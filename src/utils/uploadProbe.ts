import { cfUploadChunk, UL_SIZES } from './cloudflareSpeedTest';
import type { SpeedTestSample } from '../types';

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
