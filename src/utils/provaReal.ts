import type { SpeedTestResult } from '../types';

/**
 * Calcula a média de múltiplos resultados de teste de velocidade.
 * Usado pela Prova Real para produzir um resultado consolidado de 3 medições.
 */
export function averageSpeedResults(results: SpeedTestResult[]): SpeedTestResult {
  const n = results.length;
  if (n === 0) throw new Error('Nenhum resultado para calcular a média.');
  return {
    dl:         results.reduce((s, r) => s + r.dl, 0) / n,
    ul:         results.reduce((s, r) => s + r.ul, 0) / n,
    latency:    results.reduce((s, r) => s + r.latency, 0) / n,
    jitter:     results.reduce((s, r) => s + r.jitter, 0) / n,
    packetLoss: results.reduce((s, r) => s + r.packetLoss, 0) / n,
    timestamp:  results[n - 1].timestamp,
  };
}
