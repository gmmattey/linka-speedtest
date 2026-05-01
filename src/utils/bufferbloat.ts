import { getDefaultServer } from './serverRegistry';

export type BufferbloatGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface BufferbloatResult {
  latencyLoaded: number;
  jitterLoaded: number;
  grade: BufferbloatGrade;
  deltaMs: number;
}

export interface BufferbloatProgress {
  progress: number;
  instantLatency: number | null;
}

export function gradeFrom(deltaMs: number): BufferbloatGrade {
  if (deltaMs < 30)  return 'A';
  if (deltaMs < 60)  return 'B';
  if (deltaMs < 200) return 'C';
  if (deltaMs < 400) return 'D';
  return 'F';
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

const DURATION_MS    = 12_000;
const STREAM_COUNT   = 4;
const PING_INTERVAL  = 300;
const BLOCK_BYTES    = 25_000_000;

export async function runBufferbloatTest(
  idleLatency: number,
  signal: AbortSignal,
  onProgress: (p: BufferbloatProgress) => void,
): Promise<BufferbloatResult> {
  const server = getDefaultServer();
  const startTime = performance.now();
  const rttSamples: number[] = [];

  // Saturation streams — keep downloading to fill the pipe
  const saturators: Promise<void>[] = [];
  for (let i = 0; i < STREAM_COUNT; i++) {
    saturators.push(
      (async () => {
        while (!signal.aborted && performance.now() - startTime < DURATION_MS) {
          const ctrl = new AbortController();
          const onAbort = () => ctrl.abort();
          signal.addEventListener('abort', onAbort);
          try {
            const resp = await fetch(
              `${server.downloadUrl(BLOCK_BYTES)}&_bb=${i}_${Date.now()}`,
              { signal: ctrl.signal, cache: 'no-store' },
            );
            if (resp.body) {
              const reader = resp.body.getReader();
              while (!signal.aborted && performance.now() - startTime < DURATION_MS) {
                const { done } = await reader.read();
                if (done) break;
              }
              reader.cancel().catch(() => {});
            }
          } catch { /* stream cancelled — expected */ } finally {
            signal.removeEventListener('abort', onAbort);
          }
        }
      })(),
    );
  }

  // Ping loop while saturating
  const pingLoop = (async () => {
    while (!signal.aborted) {
      const elapsed = performance.now() - startTime;
      if (elapsed >= DURATION_MS) break;

      const progress = Math.min(1, elapsed / DURATION_MS);
      const t0 = performance.now();
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 5000);
        const onAbort = () => ctrl.abort();
        signal.addEventListener('abort', onAbort);
        const resp = await fetch(
          `${server.downloadUrl(0)}&_ping=${Date.now()}`,
          { signal: ctrl.signal, cache: 'no-store' },
        );
        await resp.arrayBuffer();
        clearTimeout(tid);
        signal.removeEventListener('abort', onAbort);
        const rtt = performance.now() - t0;
        rttSamples.push(rtt);
        onProgress({ progress, instantLatency: rtt });
      } catch {
        onProgress({ progress, instantLatency: null });
      }

      await new Promise<void>((resolve) => {
        const tid = setTimeout(resolve, PING_INTERVAL);
        signal.addEventListener('abort', () => { clearTimeout(tid); resolve(); }, { once: true });
      });
    }
  })();

  await Promise.allSettled([...saturators, pingLoop]);

  const latencyLoaded = median(rttSamples);
  const jitterLoaded  = jitterOf(rttSamples);
  const deltaMs       = Math.max(0, latencyLoaded - idleLatency);

  return { latencyLoaded, jitterLoaded, grade: gradeFrom(deltaMs), deltaMs };
}
