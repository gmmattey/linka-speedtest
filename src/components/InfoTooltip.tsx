import { useEffect, useRef, useState } from 'react';
import './InfoTooltip.css';

interface Props {
  /** Texto explicativo. Mantenha 1-2 frases pt-BR. */
  label: string;
  /** Texto alternativo para screen readers. Default usa o `label`. */
  ariaLabel?: string;
}

/**
 * InfoTooltip — botão `?` 16×16 inline com balão flutuante explicativo.
 *
 * Comportamento:
 *   - Click ou Enter/Space → abre/fecha o balão.
 *   - Click fora ou ESC   → fecha.
 *   - Posicionamento:
 *     padrão abaixo do `?`. Se overflow no viewport bottom, aparece acima.
 *
 * A11y:
 *   - `<button aria-expanded>` real; o `?` não é só decorativo.
 *   - Balão recebe `role="tooltip"` e `id` linkado por `aria-describedby`.
 *   - Sem dependência de hover (toque não ativa hover).
 */
export function InfoTooltip({ label, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<'below' | 'above'>('below');
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  // Click fora + ESC fecham. Listener montado só quando aberto.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Posicionamento simples: se o balão for renderizar abaixo da viewport,
  // troca para acima. Calculado no momento da abertura, sem listeners de
  // resize — tooltip é efêmero e pequeno, não vale a complicação.
  useEffect(() => {
    if (!open) return;
    if (!containerRef.current || !tooltipRef.current) return;
    const trigger = containerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const wouldOverflowBottom = trigger.bottom + tooltip.height + 12 > viewportH;
    setPosition(wouldOverflowBottom ? 'above' : 'below');
  }, [open]);

  const id = `lk-tip-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <span className="lk-info-tooltip" ref={containerRef}>
      <button
        type="button"
        className="lk-info-tooltip__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel ?? `Informação: ${label}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
      >
        ?
      </button>
      {open && (
        <span
          ref={tooltipRef}
          className={`lk-info-tooltip__bubble lk-info-tooltip__bubble--${position}`}
          role="tooltip"
          id={id}
        >
          {label}
        </span>
      )}
    </span>
  );
}
