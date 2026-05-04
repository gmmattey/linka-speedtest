import type { ConnectionType, SpeedTestProgress, SpeedTestResult } from '../types';
import { classifyBufferbloatSeverity, buildDiagnostics, computeStabilityFromSamples } from '../core/networkQualityClassifier';
import { runLatencyPhase, runPingLoop } from './latencyProbe';
import {
  runDownloadProbe,
  DOWNLOAD_CONFIG_FAST,
  DOWNLOAD_CONFIG_COMPLETE,
} from './downloadProbe';
import {
  runUploadProbe,
  runAdaptiveUploadProbe,
  UPLOAD_CONFIG_FAST,
  UPLOAD_CONFIG_COMPLETE,
  type UploadProbeResult,
} from './uploadProbe';
import { getDnsLatencyMs } from './dnsTiming';
import { probeDnsResolver, type DnsProbeResult } from './dnsProbe';
import { toConnectionProfile } from './connectionProfile';
import { measurePacketLossNative, type PacketLossResult } from './packetLoss';

// =============================================================================
// Erro classificado
// =============================================================================

export type SpeedTestErrorCode =
  | 'download_failed'
  | 'upload_failed'
  | 'latency_failed'
  | 'network_offline'
  | 'server_unavailable';

export class SpeedTestError extends Error {
  readonly code: SpeedTestErrorCode;
  constructor(code: SpeedTestErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'SpeedTestError';
    this.code = code;
  }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function rethrowClassified(err: unknown, fallbackCode: SpeedTestErrorCode): never {
  if (err instanceof SpeedTestError) throw err;
  if (err instanceof DOMException && err.name === 'AbortError') throw err;
  if (isOffline()) throw new SpeedTestError('network_offline');
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    throw new SpeedTestError('server_unavailable');
  }
  throw new SpeedTestError(fallbackCode);
}

// =============================================================================
// Progresso
// =============================================================================

/**
 * Faixas (em [0,1]) de cada fase no progresso global, pesadas pelo número
 * de amostras esperadas em cada uma:
 *
 *  - latência: `pingCount` amostras (~100ms cada)
 *  - download: `durationMs / 300ms` amostras
 *  - upload:   idem
 *
 * Para `fast`:     15 pings + 23 dl + 23 ul = 61 amostras → 24.6/37.7/37.7
 * Para `complete`: 25 pings + 60 dl + 60 ul = 145         → 17.2/41.4/41.4
 *
 * Exportado para teste.
 */
export type ProgressRanges = {
  latency:  [number, number];
  download: [number, number];
  upload:   [number, number];
};

export function computeRanges(mode: 'fast' | 'complete'): ProgressRanges {
  const pingCount = mode === 'fast' ? 15 : 25;
  const dlDuration = mode === 'fast' ? DOWNLOAD_CONFIG_FAST.durationMs : DOWNLOAD_CONFIG_COMPLETE.durationMs;
  const ulDuration = mode === 'fast' ? UPLOAD_CONFIG_FAST.durationMs   : UPLOAD_CONFIG_COMPLETE.durationMs;
  const dlSamples = Math.round(dlDuration / 300);
  const ulSamples = Math.round(ulDuration / 300);
  const total = pingCount + dlSamples + ulSamples;

  const latencyEnd  = pingCount / total;
  const downloadEnd = (pingCount + dlSamples) / total;

  return {
    latency:  [0, latencyEnd],
    download: [latencyEnd, downloadEnd],
    upload:   [downloadEnd, 1],
  };
}

/**
 * Projeta `local` ∈ [0,1] dentro do intervalo `range`. Exportado para teste.
 */
export function mapProgress(
  range: [number, number],
  local: number,
): number {
  const [a, b] = range;
  return a + (b - a) * Math.max(0, Math.min(1, local));
}

// =============================================================================
// Helpers de estatística
// =============================================================================

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[m - 1] + sorted[m]) / 2 : sorted[m];
}

// =============================================================================
// Motor principal
// =============================================================================

export async function runSpeedTestV2(
  mode: 'fast' | 'complete',
  onProgress: (p: SpeedTestProgress) => void,
  signal: AbortSignal,
  connectionType?: ConnectionType,
): Promise<SpeedTestResult> {
  // Tempo total do teste (2026-05): timestamp de início das 3 fases.
  // Capturado em `elapsedMs` no resultado final para o accordion Avançado
  // mostrar "Tempo total do teste" sem precisar carregar o cronômetro pela
  // ResultScreen.
  const testStartTime = Date.now();
  const ranges = computeRanges(mode);
  const dlConfig = mode === 'fast' ? DOWNLOAD_CONFIG_FAST : DOWNLOAD_CONFIG_COMPLETE;
  // Bug-fix 2026-05 (upload mobile <2 Mbps): seleciona estratégia de upload
  // pelo perfil. Em `mobile_broadband` usa o motor adaptativo
  // (`runAdaptiveUploadProbe`) que escala chunks/streams round-a-round —
  // começa em 64 KB × 1 stream e cresce só quando o round anterior fechou em
  // <2s. Garante medição real mesmo em uplink ~0,5 Mbps. Em `fixed_broadband`
  // mantém os presets fixos clássicos. Os antigos `UPLOAD_CONFIG_MOBILE_*`
  // ficaram obsoletos — exportados em `uploadProbe.ts` para compat de quem
  // precise inspecioná-los, mas não são mais consumidos aqui.
  const profile = toConnectionProfile(connectionType);
  const isMobile = profile === 'mobile_broadband';
  const ulConfigFixed = mode === 'fast' ? UPLOAD_CONFIG_FAST : UPLOAD_CONFIG_COMPLETE;
  const pingCount = mode === 'fast' ? 15 : 25;

  // ── Fase 1: Latência ────────────────────────────────────────────────────────
  onProgress({ phase: 'latency', instantMbps: null, overallProgress: 0 });

  let latencyResult;
  try {
    latencyResult = await runLatencyPhase(pingCount, signal, (i, total) => {
      onProgress({
        phase: 'latency',
        instantMbps: null,
        overallProgress: mapProgress(ranges.latency, i / total),
      });
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    rethrowClassified(err, 'latency_failed');
  }

  const latencyUnloaded = latencyResult!.medianMs;
  const jitter          = latencyResult!.jitterMs;
  const packetLoss      = latencyResult!.approximateLoss;

  // Emite parcial após latência (I-12)
  onProgress({
    phase: 'download',
    instantMbps: null,
    overallProgress: mapProgress(ranges.download, 0),
    partial: { latency: latencyUnloaded, jitter, packetLoss, latencyUnloaded },
  });

  // ── Fase 2: Download + bufferbloat simultâneo ───────────────────────────────
  const dlPings: number[] = [];
  const dlPingCtrl = new AbortController();
  const abortDlPings = () => dlPingCtrl.abort();
  signal.addEventListener('abort', abortDlPings, { once: true });

  const dlPingPromise = runPingLoop(dlPingCtrl.signal, 300, (rtt) => {
    if (rtt !== null) dlPings.push(rtt);
  });

  let dlResult;
  const dlPhaseStart = performance.now();
  try {
    dlResult = await runDownloadProbe(dlConfig, signal, (instant) => {
      const elapsed = performance.now() - dlPhaseStart;
      const local = Math.max(0, Math.min(0.98, elapsed / dlConfig.durationMs));
      onProgress({
        phase: 'download',
        instantMbps: instant,
        overallProgress: mapProgress(ranges.download, local),
      });
    });
  } catch (err) {
    dlPingCtrl.abort();
    await dlPingPromise;
    signal.removeEventListener('abort', abortDlPings);
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    rethrowClassified(err, 'download_failed');
  }
  dlPingCtrl.abort();
  await dlPingPromise;
  signal.removeEventListener('abort', abortDlPings);

  const dl = dlResult!.throughputMbps;
  const latencyDownload = median(dlPings);

  // Emite parcial após download (I-12)
  onProgress({
    phase: 'upload',
    instantMbps: null,
    overallProgress: mapProgress(ranges.upload, 0),
    partial: { dl, latency: latencyUnloaded, jitter, packetLoss, latencyUnloaded, latencyDownload },
  });

  // ── Fase 3: Upload + bufferbloat simultâneo ─────────────────────────────────
  const ulPings: number[] = [];
  const ulPingCtrl = new AbortController();
  const abortUlPings = () => ulPingCtrl.abort();
  signal.addEventListener('abort', abortUlPings, { once: true });

  const ulPingPromise = runPingLoop(ulPingCtrl.signal, 300, (rtt) => {
    if (rtt !== null) ulPings.push(rtt);
  });

  // DNS probe (Fase B 2026-05; refatorado 2026-05 para Safari): roda em
  // paralelo com o upload — uma única request DoH ao Cloudflare whoami,
  // com latência medida via `performance.now()` em volta do fetch (não
  // mais via Resource Timing, que Safari mobile zera por TAO/CORS).
  // Não bloqueia, não pode falhar (retorna campos null em erro). Captura
  // abaixo, junto da composição do resultado final.
  const dnsProbePromise: Promise<DnsProbeResult> = probeDnsResolver(signal).catch(
    () => ({ latencyMs: null, resolverIp: null, provider: null }),
  );

  // Packet loss nativo (2026-05): roda em paralelo com upload no APK
  // Android — 50 pacotes UDP DNS ao Cloudflare, contagem real de perda.
  // No PWA web (sem plugin), resolve `{ available: false }` e o
  // orchestrator preserva o `packetLoss` estimado. Não bloqueia o
  // resultado: se demorar mais que o upload, a Promise é coletada após.
  const packetLossNativePromise: Promise<PacketLossResult> = measurePacketLossNative()
    .catch(() => ({ available: false } as PacketLossResult));

  // Bug-fix 2026-05 (upload mobile): se o upload falhar (ex.: chunk não
  // completa em tempo no uplink celular saturado), preserva DL+latência e
  // retorna resultado parcial (`ul=0`, `ulFailed=true`) em vez de invalidar
  // o teste todo. Falhas reais (offline, abort externo) continuam propagando.
  let ulResult: UploadProbeResult | null = null;
  let ulFailed = false;
  const ulPhaseStart = performance.now();
  // Orçamento usado só para mapear progresso visual — em mobile usamos o
  // teto adaptativo (25s); em fixa, o `durationMs` do preset.
  const ulProgressBudget = isMobile ? 25_000 : ulConfigFixed.durationMs;
  try {
    if (isMobile) {
      ulResult = await runAdaptiveUploadProbe(signal, (instant) => {
        const elapsed = performance.now() - ulPhaseStart;
        const local = Math.max(0, Math.min(0.98, elapsed / ulProgressBudget));
        onProgress({
          phase: 'upload',
          instantMbps: instant,
          overallProgress: mapProgress(ranges.upload, local),
        });
      });
    } else {
      ulResult = await runUploadProbe(ulConfigFixed, signal, (instant) => {
        const elapsed = performance.now() - ulPhaseStart;
        const local = Math.max(0, Math.min(0.98, elapsed / ulConfigFixed.durationMs));
        onProgress({
          phase: 'upload',
          instantMbps: instant,
          overallProgress: mapProgress(ranges.upload, local),
        });
      });
    }
  } catch (err) {
    // Cleanup dos pings simultâneos antes de decidir o destino do erro.
    ulPingCtrl.abort();
    await ulPingPromise;
    signal.removeEventListener('abort', abortUlPings);
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    if (isOffline()) throw new SpeedTestError('network_offline');
    // Fallback parcial: já temos download + latência válidos. ul=0 com flag
    // permite à UI sinalizar "Resultado parcial — upload não pôde ser medido"
    // sem propagar erro fatal.
    ulFailed = true;
    ulResult = null;
  }
  if (!ulFailed) {
    ulPingCtrl.abort();
    await ulPingPromise;
    signal.removeEventListener('abort', abortUlPings);
  }

  const ul = ulResult?.throughputMbps ?? 0;
  const latencyUpload = ulPings.length > 0 ? median(ulPings) : latencyUnloaded;

  // ── Fase 4: Diagnóstico ─────────────────────────────────────────────────────
  const dlDelta = Math.max(0, latencyDownload - latencyUnloaded);
  const ulDelta = Math.max(0, latencyUpload  - latencyUnloaded);
  const bufferbloatSeverity = classifyBufferbloatSeverity(Math.max(dlDelta, ulDelta));

  const allSamples = [...(dlResult!.samples), ...(ulResult?.samples ?? [])];
  const stabilityScore = computeStabilityFromSamples(allSamples);

  // DNS feature (2026-05): aguarda o probe DoH disparado no início do
  // upload — fonte primária da latência DNS (medida diretamente via
  // performance.now() em volta do fetch, funciona no Safari mobile).
  // Se o probe falhou OU o navegador não expôs latência, tenta fallback
  // pela Resource Timing API (`getDnsLatencyMs`). Ambos podem ser null
  // sem afetar o restante do resultado.
  const dnsProbeResult = await dnsProbePromise;
  const dnsLatencyMs = dnsProbeResult.latencyMs ?? getDnsLatencyMs();

  // Packet loss nativo (2026-05): se disponível, sobrescreve a estimativa
  // heurística com o valor real medido via UDP. `packetLossSource` registra
  // a origem para a UI poder mostrar "estimado" quando ≠ 'native'.
  const packetLossNativeResult = await packetLossNativePromise;
  const finalPacketLoss = packetLossNativeResult.available && packetLossNativeResult.lossPercent != null
    ? packetLossNativeResult.lossPercent
    : packetLoss;
  const packetLossSource: 'native' | 'estimated' = packetLossNativeResult.available
    ? 'native'
    : 'estimated';

  const partial: SpeedTestResult = {
    dl,
    ul,
    latency: latencyUnloaded,
    jitter,
    packetLoss: finalPacketLoss,
    packetLossSource,
    timestamp: Date.now(),
    mode,
    stabilityScore,
    peakDlMbps:  dlResult!.peakMbps,
    peakUlMbps:  ulResult?.peakMbps ?? 0,
    bufferbloatSeverity,
    latencyUnloaded,
    latencyDownload,
    latencyUpload,
    dlSamples: dlResult!.samples,
    ulSamples: ulResult?.samples ?? [],
    ulFailed,
    dnsLatencyMs,
    dnsResolverIp: dnsProbeResult.resolverIp,
    dnsProvider:   dnsProbeResult.provider,
    elapsedMs:     Date.now() - testStartTime,
  };

  const diagnostics = buildDiagnostics(partial);
  const result: SpeedTestResult = { ...partial, diagnostics };

  onProgress({ phase: 'done', instantMbps: null, overallProgress: 1, partial: result });
  return result;
}
