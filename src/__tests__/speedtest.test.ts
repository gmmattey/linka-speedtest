import { describe, it, expect } from 'vitest';
import { computeRanges, mapProgress } from '../utils/speedTestOrchestrator';

describe('computeRanges', () => {
  it('fast: ranges são contínuos, começam em 0 e terminam em 1', () => {
    const r = computeRanges('fast');
    expect(r.latency[0]).toBe(0);
    expect(r.upload[1]).toBe(1);
    expect(r.latency[1]).toBeCloseTo(r.download[0], 10);
    expect(r.download[1]).toBeCloseTo(r.upload[0], 10);
  });

  it('fast: pesos próximos a 24.6/37.7/37.7 (15+23+23 amostras)', () => {
    const r = computeRanges('fast');
    const wLatency  = r.latency[1]  - r.latency[0];
    const wDownload = r.download[1] - r.download[0];
    const wUpload   = r.upload[1]   - r.upload[0];
    // 15/(15+23+23) = 15/61 ≈ 0.2459
    expect(wLatency).toBeCloseTo(15 / 61, 3);
    expect(wDownload).toBeCloseTo(23 / 61, 3);
    expect(wUpload).toBeCloseTo(23 / 61, 3);
  });

  it('complete: ranges são contínuos e cobrem [0,1]', () => {
    const r = computeRanges('complete');
    expect(r.latency[0]).toBe(0);
    expect(r.upload[1]).toBe(1);
    expect(r.latency[1]).toBeCloseTo(r.download[0], 10);
    expect(r.download[1]).toBeCloseTo(r.upload[0], 10);
  });

  it('complete: pesos próximos a 17.2/41.4/41.4 (25+60+60 amostras)', () => {
    const r = computeRanges('complete');
    const wLatency  = r.latency[1]  - r.latency[0];
    const wDownload = r.download[1] - r.download[0];
    const wUpload   = r.upload[1]   - r.upload[0];
    // 25/(25+60+60) = 25/145 ≈ 0.1724
    expect(wLatency).toBeCloseTo(25 / 145, 3);
    expect(wDownload).toBeCloseTo(60 / 145, 3);
    expect(wUpload).toBeCloseTo(60 / 145, 3);
  });

  it('complete tem peso de latência menor que fast (mais amostras de DL/UL)', () => {
    const fast = computeRanges('fast');
    const comp = computeRanges('complete');
    const wFastLat = fast.latency[1] - fast.latency[0];
    const wCompLat = comp.latency[1] - comp.latency[0];
    expect(wCompLat).toBeLessThan(wFastLat);
  });
});

describe('mapProgress', () => {
  it('mapeia local=0 ao início do intervalo e local=1 ao fim', () => {
    const range: [number, number] = [0.2, 0.6];
    expect(mapProgress(range, 0)).toBeCloseTo(0.2, 10);
    expect(mapProgress(range, 1)).toBeCloseTo(0.6, 10);
  });

  it('é monotônico crescente em [0,1]', () => {
    const range: [number, number] = [0.1, 0.5];
    let last = -Infinity;
    for (let i = 0; i <= 10; i++) {
      const v = mapProgress(range, i / 10);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });

  it('clampa valores fora de [0,1]', () => {
    const range: [number, number] = [0, 1];
    expect(mapProgress(range, -0.5)).toBe(0);
    expect(mapProgress(range, 1.5)).toBe(1);
  });
});
