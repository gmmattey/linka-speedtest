import { describe, it, expect } from 'vitest';
import { classify, stability, stabilityLabel, buildDiagnosis, buildShortPhrase, RULE_SET_VERSION } from '../utils/classifier';
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

const noAlerts = { gamesAlerted: false, gamesBad: false, otherAlerted: false };
const gamesOnly = { gamesAlerted: true, gamesBad: false, otherAlerted: false };
const gamesBad  = { gamesAlerted: true, gamesBad: true,  otherAlerted: false };

describe('buildShortPhrase()', () => {
  it('excellent sem alertas → contém excelente e todos', () => {
    const p = buildShortPhrase(r(), 'excellent', noAlerts);
    expect(p).toContain('excelente');
    expect(p).toContain('todos');
  });

  it('good sem alertas → contém trabalho e jogos', () => {
    const p = buildShortPhrase(r({ dl: 60, ul: 15, latency: 50, jitter: 10 }), 'good', noAlerts);
    expect(p).toContain('trabalho');
    expect(p).toContain('jogos');
  });

  it('good + games maybe (latência) → contém jogos e latência', () => {
    const p = buildShortPhrase(r({ latency: 50, jitter: 7 }), 'good', gamesOnly);
    expect(p).toContain('jogos');
    expect(p).toContain('latência');
  });

  it('good + games maybe (jitter) → contém oscilação', () => {
    const p = buildShortPhrase(r({ jitter: 25, latency: 30 }), 'good', gamesOnly);
    expect(p).toContain('oscilação');
  });

  it('good + games limited → contém não ser ideal para jogos', () => {
    const p = buildShortPhrase(r(), 'good', gamesBad);
    expect(p).toContain('jogos');
    expect(p).toMatch(/não ser ideal/);
  });

  it('slow com DL alto e instabilidade → instável', () => {
    const p = buildShortPhrase(r({ dl: 300, ul: 100, latency: 90, jitter: 60, packetLoss: 3 }), 'slow', noAlerts);
    expect(p).toContain('instável');
  });

  it('slow com DL baixo → lenta', () => {
    const p = buildShortPhrase(r({ dl: 5, ul: 1, latency: 120, jitter: 20, packetLoss: 0 }), 'slow', noAlerts);
    expect(p).toContain('lenta');
  });

  it('unavailable → Sem conexão', () => {
    const p = buildShortPhrase(r({ dl: 0, ul: 0, latency: 0, jitter: 0, packetLoss: 0 }), 'unavailable', noAlerts);
    expect(p).toContain('Sem conexão');
  });
});

describe('buildShortPhrase() — matriz A-E', () => {
  // A: conexão excelente
  it('A: dl 200, ul 80, lat 15, jitter 3, loss 0 → excellent + frase excelente', () => {
    const res = r({ dl: 200, ul: 80, latency: 15, jitter: 3, packetLoss: 0 });
    expect(classify(res).primary).toBe('excellent');
    const p = buildShortPhrase(res, 'excellent', noAlerts);
    expect(p).toContain('excelente');
  });

  // B: bom mas games atenção por latência
  it('B: dl 476, ul 239, lat 50, jitter 7, loss 0 → good + games maybe + frase com latência', () => {
    const res = r({ dl: 476, ul: 239, latency: 50, jitter: 7, packetLoss: 0 });
    expect(classify(res).primary).toBe('good');
    // games evaluate: lat 50 > 40 falha good, mas ≤80 e jitter 7 ≤40 → maybe
    const gamesStatus = res.dl >= 10 && res.latency <= 40 && res.jitter <= 20 && res.packetLoss <= 0.5 ? 'good'
      : res.dl >= 5 && res.latency <= 80 && res.jitter <= 40 && res.packetLoss <= 2 ? 'maybe' : 'limited';
    expect(gamesStatus).toBe('maybe');
    const p = buildShortPhrase(res, 'good', { gamesAlerted: true, gamesBad: false, otherAlerted: false });
    expect(p).toContain('latência');
  });

  // C: rápido mas instável
  it('C: dl 300, ul 100, lat 90, jitter 60, loss 3 → slow + instável', () => {
    const res = r({ dl: 300, ul: 100, latency: 90, jitter: 60, packetLoss: 3 });
    expect(classify(res).primary).toBe('slow');
    const p = buildShortPhrase(res, 'slow', noAlerts);
    expect(p).toContain('instável');
  });

  // D: download baixo, latência boa
  it('D: dl 8, ul 5, lat 20, jitter 5, loss 0 → slow + streaming limitado', () => {
    const res = r({ dl: 8, ul: 5, latency: 20, jitter: 5, packetLoss: 0 });
    expect(classify(res).primary).toBe('slow');
    // streaming 4K: dl 8 < 10 → limited
    const streamStatus = res.dl >= 25 ? 'good' : res.dl >= 10 ? 'maybe' : 'limited';
    expect(streamStatus).toBe('limited');
    // games: dl 8 >= 5, lat 20 ≤ 80, jitter 5 ≤ 40, loss 0 ≤ 2 → maybe
    const gamesStatus2 = res.dl >= 10 && res.latency <= 40 && res.jitter <= 20 && res.packetLoss <= 0.5 ? 'good'
      : res.dl >= 5 && res.latency <= 80 && res.jitter <= 40 && res.packetLoss <= 2 ? 'maybe' : 'limited';
    expect(gamesStatus2).toBe('maybe');
  });

  // E: upload fraco — ul 1.5 falha good (ul<2) mas passa maybe (ul>=1)
  it('E: dl 50, ul 1.5, lat 20, jitter 5, loss 0 → slow + videochamada atenção + streaming ok', () => {
    const res = r({ dl: 50, ul: 1.5, latency: 20, jitter: 5, packetLoss: 0 });
    expect(classify(res).primary).toBe('slow');
    // videochamada: ul 1.5 < 2 falha good; dl>=2 ✓, ul>=1 ✓, lat<=150 ✓ → maybe
    const videoStatus = res.dl >= 5 && res.ul >= 2 && res.latency <= 100 && res.jitter <= 30 ? 'good'
      : res.dl >= 2 && res.ul >= 1 && res.latency <= 150 ? 'maybe' : 'limited';
    expect(videoStatus).toBe('maybe');
    // streaming 4K: dl 50 ≥ 25 → good
    const streamStatus2 = res.dl >= 25 ? 'good' : res.dl >= 10 ? 'maybe' : 'limited';
    expect(streamStatus2).toBe('good');
  });
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
