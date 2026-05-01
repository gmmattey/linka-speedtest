import { cfDownloadStream, DL_SIZES } from './cloudflareSpeedTest';
import type { SpeedTestSample } from '../types';

export interface DownloadProbeConfig {
  durationMs: number;
  initialStreams: number;
  maxStreams: number;
  sizeIndex: number;    // índice em DL_SIZES para o tamanho base
  warmupMs: number;
}

export const DOWNLOAD_CONFIG_FAST: DownloadProbeConfig = {
  durationMs:     7_000,
  initialStreams:     2,
  maxStreams:         4,
  sizeIndex:          2, // 10 MB
  warmupMs:       1_000,
};

export const DOWNLOAD_CONFIG_COMPLETE: DownloadProbeConfig = {
  durationMs:    18_000,
  initialStreams:     2,
  maxStreams:         8,
  sizeIndex:          3, // 25 MB
  warmupMs:       2_000,
};

export interface DownloadProbeResult {
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

/**
 * Motor de download time-based com paralelismo progressivo.
 *
 * Abre `initialStreams` streams simultâneos; quando um arquivo termina, reabre
 * imediatamente com novo _cb. Amostra bytes recebidos a cada 300 ms.
 * A cada 4 s verifica ganho marginal: se ≥ 10% e streams < maxStreams, abre +2.
 * Encerra por AbortController após `durationMs`.
 */
export async function runDownloadProbe(
  config: DownloadProbeConfig,
  signal: AbortSignal,
  onInstant: (mbps: number) => void,
): Promise<DownloadProbeResult> {
  const { durationMs, initialStreams, maxStreams, sizeIndex, warmupMs } = config;
  const bytes = DL_SIZES[Math.min(sizeIndex, DL_SIZES.length - 1)];

  const samples: SpeedTestSample[] = [];
  const startTs = performance.now();

  // Bytes acumulados no tick atual (compartilhado entre streams)
  let tickBytes = 0;
  let activeStreams = 0;

  // Abort interno para encerrar todos os streams ao expirar durationMs
  const innerCtrl = new AbortController();
  const outerAbort = () => innerCtrl.abort();
  signal.addEventListener('abort', outerAbort, { once: true });
  const durationTid = setTimeout(() => innerCtrl.abort(), durationMs);

  // Loop de amostragem a cada 300 ms
  const SAMPLE_INTERVAL = 300;
  let lastSampleTs = startTs;
  let smoothed = 0;

  const sampleTid = setInterval(() => {
    const now = performance.now();
    const elapsedTick = (now - lastSampleTs) / 1000;
    lastSampleTs = now;

    if (elapsedTick > 0 && tickBytes > 0) {
      const instant = (tickBytes * 8) / elapsedTick / 1_000_000;
      smoothed = smoothed === 0 ? instant : 0.3 * instant + 0.7 * smoothed;
      tickBytes = 0;

      const tMs = now - startTs;
      samples.push({ tMs, mbps: instant, phase: 'download' });
      onInstant(smoothed);
    } else {
      tickBytes = 0;
    }
  }, SAMPLE_INTERVAL);

  // Paralelismo progressivo: verifica ganho a cada 4 s
  let streamCount = 0;
  const windowSamples: { ts: number; mbps: number }[] = [];
  let lastScaleCheck = startTs;
  const SCALE_INTERVAL = 4_000;

  const checkAndScale = () => {
    if (streamCount >= maxStreams) return;
    const now = performance.now();
    if (now - lastScaleCheck < SCALE_INTERVAL) return;
    lastScaleCheck = now;

    const windowStart = now - SCALE_INTERVAL;
    const recent = samples.filter((s) => s.tMs + startTs > windowStart);
    const prev = samples.filter((s) => s.tMs + startTs <= windowStart && s.tMs + startTs > windowStart - SCALE_INTERVAL);

    if (recent.length < 3 || prev.length < 3) return;
    const avgRecent = mean(recent.map((s) => s.mbps));
    const avgPrev   = mean(prev.map((s) => s.mbps));

    if (avgPrev > 0 && (avgRecent - avgPrev) / avgPrev >= 0.10) {
      const toAdd = Math.min(2, maxStreams - streamCount);
      for (let i = 0; i < toAdd; i++) openStream(bytes);
    }
    windowSamples.length = 0;
  };

  // Abre um stream contínuo: quando o arquivo termina, reabre
  async function openStream(size: number): Promise<void> {
    if (innerCtrl.signal.aborted) return;
    streamCount++;
    activeStreams++;
    let fallbackTried = false;
    let currentSize = size;

    while (!innerCtrl.signal.aborted) {
      try {
        const reader = await cfDownloadStream(currentSize, innerCtrl.signal);
        while (!innerCtrl.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) tickBytes += value.length;
        }
        checkAndScale();
      } catch (err) {
        if (innerCtrl.signal.aborted) break;
        // Fallback: tenta tamanho menor uma vez
        if (!fallbackTried && sizeIndex > 0) {
          fallbackTried = true;
          currentSize = DL_SIZES[Math.max(0, sizeIndex - 1)];
        } else {
          break;
        }
      }
    }
    activeStreams--;
    streamCount--;
  }

  // Abre os streams iniciais
  const streamPromises: Promise<void>[] = [];
  for (let i = 0; i < initialStreams; i++) {
    streamPromises.push(openStream(bytes));
  }

  // Aguarda encerramento (abort por durationMs ou sinal externo)
  await Promise.allSettled(streamPromises);
  clearTimeout(durationTid);
  clearInterval(sampleTid);
  signal.removeEventListener('abort', outerAbort);

  // Janela estável: amostras após warmup; média dos últimos 65%
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
    throw Object.assign(new Error('download_failed'), { code: 'download_failed' as const });
  }

  return { throughputMbps, peakMbps, stabilityScore, samples };
}
