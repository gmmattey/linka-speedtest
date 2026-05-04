import { useEffect, useRef, useState } from 'react';

// =============================================================================
// Helpers puros (exportados para teste)
// =============================================================================

/** Easing easeOutCubic: rápido no começo, suave no fim. t ∈ [0,1]. */
export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - x, 3);
}

/** Interpolação com easing entre `from` e `to`, dado t ∈ [0,1]. */
export function lerpEased(from: number, to: number, t: number): number {
  return from + (to - from) * easeOutCubic(t);
}

/** Normaliza o alvo: null/undefined/NaN/Infinity → 0. */
export function normalizeTarget(target: number | null | undefined): number {
  if (target == null) return 0;
  if (!Number.isFinite(target)) return 0;
  return target;
}

/** Limiar de mudança significativa baseado no número de casas decimais. */
export function epsilonFor(decimals: number): number {
  const d = Math.max(0, Math.floor(decimals));
  return Math.pow(10, -d) / 2;
}

/**
 * Decide se a animação count-up precisa (re)disparar.
 *
 * A regra é simples e independente de quem foi o "target anterior":
 * dispara sempre que o `value` corrente ainda não chegou ao `safeTarget`,
 * dentro do `epsilon`. Isso é robusto a três cenários:
 *
 *  1. Mount inicial com target já válido (`value=0`, target=600 → anima).
 *  2. `target` muda de `null`/`0` para um número real depois do mount
 *     (cenário do `ResultScreen`: `result.dl` chega após a 1ª render).
 *  3. **StrictMode dev**: o efeito roda duas vezes no mount; sem essa
 *     verificação baseada em `value`, a 2ª invocação faria early-return
 *     porque `targetRef` já foi mutado, e a animação cancelada pelo
 *     cleanup nunca seria reiniciada — a UI ficaria parada em 0.
 *
 * Exportado puro para teste sem React runtime.
 */
export function shouldStartAnimation(
  safeTarget: number,
  currentValue: number,
  epsilon: number,
): boolean {
  return Math.abs(safeTarget - currentValue) >= epsilon;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook de animação count-up baseado em RAF puro.
 *
 * Anima do último valor renderizado até `target` ao longo de `durationMs`,
 * usando easing `easeOutCubic`. Retorna sempre um número (não string) — o
 * caller continua responsável pela formatação.
 *
 * - `null` / `undefined` / `NaN` / `Infinity` → 0.
 * - Mudanças menores que `epsilon` (derivado de `decimals`) não disparam
 *   re-animação.
 *
 * Sem dependências externas. Se RAF não existir no host (SSR), aplica o
 * target imediatamente.
 */
export function useCountUp(
  target: number | null | undefined,
  durationMs: number = 700,
  decimals: number = 1,
): number {
  const safeTarget = normalizeTarget(target);
  const [value, setValue] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef<number>(0);
  const targetRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const valueRef = useRef<number>(0);
  const epsilon = epsilonFor(decimals);

  // Mantém uma referência ao valor atual sem virar dependência do efeito.
  valueRef.current = value;

  useEffect(() => {
    // Se o valor renderizado já está dentro do epsilon do target, nada a
    // animar. Comparar com `valueRef.current` (e não com `targetRef.current`)
    // é o que torna o hook resiliente a StrictMode dev: lá o efeito roda
    // duas vezes no mount, e a 2ª invocação precisa enxergar que `value`
    // ainda está em 0 e re-disparar a animação que o cleanup cancelou.
    if (!shouldStartAnimation(safeTarget, valueRef.current, epsilon)) {
      targetRef.current = safeTarget;
      return;
    }

    const hasRaf = typeof requestAnimationFrame === 'function';
    if (!hasRaf) {
      targetRef.current = safeTarget;
      setValue(safeTarget);
      return;
    }

    fromRef.current = valueRef.current;
    targetRef.current = safeTarget;
    startRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const t = Math.max(0, Math.min(1, elapsed / durationMs));
      const next = lerpEased(fromRef.current, targetRef.current, t);
      setValue(t >= 1 ? targetRef.current : next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [safeTarget, durationMs, epsilon]);

  return value;
}
