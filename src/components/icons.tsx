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

export function IconWhatsApp({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
