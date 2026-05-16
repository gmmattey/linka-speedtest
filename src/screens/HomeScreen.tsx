import { useCallback, useRef, useState } from 'react';
import type { DeviceInfo, ServerInfo, TestRecord } from '../types';
import type { Settings } from '../hooks/useSettings';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/icons';
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator';
import { useScrollHeader } from '../hooks/useScrollHeader';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { formatMbps, formatMs } from '../utils/format';
import './HomeScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  device: DeviceInfo | null;
  server: ServerInfo | null;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onStart: (mode: 'fast' | 'complete') => void;
  onRetry: () => void;
  lastRecord: TestRecord | null;
  onShowHistory: () => void;
  onOpenOrbit?: () => void;
  onShowSinal?: () => void;
  onShowDispositivos?: () => void;
  onRefresh?: () => Promise<void>;
}

type ActiveSheet = 'device' | 'gateway' | 'internet' | null;

export function HomeScreen({
  theme,
  onToggleTheme,
  device,
  server,
  loading,
  error,
  isOnline,
  settings,
  onStart,
  onRetry,
  lastRecord,
  onShowHistory,
  onOpenOrbit,
  onShowSinal,
  onShowDispositivos,
  onRefresh,
}: Props) {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [selectedMode, setSelectedMode] = useState<'fast' | 'complete'>(settings.defaultMode ?? 'complete');

  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();
  const ptrContainerRef = useRef<HTMLElement | null>(null);
  const setScrollContainer = useCallback((el: HTMLElement | null) => {
    ptrContainerRef.current = el;
    scrollContainerRef(el);
  }, [scrollContainerRef]);
  const noopRefresh = useCallback(() => Promise.resolve(), []);
  const ptr = usePullToRefresh(ptrContainerRef, onRefresh ?? noopRefresh, { enabled: !!onRefresh });

  const canStart = isOnline && !loading && !!server?.available && !!device;
  const unitLabel = settings.unit === 'gbps' ? 'Gbps' : 'Mbps';

  const deviceLabel = (() => {
    if (!device) return 'Dispositivo';
    if (device.deviceType === 'mobile') return 'Celular';
    if (device.deviceType === 'tablet') return 'Tablet';
    return 'Computador';
  })();

  const connectionLabel = (() => {
    if (!device) return null;
    if (device.connectionType === 'wifi') return 'Wi-Fi';
    if (device.connectionType === 'mobile') return 'Dados móveis';
    if (device.connectionType === 'cable') return 'Cabo';
    return 'Conexão';
  })();

  const connectionIcon = (() => {
    if (!device) return 'network';
    if (device.connectionType === 'wifi') return 'wifi';
    if (device.connectionType === 'mobile') return 'cellular';
    if (device.connectionType === 'cable') return 'router';
    return 'network';
  })() as Parameters<typeof Icon>[0]['name'];

  const ispLabel = loading ? 'Detectando…' : (server?.isp ?? '—');
  const publicIp = loading ? '…' : (server?.ip ?? '—');
  const serverLoc = server?.loc ?? '';

  const gradeFromRecord = (r: TestRecord | null): string => {
    if (!r) return '?';
    const dl = r.dl;
    if (dl >= 200) return 'A';
    if (dl >= 50) return 'B';
    if (dl >= 20) return 'C';
    if (dl >= 5) return 'D';
    return 'F';
  };

  const gradeColor = (g: string) => {
    if (g === 'A') return 'var(--grade-a)';
    if (g === 'B') return 'var(--grade-b)';
    if (g === 'C') return 'var(--grade-c)';
    if (g === 'D') return 'var(--grade-d)';
    if (g === 'F') return 'var(--grade-f)';
    return 'var(--text-3)';
  };

  const grade = gradeFromRecord(lastRecord);

  const experienceItems = lastRecord
    ? [
        {
          label: 'Jogos',
          icon: 'game',
          ok: lastRecord.dl >= 15 && lastRecord.latency <= 50,
          sub: lastRecord.dl >= 15 && lastRecord.latency <= 50 ? 'OK' : 'Limitado',
        },
        {
          label: 'Streaming',
          icon: 'stream',
          ok: lastRecord.dl >= 25,
          sub: lastRecord.dl >= 25 ? 'OK' : 'Limitado',
        },
        {
          label: 'Home Office',
          icon: 'work',
          ok: lastRecord.dl >= 10 && lastRecord.ul >= 5,
          sub: lastRecord.dl >= 10 && lastRecord.ul >= 5 ? 'OK' : 'Limitado',
        },
        {
          label: 'Videochamada',
          icon: 'videoCall',
          ok: lastRecord.latency <= 100 && lastRecord.dl >= 2,
          sub: lastRecord.latency <= 100 ? 'OK' : 'Instável',
        },
      ]
    : [];

  const closeSheet = () => setActiveSheet(null);

  return (
    <div className="lk-home" data-theme={theme} ref={setScrollContainer}>
      <PullToRefreshIndicator
        pullDistance={ptr.pullDistance}
        isRefreshing={ptr.isRefreshing}
        isReady={ptr.isReady}
      />
      <div ref={sentinelRef} aria-hidden="true" className="lk-home__sentinel" />

      <TopBar
        scrolled={scrolled}
        leftSlot={<span className="lk-home__logo">linka</span>}
        rightActions={[
          {
            icon: <Icon name="moon" size={18} color="var(--text-2)" />,
            onClick: onToggleTheme,
            ariaLabel: 'Alternar tema',
          },
          {
            icon: <Icon name="history" size={18} color="var(--text-2)" />,
            onClick: onShowHistory,
            ariaLabel: 'Ver histórico',
          },
        ]}
      />

      {/* Erro de conexão */}
      {!isOnline && (
        <div className="lk-home__alert" role="alert">
          <Icon name="network" size={14} color="var(--error)" />
          Sem conexão à internet.
        </div>
      )}
      {isOnline && error && (
        <div className="lk-home__alert" role="alert">
          {error}
          <button className="btn-text" style={{ fontSize: 12 }} onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      <div className="lk-home__scroll">
        {/* ── Network Path ─────────────────────────────────────────── */}
        <section className="lk-home__path" aria-label="Caminho da rede">
          {/* Nó: Dispositivo */}
          <button
            className="lk-home__node"
            onClick={() => setActiveSheet('device')}
            type="button"
            aria-label="Info do dispositivo"
          >
            <div className="lk-home__node-icon lk-home__node-icon--device">
              <Icon name={connectionIcon} size={20} color="#fff" />
            </div>
            <span className="lk-home__node-label">{deviceLabel}</span>
            <span className="lk-home__node-sub">{connectionLabel ?? 'Conexão'}</span>
          </button>

          <div className="lk-home__path-line" />

          {/* Nó: Gateway/Roteador */}
          <button
            className="lk-home__node"
            onClick={() => setActiveSheet('gateway')}
            type="button"
            aria-label="Info do provedor"
          >
            <div className="lk-home__node-icon lk-home__node-icon--gateway">
              <Icon name="router" size={20} color="#fff" />
            </div>
            <span className="lk-home__node-label">Provedor</span>
            <span className="lk-home__node-sub">{loading ? '…' : (ispLabel.length > 12 ? ispLabel.slice(0, 12) + '…' : ispLabel)}</span>
          </button>

          <div className="lk-home__path-line" />

          {/* Nó: Internet */}
          <button
            className="lk-home__node"
            onClick={() => setActiveSheet('internet')}
            type="button"
            aria-label="Info da internet"
          >
            <div className="lk-home__node-icon lk-home__node-icon--internet">
              <Icon name="globe" size={20} color="#fff" />
            </div>
            <span className="lk-home__node-label">Internet</span>
            <span className="lk-home__node-sub">{loading ? '…' : (serverLoc || 'IP público')}</span>
          </button>
        </section>

        {/* ── Último Teste ─────────────────────────────────────────── */}
        {lastRecord ? (
          <section className="lk-home__last card">
            <div className="lk-home__last-header">
              <span className="lk-home__last-title">Última medição</span>
              <span className="lk-home__last-grade" style={{ color: gradeColor(grade) }}>
                {grade}
              </span>
            </div>
            <div className="lk-home__last-metrics">
              <div className="lk-home__metric">
                <span className="lk-home__metric-value" style={{ color: 'var(--dl)' }}>
                  {formatMbps(lastRecord.dl, settings.unit)}
                </span>
                <span className="lk-home__metric-label">↓ {unitLabel}</span>
              </div>
              <div className="lk-home__metric-divider" />
              <div className="lk-home__metric">
                <span className="lk-home__metric-value" style={{ color: 'var(--ul)' }}>
                  {formatMbps(lastRecord.ul, settings.unit)}
                </span>
                <span className="lk-home__metric-label">↑ {unitLabel}</span>
              </div>
              <div className="lk-home__metric-divider" />
              <div className="lk-home__metric">
                <span className="lk-home__metric-value" style={{ color: 'var(--text)' }}>
                  {formatMs(lastRecord.latency)}
                </span>
                <span className="lk-home__metric-label">ms</span>
              </div>
            </div>

            {/* Experiência de uso */}
            {experienceItems.length > 0 && (
              <div className="lk-home__experience">
                <p className="lk-home__experience-header">EXPERIÊNCIA DE USO</p>
                <div className="lk-home__experience-divider" />
                {experienceItems.map((item) => (
                  <div key={item.label}>
                    <div className="lk-home__exp-item">
                      <div className="lk-home__exp-icon">
                        <Icon name={item.icon} size={20} color="var(--accent)" />
                      </div>
                      <span className="lk-home__exp-label">{item.label}</span>
                      <span
                        className="lk-home__exp-badge"
                        style={{
                          background: item.ok ? 'var(--color-good-bg)' : 'var(--color-bad-bg)',
                          color: item.ok ? 'var(--success)' : 'var(--error)',
                        }}
                      >
                        {item.sub}
                      </span>
                    </div>
                    <div className="lk-home__experience-divider" />
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="lk-home__empty card">
            <span className="lk-home__empty-text">Nenhuma medição ainda</span>
            <span className="lk-home__empty-sub">Inicie um teste para ver os resultados aqui</span>
          </section>
        )}

        {/* ── Botão Iniciar Teste ───────────────────────────────────── */}
        <div className="lk-home__cta">
          <div className="lk-home__mode-toggle">
            <button
              className={`lk-home__mode-btn${selectedMode === 'fast' ? ' lk-home__mode-btn--active' : ''}`}
              onClick={() => setSelectedMode('fast')}
              type="button"
            >
              Rápido
            </button>
            <button
              className={`lk-home__mode-btn${selectedMode === 'complete' ? ' lk-home__mode-btn--active' : ''}`}
              onClick={() => setSelectedMode('complete')}
              type="button"
            >
              Completo
            </button>
          </div>
          <button
            className="lk-home__start-btn btn-primary"
            onClick={() => onStart(selectedMode)}
            disabled={!canStart}
            type="button"
            aria-label="Iniciar teste de velocidade"
          >
            {loading ? 'Aguardando…' : 'Iniciar Teste'}
          </button>
        </div>

        {/* ── Atalhos ───────────────────────────────────────────────── */}
        <section className="lk-home__shortcuts" aria-label="Ferramentas">
          {onOpenOrbit && (
            <button className="lk-home__shortcut" onClick={onOpenOrbit} type="button">
              <span className="lk-home__shortcut-icon lk-home__shortcut-icon--orbit">
                <OrbitShortcutIcon />
              </span>
              <span className="lk-home__shortcut-label">Orbit IA</span>
              <span className="lk-home__shortcut-sub">Diagnóstico</span>
            </button>
          )}
          {onShowSinal && (
            <button className="lk-home__shortcut" onClick={onShowSinal} type="button">
              <span className="lk-home__shortcut-icon lk-home__shortcut-icon--sinal">
                <Icon name="wifi" size={22} color="#fff" />
              </span>
              <span className="lk-home__shortcut-label">Sinal</span>
              <span className="lk-home__shortcut-sub">Wi-Fi</span>
            </button>
          )}
          {onShowDispositivos && (
            <button className="lk-home__shortcut" onClick={onShowDispositivos} type="button">
              <span className="lk-home__shortcut-icon lk-home__shortcut-icon--dispositivos">
                <Icon name="network" size={22} color="#fff" />
              </span>
              <span className="lk-home__shortcut-label">Dispositivos</span>
              <span className="lk-home__shortcut-sub">Rede local</span>
            </button>
          )}
        </section>

        <div className="lk-home__bottom-pad" />
      </div>

      {/* ── Bottom Sheets ─────────────────────────────────────────── */}
      {activeSheet && (
        <div className="lk-home-sheet-backdrop" onClick={closeSheet} />
      )}

      {/* Sheet: Dispositivo */}
      <div className={`lk-home-sheet${activeSheet === 'device' ? ' lk-home-sheet--open' : ''}`}>
        <div className="lk-home-sheet__handle-row">
          <div className="lk-home-sheet__handle" />
        </div>
        <div className="lk-home-sheet__header">
          <div className="lk-home-sheet__icon lk-home-sheet__icon--device">
            <Icon name={connectionIcon} size={22} color="#fff" />
          </div>
          <div>
            <p className="lk-home-sheet__title">{deviceLabel}</p>
            <p className="lk-home-sheet__sub">Seu dispositivo</p>
          </div>
        </div>
        <div className="lk-home-sheet__rows">
          <SheetRow label="Tipo" value={deviceLabel} />
          <SheetRow label="Conexão" value={connectionLabel ?? '—'} />
          <SheetRow label="Tipo de rede" value={device?.connectionType === 'wifi' ? 'Wi-Fi' : device?.connectionType === 'mobile' ? 'Dados móveis' : device?.connectionType === 'cable' ? 'Cabo' : '—'} />
          {server?.ip && <SheetRow label="IP local" value="(via servidor)" mono />}
        </div>
        <button className="lk-home-sheet__close btn-text" onClick={closeSheet}>Fechar</button>
      </div>

      {/* Sheet: Gateway / Provedor */}
      <div className={`lk-home-sheet${activeSheet === 'gateway' ? ' lk-home-sheet--open' : ''}`}>
        <div className="lk-home-sheet__handle-row">
          <div className="lk-home-sheet__handle" />
        </div>
        <div className="lk-home-sheet__header">
          <div className="lk-home-sheet__icon lk-home-sheet__icon--gateway">
            <Icon name="router" size={22} color="#fff" />
          </div>
          <div>
            <p className="lk-home-sheet__title">Provedor</p>
            <p className="lk-home-sheet__sub">{ispLabel}</p>
          </div>
        </div>
        <div className="lk-home-sheet__rows">
          <SheetRow label="Provedor (ISP)" value={ispLabel} />
          <SheetRow label="Localização" value={serverLoc || '—'} />
          <SheetRow label="Servidor" value={server?.name ?? '—'} />
          <SheetRow label="PoP" value={server?.colo ?? '—'} mono />
        </div>
        <div className="lk-home-sheet__note">
          Informações de roteador físico não estão disponíveis no PWA.
        </div>
        <button className="lk-home-sheet__close btn-text" onClick={closeSheet}>Fechar</button>
      </div>

      {/* Sheet: Internet */}
      <div className={`lk-home-sheet${activeSheet === 'internet' ? ' lk-home-sheet--open' : ''}`}>
        <div className="lk-home-sheet__handle-row">
          <div className="lk-home-sheet__handle" />
        </div>
        <div className="lk-home-sheet__header">
          <div className="lk-home-sheet__icon lk-home-sheet__icon--internet">
            <Icon name="globe" size={22} color="#fff" />
          </div>
          <div>
            <p className="lk-home-sheet__title">Internet</p>
            <p className="lk-home-sheet__sub">Conexão pública</p>
          </div>
        </div>
        <div className="lk-home-sheet__rows">
          <SheetRow label="IP público" value={publicIp} mono />
          <SheetRow label="Provedor" value={ispLabel} />
          <SheetRow label="Localização" value={serverLoc || '—'} />
          <SheetRow label="Ponto de Presença" value={server?.colo ?? '—'} mono />
          <SheetRow label="Status" value={server?.available ? 'Conectado' : 'Indisponível'} />
        </div>
        <button className="lk-home-sheet__close btn-text" onClick={closeSheet}>Fechar</button>
      </div>
    </div>
  );
}

function SheetRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="lk-home-sheet__row">
      <span className="lk-home-sheet__row-label">{label}</span>
      <span className={`lk-home-sheet__row-value${mono ? ' numeric' : ''}`}>{value}</span>
    </div>
  );
}

function OrbitShortcutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" opacity="0.8"
        transform="rotate(30 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"
        transform="rotate(90 12 12)" />
    </svg>
  );
}
