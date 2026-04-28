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
