import { triggerHaptic } from '../utils/haptics';
import './BackButton.css';

interface Props {
  onClick: () => void;
  /** Quando true, dispara `phaseChange` (30ms) ao tocar. */
  useHaptics?: boolean;
  ariaLabel?: string;
}

/**
 * Botão de voltar padronizado do Bloco 5 — TopBar System (2026-05).
 *
 * Visual: pill 36×36 com chevron único, área de toque 44×44 invisível.
 * Active state: scale(0.94). Sem texto — semântica via `aria-label`.
 * Compatível com `triggerHaptic` (Bloco 3 — Polimento).
 */
export function BackButton({ onClick, useHaptics = false, ariaLabel = 'Voltar' }: Props) {
  const handleClick = () => {
    triggerHaptic('phaseChange', useHaptics);
    onClick();
  };

  return (
    <button
      type="button"
      className="lk-back-btn"
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      <span className="lk-back-btn__pill" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </span>
    </button>
  );
}
