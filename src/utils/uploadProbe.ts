import { cfUploadChunk, UL_SIZES } from './cloudflareSpeedTest';
import type { SpeedTestSample } from '../types';

// ── Constantes do modo adaptativo (mobile_broadband) ────────────────────────
// Bug-fix 2026-05 (upload mobile <2 Mbps): chunks pequenos progressivos.
// Em uplink celular catastrófico (~0,5 Mbps) os presets fixos de 256 KB / 1 MB
// + 3-4 streams ainda podem não fechar dentro da janela. O modo adaptativo
// começa minúsculo (64 KB × 1 stream) e só escala quando o round anterior
// completou rápido — assim sempre retorna amostras reais, nunca `upload_failed`.
const ADAPTIVE_MIN_CHUNK = 64 * 1024;        // 64 KB — piso para uplink ~0,3 Mbps
const ADAPTIVE_MAX_CHUNK = 2 * 1024 * 1024;  // 2 MB — teto antes de virar preset fixo
const ADAPTIVE_MAX_PARALLEL = 4;
const ADAPTIVE_ROUND_TIMEOUT_MS = 6_000;
const ADAPTIVE_FAST_ROUND_MS = 2_000; // round que fecha em <2s → escala
const ADAPTIVE_TOTAL_BUDGET_MS = 25_000;
const ADAPTIVE_MAX_ROUNDS = 4;

export interface UploadProbeConfig {
  durationMs: number;
  initialStreams: number;
  maxStreams: number;
  sizeIndex: number;    // índice em UL_SIZES para o tamanho base
  warmupMs: number;
}

export const UPLOAD_CONFIG_FAST: UploadProbeConfig = {
  durationMs:     7_000,
  initialStreams:     4,
  maxStreams:         4,
  sizeIndex:          2, // 5 MB
  warmupMs:       1_000,
};

export const UPLOAD_CONFIG_COMPLETE: UploadProbeConfig = {
  durationMs:    18_000,
  initialStreams:     8,
  maxStreams:         8,
  sizeIndex:          3, // 10 MB — mesma ordem do speed.cloudflare.com
  warmupMs:       2_000,
};

// ── Presets para `mobile_broadband` (4G/5G) ─────────────────────────────────
// Bug-fix 2026-05: payload de 5–10 MB com 4–8 streams concorrentes é grande
// demais para uplink celular típico (5–15 Mbps). O AbortController de
// `durationMs` dispara antes do PRIMEIRO chunk completar e, como o motor só
// contabiliza bytes ao concluir o XHR (preflight CORS impede `xhr.upload`
// progress events), `samples` fica vazio e o probe lança `upload_failed`.
//
// Solução: chunks menores (256 KB / 1 MB) e menos paralelismo, garantindo
// que vários chunks completem dentro da janela mesmo em ~3 Mbps de uplink.
//
// Heurística: 1 MB / (3 Mbps / 4 streams) = ~10.6 s por chunk. Com 18 s de
// duração, cada stream fecha 1–2 chunks → samples suficientes para a
// janela estável. 256 KB tira o piso ainda mais para baixo no preset FAST.
export const UPLOAD_CONFIG_MOBILE_FAST: UploadProbeConfig = {
  durationMs:     7_000,
  initialStreams:     3,
  maxStreams:         3,
  sizeIndex:          0, // 256 KB
  warmupMs:       1_000,
};

export const UPLOAD_CONFIG_MOBILE_COMPLETE: UploadProbeConfig = {
  durationMs:    18_000,
  initialStreams:     4,
  maxStreams:         4,
  sizeIndex:          1, // 1 MB
  warmupMs:       2_000,
};

export interface UploadProbeResult {
  throughputMbps: number;
  peakMbps: number;
  stabilityScore: number; // 0–100
  samples: SpeedTestSample[];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length);
}

function makeRandomBuffer(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  const chunk = 65536;
  for (let off = 0; off < size; off += chunk) {
    crypto.getRandomValues(buf.subarray(off, Math.min(off + chunk, size)));
  }
  return buf;
}

/**
 * Motor de upload time-based com múltiplos streams XHR concorrentes.
 *
 * Cada stream faz uploads sucessivos de `sizeIndex` bytes, emitindo amostras
 * via XHR upload.onprogress a cada 300 ms. Encerra por AbortController após
 * `durationMs`.
 */
export async function runUploadProbe(
  config: UploadProbeConfig,
  signal: AbortSignal,
  onInstant: (mbps: number) => void,
): Promise<UploadProbeResult> {
  const { durationMs, initialStreams, maxStreams, sizeIndex, warmupMs } = config;
  const bufferSize = UL_SIZES[Math.min(sizeIndex, UL_SIZES.length - 1)];
  const buffer = makeRandomBuffer(bufferSize);

  const samples: SpeedTestSample[] = [];
  const startTs = performance.now();

  // Bytes acumulados no tick atual (compartilhado entre streams)
  let tickBytes = 0;
  let smoothed = 0;

  const innerCtrl = new AbortController();
  const outerAbort = () => innerCtrl.abort();
  signal.addEventListener('abort', outerAbort, { once: true });
  const durationTid = setTimeout(() => innerCtrl.abort(), durationMs);

  const SAMPLE_INTERVAL = 300;
  let lastSampleTs = startTs;

  const sampleTid = setInterval(() => {
    const now = performance.now();
    const elapsedTick = (now - lastSampleTs) / 1000;
    lastSampleTs = now;

    if (elapsedTick > 0 && tickBytes > 0) {
      const instant = (tickBytes * 8) / elapsedTick / 1_000_000;
      smoothed = smoothed === 0 ? instant : 0.3 * instant + 0.7 * smoothed;
      tickBytes = 0;

      const tMs = now - startTs;
      samples.push({ tMs, mbps: instant, phase: 'upload' });
      onInstant(smoothed);
    } else {
      tickBytes = 0;
    }
  }, SAMPLE_INTERVAL);

  // Paralelismo progressivo (mesmo critério do download)
  let streamCount = 0;
  let lastScaleCheck = startTs;
  const SCALE_INTERVAL = 4_000;

  const checkAndScale = () => {
    if (streamCount >= maxStreams) return;
    const now = performance.now();
    if (now - lastScaleCheck < SCALE_INTERVAL) return;
    lastScaleCheck = now;

    const windowStart = now - startTs - SCALE_INTERVAL;
    const recent = samples.filter((s) => s.tMs >= windowStart);
    const prev   = samples.filter((s) => s.tMs < windowStart && s.tMs >= windowStart - SCALE_INTERVAL);

    if (recent.length < 3 || prev.length < 3) return;
    const avgRecent = mean(recent.map((s) => s.mbps));
    const avgPrev   = mean(prev.map((s) => s.mbps));

    if (avgPrev > 0 && (avgRecent - avgPrev) / avgPrev >= 0.10) {
      const toAdd = Math.min(2, maxStreams - streamCount);
      for (let i = 0; i < toAdd; i++) openStream();
    }
  };

  async function openStream(): Promise<void> {
    if (innerCtrl.signal.aborted) return;
    streamCount++;
    let fallbackTried = false;
    let currentBuffer = buffer;

    while (!innerCtrl.signal.aborted) {
      try {
        const sent = await cfUploadChunk(currentBuffer, innerCtrl.signal);
        tickBytes += sent;
        checkAndScale();
      } catch {
        if (innerCtrl.signal.aborted) break;
        if (!fallbackTried && sizeIndex > 0) {
          fallbackTried = true;
          const fallbackSize = UL_SIZES[Math.max(0, sizeIndex - 1)];
          currentBuffer = buffer.subarray(0, fallbackSize);
        } else {
          break;
        }
      }
    }
    streamCount--;
  }

  const streamPromises: Promise<void>[] = [];
  for (let i = 0; i < initialStreams; i++) {
    streamPromises.push(openStream());
  }

  await Promise.allSettled(streamPromises);
  clearTimeout(durationTid);
  clearInterval(sampleTid);
  signal.removeEventListener('abort', outerAbort);

  const valid = samples.filter((s) => s.tMs >= warmupMs && s.mbps > 0);
  const stableStart = Math.ceil(valid.length * 0.35);
  const stable = valid.slice(stableStart);
  const throughputMbps = mean(stable.map((s) => s.mbps));
  const peakMbps = Math.max(...valid.map((s) => s.mbps), 0);
  const mbpsValues = stable.map((s) => s.mbps);
  const avg = mean(mbpsValues);
  const cv = avg > 0 ? stddev(mbpsValues) / avg : 1;
  const stabilityScore = Math.round(Math.max(0, Math.min(100, 100 - cv * 150)));

  if (throughputMbps === 0 && valid.length === 0) {
    throw Object.assign(new Error('upload_failed'), { code: 'upload_failed' as const });
  }

  return { throughputMbps, peakMbps, stabilityScore, samples };
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload adaptativo (mobile_broadband) — Bug-fix 2026-05
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Estratégia de upload em rodadas progressivas para uplink celular muito lento.
 *
 * **Por que existe:** os presets fixos de `mobile_broadband`
 * (`UPLOAD_CONFIG_MOBILE_FAST` / `_COMPLETE`) usam 256 KB / 1 MB com 3-4
 * streams. Em uplink ≤2 Mbps isso ainda dispara `upload_failed` quando o
 * AbortController estoura antes do PRIMEIRO chunk fechar — `samples` fica
 * vazio e o motor lança `upload_failed`. O modo adaptativo começa em 64 KB ×
 * 1 stream (~0,5s mesmo em 1 Mbps) e só escala quando o round anterior
 * fechou rápido.
 *
 * **Algoritmo:**
 * 1. Round 1: 64 KB × 1 stream, timeout 6s. Mede.
 * 2. Se round terminou em <2s e parallelism<4 → escala (chunk×4, +1 stream).
 *    Senão registra "round lento". 2 rounds lentos consecutivos → para.
 * 3. Para também ao atingir 4 rounds, 25s totais ou abort.
 *
 * **Garantia:** mesmo em uplink 0,3 Mbps, o round 1 (64 KB / 0,5s) completa,
 * gera ao menos 1 amostra e retorna throughput real. Nunca lança
 * `upload_failed` em rede simplesmente lenta — só em rede catastroficamente
 * offline (toda rodada falha por erro de rede, não por timeout).
 */
export async function runAdaptiveUploadProbe(
  signal: AbortSignal,
  onInstant: (mbps: number) => void,
): Promise<UploadProbeResult> {
  const totalStart = performance.now();
  const samples: SpeedTestSample[] = [];

  let chunkBytes = ADAPTIVE_MIN_CHUNK;
  let parallelism = 1;
  let consecutiveSlowRounds = 0;
  let roundIndex = 0;

  const maxBuffer = makeRandomBuffer(ADAPTIVE_MAX_CHUNK);

  while (
    roundIndex < ADAPTIVE_MAX_ROUNDS &&
    performance.now() - totalStart < ADAPTIVE_TOTAL_BUDGET_MS &&
    !signal.aborted
  ) {
    const roundStart = performance.now();
    const roundCtrl = new AbortController();
    const onOuterAbort = () => roundCtrl.abort();
    signal.addEventListener('abort', onOuterAbort, { once: true });
    const timeoutTid = setTimeout(() => roundCtrl.abort(), ADAPTIVE_ROUND_TIMEOUT_MS);

    const buffer = maxBuffer.subarray(0, chunkBytes);
    let roundBytes = 0;
    let roundFailed = false;

    // Cada stream envia 1 chunk e retorna. Round = N streams paralelos.
    const streamPromises: Promise<void>[] = [];
    for (let i = 0; i < parallelism; i++) {
      streamPromises.push(
        cfUploadChunk(buffer, roundCtrl.signal)
          .then((sent) => {
            roundBytes += sent;
          })
          .catch(() => {
            // Falha individual ignorada (timeout / abort do round). Se o
            // round inteiro falhar (`roundBytes === 0`) o consecutiveSlow
            // count resolve a saída.
            roundFailed = true;
          }),
      );
    }

    await Promise.allSettled(streamPromises);
    clearTimeout(timeoutTid);
    signal.removeEventListener('abort', onOuterAbort);

    if (signal.aborted) break;

    const roundDuration = performance.now() - roundStart;
    const tMs = performance.now() - totalStart;

    if (roundBytes > 0 && roundDuration > 0) {
      const mbps = (roundBytes * 8) / (roundDuration / 1000) / 1_000_000;
      samples.push({ tMs, mbps, phase: 'upload' });
      onInstant(mbps);
    }

    roundIndex++;

    // Decisão de escalar: round rápido (<2s) e ainda há margem de paralelismo.
    const shouldScale =
      !roundFailed &&
      roundBytes > 0 &&
      roundDuration < ADAPTIVE_FAST_ROUND_MS &&
      (chunkBytes < ADAPTIVE_MAX_CHUNK || parallelism < ADAPTIVE_MAX_PARALLEL);

    if (shouldScale) {
      chunkBytes = Math.min(chunkBytes * 4, ADAPTIVE_MAX_CHUNK);
      parallelism = Math.min(parallelism + 1, ADAPTIVE_MAX_PARALLEL);
      consecutiveSlowRounds = 0;
    } else {
      consecutiveSlowRounds++;
      if (consecutiveSlowRounds >= 2) break;
    }
  }

  // Agregação: throughput é a média das amostras válidas (>0). Modo adaptativo
  // só tem 1-4 amostras (uma por round), então não dá para descartar 35%
  // como faz `runUploadProbe`. Usa todas as amostras com mbps>0.
  const valid = samples.filter((s) => s.mbps > 0);
  const throughputMbps = valid.length > 0 ? mean(valid.map((s) => s.mbps)) : 0;
  const peakMbps = valid.length > 0 ? Math.max(...valid.map((s) => s.mbps)) : 0;
  const cv = throughputMbps > 0 ? stddev(valid.map((s) => s.mbps)) / throughputMbps : 1;
  const stabilityScore = Math.round(Math.max(0, Math.min(100, 100 - cv * 150)));

  // Catastrófico: nem o round mínimo (64 KB) completou. Aí sim falha real.
  if (valid.length === 0) {
    throw Object.assign(new Error('upload_failed'), { code: 'upload_failed' as const });
  }

  return { throughputMbps, peakMbps, stabilityScore, samples };
}
