import { describe, it, expect } from 'vitest';
import { classify, RULE_SET_VERSION } from '../utils/classifier';
import { gradeFrom } from '../core/networkQualityClassifier';
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

describe('RULE_SET_VERSION', () => {
  it('está em v1 (sentinela contra bump silencioso)', () => {
    expect(RULE_SET_VERSION).toBe('v1');
  });
});

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

describe('gradeFrom — bufferbloat thresholds', () => {
  it('delta=0 → A', () => expect(gradeFrom(0)).toBe('A'));
  it('delta=29 → A', () => expect(gradeFrom(29)).toBe('A'));
  it('delta=30 → B', () => expect(gradeFrom(30)).toBe('B'));
  it('delta=59 → B', () => expect(gradeFrom(59)).toBe('B'));
  it('delta=60 → C', () => expect(gradeFrom(60)).toBe('C'));
  it('delta=100 → C', () => expect(gradeFrom(100)).toBe('C'));
  it('delta=199 → C', () => expect(gradeFrom(199)).toBe('C'));
  it('delta=200 → D', () => expect(gradeFrom(200)).toBe('D'));
  it('delta=250 → D', () => expect(gradeFrom(250)).toBe('D'));
  it('delta=399 → D', () => expect(gradeFrom(399)).toBe('D'));
  it('delta=400 → F', () => expect(gradeFrom(400)).toBe('F'));
  it('delta=450 → F', () => expect(gradeFrom(450)).toBe('F'));
});

