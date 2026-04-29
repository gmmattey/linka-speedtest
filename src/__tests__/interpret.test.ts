import { describe, it, expect } from 'vitest';
import { interpretSpeedTestResult } from '../core/interpret';
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
