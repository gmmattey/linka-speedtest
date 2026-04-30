import type { SpeedTestResult } from '../types';

export type BeforeAfterVerdict = 'improved' | 'no_change' | 'worse';

export interface BeforeAfterResult {
  verdict: BeforeAfterVerdict;
  message: string;
  dlDeltaPercent: number;
  ulDeltaPercent: number;
  latencyDeltaPercent: number;
}

export function calculateBeforeAfter(
  before: SpeedTestResult,
  after: SpeedTestResult,
): BeforeAfterResult {
  const dlDeltaPercent     = before.dl      > 0 ? ((after.dl      - before.dl)      / before.dl)      * 100 : 0;
  const ulDeltaPercent     = before.ul      > 0 ? ((after.ul      - before.ul)      / before.ul)      * 100 : 0;
  const latencyDeltaPercent = before.latency > 0 ? ((before.latency - after.latency) / before.latency) * 100 : 0;

  const dlImproved  = dlDeltaPercent > 15;
  const dlWorsened  = dlDeltaPercent < -15;
  const latImproved = latencyDeltaPercent > 20;
  const latWorsened = latencyDeltaPercent < -20;

  let verdict: BeforeAfterVerdict;
  let message: string;

  if (dlImproved || latImproved) {
    verdict = 'improved';
    message = dlImproved && latImproved
      ? 'A conexão melhorou: mais velocidade e resposta mais rápida.'
      : dlImproved
        ? 'A velocidade de download melhorou após a ação.'
        : 'A resposta da conexão melhorou após a ação.';
  } else if (dlWorsened || latWorsened) {
    verdict = 'worse';
    message = dlWorsened && latWorsened
      ? 'A conexão piorou: menos velocidade e resposta mais lenta.'
      : dlWorsened
        ? 'A velocidade de download caiu após a ação.'
        : 'A resposta da conexão ficou mais lenta após a ação.';
  } else {
    verdict = 'no_change';
    message = 'A conexão ficou praticamente igual antes e depois da ação.';
  }

  return { verdict, message, dlDeltaPercent, ulDeltaPercent, latencyDeltaPercent };
}
