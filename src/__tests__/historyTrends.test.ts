import { describe, expect, it } from 'vitest';
import type { TestRecord } from '../types';
import {
  computeWeeklyTrend,
  computeMonthlyTrend,
  describeTrend,
  isTrendSignificant,
  type TrendComparison,
} from '../utils/historyTrends';

const DAY_MS = 24 * 3600 * 1000;
const NOW = new Date('2026-05-04T12:00:00Z').getTime();

function makeRecord(
  daysAgo: number,
  dl: number,
  ul = dl / 4,
  latency = 30,
): TestRecord {
  return {
    id: `t-${daysAgo}-${dl}`,
    timestamp: NOW - daysAgo * DAY_MS - 1000, // -1000 ms p/ ficar dentro da janela
    dl,
    ul,
    latency,
    jitter: 5,
    packetLoss: 0.5,
    quality: 'good',
    tags: [],
    serverName: 'Cloudflare',
    deviceType: 'desktop',
    connectionType: 'wifi',
  };
}

describe('historyTrends', () => {
  describe('computeWeeklyTrend', () => {
    it('returns null when total records < 10 (precisa 5 em cada janela)', () => {
      const records: TestRecord[] = Array.from({ length: 8 }, (_, i) => makeRecord(i, 500));
      expect(computeWeeklyTrend(records, NOW)).toBeNull();
    });

    it('returns null when current window has fewer than 5 tests', () => {
      // 4 testes na janela atual (0-7), 6 na anterior (7-14)
      const records: TestRecord[] = [
        ...Array.from({ length: 4 }, (_, i) => makeRecord(i, 500)),
        ...Array.from({ length: 6 }, (_, i) => makeRecord(8 + i * 0.5, 400)),
      ];
      expect(computeWeeklyTrend(records, NOW)).toBeNull();
    });

    it('returns null when previous window has fewer than 5 tests', () => {
      const records: TestRecord[] = [
        ...Array.from({ length: 6 }, (_, i) => makeRecord(i, 500)),
        ...Array.from({ length: 3 }, (_, i) => makeRecord(8 + i, 400)),
      ];
      expect(computeWeeklyTrend(records, NOW)).toBeNull();
    });

    it('returns trend with positive dlChangePct quando velocidade melhorou', () => {
      const records: TestRecord[] = [
        // current: 5 testes 0-7d com 600 Mbps
        ...Array.from({ length: 5 }, (_, i) => makeRecord(i + 1, 600)),
        // previous: 5 testes 7-14d com 500 Mbps
        ...Array.from({ length: 5 }, (_, i) => makeRecord(8 + i, 500)),
      ];
      const trend = computeWeeklyTrend(records, NOW);
      expect(trend).not.toBeNull();
      expect(trend!.current.dlAvg).toBeCloseTo(600, 0);
      expect(trend!.previous.dlAvg).toBeCloseTo(500, 0);
      expect(trend!.dlChangePct).toBeCloseTo(20, 0); // (600-500)/500*100
      expect(trend!.windowLabel).toBe('essa semana');
    });

    it('returns trend with negative dlChangePct quando velocidade piorou', () => {
      const records: TestRecord[] = [
        ...Array.from({ length: 5 }, (_, i) => makeRecord(i + 1, 400)),
        ...Array.from({ length: 5 }, (_, i) => makeRecord(8 + i, 500)),
      ];
      const trend = computeWeeklyTrend(records, NOW);
      expect(trend).not.toBeNull();
      expect(trend!.dlChangePct).toBeCloseTo(-20, 0);
    });

    it('zero change quando médias idênticas', () => {
      const records: TestRecord[] = [
        ...Array.from({ length: 5 }, (_, i) => makeRecord(i + 1, 500)),
        ...Array.from({ length: 5 }, (_, i) => makeRecord(8 + i, 500)),
      ];
      const trend = computeWeeklyTrend(records, NOW);
      expect(trend!.dlChangePct).toBe(0);
    });

    it('latency: positivo quando latência aumentou (piorou)', () => {
      const records: TestRecord[] = [
        ...Array.from({ length: 5 }, (_, i) => makeRecord(i + 1, 500, 100, 50)),
        ...Array.from({ length: 5 }, (_, i) => makeRecord(8 + i, 500, 100, 30)),
      ];
      const trend = computeWeeklyTrend(records, NOW);
      expect(trend!.latencyChangePct).toBeGreaterThan(0);
    });
  });

  describe('computeMonthlyTrend', () => {
    it('uses 30-day window', () => {
      const records: TestRecord[] = [
        // current: 5 dentro de 0-30
        ...Array.from({ length: 5 }, (_, i) => makeRecord(i * 5 + 1, 600)),
        // previous: 5 dentro de 30-60
        ...Array.from({ length: 5 }, (_, i) => makeRecord(35 + i * 5, 500)),
      ];
      const trend = computeMonthlyTrend(records, NOW);
      expect(trend).not.toBeNull();
      expect(trend!.windowLabel).toBe('esse mês');
      expect(trend!.dlChangePct).toBeCloseTo(20, 0);
    });

    it('returns null sem amostras suficientes', () => {
      const records: TestRecord[] = Array.from({ length: 5 }, (_, i) => makeRecord(i, 500));
      expect(computeMonthlyTrend(records, NOW)).toBeNull();
    });
  });

  describe('describeTrend', () => {
    function makeTrend(dlPct: number, latPct = 0, currentDl = 580, label = 'essa semana'): TrendComparison {
      return {
        current:  { dlAvg: currentDl, ulAvg: 100, latencyAvg: 30, testCount: 5 },
        previous: { dlAvg: currentDl / (1 + dlPct / 100), ulAvg: 100, latencyAvg: 30 / (1 + latPct / 100), testCount: 5 },
        dlChangePct: dlPct,
        ulChangePct: 0,
        latencyChangePct: latPct,
        windowLabel: label,
      };
    }

    it('good severity quando dl subiu >10%', () => {
      const desc = describeTrend(makeTrend(15));
      expect(desc.severity).toBe('good');
      expect(desc.comparison).toContain('melhor');
      expect(desc.comparison).toContain('▲');
    });

    it('bad severity quando dl caiu >10%', () => {
      const desc = describeTrend(makeTrend(-12));
      expect(desc.severity).toBe('bad');
      expect(desc.comparison).toContain('pior');
      expect(desc.comparison).toContain('▼');
    });

    it('uses "bem pior" quando queda >=20%', () => {
      const desc = describeTrend(makeTrend(-25));
      expect(desc.comparison).toContain('bem pior');
    });

    it('uses "bem melhor" quando alta >=20%', () => {
      const desc = describeTrend(makeTrend(30));
      expect(desc.comparison).toContain('bem melhor');
    });

    it('neutral quando variação < 10%', () => {
      const desc = describeTrend(makeTrend(5));
      expect(desc.severity).toBe('neutral');
      expect(desc.comparison).toContain('Estável');
    });

    it('narra latência quando dl é estável mas lat mudou >10%', () => {
      const desc = describeTrend(makeTrend(2, 25));
      expect(desc.severity).toBe('bad');
      expect(desc.headline).toContain('Resposta');
    });

    it('headline contém formatMbps em Gbps quando >= 1000', () => {
      const desc = describeTrend(makeTrend(15, 0, 1500));
      expect(desc.headline).toContain('Gbps');
    });
  });

  describe('isTrendSignificant', () => {
    it('true quando algum delta >= 10%', () => {
      expect(isTrendSignificant({
        current:  { dlAvg: 580, ulAvg: 100, latencyAvg: 30, testCount: 5 },
        previous: { dlAvg: 500, ulAvg: 100, latencyAvg: 30, testCount: 5 },
        dlChangePct: 16, ulChangePct: 0, latencyChangePct: 0,
        windowLabel: 'essa semana',
      })).toBe(true);
    });

    it('false quando todos os deltas < 10%', () => {
      expect(isTrendSignificant({
        current:  { dlAvg: 510, ulAvg: 100, latencyAvg: 30, testCount: 5 },
        previous: { dlAvg: 500, ulAvg: 100, latencyAvg: 30, testCount: 5 },
        dlChangePct: 2, ulChangePct: 5, latencyChangePct: -3,
        windowLabel: 'essa semana',
      })).toBe(false);
    });
  });
});
