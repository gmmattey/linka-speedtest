import type { ConnectionType, DeviceInfo, ServerInfo } from '../types';
import { deviceLabel, truncateIp } from '../utils/format';
import './InfoCards.css';

interface Props {
  server: ServerInfo | null;
  device: DeviceInfo | null;
  loading: boolean;
}

function Card({
  label,
  value,
  loading,
  icon,
}: {
  label: string;
  value: string;
  loading?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="lk-info-card">
      <div className="lk-info-card__icon">{icon}</div>
      <div className="lk-info-card__body">
        <div className="lk-info-card__label">{label}</div>
        {loading ? (
          <div className="lk-info-card__skeleton" />
        ) : (
          <div className="lk-info-card__value">{value}</div>
        )}
      </div>
    </div>
  );
}

const ICON_CLOUD = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19a4.5 4.5 0 0 0 .9-8.91 6 6 0 0 0-11.4 1.18A4 4 0 0 0 6 19h11.5Z" />
  </svg>
);
const ICON_PIN = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const ICON_NET = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

function deviceIcon(kind: 'mobile' | 'tablet' | 'desktop', conn: ConnectionType) {
  if (conn === 'wifi')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14 0M2 8.82a16 16 0 0 1 20 0M8.5 16.43a6 6 0 0 1 7 0" />
        <circle cx="12" cy="20" r="0.8" fill="currentColor" />
      </svg>
    );
  if (kind === 'mobile')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="2" />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
    </svg>
  );
}

export function InfoCards({ server, device, loading }: Props) {
  return (
    <div className="lk-info-grid">
      <Card
        label="Servidor"
        value={server ? `${server.name}${server.colo !== '—' ? ` · ${server.colo}` : ''}` : '—'}
        loading={loading}
        icon={ICON_CLOUD}
      />
      <Card
        label="Localização"
        value={server && server.loc !== '—' ? `${server.loc}${server.colo !== '—' ? ` · ${server.colo}` : ''}` : '—'}
        loading={loading}
        icon={ICON_PIN}
      />
      <Card
        label="Seu IP"
        value={server ? truncateIp(server.ip) : '—'}
        loading={loading}
        icon={ICON_NET}
      />
      <Card
        label="Dispositivo"
        value={device ? deviceLabel(device.deviceType, device.connectionType) : '—'}
        loading={loading || !device}
        icon={device ? deviceIcon(device.deviceType, device.connectionType) : ICON_NET}
      />
    </div>
  );
}
