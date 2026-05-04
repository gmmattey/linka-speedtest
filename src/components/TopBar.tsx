import type { ReactNode } from 'react';
import { BackButton } from './BackButton';
import { IconButton } from './IconButton';
import './TopBar.css';

export interface TopBarAction {
  icon: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  /** Chave React opcional, útil quando a lista é dinâmica. */
  key?: string;
}

interface Props {
  /** Handler do botão voltar (chevron à esquerda). Mutuamente exclusivo com `leftSlot`. */
  onBack?: () => void;
  /** Ações à direita, renderizadas como `IconButton` em sequência horizontal. */
  rightActions?: TopBarAction[];
  /** Slot livre à esquerda (usado quando o lugar do back é um logo, ex.: StartScreen). */
  leftSlot?: ReactNode;
  /** Slot livre à direita — alternativa a `rightActions` quando o conteúdo
   *  não cabe no formato {icon, onClick, ariaLabel} (ex.: HamburgerMenu). */
  rightSlot?: ReactNode;
  /** Texto pequeno do header — visível quando `showTitle` true. */
  title?: string;
  /** Quando true, o título aparece centralizado com fade-in. */
  showTitle?: boolean;
  /** Quando true, ativa o glass effect (background translucent + blur). */
  scrolled?: boolean;
  /** Habilita haptic ao tocar no back (delegado para `BackButton`). */
  useHaptics?: boolean;
}

/**
 * Header transparente que ganha glass effect ao rolar (Bloco 5 — TopBar
 * System, 2026-05). Posicionado em `position: absolute` no topo da tela
 * para que o conteúdo passe por baixo dele com efeito de blur.
 *
 * Layout: [left slot | título centralizado | actions]. Cada slot 44×44px
 * de área tocável; conteúdo visual ocupa 36×36 (pill).
 */
export function TopBar({
  onBack,
  rightActions,
  leftSlot,
  rightSlot,
  title,
  showTitle = false,
  scrolled = false,
  useHaptics = false,
}: Props) {
  const hasLeft = !!leftSlot || !!onBack;
  const hasRight = !!rightSlot || (!!rightActions && rightActions.length > 0);

  return (
    <header
      className={`lk-topbar${scrolled ? ' lk-topbar--scrolled' : ''}`}
      role="banner"
    >
      <div className="lk-topbar__left">
        {leftSlot ?? (onBack ? (
          <BackButton onClick={onBack} useHaptics={useHaptics} />
        ) : null)}
      </div>

      <div
        className={`lk-topbar__title${showTitle && title ? ' lk-topbar__title--visible' : ''}`}
        aria-hidden={!showTitle}
      >
        {title}
      </div>

      <div className="lk-topbar__right">
        {rightSlot}
        {!rightSlot && rightActions?.map((action, i) => (
          <IconButton
            key={action.key ?? i}
            onClick={action.onClick}
            ariaLabel={action.ariaLabel}
          >
            {action.icon}
          </IconButton>
        ))}
        {/* Spacer simétrico ao back quando não há nada à direita, para o título centrado */}
        {hasLeft && !hasRight && (
          <span className="lk-topbar__spacer" aria-hidden="true" />
        )}
      </div>
    </header>
  );
}
