import { useEffect, useRef, useState } from 'react';
import './HamburgerMenu.css';
import { Icon } from './icons';

interface Props {
  /** Estado externo: o menu é controlled. O trigger vive no consumer. */
  open: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onShare?: (() => Promise<void>) | null;
  contractedDown: number | null;
  contractedUp: number | null;
  onUpdateContracted: (down: number | null, up: number | null) => void;
  showContracted?: boolean;
  // Bloco 3 (Polimento, 2026-05): toggle de vibração tátil. Quando
  // ambas as props vêm definidas, renderiza o toggle "Vibração" no menu.
  useHaptics?: boolean;
  onToggleHaptics?: (next: boolean) => void;
}

/**
 * Menu de configurações (Bloco 6 — UX uniforme, 2026-05).
 *
 * Componente controlled: o trigger vive no consumer (geralmente um
 * `<IconButton>` no `<TopBar>`); aqui só renderizamos o painel quando
 * `open` é true. Para fechar, o painel chama `onClose()` ao detectar
 * clique fora dele ou ao concluir uma ação interna (ex.: share).
 *
 * O click-outside ignora elementos com `aria-label="Menu"` para não
 * brigar com o toggle do trigger externo.
 */
export function HamburgerMenu({
  open,
  onClose,
  theme,
  onToggleTheme,
  onShare,
  contractedDown,
  contractedUp,
  onUpdateContracted,
  showContracted = true,
  useHaptics,
  onToggleHaptics,
}: Props) {
  const [downVal, setDownVal] = useState(contractedDown !== null ? String(contractedDown) : '');
  const [upVal, setUpVal] = useState(contractedUp !== null ? String(contractedUp) : '');
  const [sharing, setSharing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      // Não feche quando o usuário tocar no próprio trigger (que tem seu
      // próprio toggle externamente). Identificado por aria-label="Menu".
      if (target.closest('[aria-label="Menu"]')) return;
      onClose();
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open, onClose]);

  function commitContracted() {
    const down = downVal.trim() ? Number(downVal) : null;
    const up = upVal.trim() ? Number(upVal) : null;
    onUpdateContracted(
      down !== null && !isNaN(down) && down > 0 ? down : null,
      up !== null && !isNaN(up) && up > 0 ? up : null,
    );
  }

  async function handleShare() {
    if (!onShare || sharing) return;
    setSharing(true);
    try { await onShare(); } catch { /* cancelado */ }
    finally { setSharing(false); onClose(); }
  }

  if (!open) return null;

  return (
    <div className="lk-ham__panel" ref={panelRef} role="menu">
      <div className="lk-ham__section">
        <span className="lk-ham__section-label">Tema</span>
        <div className="lk-ham__theme-row">
          <button
            className={`lk-ham__theme-btn${theme === 'light' ? ' lk-ham__theme-btn--active' : ''}`}
            onClick={() => { if (theme !== 'light') onToggleTheme(); }}
          >
            Claro
          </button>
          <button
            className={`lk-ham__theme-btn${theme === 'dark' ? ' lk-ham__theme-btn--active' : ''}`}
            onClick={() => { if (theme !== 'dark') onToggleTheme(); }}
          >
            Escuro
          </button>
        </div>
      </div>

      {onShare && (
        <button className="lk-ham__action" onClick={handleShare} disabled={sharing}>
          <Icon name="share" size={16} color="var(--text)" />
          <span>{sharing ? 'Compartilhando…' : 'Compartilhar resultado'}</span>
        </button>
      )}

      {typeof useHaptics === 'boolean' && onToggleHaptics && (
        <div className="lk-ham__section">
          <span className="lk-ham__section-label">Vibração</span>
          <div className="lk-ham__theme-row">
            <button
              className={`lk-ham__theme-btn${useHaptics ? ' lk-ham__theme-btn--active' : ''}`}
              onClick={() => { if (!useHaptics) onToggleHaptics(true); }}
            >
              Ativada
            </button>
            <button
              className={`lk-ham__theme-btn${!useHaptics ? ' lk-ham__theme-btn--active' : ''}`}
              onClick={() => { if (useHaptics) onToggleHaptics(false); }}
            >
              Desativada
            </button>
          </div>
        </div>
      )}

      {showContracted && (
        <div className="lk-ham__section">
          <span className="lk-ham__section-label">Velocidade contratada</span>
          <div className="lk-ham__speed-row">
            <label className="lk-ham__speed-field">
              <span className="lk-ham__speed-dir">↓ Download</span>
              <div className="lk-ham__speed-input-wrap">
                <input
                  type="number"
                  className="lk-ham__speed-input"
                  placeholder="—"
                  value={downVal}
                  onChange={(e) => setDownVal(e.target.value)}
                  onBlur={commitContracted}
                  min="1"
                  max="100000"
                />
                <span className="lk-ham__speed-unit">Mbps</span>
              </div>
            </label>
            <label className="lk-ham__speed-field">
              <span className="lk-ham__speed-dir">↑ Upload</span>
              <div className="lk-ham__speed-input-wrap">
                <input
                  type="number"
                  className="lk-ham__speed-input"
                  placeholder="—"
                  value={upVal}
                  onChange={(e) => setUpVal(e.target.value)}
                  onBlur={commitContracted}
                  min="1"
                  max="100000"
                />
                <span className="lk-ham__speed-unit">Mbps</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// Ícone do trigger — exportado para o consumer não duplicar a string.
export const HamburgerMenuIcon = () => <Icon name="menu" size={18} color="var(--text-2)" />;
