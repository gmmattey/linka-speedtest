import { forwardRef, type ReactNode } from 'react';
import './PageHeader.css';

interface Props {
  title: string;
  subtitle?: string;
  /** Variante de tamanho do título. `lg` = 32/40px (padrão), `md` = 24/28px. */
  size?: 'lg' | 'md';
  /** Slot opcional à direita do título (chips, botões secundários). */
  trailing?: ReactNode;
}

/**
 * Cabeçalho grande no início do scroll content (Bloco 5 — TopBar System,
 * 2026-05). Funciona em par com `<TopBar>` e `useScrollHeader`: enquanto
 * este header está visível, o TopBar fica transparente e sem título;
 * quando ele sai da viewport, o TopBar ganha glass + título pequeno.
 *
 * Padding-top compensa a altura do TopBar absolute (56px + safe-top).
 *
 * Aceita ref encaminhado — usado como sentinel do IntersectionObserver
 * em `useScrollHeader`.
 */
export const PageHeader = forwardRef<HTMLDivElement, Props>(function PageHeader(
  { title, subtitle, size = 'lg', trailing },
  ref,
) {
  return (
    <div ref={ref} className={`lk-page-header lk-page-header--${size}`}>
      <div className="lk-page-header__row">
        <h1 className="lk-page-header__title">{title}</h1>
        {trailing && <div className="lk-page-header__trailing">{trailing}</div>}
      </div>
      {subtitle && <p className="lk-page-header__sub">{subtitle}</p>}
    </div>
  );
});
