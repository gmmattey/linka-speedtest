import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon } from './icons';
import './Accordion.css';

interface Props {
  /** Texto do header — sempre visível, mesmo colapsado. */
  title: string;
  /** Ícone opcional à esquerda do título. */
  icon?: ReactNode;
  /** Estado inicial. Default: false (colapsado). */
  defaultOpen?: boolean;
  /** Conteúdo colapsável. */
  children: ReactNode;
  /**
   * Callback disparado a cada mudança de estado (abriu/fechou). Útil para
   * lazy-load de conteúdo caro (ex.: benchmark DNS no accordion DNS — só
   * dispara quando o usuário expande pela primeira vez).
   */
  onToggle?: (open: boolean) => void;
}

/**
 * Accordion — bloco expansível usado nas seções "Mais detalhes" da
 * ResultScreen (Avançado, Modo Gamer, DNS).
 *
 * Comportamento:
 * - Header é um `<button>` com `aria-expanded` para controle total de estilo.
 * - Conteúdo anima via `max-height` lendo `scrollHeight` do conteúdo (sem
 *   `auto`, que não anima). Cubic-bezier suave; respeita `prefers-reduced-
 *   motion: reduce`.
 * - Chevron rotaciona 180° quando aberto.
 * - Sem `<details>/<summary>`: queriam-se controle total da animação e do
 *   estilo do header sem polyfill de `::marker`.
 */
export function Accordion({ title, icon, defaultOpen = false, children, onToggle }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  // `contentHeight`: altura observada do conteúdo via ResizeObserver. Sem
  // o observer, mudanças de altura no children (ex.: benchmark DNS
  // populando assíncronamente uma tabela em um accordion já aberto) NÃO
  // disparariam re-render no `<Accordion>`, mantendo `max-height` travada
  // no scrollHeight inicial e cortando o conteúdo. O observer força um
  // setState a cada mudança de tamanho e o React recalcula `maxHeight`.
  const [contentHeight, setContentHeight] = useState(0);
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    setContentHeight(node.scrollHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      // scrollHeight é mais confiável que entry.contentRect.height para
      // conteúdos com margin/overflow — usa o próprio nó como fonte.
      setContentHeight(node.scrollHeight);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // `max-height` em px. Quando aberto, replica `contentHeight` (atualizado
  // pelo ResizeObserver). Quando fechado, 0 — animação simétrica.
  const maxHeight = open ? contentHeight : 0;

  const handleToggle = () => {
    setOpen((o) => {
      const next = !o;
      onToggle?.(next);
      return next;
    });
  };

  return (
    <div className={`lk-accordion${open ? ' lk-accordion--open' : ''}`}>
      <button
        type="button"
        className="lk-accordion__header"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={handleToggle}
      >
        {icon && <span className="lk-accordion__header-icon">{icon}</span>}
        <span className="lk-accordion__header-title">{title}</span>
        <span className="lk-accordion__header-chevron" aria-hidden="true">
          <Icon name="arrowDown" size={16} color="var(--text-3)" />
        </span>
      </button>

      <div
        id={contentId}
        role="region"
        className="lk-accordion__content-wrap"
        style={{ maxHeight: `${maxHeight}px` }}
        aria-hidden={!open}
      >
        <div ref={contentRef} className="lk-accordion__content">
          {children}
        </div>
      </div>
    </div>
  );
}
