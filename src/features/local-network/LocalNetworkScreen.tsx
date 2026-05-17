import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { TopBar } from '../../components/TopBar';
import { Icon } from '../../components/icons';
import { useScrollHeader } from '../../hooks/useScrollHeader';
import { getCapabilities } from '../../platform/capabilities';
import { confidenceLabel, kindLabel, nameSourceLabel } from './LocalNetworkService';
import { useLocalNetworkDiscovery } from './useLocalNetworkDiscovery';
import type { DeviceKind, IdentifiedDevice as LocalDevice } from './types';
import './LocalNetworkScreen.css';

const NICKNAMES_KEY = 'linka.network.nicknames';

function loadNicknames(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NICKNAMES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveNickname(id: string, nickname: string | null) {
  const existing = loadNicknames();
  if (!nickname || nickname.trim() === '') {
    delete existing[id];
  } else {
    existing[id] = nickname.trim();
  }
  localStorage.setItem(NICKNAMES_KEY, JSON.stringify(existing));
}

function deviceId(device: LocalDevice): string {
  return device.mac || device.ip;
}

function kindIconName(kind: DeviceKind): string {
  switch (kind) {
    case 'router':   return 'router';
    case 'phone':    return 'cellular';
    case 'tv':       return 'stream';
    case 'printer':  return 'document';
    case 'computer': return 'laptop';
    default:         return 'network';
  }
}

function kindIconColor(kind: DeviceKind): string {
  switch (kind) {
    case 'router': return 'var(--accent)';
    case 'phone':  return 'var(--accent)';
    default:       return 'var(--text-2)';
  }
}

interface Props {
  onBack: () => void;
}

export function LocalNetworkScreen({ onBack }: Props) {
  const { localNetworkDiscovery } = getCapabilities();
  const { loading, result, error, run } = useLocalNetworkDiscovery();
  const { scrolled, topBarOpacity, scrollContainerRef, sentinelRef } = useScrollHeader();

  const [nicknames, setNicknames] = useState<Record<string, string>>(loadNicknames);
  const [editingDevice, setEditingDevice] = useState<LocalDevice | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');

  const openNicknameSheet = (device: LocalDevice) => {
    setEditingDevice(device);
    setNicknameInput(nicknames[deviceId(device)] ?? '');
  };

  const saveAndClose = () => {
    if (!editingDevice) return;
    saveNickname(deviceId(editingDevice), nicknameInput);
    setNicknames(loadNicknames());
    setEditingDevice(null);
  };

  const clearAndClose = () => {
    if (!editingDevice) return;
    saveNickname(deviceId(editingDevice), null);
    setNicknames(loadNicknames());
    setEditingDevice(null);
  };

  const displayName = (device: LocalDevice): string =>
    nicknames[deviceId(device)] || device.displayName;

  const gateways = result?.devices.filter((d) => d.kind === 'router') ?? [];
  const clients  = result?.devices.filter((d) => d.kind !== 'router') ?? [];
  const hasResults = result != null;
  const onlyGateway = hasResults && gateways.length > 0 && clients.length === 0;

  return (
    <div className="lk-local-network">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        opacity={topBarOpacity}
        title="Dispositivos"
        showTitle={true}
      />

      {/* Linear progress bar during scan */}
      {loading && <div className="lk-local-network__progress" />}

      <div className="lk-local-network__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Dispositivos" />

        {/* ── Browser fallback ───────────────────────────────────────── */}
        {!localNetworkDiscovery && (
          <div className="lk-local-network__empty">
            <span className="material-symbols-rounded lk-local-network__empty-icon">devices_other</span>
            <p className="lk-local-network__empty-title">Ver dispositivos da rede</p>
            <p className="lk-local-network__empty-desc">
              O navegador não permite varrer a rede local por segurança. O app Android acessa ARP, mDNS e SSDP diretamente para identificar roteador, smart TVs, celulares e outros dispositivos.
            </p>
            <div className="lk-local-network__android-cta">
              <span className="material-symbols-rounded">android</span>
              <p>Use o <strong>app linka para Android</strong> para ver todos os dispositivos conectados na sua rede Wi-Fi em tempo real.</p>
            </div>
          </div>
        )}

        {/* ── Native state ────────────────────────────────────────────── */}
        {localNetworkDiscovery && (
          <>
            {/* Empty / initial state */}
            {!hasResults && !loading && (
              <div className="lk-local-network__empty">
                {error ? (
                  <>
                    <span className="material-symbols-rounded lk-local-network__empty-icon lk-local-network__empty-icon--warn">warning_amber</span>
                    <p className="lk-local-network__empty-title">Erro ao escanear</p>
                    <p className="lk-local-network__empty-desc">{error}</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded lk-local-network__empty-icon">devices_other</span>
                    <p className="lk-local-network__empty-title">Nenhum dispositivo encontrado</p>
                    <p className="lk-local-network__empty-desc">
                      Tente novamente ou verifique a conexão Wi-Fi.
                    </p>
                  </>
                )}
                <button className="lk-local-network__scan-btn" onClick={() => void run()} disabled={loading}>
                  Escanear Rede
                </button>
              </div>
            )}

            {/* Loading state with no prior results */}
            {!hasResults && loading && (
              <div className="lk-local-network__empty">
                <span className="material-symbols-rounded lk-local-network__empty-icon lk-local-network__empty-icon--spin">radar</span>
                <p className="lk-local-network__empty-title">Procurando dispositivos…</p>
                <p className="lk-local-network__empty-desc">Varrendo a rede local.</p>
              </div>
            )}

            {/* Results */}
            {hasResults && (
              <div className="lk-local-network__results">

                {/* INFRAESTRUTURA */}
                {gateways.length > 0 && (
                  <div className="lk-local-network__section">
                    <p className="lk-local-network__section-header">
                      INFRAESTRUTURA ({gateways.length})
                    </p>
                    <div className="lk-local-network__device-list">
                      {gateways.map((device) => (
                        <DeviceRow
                          key={deviceId(device)}
                          device={device}
                          displayName={displayName(device)}
                          hasNickname={!!nicknames[deviceId(device)]}
                          badge="Roteador"
                          badgeVariant="router"
                          onClick={() => openNicknameSheet(device)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Only gateway message */}
                {onlyGateway && (
                  <p className="lk-local-network__only-gateway">
                    Apenas o gateway foi encontrado. Outros dispositivos podem estar dormindo ou bloqueando respostas.
                  </p>
                )}

                {/* DISPOSITIVOS */}
                {clients.length > 0 && (
                  <div className="lk-local-network__section">
                    <p className="lk-local-network__section-header">
                      DISPOSITIVOS ({clients.length})
                    </p>
                    <div className="lk-local-network__device-list">
                      {clients.map((device) => (
                        <DeviceRow
                          key={deviceId(device)}
                          device={device}
                          displayName={displayName(device)}
                          hasNickname={!!nicknames[deviceId(device)]}
                          onClick={() => openNicknameSheet(device)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rescan button */}
                <button
                  className="lk-local-network__rescan-btn"
                  onClick={() => void run()}
                  disabled={loading}
                >
                  <Icon name="refresh" size={16} color="var(--accent)" />
                  {loading ? 'Escaneando…' : 'Escanear novamente'}
                </button>
              </div>
            )}
          </>
        )}

        <div className="lk-local-network__bottom-pad" />
      </div>

      {/* ── NicknameSheet ────────────────────────────────────────────── */}
      {editingDevice && (
        <div className="lk-nickname-overlay" onClick={() => setEditingDevice(null)}>
          <div className="lk-nickname-sheet fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="lk-nickname-sheet__handle-row">
              <div className="lk-nickname-sheet__handle" />
            </div>
            <div className="lk-nickname-sheet__header">
              <h3>Apelido do dispositivo</h3>
              <button className="lk-nickname-sheet__close" onClick={() => setEditingDevice(null)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="lk-nickname-sheet__body">
              <p className="lk-nickname-sheet__desc">
                Identifique este dispositivo com um nome mais fácil de reconhecer.
              </p>
              <div className="lk-nickname-sheet__device-info">
                <span className="lk-nickname-sheet__device-ip">{editingDevice.ip}</span>
                {editingDevice.mac && (
                  <span className="lk-nickname-sheet__device-mac">{editingDevice.mac}</span>
                )}
                {editingDevice.vendor && (
                  <span className="lk-nickname-sheet__device-mac">{editingDevice.vendor}</span>
                )}
              </div>
              <label className="lk-nickname-sheet__field">
                <span>Apelido</span>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder="Ex: TV da Sala, Notebook do João"
                  autoFocus
                  maxLength={40}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveAndClose(); }}
                />
              </label>
              <div className="lk-nickname-sheet__meta">
                <span>{kindLabel(editingDevice.kind)}</span>
                <span className={`lk-local-network__confidence lk-local-network__confidence--${editingDevice.confidence}`}>
                  {confidenceLabel(editingDevice.confidence)}
                </span>
                <span>{nameSourceLabel(editingDevice.nameSource)}</span>
              </div>
              <div className="lk-nickname-sheet__actions">
                {nicknames[deviceId(editingDevice)] && (
                  <button className="lk-nickname-sheet__btn-clear" onClick={clearAndClose}>
                    Remover apelido
                  </button>
                )}
                <button className="lk-nickname-sheet__btn-save" onClick={saveAndClose}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Device Row ──────────────────────────────────────────────────────────── */

function DeviceRow({
  device, displayName, hasNickname, badge, badgeVariant, onClick,
}: {
  device: LocalDevice;
  displayName: string;
  hasNickname: boolean;
  badge?: string;
  badgeVariant?: 'router' | 'ap';
  onClick: () => void;
}) {
  const iconName = kindIconName(device.kind);
  const iconColor = kindIconColor(device.kind);
  const iconBg = device.kind === 'router' ? 'var(--accent-tint)' : 'var(--surface-2)';

  return (
    <div className="lk-local-network__device-row" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <div className="lk-local-network__device-icon" style={{ background: iconBg }}>
        <Icon name={iconName} size={18} color={iconColor} />
      </div>
      <div className="lk-local-network__device-text">
        <div className="lk-local-network__device-name">
          {displayName}
          {hasNickname && <span className="lk-local-network__nickname-tag">apelido</span>}
          {badge && (
            <span className={`lk-local-network__badge lk-local-network__badge--${badgeVariant ?? 'device'}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="lk-local-network__device-sub">
          {device.vendor || kindLabel(device.kind)}
        </div>
      </div>
      <div className="lk-local-network__device-trailing">
        <span className="lk-local-network__device-ip">{device.ip}</span>
        <Icon name="chevron" size={14} color="var(--text-3)" />
      </div>
    </div>
  );
}
