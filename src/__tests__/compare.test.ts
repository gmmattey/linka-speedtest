import { describe, expect, it } from 'vitest';
import { calculateComparison } from '../utils/comparison';
import type { SpeedTestResult } from '../types';

function result(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    dl: 100, ul: 50, latency: 20, jitter: 5, packetLoss: 0, timestamp: 0,
    ...overrides,
  };
}

describe('calculateComparison', () => {
  // ── Critério da Fase 4 ─────────────────────────────────────────────────────

  it('upload caindo 80% com download estável → coverage_issue', () => {
    const near = result({ dl: 100, ul: 50 });
    const far  = result({ dl: 95,  ul: 10 }); // UL cai 80%, DL estável
    const r = calculateComparison(near, far);
    expect(r.diagnosis).toBe('coverage_issue');
    expect(r.uploadDropPercent).toBeCloseTo(80, 0);
  });

  it('upload caindo 76% com download estável → coverage_issue', () => {
    const near = result({ dl: 80, ul: 25 });
    const far  = result({ dl: 75, ul: 6 }); // UL cai ~76%
    expect(calculateComparison(near, far).diagnosis).toBe('coverage_issue');
  });

  // ── Download drop (comportamento existente) ─────────────────────────────────

  it('download caindo 80% com near boa → coverage_issue (forte)', () => {
    const near = result({ dl: 100, ul: 50, latency: 20 });
    const far  = result({ dl: 15,  ul: 45, latency: 25 });
    const r = calculateComparison(near, far);
    expect(r.diagnosis).toBe('coverage_issue');
    expect(r.downloadDropPercent).toBeCloseTo(85, 0);
  });

  it('download caindo 55% com near boa → coverage_issue (moderado)', () => {
    const near = result({ dl: 100, ul: 50, latency: 20 });
    const far  = result({ dl: 45,  ul: 48, latency: 30 });
    expect(calculateComparison(near, far).diagnosis).toBe('coverage_issue');
  });

  it('upload caindo 55% com near boa → coverage_issue (upload moderado)', () => {
    const near = result({ dl: 100, ul: 30, latency: 20 });
    const far  = result({ dl: 90,  ul: 13, latency: 22 }); // UL cai ~57%
    expect(calculateComparison(near, far).diagnosis).toBe('coverage_issue');
  });

  // ── Both bad / both good ────────────────────────────────────────────────────

  it('both_bad quando os dois locais têm download < 10 Mbps', () => {
    const near = result({ dl: 5, ul: 2, latency: 200 });
    const far  = result({ dl: 3, ul: 1, latency: 220 });
    expect(calculateComparison(near, far).diagnosis).toBe('both_bad');
  });

  it('both_good quando os dois locais têm conexão boa', () => {
    const near = result({ dl: 100, ul: 50, latency: 20 });
    const far  = result({ dl: 90,  ul: 45, latency: 25 });
    expect(calculateComparison(near, far).diagnosis).toBe('both_good');
  });

  // ── Percentuais calculados ──────────────────────────────────────────────────

  it('downloadDropPercent calculado corretamente', () => {
    const r = calculateComparison(result({ dl: 100 }), result({ dl: 60 }));
    expect(r.downloadDropPercent).toBeCloseTo(40, 1);
  });

  it('uploadDropPercent calculado corretamente', () => {
    const r = calculateComparison(result({ ul: 50 }), result({ ul: 10 }));
    expect(r.uploadDropPercent).toBeCloseTo(80, 1);
  });

  it('latencyIncreasePercent calculado corretamente', () => {
    const r = calculateComparison(result({ latency: 20 }), result({ latency: 60 }));
    expect(r.latencyIncreasePercent).toBeCloseTo(200, 1);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('near.dl = 0 → downloadDropPercent = 0 sem divisão por zero', () => {
    const r = calculateComparison(result({ dl: 0 }), result({ dl: 0 }));
    expect(r.downloadDropPercent).toBe(0);
  });

  it('near.ul muito baixo (< 3) não dispara coverage_issue por upload drop', () => {
    // near com upload fraco não deve ser amplificado
    const near = result({ dl: 80, ul: 1, latency: 30 });
    const far  = result({ dl: 75, ul: 0, latency: 35 });
    const r = calculateComparison(near, far);
    // DL não caiu muito → não é coverage_issue por DL; UL near < 3 → não dispara por UL
    expect(r.diagnosis).not.toBe('coverage_issue');
  });
});
