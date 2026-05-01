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
  UPLOAD_CONFIG_FAST,
  UPLOAD_CONFIG_COMPLETE,
} from './uploadProbe';

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

// fast:     latency 0–10% | download 10–55% | upload 55–100%
// complete: latency 0–8%  | download 8–53%  | upload 53–100%
const PROGRESS_RANGES = {
  fast: {
    latency:  [0.00, 0.10] as [number, number],
    download: [0.10, 0.55] as [number, number],
    upload:   [0.55, 1.00] as [number, number],
  },
  complete: {
    latency:  [0.00, 0.08] as [number, number],
    download: [0.08, 0.53] as [number, number],
    upload:   [0.53, 1.00] as [number, number],
  },
};

function mapProgress(
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
  _connectionType?: ConnectionType,
): Promise<SpeedTestResult> {
  const ranges = PROGRESS_RANGES[mode];
  const dlConfig = mode === 'fast' ? DOWNLOAD_CONFIG_FAST : DOWNLOAD_CONFIG_COMPLETE;
  const ulConfig = mode === 'fast' ? UPLOAD_CONFIG_FAST   : UPLOAD_CONFIG_COMPLETE;
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

  let dlResult;
  try {
    [dlResult] = await Promise.all([
      runDownloadProbe(dlConfig, signal, (instant) => {
        const elapsed = performance.now();
        const local = Math.min(0.98, (elapsed % dlConfig.durationMs) / dlConfig.durationMs);
        onProgress({
          phase: 'download',
          instantMbps: instant,
          overallProgress: mapProgress(ranges.download, 0.05 + local * 0.9),
        });
      }),
      runPingLoop(dlPingCtrl.signal, 300, (rtt) => {
        if (rtt !== null) dlPings.push(rtt);
      }),
    ]);
  } catch (err) {
    dlPingCtrl.abort();
    signal.removeEventListener('abort', abortDlPings);
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    rethrowClassified(err, 'download_failed');
  }
  dlPingCtrl.abort();
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

  let ulResult;
  try {
    [ulResult] = await Promise.all([
      runUploadProbe(ulConfig, signal, (instant) => {
        const elapsed = performance.now();
        const local = Math.min(0.98, (elapsed % ulConfig.durationMs) / ulConfig.durationMs);
        onProgress({
          phase: 'upload',
          instantMbps: instant,
          overallProgress: mapProgress(ranges.upload, 0.05 + local * 0.9),
        });
      }),
      runPingLoop(ulPingCtrl.signal, 300, (rtt) => {
        if (rtt !== null) ulPings.push(rtt);
      }),
    ]);
  } catch (err) {
    ulPingCtrl.abort();
    signal.removeEventListener('abort', abortUlPings);
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    rethrowClassified(err, 'upload_failed');
  }
  ulPingCtrl.abort();
  signal.removeEventListener('abort', abortUlPings);

  const ul = ulResult!.throughputMbps;
  const latencyUpload = median(ulPings);

  // ── Fase 4: Diagnóstico ─────────────────────────────────────────────────────
  const dlDelta = Math.max(0, latencyDownload - latencyUnloaded);
  const ulDelta = Math.max(0, latencyUpload  - latencyUnloaded);
  const bufferbloatSeverity = classifyBufferbloatSeverity(Math.max(dlDelta, ulDelta));

  const allSamples = [...(dlResult!.samples), ...(ulResult!.samples)];
  const stabilityScore = computeStabilityFromSamples(allSamples);

  const partial: SpeedTestResult = {
    dl,
    ul,
    latency: latencyUnloaded,
    jitter,
    packetLoss,
    timestamp: Date.now(),
    mode,
    stabilityScore,
    peakDlMbps:  dlResult!.peakMbps,
    peakUlMbps:  ulResult!.peakMbps,
    bufferbloatSeverity,
    latencyUnloaded,
    latencyDownload,
    latencyUpload,
    dlSamples: dlResult!.samples,
    ulSamples: ulResult!.samples,
  };

  const diagnostics = buildDiagnostics(partial);
  const result: SpeedTestResult = { ...partial, diagnostics };

  onProgress({ phase: 'done', instantMbps: null, overallProgress: 1, partial: result });
  return result;
}
