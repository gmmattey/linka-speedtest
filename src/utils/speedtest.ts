import type { ConnectionType, SpeedTestMode, SpeedTestProgress, SpeedTestResult, TestPhase } from '../types';
import { getDefaultServer } from './serverRegistry';

interface Preset {
  latencySamples: number;
  dlWarmup: number;
  dlRound: number;
  dlRounds: number;
  dlTimeoutMs: number;
  ulWarmup: number;
  ulRound: number;
  ulRounds: number;
  ulTimeoutMs: number;
}

const PRESET_DEFAULT: Preset = {
  latencySamples: 20,
  dlWarmup: 25_000_000,  dlRound: 100_000_000, dlRounds: 3, dlTimeoutMs: 25_000,
  ulWarmup: 10_000_000,  ulRound:  50_000_000, ulRounds: 3, ulTimeoutMs: 30_000,
};

// Em rede móvel reduzimos volume (~70 MB total vs ~400 MB) para preservar
// franquia e tempo do usuário, mantendo precisão até ~200 Mbps.
const PRESET_MOBILE: Preset = {
  latencySamples: 20,
  dlWarmup:  5_000_000,  dlRound:  25_000_000, dlRounds: 2, dlTimeoutMs: 20_000,
  ulWarmup:  2_000_000,  ulRound:  10_000_000, ulRounds: 2, ulTimeoutMs: 20_000,
};

// Modo rápido: ~80 MB total, 8 amostras de latência, 1 round de cada.
const PRESET_QUICK: Preset = {
  latencySamples: 8,
  dlWarmup:  5_000_000,  dlRound:  50_000_000, dlRounds: 1, dlTimeoutMs: 20_000,
  ulWarmup:  2_000_000,  ulRound:  20_000_000, ulRounds: 1, ulTimeoutMs: 20_000,
};

function presetFor(connectionType?: ConnectionType, mode?: SpeedTestMode): Preset {
  if (mode === 'quick') return PRESET_QUICK;
  return connectionType === 'mobile' ? PRESET_MOBILE : PRESET_DEFAULT;
}

const PHASE_RANGES: Record<Exclude<TestPhase, 'idle'>, [number, number]> = {
  latency: [0.0, 0.15],
  download: [0.15, 0.70],
  upload: [0.70, 1.0],
  done: [1.0, 1.0],
  error: [0, 0],
};

function p90(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9));
  return sorted[idx];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[m - 1] + sorted[m]) / 2 : sorted[m];
}

function jitterOf(samples: number[]): number {
  if (samples.length < 2) return 0;
  let acc = 0;
  for (let i = 1; i < samples.length; i++) acc += Math.abs(samples[i] - samples[i - 1]);
  return acc / (samples.length - 1);
}

function makeRandomBuffer(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  const chunk = 65536;
  for (let off = 0; off < size; off += chunk) {
    const slice = buf.subarray(off, Math.min(off + chunk, size));
    crypto.getRandomValues(slice);
  }
  return buf;
}

function mapProgress(phase: Exclude<TestPhase, 'idle' | 'error'>, local: number): number {
  const [a, b] = PHASE_RANGES[phase];
  return a + (b - a) * Math.max(0, Math.min(1, local));
}

async function measureLatency(
  samples: number,
  signal: AbortSignal,
  onProgress: (p: SpeedTestProgress) => void,
): Promise<{ latency: number; jitter: number; loss: number }> {
  const server = getDefaultServer();
  const timings: number[] = [];
  let failures = 0;

  for (let i = 0; i < samples; i++) {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    const t0 = performance.now();
    try {
      const ctrl = new AbortController();
      const onAbort = () => ctrl.abort();
      signal.addEventListener('abort', onAbort);
      const tid = setTimeout(() => ctrl.abort(), 4000);
      const resp = await fetch(`${server.downloadUrl(0)}&_cb=${Date.now()}_${i}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      await resp.arrayBuffer();
      clearTimeout(tid);
      signal.removeEventListener('abort', onAbort);
      timings.push(performance.now() - t0);
    } catch {
      failures += 1;
    }
    onProgress({
      phase: 'latency',
      instantMbps: null,
      overallProgress: mapProgress('latency', (i + 1) / samples),
    });
  }

  const usable = timings.slice(1);
  const lat = median(usable);
  const jit = jitterOf(usable);
  const loss = (failures / samples) * 100;
  return { latency: lat, jitter: jit, loss };
}

async function downloadRound(
  bytes: number,
  signal: AbortSignal,
  onInstant: (mbps: number) => void,
  timeoutMs: number,
): Promise<number> {
  const server = getDefaultServer();
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal.addEventListener('abort', onAbort);
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);

  let smoothed = 0;
  let totalRx = 0;
  const t0 = performance.now();

  try {
    const resp = await fetch(`${server.downloadUrl(bytes)}&_cb=${Date.now()}`, {
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!resp.body) throw new Error('no body');
    const reader = resp.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalRx += value.length;
        const elapsed = (performance.now() - t0) / 1000;
        if (elapsed > 0.05) {
          const instant = (totalRx * 8) / elapsed / 1_000_000;
          smoothed = smoothed === 0 ? instant : 0.3 * instant + 0.7 * smoothed;
          onInstant(smoothed);
        }
      }
    }
  } finally {
    clearTimeout(tid);
    signal.removeEventListener('abort', onAbort);
  }

  const seconds = (performance.now() - t0) / 1000;
  if (seconds <= 0) return 0;
  return (totalRx * 8) / seconds / 1_000_000;
}

async function uploadRound(
  buf: Uint8Array,
  signal: AbortSignal,
  onInstant: (mbps: number) => void,
  timeoutMs: number,
): Promise<number> {
  const server = getDefaultServer();
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal.addEventListener('abort', onAbort);
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);

  const t0 = performance.now();
  try {
    const blob = new Blob([buf as unknown as BlobPart]);
    const tickId = setInterval(() => {
      const elapsed = (performance.now() - t0) / 1000;
      if (elapsed > 0.05) {
        const instant = (buf.length * 8) / elapsed / 1_000_000 * 0.5;
        onInstant(instant);
      }
    }, 200);
    try {
      await fetch(server.uploadUrl(), {
        method: 'POST',
        body: blob,
        signal: ctrl.signal,
        cache: 'no-store',
      });
    } finally {
      clearInterval(tickId);
    }
  } finally {
    clearTimeout(tid);
    signal.removeEventListener('abort', onAbort);
  }

  const seconds = (performance.now() - t0) / 1000;
  if (seconds <= 0) return 0;
  return (buf.length * 8) / seconds / 1_000_000;
}

export async function runSpeedTest(
  onProgress: (p: SpeedTestProgress) => void,
  signal: AbortSignal,
  connectionType?: ConnectionType,
  mode?: SpeedTestMode,
): Promise<SpeedTestResult> {
  const preset = presetFor(connectionType, mode);

  onProgress({ phase: 'latency', instantMbps: null, overallProgress: 0 });
  const lat = await measureLatency(preset.latencySamples, signal, onProgress);

  let warmupRx = 0;
  const tWarm = performance.now();
  await downloadRound(
    preset.dlWarmup,
    signal,
    () => {
      warmupRx += 1;
      const local = Math.min(0.99, (performance.now() - tWarm) / 8000);
      onProgress({
        phase: 'download',
        instantMbps: null,
        overallProgress: mapProgress('download', local * 0.1),
      });
    },
    20_000,
  );

  const dlSamples: number[] = [];
  for (let r = 0; r < preset.dlRounds; r++) {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    const roundStart = 0.1 + (r / preset.dlRounds) * 0.9;
    const mbps = await downloadRound(
      preset.dlRound,
      signal,
      (instant) => {
        const local = Math.min(0.99, roundStart + 0.9 * (1 / preset.dlRounds) * 0.5);
        onProgress({
          phase: 'download',
          instantMbps: instant,
          overallProgress: mapProgress('download', local),
        });
      },
      preset.dlTimeoutMs,
    );
    if (mbps > 0) dlSamples.push(mbps);
    onProgress({
      phase: 'download',
      instantMbps: null,
      overallProgress: mapProgress('download', 0.1 + ((r + 1) / preset.dlRounds) * 0.9),
    });
  }
  const dl = p90(dlSamples);

  const ulBuf = makeRandomBuffer(preset.ulRound);
  const tUlWarm = performance.now();
  await uploadRound(
    ulBuf.subarray(0, preset.ulWarmup) as unknown as Uint8Array,
    signal,
    () => {
      const local = Math.min(0.99, (performance.now() - tUlWarm) / 8000);
      onProgress({
        phase: 'upload',
        instantMbps: null,
        overallProgress: mapProgress('upload', local * 0.1),
      });
    },
    preset.ulTimeoutMs,
  );

  const ulSamples: number[] = [];
  for (let r = 0; r < preset.ulRounds; r++) {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    const roundStart = 0.1 + (r / preset.ulRounds) * 0.9;
    const mbps = await uploadRound(
      ulBuf,
      signal,
      (instant) => {
        const local = Math.min(0.99, roundStart);
        onProgress({
          phase: 'upload',
          instantMbps: instant,
          overallProgress: mapProgress('upload', local),
        });
      },
      preset.ulTimeoutMs,
    );
    if (mbps > 0) ulSamples.push(mbps);
    onProgress({
      phase: 'upload',
      instantMbps: null,
      overallProgress: mapProgress('upload', 0.1 + ((r + 1) / preset.ulRounds) * 0.9),
    });
  }
  const ul = p90(ulSamples);

  const result: SpeedTestResult = {
    dl,
    ul,
    latency: lat.latency,
    jitter: lat.jitter,
    packetLoss: lat.loss,
    timestamp: Date.now(),
  };
  onProgress({ phase: 'done', instantMbps: null, overallProgress: 1, partial: result });
  return result;
}
