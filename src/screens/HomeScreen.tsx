import { useCallback, useRef, useState } from 'react';
import type { DeviceInfo, ServerInfo, TestRecord } from '../types';
import type { Settings } from '../hooks/useSettings';
import { TopBar } from '../components/TopBar';
import { Icon, IconGames, IconStream, IconWork, IconVideoCall } from '../components/icons';
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator';
import { useScrollHeader } from '../hooks/useScrollHeader';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { formatMbps, formatMs } from '../utils/format';
import { loadHistory } from '../utils/history';
import './HomeScreen.css';

interface Props {
  theme: 'dark' | 'light';
  device: DeviceInfo | null;
  server: ServerInfo | null;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  settings: Settings;
  onRetry: () => void;
  lastRecord: TestRecord | null;
  onShowHistory: () => void;
  onNavigateToSpeedTest: () => void;
  onNavigateToAjustes: () => void;
  onOpenOrbit?: () => void;
  onShowSinal?: () => void;
  onRefresh?: () => Promise<void>;
}

type ActiveSheet = 'device' | 'gateway' | 'internet' | null;

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatTimestamp(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const d = new Date(epochMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (diff < 60_000) return 'Agora';
  if (diff < 3_600_000) return `Há ${Math.floor(diff / 60_000)}min`;
  if (diff < 86_400_000) return `${hh}:${mm}`;
  if (diff < 2 * 86_400_000) return `Ontem, ${hh}:${mm}`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function isCgNat(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  return parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
}

function gamerVeredito(r: TestRecord): 'good' | 'acceptable' | 'poor' {
  if (r.dl >= 15 && r.latency <= 50) return 'good';
  if (r.dl >= 5 && r.latency <= 100) return 'acceptable';
  return 'poor';
}

type BadgeLevel = 'ok' | 'warn' | 'bad' | 'none';

function getBadge(level: BadgeLevel): { label: string; color: string; bg: string } {
  if (level === 'ok')   return { label: 'OK',      color: 'var(--success)',        bg: 'rgba(52,211,153,0.12)'  };
  if (level === 'warn') return { label: 'Regular',  color: 'var(--warn, #F59E0B)', bg: 'rgba(245,158,11,0.12)'  };
  if (level === 'bad')  return { label: 'Ruim',     color: 'var(--error)',          bg: 'rgba(239,68,68,0.12)'   };
  return { label: '–', color: 'var(--text-3)', bg: 'var(--surface-2)' };
}

function signalBarsCount(latencyMs: number): number {
  if (latencyMs <= 20)  return 4;
  if (latencyMs <= 50)  return 3;
  if (latencyMs <= 100) return 2;
  return 1;
}

function signalColor(bars: number): string {
  if (bars >= 3) return 'var(--success)';
  if (bars === 2) return 'var(--warn, #F59E0B)';
  return 'var(--error)';
}

/* ── MiniSignalBars ───────────────────────────────────────────────────── */

function MiniSignalBars({ bars, color }: { bars: number; color: string }) {
  return (
    <div className="lk-home__signal-bars" aria-hidden="true">
      {[8, 12, 16, 20].map((h, i) => (
        <div
          key={i}
          className="lk-home__signal-bar"
          style={{ height: h, background: i < bars ? color : undefined, opacity: i < bars ? 1 : 0.2 }}
        />
      ))}
    </div>
  );
}

/* ── MiniLineChart (multi-point history) ─────────────────────────────── */

function MiniLineChart({ history }: { history: TestRecord[] }) {
  const W = 400;
  const H = 72;
  const pad = 8;

  const pts = [...history].reverse().slice(0, 10); // oldest → newest, max 10
  if (pts.length === 0) return null;

  const allVals = pts.flatMap((p) => [p.dl, p.ul]).filter((v) => v > 0);
  const maxY = Math.max(...allVals, 1) * 1.2;
  const n = Math.max(pts.length - 1, 1);

  const toX = (i: number) => pad + (i / n) * (W - 2 * pad);
  const toY = (v: number) => H - pad - (v / maxY) * (H - 2 * pad);

  const bezierPath = (vals: number[]): string => {
    if (vals.length === 0) return '';
    const points = vals.map((v, i): [number, number] => [toX(i), toY(v)]);
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let k = 1; k < points.length; k++) {
      const [px, py] = points[k - 1];
      const [cx, cy] = points[k];
      const cpx = (px + cx) / 2;
      d += ` C ${cpx} ${py} ${cpx} ${cy} ${cx} ${cy}`;
    }
    return d;
  };

  const dlPath = bezierPath(pts.map((p) => p.dl));
  const ulPath = bezierPath(pts.map((p) => p.ul));
  const lastX = toX(pts.length - 1);
  const firstX = toX(0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 72, display: 'block' }}
      aria-hidden="true"
    >
      <path d={`${dlPath} L ${lastX} ${H} L ${firstX} ${H} Z`} fill="var(--accent)" fillOpacity="0.10" />
      <path d={`${ulPath} L ${lastX} ${H} L ${firstX} ${H} Z`} fill="var(--success, #34D399)" fillOpacity="0.07" />
      {dlPath && <path d={dlPath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />}
      {ulPath && <path d={ulPath} fill="none" stroke="var(--success, #34D399)" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}

/* ── ExperienciaDeUso ─────────────────────────────────────────────────── */

function ExperienciaDeUso({ record }: { record: TestRecord | null }) {
  const gamer = record ? gamerVeredito(record) : null;

  const cases: { icon: React.ReactNode; label: string; level: BadgeLevel }[] = [
    {
      icon: <IconGames size={20} />,
      label: 'Jogos',
      level: !gamer ? 'none' : gamer === 'good' ? 'ok' : gamer === 'acceptable' ? 'warn' : 'bad',
    },
    {
      icon: <IconStream size={20} />,
      label: 'Streaming',
      level: !record ? 'none' : record.dl >= 3 ? 'ok' : 'bad',
    },
    {
      icon: <IconWork size={20} />,
      label: 'Home Office',
      level: !record ? 'none' : record.dl >= 2 ? 'ok' : 'bad',
    },
    {
      icon: <IconVideoCall size={20} />,
      label: 'Chamadas',
      level: !record ? 'none' : record.dl >= 1 ? 'ok' : 'bad',
    },
  ];

  return (
    <>
      <p className="lk-home__experience-header">EXPERIÊNCIA DE USO</p>
      <div className="lk-home__experience-divider" />
      {cases.map(({ icon, label, level }) => {
        const badge = getBadge(level);
        return (
          <div key={label}>
            <div className="lk-home__exp-item">
              <span className="lk-home__exp-icon" style={{ color: 'var(--accent)' }}>{icon}</span>
              <span className="lk-home__exp-label">{label}</span>
              <span className="lk-home__exp-badge" style={{ color: badge.color, background: badge.bg }}>
                {badge.label}
              </span>
            </div>
            <div className="lk-home__experience-divider" />
          </div>
        );
      })}
    </>
  );
}

/* ── SignalCard ───────────────────────────────────────────────────────── */

interface NavConn { downlink?: number; effectiveType?: string; type?: string }

function SignalCard({
  device,
  server,
  lastRecord,
  onTap,
}: {
  device: DeviceInfo | null;
  server: ServerInfo | null;
  lastRecord: TestRecord | null;
  onTap?: () => void;
}) {
  if (!device) return null;

  const navConn = (navigator as unknown as { connection?: NavConn }).connection;
  const isWifi   = device.connectionType === 'wifi';
  const isMobile = device.connectionType === 'mobile';

  const bars      = lastRecord ? signalBarsCount(lastRecord.latency) : 0;
  const barsColor = bars > 0 ? signalColor(bars) : 'var(--text-3)';

  const line1 = isWifi ? 'Wi-Fi' : isMobile ? (server?.isp ?? 'Dados móveis') : 'Ethernet';
  const line2 = (() => {
    if (isWifi   && navConn?.downlink)       return `~${navConn.downlink} Mbps`;
    if (isMobile && navConn?.effectiveType) {
      const map: Record<string, string> = { '4g': '4G', '3g': '3G', '2g': '2G', 'slow-2g': '2G lento' };
      return map[navConn.effectiveType] ?? navConn.effectiveType.toUpperCase();
    }
    return null;
  })();

  const iconName = isWifi ? 'wifi' : isMobile ? 'cellular' : 'router';

  const Tag = onTap ? 'button' : 'div';

  return (
    <Tag
      className="card lk-home__signal-card"
      {...(onTap ? { type: 'button' as const, onClick: onTap } : {})}
      aria-label={onTap ? 'Abrir análise de sinal' : undefined}
    >
      <div className="lk-home__signal-left">
        <div className="lk-home__signal-icon-wrap">
          <Icon name={iconName} size={20} color="var(--accent)" />
        </div>
        <div className="lk-home__signal-text">
          <span className="lk-home__signal-name">{line1}</span>
          {line2 && <span className="lk-home__signal-sub">{line2}</span>}
        </div>
      </div>
      <div className="lk-home__signal-right">
        {bars > 0 && (
          <>
            <MiniSignalBars bars={bars} color={barsColor} />
            <span className="lk-home__signal-pct" style={{ color: barsColor }}>{bars * 25}%</span>
          </>
        )}
        {onTap && <Icon name="chevron" size={14} color="var(--text-3)" />}
      </div>
    </Tag>
  );
}

/* ── GamerSheet ───────────────────────────────────────────────────────── */

function GamerSheet({
  record,
  onClose,
  onGoToTest,
}: {
  record: TestRecord | null;
  onClose: () => void;
  onGoToTest: () => void;
}) {
  const verdict = record ? gamerVeredito(record) : null;
  const verdictLabel =
    verdict === 'good' ? 'Ótimo para games' :
    verdict === 'acceptable' ? 'Aceitável' :
    verdict === 'poor' ? 'Ruim para games' : null;
  const verdictColor =
    verdict === 'good' ? 'var(--success)' :
    verdict === 'acceptable' ? 'var(--warn, #F59E0B)' :
    'var(--error)';

  return (
    <div className="lk-home__overlay" onClick={onClose}>
      <div className="lk-home__gamer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="lk-home__gamer-handle-row">
          <div className="lk-home__gamer-handle" />
        </div>
        <div className="lk-home__gamer-content">
          <p className="lk-home__gamer-title">Modo Gamer</p>
          {record ? (
            <>
              {verdictLabel && (
                <p className="lk-home__gamer-verdict" style={{ color: verdictColor }}>{verdictLabel}</p>
              )}
              <div className="lk-home__gamer-metrics">
                <GamerMetric label="Latência"  value={`${formatMs(record.latency)} ms`} />
                <GamerMetric label="Oscilação" value={`${record.jitter.toFixed(1)} ms`} />
                <GamerMetric label="Perda"     value={`${record.packetLoss.toFixed(1)}%`} />
                <GamerMetric label="Download"  value={`${formatMbps(record.dl, 'mbps')} Mbps`} />
                <GamerMetric label="Upload"    value={`${formatMbps(record.ul, 'mbps')} Mbps`} />
              </div>
            </>
          ) : (
            <p className="lk-home__gamer-no-data">
              Realize um teste de velocidade para ver a análise gamer.
            </p>
          )}
          <button
            className="lk-home__gamer-cta btn-primary"
            type="button"
            onClick={() => { onClose(); onGoToTest(); }}
          >
            {record ? 'Novo teste' : 'Iniciar teste'}
          </button>
        </div>
        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
      </div>
    </div>
  );
}

function GamerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="lk-home__gamer-metric-row">
      <span className="lk-home__gamer-metric-label">{label}</span>
      <span className="lk-home__gamer-metric-value">{value}</span>
    </div>
  );
}

/* ── SheetRow ─────────────────────────────────────────────────────────── */

function SheetRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="lk-home-sheet__row">
      <span className="lk-home-sheet__row-label">{label}</span>
      <span className={`lk-home-sheet__row-value${mono ? ' numeric' : ''}`}>{value}</span>
    </div>
  );
}

/* ── HomeScreen ───────────────────────────────────────────────────────── */

export function HomeScreen({
  theme,
  device,
  server,
  loading,
  error,
  isOnline,
  settings,
  onRetry,
  lastRecord,
  onShowHistory,
  onNavigateToSpeedTest,
  onNavigateToAjustes,
  onOpenOrbit,
  onShowSinal,
  onRefresh,
}: Props) {
  const [history]        = useState<TestRecord[]>(() => loadHistory());
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [showGamerSheet, setShowGamerSheet] = useState(false);

  const { scrolled, topBarOpacity, scrollContainerRef, sentinelRef } = useScrollHeader();
  const ptrContainerRef = useRef<HTMLElement | null>(null);
  const setScrollContainer = useCallback((el: HTMLElement | null) => {
    ptrContainerRef.current = el;
    scrollContainerRef(el);
  }, [scrollContainerRef]);
  const noopRefresh = useCallback(() => Promise.resolve(), []);
  const ptr = usePullToRefresh(ptrContainerRef, onRefresh ?? noopRefresh, { enabled: !!onRefresh });

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

  const ispLabel  = loading ? 'Detectando…' : (server?.isp ?? '—');
  const publicIp  = loading ? '…' : (server?.ip ?? '—');
  const serverLoc = server?.loc ?? '';

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
        opacity={topBarOpacity}
        showTitle
        title="Home"
        leftSlot={
          <button
            className="lk-home__avatar"
            type="button"
            onClick={onNavigateToAjustes}
            aria-label="Abrir ajustes"
          >
            L
          </button>
        }
      />

      {/* ── Alertas ─────────────────────────────────────────── */}
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

        {/* ── NetworkPath ──────────────────────────────────── */}
        <section className="lk-home__path" aria-label="Caminho da rede">
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
            <span className="lk-home__node-sub">
              {loading ? '…' : ispLabel.length > 12 ? ispLabel.slice(0, 12) + '…' : ispLabel}
            </span>
          </button>

          <div className="lk-home__path-line" />

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

        {/* ── CGNAT banner ─────────────────────────────────── */}
        {isCgNat(server?.ip) && (
          <div className="lk-home__cgnat" role="alert">
            <Icon name="info" size={20} color="var(--warn, #F59E0B)" />
            <div>
              <p className="lk-home__cgnat-title">Conexão compartilhada com vizinhos</p>
              <p className="lk-home__cgnat-body">
                Seu provedor divide o acesso à internet entre vários clientes. Não afeta navegação
                e streaming, mas pode impactar jogos online e aplicativos de chamada.
              </p>
            </div>
          </div>
        )}

        {/* ── Medições card ────────────────────────────────── */}
        <section className="lk-home__medicoes card">
          <div className="lk-home__medicoes-header">
            <div>
              <span className="lk-home__medicoes-title">Medições</span>
              {lastRecord && (
                <p className="lk-home__medicoes-ts">Última: {formatTimestamp(lastRecord.timestamp)}</p>
              )}
            </div>
            {history.length > 0 && (
              <button className="lk-home__medicoes-link" onClick={onShowHistory} type="button">
                Ver histórico
              </button>
            )}
          </div>

          {lastRecord ? (
            <>
              {/* Hero: DL + UL com dividers (igual ao Android LastResultHero) */}
              <div className="lk-home__hero-divider" />
              <div className="lk-home__hero-inner">
                <span className="lk-home__hero-ts">{formatTimestamp(lastRecord.timestamp)}</span>
                <div className="lk-home__hero-speeds">
                  <div className="lk-home__hero-speed">
                    <div className="lk-home__hero-nums">
                      <span className="lk-home__hero-arrow" style={{ color: 'var(--dl)' }}>↓</span>
                      <span className="lk-home__hero-big" style={{ color: 'var(--dl)' }}>
                        {formatMbps(lastRecord.dl, settings.unit)}
                      </span>
                      <span className="lk-home__hero-unit" style={{ color: 'var(--dl)', opacity: 0.75 }}>
                        {unitLabel}
                      </span>
                    </div>
                    <span className="lk-home__hero-label-sm">Download</span>
                  </div>
                  <div className="lk-home__hero-speed">
                    <div className="lk-home__hero-nums">
                      <span className="lk-home__hero-arrow" style={{ color: 'var(--ul)' }}>↑</span>
                      <span className="lk-home__hero-big" style={{ color: 'var(--ul)' }}>
                        {formatMbps(lastRecord.ul, settings.unit)}
                      </span>
                      <span className="lk-home__hero-unit" style={{ color: 'var(--ul)', opacity: 0.75 }}>
                        {unitLabel}
                      </span>
                    </div>
                    <span className="lk-home__hero-label-sm">Upload</span>
                  </div>
                </div>
              </div>
              <div className="lk-home__hero-divider" />

              {/* MiniLineChart com histórico real */}
              <div className="lk-home__chart-wrap">
                <MiniLineChart history={history} />
              </div>
            </>
          ) : (
            <div className="lk-home__medicoes-empty">
              <span className="lk-home__empty-text">
                Faça um teste para ver o histórico de velocidade aqui.
              </span>
            </div>
          )}

          <button
            className="lk-home__central-btn btn-primary"
            onClick={onNavigateToSpeedTest}
            type="button"
          >
            Central de Medição
          </button>
        </section>

        {/* ── ExperienciaDeUso card ─────────────────────────── */}
        <section className="card lk-home__exp-card">
          <ExperienciaDeUso record={lastRecord} />
        </section>

        {/* ── SignalCard ────────────────────────────────────── */}
        <SignalCard
          device={device}
          server={server}
          lastRecord={lastRecord}
          onTap={onShowSinal}
        />

        {/* ── QualidadeShortcutRow (Diagnóstico Inteligente) ── */}
        {onOpenOrbit && (
          <button className="card lk-home__shortcut-row" type="button" onClick={onOpenOrbit}>
            <div className="lk-home__shortcut-row-icon">
              <Icon name="bulb" size={18} color="var(--accent)" />
            </div>
            <div className="lk-home__shortcut-row-text">
              <span className="lk-home__shortcut-row-title">Diagnóstico Inteligente</span>
              <span className="lk-home__shortcut-row-sub">Realize o diagnóstico da sua rede com IA</span>
            </div>
            <Icon name="chevron" size={18} color="var(--text-3)" />
          </button>
        )}

        {/* ── GamerShortcutCard ─────────────────────────────── */}
        <button
          className="card lk-home__shortcut-row"
          type="button"
          onClick={() => setShowGamerSheet(true)}
        >
          <div className="lk-home__shortcut-row-icon lk-home__shortcut-row-icon--game">
            <Icon name="game" size={18} color="var(--success)" />
          </div>
          <div className="lk-home__shortcut-row-text">
            <span className="lk-home__shortcut-row-title">Modo Gamer</span>
            <span className="lk-home__shortcut-row-sub">Análise da conexão para gaming</span>
          </div>
          <Icon name="chevron" size={18} color="var(--text-3)" />
        </button>

        <div className="lk-home__bottom-pad" />
      </div>

      {/* ── Bottom sheets (node info) ─────────────────────── */}
      {activeSheet && (
        <div className="lk-home-sheet-backdrop" onClick={closeSheet} />
      )}

      {/* Sheet: Dispositivo */}
      <div className={`lk-home-sheet${activeSheet === 'device' ? ' lk-home-sheet--open' : ''}`}>
        <div className="lk-home-sheet__handle-row"><div className="lk-home-sheet__handle" /></div>
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
          <SheetRow label="Tipo de rede" value={
            device?.connectionType === 'wifi' ? 'Wi-Fi'
            : device?.connectionType === 'mobile' ? 'Dados móveis'
            : device?.connectionType === 'cable' ? 'Cabo'
            : '—'
          } />
          {server?.ip && <SheetRow label="IP local" value="(via servidor)" mono />}
        </div>
        <button className="lk-home-sheet__close btn-text" onClick={closeSheet}>Fechar</button>
      </div>

      {/* Sheet: Gateway / Provedor */}
      <div className={`lk-home-sheet${activeSheet === 'gateway' ? ' lk-home-sheet--open' : ''}`}>
        <div className="lk-home-sheet__handle-row"><div className="lk-home-sheet__handle" /></div>
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
        <div className="lk-home-sheet__handle-row"><div className="lk-home-sheet__handle" /></div>
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

      {/* ── GamerSheet ────────────────────────────────────── */}
      {showGamerSheet && (
        <GamerSheet
          record={lastRecord}
          onClose={() => setShowGamerSheet(false)}
          onGoToTest={onNavigateToSpeedTest}
        />
      )}
    </div>
  );
}
