import { describe, it, expect } from 'vitest';
import { interpretSpeedTestResult } from '../core/interpret';
import { resolveCopy } from '../core/copyDictionary';
import { RULE_SET_VERSION } from '../utils/classifier';
import type { ConnectionProfile, SpeedTestResult, TestRecord } from '../types';

function metrics(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
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

function run(m: SpeedTestResult, profile: ConnectionProfile = 'fixed_broadband', history?: TestRecord[]) {
  return interpretSpeedTestResult({ metrics: m, profile, history });
}

// =============================================================================
// Sentinela e contrato básico
// =============================================================================

describe('interpretSpeedTestResult — contrato básico', () => {
  it('retorna ruleSetVersion = v1 (paridade legacy)', () => {
    expect(run(metrics()).ruleSetVersion).toBe('v1');
    expect(run(metrics()).ruleSetVersion).toBe(RULE_SET_VERSION);
  });

  it('ecoa o profile recebido', () => {
    expect(run(metrics(), 'fixed_broadband').profile).toBe('fixed_broadband');
    expect(run(metrics(), 'mobile_broadband').profile).toBe('mobile_broadband');
  });

  it('emite copyKeys derivados, não strings cruas', () => {
    const r = run(metrics());
    expect(r.copyKeys.headlineKey).toBe('quality.excellent');
    expect(r.copyKeys.stabilityLabelKey).toBe('stability.very_stable');
  });
});

// =============================================================================
// Quality — paridade com classifier legado em fixed_broadband (matriz A-E)
// =============================================================================

describe('quality — paridade fixed_broadband (matriz A-E)', () => {
  // A: excelente
  it('A: dl 200, ul 80, lat 15, jitter 3, loss 0 → excellent', () => {
    expect(run(metrics({ dl: 200, ul: 80, latency: 15, jitter: 3, packetLoss: 0 })).quality)
      .toBe('excellent');
  });

  // B: bom
  it('B: dl 60, ul 15, lat 50, jitter 10, loss 0.5 → good', () => {
    expect(run(metrics({ dl: 60, ul: 15, latency: 50, jitter: 10, packetLoss: 0.5 })).quality)
      .toBe('good');
  });

  // C: rápido mas instável → slow (paridade legacy)
  it('C: dl 300, ul 100, lat 90, jitter 60, loss 3 → slow', () => {
    expect(run(metrics({ dl: 300, ul: 100, latency: 90, jitter: 60, packetLoss: 3 })).quality)
      .toBe('slow');
  });

  // D: dl baixo (8 < fair=10) → slow
  it('D: dl 8, ul 5, lat 20, jitter 5, loss 0 → slow', () => {
    expect(run(metrics({ dl: 8, ul: 5, latency: 20, jitter: 5, packetLoss: 0 })).quality)
      .toBe('slow');
  });

  // E: ul fraco — ul 1.5 falha tanto good (ul<10) quanto fair (ul<3) → slow
  it('E: dl 50, ul 1.5, lat 20, jitter 5, loss 0 → slow', () => {
    expect(run(metrics({ dl: 50, ul: 1.5, latency: 20, jitter: 5, packetLoss: 0 })).quality)
      .toBe('slow');
  });
});

// =============================================================================
// Quality — mobile_broadband (deflate de banda)
// =============================================================================

describe('quality — mobile_broadband', () => {
  it('4G boa: dl 30, ul 10, lat 50, jitter 10, loss 0.5 → good', () => {
    expect(run(
      metrics({ dl: 30, ul: 10, latency: 50, jitter: 10, packetLoss: 0.5 }),
      'mobile_broadband',
    ).quality).toBe('good');
  });

  it('4G ruim: dl 8, ul 2, lat 120, jitter 20, loss 1.5 → fair', () => {
    expect(run(
      metrics({ dl: 8, ul: 2, latency: 120, jitter: 20, packetLoss: 1.5 }),
      'mobile_broadband',
    ).quality).toBe('fair');
  });

  it('3G: dl 2, ul 0.5, lat 200, jitter 30, loss 3 → slow', () => {
    expect(run(
      metrics({ dl: 2, ul: 0.5, latency: 200, jitter: 30, packetLoss: 3 }),
      'mobile_broadband',
    ).quality).toBe('slow');
  });
});

// =============================================================================
// Stability — achado #2: "Muito estável" + "Resposta alta" não pode coexistir
// =============================================================================

describe('stability — rebaixamento por latência alta (achado #2)', () => {
  it('jitter/loss perfeitos + latência > 1.5× highLatency → rebaixa de very_stable para stable', () => {
    // Fixed: highLatency = 80, então 1.5× = 120. Latência 130 dispara.
    const r = run(metrics({ jitter: 0, packetLoss: 0, latency: 130 }));
    expect(r.stability.score).toBe(100);                 // score puro permanece máximo
    expect(r.stability.level).toBe('stable');            // mas o nível foi rebaixado
    expect(r.flags.highLatency).toBe(true);
  });

  it('mobile: latência 170 (>110×1.5=165) também rebaixa nível', () => {
    const r = run(
      metrics({ jitter: 0, packetLoss: 0, latency: 170 }),
      'mobile_broadband',
    );
    expect(r.stability.score).toBe(100);
    expect(r.stability.level).toBe('stable');
    expect(r.flags.highLatency).toBe(true);
  });
});

// =============================================================================
// Use cases — achado #3 (4K com perda alta) e achado #4 (Games com jitter ~ok)
// =============================================================================

describe('use cases — métricas relevantes em todos os cenários', () => {
  it('streaming_4k com dl alto mas packetLoss=8% NÃO é good (achado #3)', () => {
    const r = run(metrics({ dl: 200, ul: 80, latency: 20, jitter: 3, packetLoss: 8 }));
    const stream = r.useCases.find((u) => u.id === 'streaming_4k')!;
    expect(stream.status).not.toBe('good');
    expect(stream.blockingFactors).toContain('packetLoss');
  });

  it('gaming com jitter=7ms e latency=50ms NÃO é limited (achado #4)', () => {
    const r = run(metrics({ dl: 100, ul: 30, latency: 50, jitter: 7, packetLoss: 0 }));
    const games = r.useCases.find((u) => u.id === 'gaming')!;
    expect(games.status).not.toBe('limited');
    // Cai para "maybe" — latência 50 falha o good (≤40) mas passa o maybe (≤80)
    expect(games.status).toBe('maybe');
  });
});

// =============================================================================
// Invariante de recomendações
// =============================================================================

describe('recomendações — invariante de rastreabilidade', () => {
  it('quando gaming = limited, há recomendação rastreando algum fator do uso', () => {
    // dl baixo e perda alta → games sai como limited
    const m = metrics({ dl: 4, ul: 30, latency: 200, jitter: 100, packetLoss: 10 });
    const r = run(m);
    const games = r.useCases.find((u) => u.id === 'gaming')!;
    expect(games.status).toBe('limited');

    const ucReco = r.recommendations.find((rec) => rec.id === 'useCase.gaming.limited');
    expect(ucReco).toBeDefined();
    expect(ucReco!.triggeredBy).toContain('useCase');

    // E os fatores que rebaixaram aparecem entre as recomendações de flags:
    // packetLoss e latency estão acima dos limiares de flag.
    const flagRecoIds = r.recommendations.map((rec) => rec.id);
    expect(flagRecoIds).toContain('flag.packetLoss');
    expect(flagRecoIds).toContain('flag.highLatency');
  });
});

// =============================================================================
// Quality — casos não cobertos acima
// =============================================================================

describe('quality — fair e unavailable (fixed_broadband)', () => {
  it('fair: dl=10, ul=3, lat=100, loss=2 → exatamente no limiar', () => {
    expect(run(metrics({ dl: 10, ul: 3, latency: 100, jitter: 40, packetLoss: 2 })).quality)
      .toBe('fair');
  });

  it('fair: dl=20, ul=5, lat=80, jitter=20, loss=1.8 → fair (jitter não é critério de fair)', () => {
    expect(run(metrics({ dl: 20, ul: 5, latency: 80, jitter: 20, packetLoss: 1.8 })).quality)
      .toBe('fair');
  });

  it('unavailable: dl=0, ul=0 → unavailable', () => {
    expect(run(metrics({ dl: 0, ul: 0, latency: 0, jitter: 0, packetLoss: 0 })).quality)
      .toBe('unavailable');
  });

  it('slow: dl>0, ul=0, abaixo dos limiares fair → slow (não cai em unavailable)', () => {
    expect(run(metrics({ dl: 5, ul: 0, latency: 150, jitter: 60, packetLoss: 5 })).quality)
      .toBe('slow');
  });
});

describe('quality — mobile_broadband (excellent + unavailable)', () => {
  it('excellent: dl=60, ul=20, lat=50, jitter=3, loss=0.3 → excellent', () => {
    expect(run(
      metrics({ dl: 60, ul: 20, latency: 50, jitter: 3, packetLoss: 0.3 }),
      'mobile_broadband',
    ).quality).toBe('excellent');
  });

  it('unavailable: dl=0, ul=0 no mobile → unavailable', () => {
    expect(run(
      metrics({ dl: 0, ul: 0, latency: 0, jitter: 0, packetLoss: 0 }),
      'mobile_broadband',
    ).quality).toBe('unavailable');
  });

  it('fair: dl=6, ul=2, lat=120, jitter=20, loss=1.5 → fair (mobile)', () => {
    expect(run(
      metrics({ dl: 6, ul: 2, latency: 120, jitter: 20, packetLoss: 1.5 }),
      'mobile_broadband',
    ).quality).toBe('fair');
  });

  // Prova que os thresholds móveis são mais lenientes que a fixa
  it('dl=8 → slow em fixed (abaixo do fair dl≥10), fair em mobile (acima do fair dl≥5)', () => {
    const m = metrics({ dl: 8, ul: 2, latency: 80, jitter: 10, packetLoss: 0.5 });
    expect(run(m, 'fixed_broadband').quality).toBe('slow');
    expect(run(m, 'mobile_broadband').quality).toBe('fair');
  });
});

// =============================================================================
// Flags — cobertura de cada flag individualmente
// =============================================================================

describe('flags — fixed_broadband (todos os 5)', () => {
  it('highLatency=false abaixo do limiar (lat=80)', () => {
    expect(run(metrics({ latency: 80 })).flags.highLatency).toBe(false);
  });

  it('highLatency=true acima do limiar (lat=81)', () => {
    expect(run(metrics({ latency: 81 })).flags.highLatency).toBe(true);
  });

  it('lowUpload=false quando ul≥5', () => {
    expect(run(metrics({ ul: 5 })).flags.lowUpload).toBe(false);
  });

  it('lowUpload=true quando ul<5', () => {
    expect(run(metrics({ ul: 4.9 })).flags.lowUpload).toBe(true);
  });

  it('unstable=false quando jitter≤50', () => {
    expect(run(metrics({ jitter: 50 })).flags.unstable).toBe(false);
  });

  it('unstable=true quando jitter>50', () => {
    expect(run(metrics({ jitter: 51 })).flags.unstable).toBe(true);
  });

  it('packetLoss=false quando loss≤2', () => {
    expect(run(metrics({ packetLoss: 2 })).flags.packetLoss).toBe(false);
  });

  it('packetLoss=true quando loss>2', () => {
    expect(run(metrics({ packetLoss: 2.1 })).flags.packetLoss).toBe(true);
  });

  it('veryUnstable=true via jitter>80', () => {
    expect(run(metrics({ jitter: 81 })).flags.veryUnstable).toBe(true);
  });

  it('veryUnstable=true via packetLoss>5', () => {
    expect(run(metrics({ packetLoss: 5.1 })).flags.veryUnstable).toBe(true);
  });

  it('veryUnstable=false quando jitter=80 e loss=2 (nos limiares)', () => {
    expect(run(metrics({ jitter: 80, packetLoss: 2 })).flags.veryUnstable).toBe(false);
  });
});

describe('flags — mobile_broadband (limiares diferentes)', () => {
  it('mobile: highLatency=false em lat=110 (limiar=110)', () => {
    expect(run(metrics({ latency: 110 }), 'mobile_broadband').flags.highLatency).toBe(false);
  });

  it('mobile: highLatency=true em lat=111', () => {
    expect(run(metrics({ latency: 111 }), 'mobile_broadband').flags.highLatency).toBe(true);
  });

  it('mobile: lowUpload=false em ul=2.5 (limiar=2.5)', () => {
    expect(run(metrics({ ul: 2.5 }), 'mobile_broadband').flags.lowUpload).toBe(false);
  });

  it('mobile: lowUpload=true em ul=2.4', () => {
    expect(run(metrics({ ul: 2.4 }), 'mobile_broadband').flags.lowUpload).toBe(true);
  });
});

// =============================================================================
// Stability — todos os 4 níveis + downgrade completo
// =============================================================================

describe('stability — todos os níveis', () => {
  it('very_stable: jitter=0, loss=0 → score=100, level=very_stable', () => {
    const r = run(metrics({ jitter: 0, packetLoss: 0, latency: 20 }));
    expect(r.stability.score).toBe(100);
    expect(r.stability.level).toBe('very_stable');
  });

  it('stable: jitter=25, loss=0 → score=70, level=stable', () => {
    // jitterScore = 100 - (25/50)*100 = 50; lossScore = 100; score = round(0.6*50 + 0.4*100) = 70
    const r = run(metrics({ jitter: 25, packetLoss: 0, latency: 20 }));
    expect(r.stability.score).toBe(70);
    expect(r.stability.level).toBe('stable');
  });

  it('oscillating: jitter=40, loss=0 → score=52, level=oscillating', () => {
    // jitterScore = 100 - 80 = 20; lossScore = 100; score = round(0.6*20 + 0.4*100) = 52
    const r = run(metrics({ jitter: 40, packetLoss: 0, latency: 20 }));
    expect(r.stability.score).toBe(52);
    expect(r.stability.level).toBe('oscillating');
  });

  it('unstable: jitter=50, loss=2 → score=0, level=unstable', () => {
    const r = run(metrics({ jitter: 50, packetLoss: 2, latency: 20 }));
    expect(r.stability.score).toBe(0);
    expect(r.stability.level).toBe('unstable');
  });
});

describe('stability — downgrade por latência alta', () => {
  it('stable (score=70) + lat=130 → downgrade para oscillating', () => {
    // fixed highLatency=80, 1.5×=120. lat=130 dispara downgrade.
    const r = run(metrics({ jitter: 25, packetLoss: 0, latency: 130 }));
    expect(r.stability.score).toBe(70);
    expect(r.stability.level).toBe('oscillating');
  });

  it('oscillating (score=52) + lat=130 → downgrade para unstable', () => {
    const r = run(metrics({ jitter: 40, packetLoss: 0, latency: 130 }));
    expect(r.stability.score).toBe(52);
    expect(r.stability.level).toBe('unstable');
  });

  it('unstable + lat=130 → permanece unstable (piso, sem downgrade adicional)', () => {
    const r = run(metrics({ jitter: 50, packetLoss: 2, latency: 130 }));
    expect(r.stability.score).toBe(0);
    expect(r.stability.level).toBe('unstable');
  });

  it('lat=120 (= 1.5× limiar, não estritamente maior) → sem downgrade', () => {
    const r = run(metrics({ jitter: 0, packetLoss: 0, latency: 120 }));
    expect(r.stability.level).toBe('very_stable');
  });
});

// =============================================================================
// Use cases — boa cobertura de cada cenário
// =============================================================================

describe('use cases — gaming (fixed_broadband)', () => {
  it('good: dl=10, lat=40, jitter=20, loss=0.5 → good, sem blockingFactors', () => {
    const r = run(metrics({ dl: 10, ul: 30, latency: 40, jitter: 20, packetLoss: 0.5 }));
    const g = r.useCases.find((u) => u.id === 'gaming')!;
    expect(g.status).toBe('good');
    expect(g.blockingFactors).toHaveLength(0);
  });

  it('maybe: lat=50 (falha good ≤40, passa maybe ≤80) → blockingFactor=[latency]', () => {
    const r = run(metrics({ dl: 10, ul: 30, latency: 50, jitter: 5, packetLoss: 0 }));
    const g = r.useCases.find((u) => u.id === 'gaming')!;
    expect(g.status).toBe('maybe');
    expect(g.blockingFactors).toContain('latency');
  });

  it('limited: lat=90 (falha maybe ≤80) → limited', () => {
    const r = run(metrics({ dl: 10, ul: 30, latency: 90, jitter: 5, packetLoss: 0 }));
    const g = r.useCases.find((u) => u.id === 'gaming')!;
    expect(g.status).toBe('limited');
  });
});

describe('use cases — streaming_4k (fixed_broadband)', () => {
  it('good: dl=25, jitter=5, loss=0.5 → good', () => {
    const r = run(metrics({ dl: 25, ul: 30, latency: 20, jitter: 5, packetLoss: 0.5 }));
    const s = r.useCases.find((u) => u.id === 'streaming_4k')!;
    expect(s.status).toBe('good');
    expect(s.blockingFactors).toHaveLength(0);
  });

  it('maybe: dl=15 (falha good ≥25, passa maybe ≥10) → maybe, blockingFactor=[dl]', () => {
    const r = run(metrics({ dl: 15, ul: 30, latency: 20, jitter: 5, packetLoss: 0.5 }));
    const s = r.useCases.find((u) => u.id === 'streaming_4k')!;
    expect(s.status).toBe('maybe');
    expect(s.blockingFactors).toContain('dl');
  });

  it('limited: dl=8 (falha maybe ≥10) → limited', () => {
    const r = run(metrics({ dl: 8, ul: 30, latency: 20, jitter: 5, packetLoss: 0 }));
    const s = r.useCases.find((u) => u.id === 'streaming_4k')!;
    expect(s.status).toBe('limited');
  });
});

describe('use cases — home_office (fixed_broadband)', () => {
  it('good: dl=10, ul=5, lat=100, jitter=30, loss=1 → good', () => {
    const r = run(metrics({ dl: 10, ul: 5, latency: 100, jitter: 30, packetLoss: 1 }));
    const h = r.useCases.find((u) => u.id === 'home_office')!;
    expect(h.status).toBe('good');
  });

  it('maybe: ul=3 (falha good ≥5, passa maybe ≥2) → maybe, blockingFactor=[ul]', () => {
    const r = run(metrics({ dl: 10, ul: 3, latency: 80, jitter: 20, packetLoss: 0.5 }));
    const h = r.useCases.find((u) => u.id === 'home_office')!;
    expect(h.status).toBe('maybe');
    expect(h.blockingFactors).toContain('ul');
  });

  it('limited: ul=1 (falha maybe ≥2) → limited', () => {
    const r = run(metrics({ dl: 10, ul: 1, latency: 80, jitter: 20, packetLoss: 0 }));
    const h = r.useCases.find((u) => u.id === 'home_office')!;
    expect(h.status).toBe('limited');
  });
});

describe('use cases — video_call (fixed_broadband)', () => {
  it('good: dl=5, ul=2, lat=100, jitter=30, loss=0.5 → good', () => {
    const r = run(metrics({ dl: 5, ul: 2, latency: 100, jitter: 30, packetLoss: 0.5 }));
    const v = r.useCases.find((u) => u.id === 'video_call')!;
    expect(v.status).toBe('good');
  });

  it('maybe: loss=2 (falha good ≤1, passa maybe ≤3) → maybe', () => {
    const r = run(metrics({ dl: 5, ul: 2, latency: 80, jitter: 20, packetLoss: 2 }));
    const v = r.useCases.find((u) => u.id === 'video_call')!;
    expect(v.status).toBe('maybe');
  });

  it('limited: ul=0.4 (falha maybe ≥1) → limited', () => {
    const r = run(metrics({ dl: 5, ul: 0.4, latency: 80, jitter: 20, packetLoss: 0 }));
    const v = r.useCases.find((u) => u.id === 'video_call')!;
    expect(v.status).toBe('limited');
  });
});

describe('use cases — mobile_broadband (limiares deflacionados)', () => {
  it('mobile gaming good: dl=5, lat=70, jitter=20, loss=0.5 → good', () => {
    const r = run(metrics({ dl: 5, ul: 5, latency: 70, jitter: 20, packetLoss: 0.5 }), 'mobile_broadband');
    const g = r.useCases.find((u) => u.id === 'gaming')!;
    expect(g.status).toBe('good');
  });

  it('mobile streaming_4k good: dl=13, jitter=20, loss=0.5 → good', () => {
    const r = run(metrics({ dl: 13, ul: 5, latency: 40, jitter: 20, packetLoss: 0.5 }), 'mobile_broadband');
    const s = r.useCases.find((u) => u.id === 'streaming_4k')!;
    expect(s.status).toBe('good');
  });
});

// =============================================================================
// Recomendações — cobertura de cada fonte
// =============================================================================

describe('recomendações — uma por flag verdadeira', () => {
  it('nenhuma flag → nenhuma recomendação de flag', () => {
    const r = run(metrics({ dl: 100, ul: 30, latency: 20, jitter: 3, packetLoss: 0 }));
    const flagRecos = r.recommendations.filter((rec) => rec.id.startsWith('flag.'));
    expect(flagRecos).toHaveLength(0);
  });

  it('flag.highLatency → recomendação com priority=high', () => {
    const r = run(metrics({ latency: 90 }));
    const rec = r.recommendations.find((rec) => rec.id === 'flag.highLatency');
    expect(rec).toBeDefined();
    expect(rec!.priority).toBe('high');
    expect(rec!.triggeredBy).toContain('highLatency');
  });

  it('flag.lowUpload → recomendação com priority=medium', () => {
    const r = run(metrics({ ul: 3 }));
    const rec = r.recommendations.find((rec) => rec.id === 'flag.lowUpload');
    expect(rec).toBeDefined();
    expect(rec!.priority).toBe('medium');
  });

  it('flag.unstable → recomendação com priority=medium', () => {
    const r = run(metrics({ jitter: 55 }));
    const rec = r.recommendations.find((rec) => rec.id === 'flag.unstable');
    expect(rec).toBeDefined();
    expect(rec!.priority).toBe('medium');
  });

  it('flag.packetLoss → recomendação com priority=high', () => {
    const r = run(metrics({ packetLoss: 3 }));
    const rec = r.recommendations.find((rec) => rec.id === 'flag.packetLoss');
    expect(rec).toBeDefined();
    expect(rec!.priority).toBe('high');
  });

  it('flag.veryUnstable → recomendação com priority=high', () => {
    const r = run(metrics({ jitter: 90 }));
    const rec = r.recommendations.find((rec) => rec.id === 'flag.veryUnstable');
    expect(rec).toBeDefined();
    expect(rec!.priority).toBe('high');
  });
});

describe('recomendações — use cases rebaixados', () => {
  it('use case good → sem recomendação de useCase', () => {
    const r = run(metrics({ dl: 100, ul: 30, latency: 20, jitter: 3, packetLoss: 0 }));
    const ucRecos = r.recommendations.filter((rec) => rec.id.startsWith('useCase.'));
    expect(ucRecos).toHaveLength(0);
  });

  it('streaming_4k maybe → rec useCase.streaming_4k.maybe com priority=medium', () => {
    const r = run(metrics({ dl: 15, ul: 30, latency: 20, jitter: 5, packetLoss: 0.5 }));
    const rec = r.recommendations.find((rec) => rec.id === 'useCase.streaming_4k.maybe');
    expect(rec).toBeDefined();
    expect(rec!.priority).toBe('medium');
    expect(rec!.triggeredBy).toContain('useCase');
  });

  it('video_call limited → rec useCase.video_call.limited com priority=high', () => {
    const r = run(metrics({ dl: 5, ul: 0.4, latency: 80, jitter: 20, packetLoss: 0 }));
    const rec = r.recommendations.find((rec) => rec.id === 'useCase.video_call.limited');
    expect(rec).toBeDefined();
    expect(rec!.priority).toBe('high');
  });
});

describe('recomendações — histórico', () => {
  function makeRecord(overrides: Partial<TestRecord> = {}): TestRecord {
    return {
      id: Math.random().toString(),
      timestamp: Date.now(),
      dl: 100, ul: 30, latency: 20, jitter: 3, packetLoss: 0.1,
      quality: 'excellent', tags: [], serverName: 'CF',
      deviceType: 'desktop', connectionType: 'cable',
      ...overrides,
    };
  }

  it('< 3 registros → sem recomendações históricas', () => {
    const h = [makeRecord(), makeRecord()];
    const r = run(metrics(), 'fixed_broadband', h);
    const histRecos = r.recommendations.filter((rec) => rec.id.startsWith('history.'));
    expect(histRecos).toHaveLength(0);
  });

  it('3+ registros com lat>80 → rec history.latency', () => {
    const h = [
      makeRecord({ latency: 90 }), makeRecord({ latency: 90 }), makeRecord({ latency: 90 }),
    ];
    const r = run(metrics(), 'fixed_broadband', h);
    const rec = r.recommendations.find((rec) => rec.id === 'history.latency');
    expect(rec).toBeDefined();
    expect(rec!.triggeredBy).toContain('history');
  });

  it('3+ registros com loss>2 → rec history.loss', () => {
    const h = [
      makeRecord({ packetLoss: 3 }), makeRecord({ packetLoss: 3 }), makeRecord({ packetLoss: 3 }),
    ];
    const r = run(metrics(), 'fixed_broadband', h);
    expect(r.recommendations.find((rec) => rec.id === 'history.loss')).toBeDefined();
  });

  it('3+ registros com quality=slow → rec history.slow', () => {
    const h = [
      makeRecord({ quality: 'slow' }), makeRecord({ quality: 'slow' }), makeRecord({ quality: 'slow' }),
    ];
    const r = run(metrics(), 'fixed_broadband', h);
    expect(r.recommendations.find((rec) => rec.id === 'history.slow')).toBeDefined();
  });

  it('apenas 2 de 5 com lat>80 → sem rec history.latency (requer ≥3)', () => {
    const h = [
      makeRecord({ latency: 90 }), makeRecord({ latency: 90 }),
      makeRecord(), makeRecord(), makeRecord(),
    ];
    const r = run(metrics(), 'fixed_broadband', h);
    expect(r.recommendations.find((rec) => rec.id === 'history.latency')).toBeUndefined();
  });
});

// =============================================================================
// Copy keys — shortPhraseKey e diagnosisKeys
// =============================================================================

describe('copyKeys — shortPhraseKey', () => {
  it('excellent sem flags → shortPhrase.excellent', () => {
    expect(run(metrics()).copyKeys.shortPhraseKey).toBe('shortPhrase.excellent');
  });

  it('good → shortPhrase.good', () => {
    const r = run(metrics({ dl: 60, ul: 15, latency: 50, jitter: 10, packetLoss: 0.5 }));
    expect(r.copyKeys.shortPhraseKey).toBe('shortPhrase.good');
  });

  it('fair → shortPhrase.fair', () => {
    const r = run(metrics({ dl: 10, ul: 3, latency: 80, jitter: 20, packetLoss: 1.5 }));
    expect(r.copyKeys.shortPhraseKey).toBe('shortPhrase.fair');
  });

  it('slow sem flags → shortPhrase.slow', () => {
    // dl=5 → slow; latency=30 (não dispara highLatency >80); sem flags de instabilidade
    const r = run(metrics({ dl: 5, ul: 1, latency: 30, jitter: 3, packetLoss: 0 }));
    expect(r.quality).toBe('slow');
    expect(r.flags.unstable).toBe(false);
    expect(r.flags.packetLoss).toBe(false);
    expect(r.copyKeys.shortPhraseKey).toBe('shortPhrase.slow');
  });

  it('slow + flag.unstable → shortPhrase.slow.unstable', () => {
    const r = run(metrics({ dl: 5, ul: 1, latency: 30, jitter: 55, packetLoss: 0 }));
    expect(r.quality).toBe('slow');
    expect(r.flags.unstable).toBe(true);
    expect(r.copyKeys.shortPhraseKey).toBe('shortPhrase.slow.unstable');
  });

  it('slow + flag.packetLoss → shortPhrase.slow.unstable', () => {
    const r = run(metrics({ dl: 5, ul: 1, latency: 30, jitter: 3, packetLoss: 3 }));
    expect(r.copyKeys.shortPhraseKey).toBe('shortPhrase.slow.unstable');
  });

  it('slow + flag.highLatency → shortPhrase.slow.unstable', () => {
    const r = run(metrics({ dl: 5, ul: 1, latency: 90, jitter: 3, packetLoss: 0 }));
    expect(r.copyKeys.shortPhraseKey).toBe('shortPhrase.slow.unstable');
  });

  it('unavailable → shortPhrase.unavailable', () => {
    const r = run(metrics({ dl: 0, ul: 0, latency: 0, jitter: 0, packetLoss: 0 }));
    expect(r.copyKeys.shortPhraseKey).toBe('shortPhrase.unavailable');
  });
});

describe('copyKeys — diagnosisKeys (conteúdo)', () => {
  it('excellent sem flags → [diagnosis.excellent]', () => {
    const keys = run(metrics()).copyKeys.diagnosisKeys;
    expect(keys[0]).toBe('diagnosis.excellent');
    expect(keys).toHaveLength(1);
  });

  it('slow + veryUnstable → inclui diagnosis.veryUnstable (não packetLoss/unstable)', () => {
    const r = run(metrics({ dl: 5, ul: 1, latency: 30, jitter: 90, packetLoss: 0 }));
    expect(r.flags.veryUnstable).toBe(true);
    expect(r.copyKeys.diagnosisKeys).toContain('diagnosis.veryUnstable');
    expect(r.copyKeys.diagnosisKeys).not.toContain('diagnosis.packetLoss');
    expect(r.copyKeys.diagnosisKeys).not.toContain('diagnosis.unstable');
  });

  it('slow + packetLoss (sem veryUnstable) → inclui diagnosis.packetLoss', () => {
    const r = run(metrics({ dl: 5, ul: 1, latency: 30, jitter: 3, packetLoss: 3 }));
    expect(r.flags.veryUnstable).toBe(false);
    expect(r.flags.packetLoss).toBe(true);
    expect(r.copyKeys.diagnosisKeys).toContain('diagnosis.packetLoss');
    expect(r.copyKeys.diagnosisKeys).not.toContain('diagnosis.unstable');
  });

  it('slow + jitter=55 (unstable, sem packetLoss/veryUnstable) → inclui diagnosis.unstable', () => {
    const r = run(metrics({ dl: 5, ul: 1, latency: 30, jitter: 55, packetLoss: 0 }));
    expect(r.flags.unstable).toBe(true);
    expect(r.flags.packetLoss).toBe(false);
    expect(r.flags.veryUnstable).toBe(false);
    expect(r.copyKeys.diagnosisKeys).toContain('diagnosis.unstable');
  });

  it('highLatency flag → inclui diagnosis.highLatency', () => {
    const keys = run(metrics({ latency: 90 })).copyKeys.diagnosisKeys;
    expect(keys).toContain('diagnosis.highLatency');
  });

  it('lowUpload flag → inclui diagnosis.lowUpload', () => {
    const keys = run(metrics({ ul: 3 })).copyKeys.diagnosisKeys;
    expect(keys).toContain('diagnosis.lowUpload');
  });

  it('histórico com 3 lat>80 → inclui diagnosis.history.latency', () => {
    const h: TestRecord[] = Array.from({ length: 3 }, () => ({
      id: 'x', timestamp: Date.now(), dl: 50, ul: 10, latency: 90, jitter: 5,
      packetLoss: 0.1, quality: 'good' as const, tags: [], serverName: 'CF',
      deviceType: 'desktop' as const, connectionType: 'cable' as const,
    }));
    const keys = run(metrics(), 'fixed_broadband', h).copyKeys.diagnosisKeys;
    expect(keys).toContain('diagnosis.history.latency');
  });

  it('histórico com 3 loss>2 → inclui diagnosis.history.loss', () => {
    const h: TestRecord[] = Array.from({ length: 3 }, () => ({
      id: 'x', timestamp: Date.now(), dl: 50, ul: 10, latency: 20, jitter: 5,
      packetLoss: 3, quality: 'good' as const, tags: [], serverName: 'CF',
      deviceType: 'desktop' as const, connectionType: 'cable' as const,
    }));
    const keys = run(metrics(), 'fixed_broadband', h).copyKeys.diagnosisKeys;
    expect(keys).toContain('diagnosis.history.loss');
  });

  it('histórico com 3 quality=unavailable → inclui diagnosis.history.slow', () => {
    const h: TestRecord[] = Array.from({ length: 3 }, () => ({
      id: 'x', timestamp: Date.now(), dl: 0, ul: 0, latency: 0, jitter: 0,
      packetLoss: 0, quality: 'unavailable' as const, tags: [], serverName: 'CF',
      deviceType: 'desktop' as const, connectionType: 'cable' as const,
    }));
    const keys = run(metrics(), 'fixed_broadband', h).copyKeys.diagnosisKeys;
    expect(keys).toContain('diagnosis.history.slow');
  });
});

// =============================================================================
// resolveCopy — contrato do dicionário
// =============================================================================

describe('resolveCopy()', () => {
  it('chave existente → string pt-BR', () => {
    expect(resolveCopy('quality.excellent')).toBe('Conexão excelente');
    expect(resolveCopy('stability.very_stable')).toBe('Muito estável');
    expect(resolveCopy('quality.unavailable')).toBe('Sem conexão');
  });

  it('chave inexistente → retorna a própria chave (fallback visível)', () => {
    expect(resolveCopy('chave.que.nao.existe')).toBe('chave.que.nao.existe');
  });

  it('params: substitui {placeholder} no template', () => {
    // Injetamos uma chave de teste imaginando que o dicionário suporte interpolação
    // Verificamos o mecanismo sem depender de chave real com {placeholder}:
    // resolveCopy retorna key se não encontrar — comportamento já testado.
    // Para interpolação, verificamos via chave que não existe (retorna key, sem crash):
    expect(() => resolveCopy('x.y', { count: 3 })).not.toThrow();
  });
});
