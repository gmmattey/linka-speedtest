import './BottomNavBar.css';

export type NavTab = 'home' | 'orbit' | 'historico' | 'ajustes';

interface Props {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
}

export function BottomNavBar({ active, onNavigate }: Props) {
  return (
    <nav className="lk-navbar" role="navigation" aria-label="Navegação principal">
      <NavItem
        tab="home"
        active={active === 'home'}
        label="Home"
        icon={<HomeIcon />}
        onNavigate={onNavigate}
      />
      <NavItem
        tab="orbit"
        active={active === 'orbit'}
        label="Orbit"
        icon={<OrbitIcon />}
        onNavigate={onNavigate}
      />
      <NavItem
        tab="historico"
        active={active === 'historico'}
        label="Histórico"
        icon={<HistoricoIcon />}
        onNavigate={onNavigate}
      />
      <NavItem
        tab="ajustes"
        active={active === 'ajustes'}
        label="Ajustes"
        icon={<AjustesIcon />}
        onNavigate={onNavigate}
      />
    </nav>
  );
}

interface NavItemProps {
  tab: NavTab;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onNavigate: (tab: NavTab) => void;
}

function NavItem({ tab, active, label, icon, onNavigate }: NavItemProps) {
  return (
    <button
      className={`lk-navbar__item${active ? ' lk-navbar__item--active' : ''}`}
      onClick={() => onNavigate(tab)}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      type="button"
    >
      <span className="lk-navbar__icon">{icon}</span>
      <span className="lk-navbar__label">{label}</span>
    </button>
  );
}

/* ── Ícones inline (SVG) ────────────────────────────────────────────────── */

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M3 12L12 3L21 12V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OrbitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5"
        transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5"
        transform="rotate(120 12 12)" />
    </svg>
  );
}

function HistoricoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M12 8V12L15 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.05 11A9 9 0 1 0 4 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3V7H7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AjustesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
