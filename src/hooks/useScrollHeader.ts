import { useCallback, useEffect, useState } from 'react';

/**
 * Hook que detecta quando o `PageHeader` (sentinel) saiu da viewport para
 * acionar o glass effect + título pequeno do TopBar (Bloco 5 — TopBar
 * System, 2026-05).
 *
 * Uso:
 * ```tsx
 * const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();
 *
 * <div className="lk-tela">
 *   <TopBar scrolled={scrolled} title="Histórico" showTitle={scrolled} />
 *   <div className="lk-tela__scroll" ref={scrollContainerRef}>
 *     <PageHeader ref={sentinelRef} title="Histórico" />
 *     ...
 *   </div>
 * </div>
 * ```
 *
 * Implementação: `IntersectionObserver` observando o sentinel; `root`
 * pode ser o scrollContainer (interno) ou `null` (window). `rootMargin`
 * negativo no topo compensa a altura do TopBar para que o trigger seja
 * exato no momento em que o título grande encosta no header.
 *
 * Fallback silencioso: ambientes sem `IntersectionObserver` (testes JSDOM
 * antigos) ficam com `scrolled = false` permanente — comportamento
 * aceitável: o header só não muda de estado.
 *
 * Os dois "refs" retornados são callback refs — aceitos por `useRef`-style
 * consumers (via `forwardRef`) e disparam re-observação quando o nó muda.
 */
export interface UseScrollHeaderResult {
  scrolled: boolean;
  /** Opacidade do TopBar: 1 no topo, 0 após FADE_THRESHOLD_PX de scroll. */
  topBarOpacity: number;
  /** Callback ref para o container que rola (qualquer HTMLElement: div, main, section). */
  scrollContainerRef: (el: HTMLElement | null) => void;
  /** Callback ref para o sentinel — tipicamente o `<PageHeader>`. */
  sentinelRef: (el: HTMLElement | null) => void;
}

const TOPBAR_HEIGHT_PX = 56;
const FADE_THRESHOLD_PX = 80;

export function useScrollHeader(): UseScrollHeaderResult {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);

  const scrollContainerRef = useCallback((el: HTMLElement | null) => {
    setContainer(el);
  }, []);

  const sentinelRef = useCallback((el: HTMLElement | null) => {
    setSentinel(el);
  }, []);

  useEffect(() => {
    if (!sentinel) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setScrolled(!entry.isIntersecting);
      },
      {
        root: container ?? null,
        threshold: 0,
        rootMargin: `-${TOPBAR_HEIGHT_PX}px 0px 0px 0px`,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [container, sentinel]);

  useEffect(() => {
    if (!container) return;
    const onScroll = () => setScrollY(container.scrollTop);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      setScrollY(0);
    };
  }, [container]);

  const topBarOpacity = Math.max(0, 1 - scrollY / FADE_THRESHOLD_PX);

  return { scrolled, topBarOpacity, scrollContainerRef, sentinelRef };
}

/**
 * Calcula `scrolled` a partir do estado de visibilidade do sentinel.
 * Helper puro exposto para testes — espelha a regra do hook.
 */
export function deriveScrolled(isIntersecting: boolean): boolean {
  return !isIntersecting;
}
