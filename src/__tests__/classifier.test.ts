import { describe, it, expect } from 'vitest';
import { classify, stability, stabilityLabel, buildDiagnosis } from '../utils/classifier';
import type { SpeedTestResult } from '../types';

function r(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    dl: 100,
    ul: 30,
    latency: 20,
    jitter: 3,
    packetLoss: 0.1,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('classify — primary quality', () => {
  it('excellent: all thresholds met', () => {
    expect(classify(r()).primary).toBe('excellent');
  });

  it('good: dl 50, ul 10, lat 60, jitter 15, loss 1.5', () => {
    expect(classify(r({ dl: 50, ul: 10, latency: 60, jitter: 15, packetLoss: 1.5 })).primary).toBe('good');
  });

  it('fair: dl 10, ul 3, lat 100, loss 2', () => {
    expect(classify(r({ dl: 10, ul: 3, latency: 100, jitter: 40, packetLoss: 2 })).primary).toBe('fair');
  });

  it('slow: any dl>0 but below fair thresholds', () => {
    expect(classify(r({ dl: 3, ul: 0.5, latency: 150, jitter: 60, packetLoss: 5 })).primary).toBe('slow');
  });

  it('unavailable: dl=0 and ul=0', () => {
    expect(classify(r({ dl: 0, ul: 0, latency: 0, jitter: 0, packetLoss: 0 })).primary).toBe('unavailable');
  });

  it('good does NOT fire when jitter > 15', () => {
    expect(classify(r({ dl: 80, ul: 20, latency: 50, jitter: 16, packetLoss: 0.5 })).primary).toBe('fair');
  });

  it('fair does NOT fire when loss > 2%', () => {
    expect(classify(r({ dl: 20, ul: 5, latency: 80, jitter: 10, packetLoss: 2.1 })).primary).toBe('slow');
  });
});

describe('classify — tags', () => {
  it('highLatency when lat > 80ms', () => {
    expect(classify(r({ latency: 81 })).tags.has('highLatency')).toBe(true);
  });

  it('no highLatency when lat = 80ms', () => {
    expect(classify(r({ latency: 80 })).tags.has('highLatency')).toBe(false);
  });

  it('lowUpload when ul < 5', () => {
    expect(classify(r({ ul: 4.9 })).tags.has('lowUpload')).toBe(true);
  });

  it('unstable when jitter > 50ms', () => {
    expect(classify(r({ jitter: 51 })).tags.has('unstable')).toBe(true);
  });

  it('packetLoss tag when loss > 2%', () => {
    expect(classify(r({ packetLoss: 2.1 })).tags.has('packetLoss')).toBe(true);
  });

  it('veryUnstable when loss > 5%', () => {
    expect(classify(r({ packetLoss: 5.1 })).tags.has('veryUnstable')).toBe(true);
  });

  it('veryUnstable when jitter > 80ms', () => {
    expect(classify(r({ jitter: 81 })).tags.has('veryUnstable')).toBe(true);
  });
});

describe('stability()', () => {
  it('returns 100 with zero jitter and zero loss', () => {
    expect(stability(r({ jitter: 0, packetLoss: 0 }))).toBe(100);
  });

  it('returns 0 with max jitter(>=50) and max loss(>=2)', () => {
    expect(stability(r({ jitter: 50, packetLoss: 2 }))).toBe(0);
  });

  it('is dominated by jitter (weight 0.6)', () => {
    const onlyJitter = stability(r({ jitter: 25, packetLoss: 0 }));
    const onlyLoss   = stability(r({ jitter: 0,  packetLoss: 1 }));
    expect(onlyJitter).toBeLessThan(onlyLoss);
  });
});

describe('stabilityLabel()', () => {
  it('≥85 → Muito estável', () => expect(stabilityLabel(85)).toBe('Muito estável'));
  it('≥60 → Estável',       () => expect(stabilityLabel(60)).toBe('Estável'));
  it('≥35 → Oscilando',     () => expect(stabilityLabel(35)).toBe('Oscilando'));
  it('<35 → Instável',      () => expect(stabilityLabel(34)).toBe('Instável'));
});

describe('buildDiagnosis()', () => {
  it('contains excellent message for excellent result', () => {
    const c = classify(r());
    const d = buildDiagnosis(r(), c);
    expect(d[0]).toContain('excelente');
  });

  it('includes veryUnstable message when tag present', () => {
    const result = r({ packetLoss: 6 });
    const c = classify(result);
    const d = buildDiagnosis(result, c);
    expect(d.join(' ')).toContain('muito instável');
  });

  it('adds history-based latency message when 3+ recent tests have lat>80', () => {
    const bad = { ...r({ latency: 90 }), id: '1', timestamp: Date.now(), quality: 'fair' as const, tags: [], serverName: 'CF', deviceType: 'desktop' as const, connectionType: 'cable' as const };
    const history = [bad, bad, bad];
    const result = r({ latency: 90 });
    const c = classify(result);
    const d = buildDiagnosis(result, c, history);
    expect(d.join(' ')).toContain('recorrente');
  });
});
