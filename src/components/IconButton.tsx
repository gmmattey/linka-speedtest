import type { ReactNode } from 'react';
import './IconButton.css';

interface Props {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}

/**
 * Botão de ação circular do TopBar (Bloco 5 — TopBar System, 2026-05).
 *
 * Mesmo padrão visual do BackButton (pill 36×36, área de toque 44×44),
 * porém genérico — recebe qualquer ícone como children. Use para ações
 * secundárias do header (compartilhar, exportar, hamburger, histórico).
 */
export function IconButton({ onClick, ariaLabel, children }: Props) {
  return (
    <button
      type="button"
      className="lk-icon-btn"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="lk-icon-btn__pill" aria-hidden="true">{children}</span>
    </button>
  );
}
