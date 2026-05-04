import { describe, it, expect } from 'vitest';
import { useCaseGrade, gradeMetric } from '../core/useCaseGrade';
import { PROFILES } from '../core/profiles';
import type { SpeedTestResult } from '../types';
import type { UseCaseVerdict } from '../core';

function metrics(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    dl: 200,
    ul: 50,
    latency: 15,
    jitter: 2,
    packetLoss: 0,
    timestamp: Date.now(),
    ...overrides,
  };
}

function gaming(): UseCaseVerdict {
  return { id: 'gaming', status: 'good', blockingFactors: [] };
}

function streaming(): UseCaseVerdict {
  return { id: 'streaming_4k', status: 'good', blockingFactors: [] };
}

describe('useCaseGrade — derivação de grade A-F por use case', () => {
  it('retorna A quando todas as métricas relevantes estão em "excellent"', () => {
    const r = useCaseGrade(gaming(), metrics(), 'fixed_broadband');
    expect(r).toBe('A');
  });

  it('retorna B quando o pior caso é "good" (mistura A + B)', () => {
    // gaming: dl=580 (A), latency=41 (B em fixed: >30, <=60),
    // jitter=9 (B: >5, <=15), packetLoss=0 (A) → pior = B.
    const r = useCaseGrade(
      gaming(),
      metrics({ dl: 580, latency: 41, jitter: 9, packetLoss: 0 }),
      'fixed_broadband',
    );
    expect(r).toBe('B');
  });

  it('retorna F quando ao menos uma métrica relevante está em F (mistura A + F)', () => {
    // streaming_4k considera dl, jitter, packetLoss. packetLoss=10% > 5 → F.
    const r = useCaseGrade(
      streaming(),
      metrics({ dl: 500, jitter: 1, packetLoss: 10 }),
      'fixed_broadband',
    );
    expect(r).toBe('F');
  });

  it('packet loss alto rebaixa gaming para F mesmo com banda e latência ótimas', () => {
    const r = useCaseGrade(
      gaming(),
      metrics({ dl: 500, latency: 10, jitter: 1, packetLoss: 8 }),
      'fixed_broadband',
    );
    expect(r).toBe('F');
  });

  it('mesmo download recebe grade diferente em mobile_broadband (thresholds menores)', () => {
    // dl=30 Mbps:
    // - fixed_broadband: <50 (good) e >=10 (fair) → C
    // - mobile_broadband: >=25 (good) → B
    expect(gradeMetric('dl', 30, PROFILES.fixed_broadband)).toBe('C');
    expect(gradeMetric('dl', 30, PROFILES.mobile_broadband)).toBe('B');

    // streaming_4k com dl=30 dominante (jitter e loss neutros) reflete a
    // diferença no resultado final.
    const m = metrics({ dl: 30, ul: 5, latency: 50, jitter: 1, packetLoss: 0 });
    expect(useCaseGrade(streaming(), m, 'fixed_broadband')).toBe('C');
    expect(useCaseGrade(streaming(), m, 'mobile_broadband')).toBe('B');
  });
});
