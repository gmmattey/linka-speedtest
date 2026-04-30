import { useRef, useState } from 'react';
import type { ConnectionType, DeviceInfo, GamingProfile, ServerInfo } from '../types';
import type { Settings } from '../hooks/useSettings';
import { SERVERS } from '../utils/serverRegistry';
import { PathRow } from './PathRow';
import './BottomSheet.css';

interface Props {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  device: DeviceInfo | null;
  server: ServerInfo | null;
  loading: boolean;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
}

type SegOption<T extends string> = { value: T; label: string };

function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="lk-seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={`lk-seg__btn${value === o.value ? ' lk-seg__btn--active' : ''}`}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const CONN_OPTS: SegOption<Settings['connectionOverride']>[] = [
  { value: 'auto',   label: 'Auto'    },
  { value: 'wifi',   label: 'Wi-Fi'   },
  { value: 'cable',  label: 'Cabo'    },
  { value: 'mobile', label: 'Celular' },
];

const GAMING_OPTS: SegOption<GamingProfile>[] = [
  { value: 'off',    label: 'Off'    },
  { value: 'casual', label: 'Casual' },
  { value: 'moba',   label: 'MOBA'   },
  { value: 'fps',    label: 'FPS'    },
  { value: 'cloud',  label: 'Cloud'  },
];

const UNIT_OPTS: SegOption<Settings['unit']>[] = [
  { value: 'mbps', label: 'Mbps' },
  { value: 'gbps', label: 'Gbps' },
];

export function BottomSheet({ open, onToggle, onClose, device, server, loading, settings, onUpdateSettings }: Props) {
  const effectiveConnection: ConnectionType =
    settings.connectionOverride !== 'auto'
      ? settings.connectionOverride
      : (device?.connectionType ?? 'wifi');

  const startYRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setDragOffset(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current == null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    // Quando fechado, só aceita arrasto pra cima (dy < 0).
    // Quando aberto, só aceita arrasto pra baixo (dy > 0).
    if (open) setDragOffset(Math.max(0, dy));
    else setDragOffset(Math.min(0, dy));
  };
  const onTouchEnd = () => {
    const dy = dragOffset;
    startYRef.current = null;
    setDragOffset(0);
    if (!open && dy < -60) onToggle();
    else if (open && dy > 60) onClose();
  };

  const dragStyle = dragOffset !== 0
    ? { transform: open
        ? `translateX(-50%) translateY(${dragOffset}px)`
        : `translateX(-50%) translateY(calc(100% - 110px + ${dragOffset}px))`,
        transition: 'none' as const }
    : undefined;

  return (
    <>
      {open && <div className="lk-sheet-backdrop" onClick={onClose} />}
      <div
        className={`lk-sheet${open ? ' lk-sheet--open' : ''}`}
        style={dragStyle}
      >
        <button
          className="lk-sheet__handle-area"
          onClick={onToggle}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          aria-label="Detalhes e configurações"
        >
          <div className="lk-sheet__handle" />
          <PathRow
            device={device?.deviceType ?? 'desktop'}
            connection={effectiveConnection}
            serverName={server?.name ?? 'Cloudflare'}
            serverAvailable={server?.available !== false}
          />
        </button>

        <div className="lk-sheet__body">
          {/* Info section */}
          <div className="lk-sheet__section">
            <Row label="Servidor"    value={loading ? '…' : `${server?.name ?? '—'}${server?.colo && server.colo !== '—' ? ' · ' + server.colo : ''}`} />
            <Row label="Operadora"   value={loading ? '…' : (server?.isp ?? '—')} />
            <Row label="Localização" value={loading ? '…' : (server?.loc && server.colo ? `${server.loc} · ${server.colo}` : (server?.loc ?? '—'))} />
            <Row label="Seu IP"      value={loading ? '…' : (server?.ip ?? '—')} />
            <Row label="Dispositivo" value={loading ? '…' : `${device?.deviceType === 'mobile' ? 'Celular' : device?.deviceType === 'tablet' ? 'Tablet' : 'PC'} · ${effectiveConnection === 'wifi' ? 'Wi-Fi' : effectiveConnection === 'mobile' ? 'Celular' : 'Cabo'}`} />
          </div>

          {/* Settings section */}
          <div className="lk-sheet__section lk-sheet__section--settings">
            <SettingRow label="Unidade">
              <Seg options={UNIT_OPTS} value={settings.unit} onChange={(v) => onUpdateSettings({ unit: v })} />
            </SettingRow>
            <SettingRow label="Conexão">
              <Seg options={CONN_OPTS} value={settings.connectionOverride} onChange={(v) => onUpdateSettings({ connectionOverride: v })} />
            </SettingRow>
            <SettingRow label="Modo Gamer">
              <Seg options={GAMING_OPTS} value={settings.gamingProfile} onChange={(v) => onUpdateSettings({ gamingProfile: v })} />
            </SettingRow>
            <SettingRow label="IP ao compartilhar">
              <Seg
                options={[{ value: 'hide', label: 'Oculto' }, { value: 'show', label: 'Visível' }]}
                value={settings.hideIpOnShare ? 'hide' : 'show'}
                onChange={(v) => onUpdateSettings({ hideIpOnShare: v === 'hide' })}
              />
            </SettingRow>
          </div>

          {/* Privacy note */}
          <div className="lk-sheet__section">
            <p className="lk-sheet__privacy-note">Seus testes ficam salvos neste aparelho. Você decide quando exportar ou compartilhar.</p>
          </div>

          {/* Server picker */}
          <div className="lk-sheet__section">
            <p className="lk-sheet__setting-label">Servidor</p>
            <div className="lk-sheet__server-list">
              {SERVERS.map((s) => (
                <div key={s.id} className="lk-sheet__server-item lk-sheet__server-item--active">
                  <span className="lk-sheet__server-dot" />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lk-sheet__bottom-pad" />
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="lk-sheet__row">
      <span className="lk-sheet__row-label">{label}</span>
      <span className="lk-sheet__row-value">{value}</span>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="lk-sheet__setting">
      <span className="lk-sheet__setting-label">{label}</span>
      {children}
    </div>
  );
}
