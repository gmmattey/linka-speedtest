import type { ConnectionType, DeviceType } from '../types';

const SVG = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => {
  const { size = 24, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      // A11y (2026-05): SVGs são decorativos; os labels textuais ao lado
      // já comunicam significado. `aria-hidden` impede leitura duplicada
      // pelo screen reader (label + ícone "imagem").
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  );
};

/* ── Device ───────────────────────────────────────── */

export function IconDeviceMobile({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </SVG>
  );
}

export function IconDeviceTablet({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M11 18h2" />
    </SVG>
  );
}

export function IconDeviceDesktop({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </SVG>
  );
}

export function DeviceIcon({ kind, size }: { kind: DeviceType; size?: number }) {
  if (kind === 'mobile') return <IconDeviceMobile size={size} />;
  if (kind === 'tablet') return <IconDeviceTablet size={size} />;
  return <IconDeviceDesktop size={size} />;
}

/* ── Connection ───────────────────────────────────── */

export function IconWifi({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <path d="M5 12.55a11 11 0 0 1 14 0M2 8.82a16 16 0 0 1 20 0M8.5 16.43a6 6 0 0 1 7 0" />
      <circle cx="12" cy="20" r="0.8" fill="currentColor" />
    </SVG>
  );
}

export function IconCellular({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <path d="M4 20h2v-3H4zM10 20h2v-7h-2zM16 20h2V8h-2z" />
    </SVG>
  );
}

export function IconCable({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <path d="M5 5h14v6a4 4 0 0 1-4 4h-1v4h-4v-4H9a4 4 0 0 1-4-4V5z" />
      <path d="M9 9h.01M15 9h.01" />
    </SVG>
  );
}

export function ConnectionIcon({ kind, size }: { kind: ConnectionType; size?: number }) {
  if (kind === 'wifi')   return <IconWifi size={size} />;
  if (kind === 'mobile') return <IconCellular size={size} />;
  return <IconCable size={size} />;
}

/* ── Server / Network ─────────────────────────────── */

export function IconServer({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <path d="M17 14h.01M7 14h.01" />
      <path d="M19 7H5a3 3 0 0 0 0 6h14a3 3 0 0 0 0-6Z" />
      <path d="M19 13H5a3 3 0 0 0 0 6h14a3 3 0 0 0 0-6Z" />
    </SVG>
  );
}

export function IconBuilding({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </SVG>
  );
}

/* ── Use cases ────────────────────────────────────── */

export function IconGames({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <path d="M6 12h4M8 10v4" />
      <path d="M15 12h.01M17 10h.01" />
      <path d="M5 8h14a2 2 0 0 1 2 2v4a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-4a2 2 0 0 1 2-2Z" />
    </SVG>
  );
}

export function IconStream({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M10 9l5 3-5 3V9z" />
      <path d="M8 20h8" />
    </SVG>
  );
}

export function IconWork({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M12 12v4M10 14h4" />
    </SVG>
  );
}

export function IconVideoCall({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14" />
      <rect x="3" y="7" width="12" height="12" rx="2" />
    </SVG>
  );
}

/* ── Inline icon primitive (design system) ───────── */

interface IconProps { name: string; size?: number; stroke?: number; color?: string; }

const ICON_PATHS: Record<string, React.ReactNode> = {
  download:   <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />,
  upload:     <path d="M12 20V8m0 0l-4 4m4-4l4 4M4 4h16" />,
  ping:       <path d="M5 12h2l3-7 4 14 3-7h2" />,
  jitter:     <path d="M3 12h3l2-4 4 8 2-4 3 0 4 0" />,
  loss:       <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6m0-6l-6 6" /></>,
  wifi:       <><path d="M2 8.5C5 5.5 8.5 4 12 4s7 1.5 10 4.5" /><path d="M5 12c2-2 4.5-3 7-3s5 1 7 3" /><path d="M8.5 15.5c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" /><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" /></>,
  router:     <><rect x="3" y="13" width="18" height="6" rx="2" /><path d="M7 16h.01M11 16h.01" /><path d="M12 9V5m-3 0h6" /><path d="M6 9c0-3 2.5-5 6-5s6 2 6 5" /></>,
  home:       <path d="M3 12l9-8 9 8M5 10v10h14V10" />,
  history:    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  game:       <><rect x="2" y="7" width="20" height="10" rx="3" /><path d="M7 12h2m-1-1v2" /><circle cx="15" cy="11" r="0.8" fill="currentColor" stroke="none" /><circle cx="17" cy="13" r="0.8" fill="currentColor" stroke="none" /></>,
  bolt:       <path d="M13 2L4 14h7l-1 8 10-12h-7l1-8z" />,
  shield:     <path d="M12 2l8 3v7c0 5-3.5 8-8 10-4.5-2-8-5-8-10V5l8-3z" />,
  bulb:       <path d="M9 18h6m-5 3h4M12 3a6 6 0 016 6c0 2.5-1.5 4.5-3 5.5V17H9v-2.5C7.5 13.5 6 11.5 6 9a6 6 0 016-6z" />,
  cog:        <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" /></>,
  refresh:    <path d="M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5" />,
  share:      <><path d="M12 4v12" /><path d="M8 8l4-4 4 4" /><path d="M5 14v5a1 1 0 001 1h12a1 1 0 001-1v-5" /></>,
  check:      <path d="M5 13l4 4 10-10" />,
  close:      <path d="M6 6l12 12M18 6L6 18" />,
  chevron:    <path d="M9 6l6 6-6 6" />,
  arrowDown:  <path d="M6 9l6 6 6-6" />,
  pin:        <><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></>,
  cmp:        <><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></>,
  menu:       <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  stream:        <><rect x="2" y="4" width="20" height="14" rx="2" /><path d="M10 9l5 3-5 3V9z" /><path d="M8 20h8" /></>,
  work:          <><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M12 12v4M10 14h4" /></>,
  videoCall:     <><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14" /><rect x="3" y="7" width="12" height="12" rx="2" /></>,
  cellular:      <path d="M4 20h2v-3H4zM10 20h2v-7h-2zM16 20h2V8h-2z" />,
  'check-circle': <><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></>,
  'trending-up':  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
  'trending-down': <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></>,
  document:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
  swap:          <><path d="M4 17l4-4-4-4" /><path d="M20 7l-4 4 4 4" /><path d="M12 4v16" /></>,
  person:        <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  business:      <><rect x="2" y="7" width="20" height="13" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  info:          <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  delete:        <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>,
  vibration:     <><path d="M2 8l2 2-2 2 2 2-2 2" /><path d="M22 8l-2 2 2 2-2 2 2 2" /><rect x="8" y="5" width="8" height="14" rx="2" /></>,
};

export function Icon({ name, size = 18, stroke = 1.6, color = 'currentColor' }: IconProps) {
  const content = ICON_PATHS[name];
  if (!content) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}

/* ── Actions ──────────────────────────────────────── */

export function IconPdf({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 13v5M9.5 15.5l2.5 2.5 2.5-2.5" />
    </SVG>
  );
}

export function IconShare({ size }: { size?: number }) {
  return (
    <SVG size={size}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16,6 12,2 8,6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </SVG>
  );
}

export function IconWhatsApp({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
