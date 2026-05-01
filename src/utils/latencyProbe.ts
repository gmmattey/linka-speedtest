import { cfPing } from './cloudflareSpeedTest';

export interface LatencyPhaseResult {
  medianMs: number;
  meanMs: number;
  jitterMs: number;
  timeoutRate: number;   // 0–1
  approximateLoss: number; // %
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[m - 1] + sorted[m]) / 2 : sorted[m];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function jitterOf(samples: number[]): number {
  if (samples.length < 2) return 0;
  let acc = 0;
  for (let i = 1; i < samples.length; i++) acc += Math.abs(samples[i] - samples[i - 1]);
  return acc / (samples.length - 1);
}

/**
 * Executa `pingCount` pings sequenciais.
 * - Descarta o 1º (TCP slow-start / DNS lookup).
 * - Remove outliers > 3× a mediana dos resultados válidos.
 */
export async function runLatencyPhase(
  pingCount: number,
  signal: AbortSignal,
  onProgress: (i: number, total: number) => void,
): Promise<LatencyPhaseResult> {
  const raw: (number | null)[] = [];

  for (let i = 0; i < pingCount; i++) {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    raw.push(await cfPing(signal));
    onProgress(i + 1, pingCount);
  }

  // Descarta o primeiro (aquecimento TCP/DNS)
  const withoutFirst = raw.slice(1);
  const timeouts = withoutFirst.filter((v) => v === null).length;
  const valid = withoutFirst.filter((v): v is number => v !== null);

  // Remove outliers > 3× mediana
  const med = median(valid);
  const stable = med > 0 ? valid.filter((v) => v <= med * 3) : valid;

  const usable = stable.length > 0 ? stable : valid;

  return {
    medianMs:        median(usable),
    meanMs:          mean(usable),
    jitterMs:        jitterOf(usable),
    timeoutRate:     withoutFirst.length > 0 ? timeouts / withoutFirst.length : 0,
    approximateLoss: withoutFirst.length > 0 ? (timeouts / withoutFirst.length) * 100 : 0,
  };
}

/**
 * Loop contínuo de pings para medir latência em carga (bufferbloat).
 * Chama `onPing(rtt)` a cada resposta (null se timeout).
 * Encerra quando o sinal é abortado.
 */
export async function runPingLoop(
  signal: AbortSignal,
  intervalMs: number,
  onPing: (rtt: number | null) => void,
): Promise<void> {
  while (!signal.aborted) {
    const t0 = performance.now();
    const rtt = await cfPing(signal);
    if (!signal.aborted) onPing(rtt);

    // Aguarda o restante do intervalo antes do próximo ping
    const elapsed = performance.now() - t0;
    const wait = Math.max(0, intervalMs - elapsed);
    if (wait > 0 && !signal.aborted) {
      await new Promise<void>((resolve) => {
        const tid = setTimeout(resolve, wait);
        signal.addEventListener('abort', () => { clearTimeout(tid); resolve(); }, { once: true });
      });
    }
  }
}
