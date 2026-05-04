import { describe, it, expect } from 'vitest';
import {
  easeOutCubic,
  lerpEased,
  normalizeTarget,
  epsilonFor,
  shouldStartAnimation,
} from '../hooks/useCountUp';

// Testa apenas os helpers puros do useCountUp. O hook em si depende do
// React runtime (useState/useEffect/RAF) e não temos @testing-library/react
// instalado — a cobertura aqui mira a lógica matemática, que é o coração
// da animação.

describe('useCountUp helpers', () => {
  // ── easing ────────────────────────────────────────────────────────────────
  it('easeOutCubic atinge 0 em t=0 e 1 em t=1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('easeOutCubic em t=0.5 está acima da reta (curva rápida no início)', () => {
    // Linear daria 0.5; easeOutCubic(0.5) = 1 - 0.5^3 = 0.875
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 5);
  });

  it('easeOutCubic clampa fora de [0,1]', () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });

  // ── interpolação ──────────────────────────────────────────────────────────
  it('lerpEased(0, 100, 1) → 100 (alvo final atingido)', () => {
    expect(lerpEased(0, 100, 1)).toBe(100);
  });

  it('lerpEased(0, 100, 0) → 0 (valor inicial)', () => {
    expect(lerpEased(0, 100, 0)).toBe(0);
  });

  it('lerpEased em t=0.5 retorna valor intermediário (mid-animation)', () => {
    const v = lerpEased(0, 100, 0.5);
    // easeOutCubic(0.5) = 0.875 → v = 87.5
    expect(v).toBeGreaterThan(50);
    expect(v).toBeLessThan(100);
    expect(v).toBeCloseTo(87.5, 5);
  });

  it('lerpEased respeita valor inicial não-zero (re-anima a partir do "from")', () => {
    const v = lerpEased(40, 100, 0.5);
    // 40 + (100-40) * 0.875 = 40 + 52.5 = 92.5
    expect(v).toBeCloseTo(92.5, 5);
  });

  // ── normalização do alvo ──────────────────────────────────────────────────
  it('normalizeTarget(null) retorna 0', () => {
    expect(normalizeTarget(null)).toBe(0);
  });

  it('normalizeTarget(undefined) retorna 0', () => {
    expect(normalizeTarget(undefined)).toBe(0);
  });

  it('normalizeTarget(NaN) e Infinity retornam 0', () => {
    expect(normalizeTarget(Number.NaN)).toBe(0);
    expect(normalizeTarget(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeTarget(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('normalizeTarget passa números finitos sem alteração', () => {
    expect(normalizeTarget(0)).toBe(0);
    expect(normalizeTarget(87.3)).toBe(87.3);
    expect(normalizeTarget(-5.5)).toBe(-5.5);
  });

  // ── epsilon (precisão) ────────────────────────────────────────────────────
  it('epsilonFor(1) = 0.05 (precisão 1 casa decimal)', () => {
    expect(epsilonFor(1)).toBeCloseTo(0.05, 8);
  });

  it('epsilonFor(0) = 0.5 (precisão inteira)', () => {
    expect(epsilonFor(0)).toBeCloseTo(0.5, 8);
  });

  it('mudança abaixo do epsilon é considerada estável (não re-anima)', () => {
    // simulação manual: target estável dentro do epsilon
    const decimals = 1;
    const eps = epsilonFor(decimals);
    const targetA = 87.3;
    const targetB = 87.32; // delta = 0.02 < eps (0.05)
    expect(Math.abs(targetB - targetA)).toBeLessThan(eps);
  });

  it('mudança acima do epsilon dispara re-animação', () => {
    const eps = epsilonFor(1);
    const targetA = 87.3;
    const targetB = 87.5; // delta = 0.2 > eps (0.05)
    expect(Math.abs(targetB - targetA)).toBeGreaterThan(eps);
  });
});

// ── Regressão: cards vazios no ResultScreen (StrictMode dev) ───────────────
//
// Cenário: o hook estava comparando `safeTarget` contra `targetRef.current`
// (mutado pelo efeito anterior). Em StrictMode dev, o efeito roda duas vezes
// no mount e a 2ª invocação fazia early-return — a animação cancelada pelo
// cleanup nunca era reiniciada, então `value` ficava preso em 0 e os cards
// "Download/Upload/Resposta/Oscilação" exibiam 0/—.
//
// Estes testes garantem que a decisão de animar passe a olhar o `value`
// corrente (não o target anterior). Se algum dia alguém reverter o predicado
// para `Math.abs(safeTarget - targetRef.current) < epsilon`, este bloco
// quebra antes de chegar ao APK.
describe('shouldStartAnimation (regressão ResultScreen)', () => {
  const eps = epsilonFor(1); // 0.05 — mesmo epsilon usado para Mbps

  it('mount inicial com target válido e value=0 → anima', () => {
    expect(shouldStartAnimation(604, 0, eps)).toBe(true);
  });

  it('target sobe de 0 para valor real (cenário result.dl chega depois) → anima', () => {
    // Equivalente ao caso onde a 1ª render veio com result null e a 2ª
    // trouxe os números do speedtest.
    expect(shouldStartAnimation(587, 0, eps)).toBe(true);
  });

  it('StrictMode dev: 2ª invocação do efeito ainda dispara a animação', () => {
    // value continua em 0 porque o setValue da 1ª invocação foi cancelado
    // pelo cleanup. Mesmo que `targetRef` já esteja em 604, o predicado tem
    // que olhar o `value` e devolver true.
    const valueAfterCleanup = 0;
    expect(shouldStartAnimation(604, valueAfterCleanup, eps)).toBe(true);
  });

  it('valor já chegou ao target → não re-anima', () => {
    expect(shouldStartAnimation(604, 604, eps)).toBe(false);
    expect(shouldStartAnimation(604, 603.99, eps)).toBe(false); // dentro do eps
  });

  it('latência (decimals=0): target 51 ms com value=0 → anima', () => {
    const latencyEps = epsilonFor(0); // 0.5
    expect(shouldStartAnimation(51, 0, latencyEps)).toBe(true);
  });

  it('mid-animação: value parcial, target inalterado → ainda devolve true (não trava)', () => {
    // Cenário onde o efeito é re-executado por outra dep enquanto o RAF
    // está no meio do caminho. Ainda há trabalho a fazer.
    expect(shouldStartAnimation(604, 320, eps)).toBe(true);
  });
});
