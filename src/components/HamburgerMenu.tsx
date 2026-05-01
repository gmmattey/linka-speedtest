import { useEffect, useRef, useState } from 'react';
import './HamburgerMenu.css';
import { Icon } from './icons';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onShare?: (() => Promise<void>) | null;
  contractedDown: number | null;
  contractedUp: number | null;
  onUpdateContracted: (down: number | null, up: number | null) => void;
  showContracted?: boolean;
}

export function HamburgerMenu({
  theme,
  onToggleTheme,
  onShare,
  contractedDown,
  contractedUp,
  onUpdateContracted,
  showContracted = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [downVal, setDownVal] = useState(contractedDown !== null ? String(contractedDown) : '');
  const [upVal, setUpVal] = useState(contractedUp !== null ? String(contractedUp) : '');
  const [sharing, setSharing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

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
    finally { setSharing(false); setOpen(false); }
  }

  return (
    <div className="lk-ham" ref={panelRef}>
      <button
        className="lk-ham__btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <Icon name="menu" size={20} />
      </button>

      {open && (
        <div className="lk-ham__panel">
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
      )}
    </div>
  );
}
