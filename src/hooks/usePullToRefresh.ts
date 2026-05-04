import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/**
 * usePullToRefresh — gesto de "puxar pra atualizar" universal (PWA web + APK
 * Capacitor) com semântica iOS/Android nativa.
 *
 * Anatomia do gesto:
 *  1. `touchstart` arma o gesto SOMENTE se `scrollContainer.scrollTop === 0`
 *     e o alvo NÃO está dentro de um `DraggableSheet` aberto (o sheet rouba
 *     o gesture). Sem armar, o scroll normal e o drag-to-resize do sheet
 *     funcionam intactos.
 *  2. `touchmove` calcula `delta = touchY − startY`. Se positivo (puxando
 *     pra baixo), aplica `resistanceFactor` (default 0.5 — 100px de dedo
 *     viram 50px de spinner) e dispara `preventDefault` para anular o
 *     rubber-band do iOS. Se negativo (puxando pra cima), desarma — usuário
 *     mudou de ideia e quer scrollar.
 *  3. `touchend`:
 *     - `pullDistance < threshold` (default 80) → snap back animado, nada
 *       mais acontece.
 *     - `pullDistance ≥ threshold` → entra em `isRefreshing`, dispara
 *       `onRefresh()`, depois snap back.
 *
 * Suporte a pointer events: implementação espelhada apenas para `pointerType
 * !== 'touch'` (mouse/pen em PWA desktop). Em touch, deixa o caminho touch
 * event original responder para garantir `preventDefault` confiável — em
 * pointer events o controle de scroll seria via `touch-action: none`, o que
 * exigiria CSS extra no scroll container.
 *
 * O hook NÃO renderiza nada — só expõe estado para o `PullToRefreshIndicator`
 * (ou consumidor custom). O consumidor é responsável por montar o indicador
 * acima do scroll container.
 */

const DEFAULT_THRESHOLD = 80;
const DEFAULT_RESISTANCE = 0.5;

export interface UsePullToRefreshOptions {
  /** Distância (px após resistência) para passar a "ready". Default 80. */
  threshold?: number;
  /**
   * Fator de resistência aplicado ao delta do dedo. Default 0.5 (puxar
   * 100px move o spinner 50px). Use < 1 para sensação de "puxar contra
   * elástico"; nunca use ≥ 1 (vira 1:1 e fica sem feedback).
   */
  resistanceFactor?: number;
  /**
   * Liga/desliga o gesto sem desmontar o hook. Default `true`. Útil para
   * desabilitar enquanto outro overlay (modal, sheet, etc.) está ativo
   * sem ter que condicionar a montagem do componente.
   */
  enabled?: boolean;
}

export interface UsePullToRefreshState {
  /** Distância visual do spinner em px (já com resistência aplicada). */
  pullDistance: number;
  /** True enquanto `onRefresh()` está em vôo. */
  isRefreshing: boolean;
  /** True quando `pullDistance ≥ threshold` — base do estado "armed". */
  isReady: boolean;
}

export function usePullToRefresh(
  scrollContainerRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void>,
  options: UsePullToRefreshOptions = {},
): UsePullToRefreshState {
  const {
    threshold = DEFAULT_THRESHOLD,
    resistanceFactor = DEFAULT_RESISTANCE,
    enabled = true,
  } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mantém uma cópia ref dos valores reativos para os event listeners não
  // precisarem ser re-attached a cada pixel de pull (preserva a passive
  // declaration e evita race entre pointer events e re-attach).
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const startYRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);
  useEffect(() => { isRefreshingRef.current = isRefreshing; }, [isRefreshing]);

  const setPull = useCallback((d: number) => {
    pullDistanceRef.current = d;
    setPullDistance(d);
  }, []);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    isRefreshingRef.current = true;
    try {
      await onRefreshRef.current();
    } catch {
      // Engole — UX manda o spinner sumir mesmo se o refresh falhar.
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
      setPull(0);
    }
  }, [setPull]);

  useEffect(() => {
    if (!enabled) {
      // Reset defensivo se desligar no meio de um gesto.
      armedRef.current = false;
      startYRef.current = null;
      if (pullDistanceRef.current !== 0) setPull(0);
      return;
    }
    const el = scrollContainerRef.current;
    if (!el) return;

    const isInsideSheet = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return !!target.closest('.lk-dsheet');
    };

    const arm = (clientY: number, target: EventTarget | null): boolean => {
      if (isRefreshingRef.current) return false;
      if (isInsideSheet(target)) return false;
      // Só arma com scrollTop em 0 — se o usuário já scrollou pra baixo,
      // pull-to-refresh não dispara, deixa scroll normal seguir.
      if (el.scrollTop > 0) return false;
      armedRef.current = true;
      startYRef.current = clientY;
      return true;
    };

    const update = (clientY: number, cancelable: boolean, preventDefault: () => void) => {
      if (!armedRef.current || startYRef.current == null) return;
      const dy = clientY - startYRef.current;
      if (dy <= 0) {
        if (pullDistanceRef.current !== 0) setPull(0);
        return;
      }
      const distance = dy * resistanceFactor;
      // Anula rubber-band do iOS / scroll padrão. Sem isso, o gesto entra
      // em conflito com a inércia nativa e o spinner nunca fica visível
      // estável. Só chama quando o gesto está armado e indo pra baixo —
      // então quando scrollTop > 0 o scroll normal continua funcionando.
      if (cancelable) preventDefault();
      setPull(distance);
    };

    const finish = () => {
      if (!armedRef.current) return;
      const distance = pullDistanceRef.current;
      armedRef.current = false;
      startYRef.current = null;
      if (distance < threshold) {
        setPull(0);
        return;
      }
      void triggerRefresh();
    };

    // ── Touch events (caminho mobile principal) ──
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        armedRef.current = false;
        return;
      }
      arm(e.touches[0].clientY, e.target);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      update(e.touches[0].clientY, e.cancelable, () => e.preventDefault());
    };

    const onTouchEnd = () => finish();

    // ── Pointer events (caminho mouse/pen no PWA desktop) ──
    // Só responde se NÃO for `touch` — o touch tem caminho próprio com
    // `preventDefault` confiável. Em mouse o page-scroll não dispara em
    // pointer-drag, então não precisa de preventDefault.
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      arm(e.clientY, e.target);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      // Em mouse não há rubber-band — passa preventDefault no-op.
      update(e.clientY, false, () => { /* no-op */ });
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      finish();
    };

    // touchmove precisa ser não-passivo para `preventDefault()` ter efeito
    // em iOS Safari moderno. Os outros podem ficar passivos.
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerEnd);
    el.addEventListener('pointercancel', onPointerEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerEnd);
      el.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [scrollContainerRef, enabled, threshold, resistanceFactor, setPull, triggerRefresh]);

  return {
    pullDistance,
    isRefreshing,
    isReady: pullDistance >= threshold,
  };
}
