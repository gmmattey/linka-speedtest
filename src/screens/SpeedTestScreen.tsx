import { useState, useEffect, useCallback } from 'react';
import type { DeviceInfo, ServerInfo, TestRecord, BufferbloatSeverity } from '../types';
import type { Settings } from '../hooks/useSettings';
import { TopBar } from '../components/TopBar';
import { formatMbps } from '../utils/format';
import { useScrollHeader } from '../hooks/useScrollHeader';
import './SpeedTestScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onStart: (mode: 'fast' | 'complete') => void;
  onOpenDiagnostico: () => void;
  lastRecord: TestRecord | null;
  device: DeviceInfo | null;
  server: ServerInfo | null;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
}

type ModeOption = 'fast' | 'complete' | 'triplo';

const MODE_LABELS: Record<ModeOption, string> = {
  fast: 'Rápido',
  complete: 'Completo',
  triplo: 'Triplo',
};

const MODE_DESC: Record<ModeOption, string> = {
  fast: 'Download e upload · cerca de 15s',
  complete: 'Download, upload, bufferbloat e DNS · cerca de 60s',
  triplo: '3 medições com intervalo de 10s · média calculada ao final',
};

export function SpeedTestScreen({
  onToggleTheme,
  onStart,
  onOpenDiagnostico,
  lastRecord,
  device,
  server,
  settings,
  onUpdateSettings,
}: Props) {
  const { scrolled, topBarOpacity, scrollContainerRef, sentinelRef } = useScrollHeader();
  const [mode, setMode] = useState<ModeOption>(settings.defaultMode ?? 'complete');
  const [showToolsSheet, setShowToolsSheet] = useState(false);
  const [showAnatelSheet, setShowAnatelSheet] = useState(false);
  const [showBufferbloatSheet, setShowBufferbloatSheet] = useState(false);

  const handleStart = useCallback(() => {
    const effectiveMode = mode === 'triplo' ? 'complete' : mode;
    onUpdateSettings({ defaultMode: effectiveMode });
    onStart(effectiveMode);
  }, [mode, onStart, onUpdateSettings]);

  const connectionType = device?.connectionType ?? lastRecord?.connectionType ?? 'unknown';

  return (
    <div className="st-screen">
      <TopBar
        title="Velocidade"
        showTitle={true}
        scrolled={scrolled}
        opacity={topBarOpacity}
      />

      <div ref={scrollContainerRef} className="st-scroll">
        <div ref={sentinelRef} style={{ height: 1 }} />

        {/* ── Círculo principal ── */}
        <div className="st-circle-wrapper">
          {lastRecord ? (
            <DoneCircle onRepeat={handleStart} />
          ) : (
            <IdleCircle onStart={handleStart} />
          )}
        </div>

        {/* ── Seletor de modo ── */}
        <ModeSelector mode={mode} onSelect={setMode} />

        <p className="st-mode-desc">{MODE_DESC[mode]}</p>

        {/* ── Resultados (só aparecem após a primeira medição) ── */}
        {lastRecord && (
          <>
            <LastResultCard record={lastRecord} unit={settings.unit} />
            <CardContextoUso record={lastRecord} />
            {settings.contractedDown && (connectionType === 'wifi' || connectionType === 'cable') && (
              <CardAnatel
                downloadMbps={lastRecord.dl}
                contractedDown={settings.contractedDown}
                onOpenSheet={() => setShowAnatelSheet(true)}
              />
            )}
            <CardBufferbloat
              severity={lastRecord.bufferbloatSeverity}
              onOpenSheet={() => setShowBufferbloatSheet(true)}
            />
          </>
        )}

        {/* ── Ferramentas ── */}
        <ExploreToolsRow onClick={() => setShowToolsSheet(true)} />

        {/* ── Status de conexão ── */}
        <StatusCard device={device} server={server} />

        <div className="st-bottom-spacer" />
      </div>

      {/* ── Bottom sheets ── */}
      {showToolsSheet && (
        <ToolsSheet
          onClose={() => setShowToolsSheet(false)}
          onOpenDiagnostico={() => { setShowToolsSheet(false); onOpenDiagnostico(); }}
        />
      )}
      {showAnatelSheet && <AnatelSheet onClose={() => setShowAnatelSheet(false)} />}
      {showBufferbloatSheet && <BufferbloatSheet onClose={() => setShowBufferbloatSheet(false)} />}
    </div>
  );
}

/* ── Círculo idle (pulse animado) ────────────────────────────────────────── */

function IdleCircle({ onStart }: { onStart: () => void }) {
  return (
    <button
      className="st-circle st-circle--idle"
      onClick={onStart}
      aria-label="Iniciar teste de velocidade"
      type="button"
    >
      <span className="st-circle__glow" aria-hidden="true" />
      <span className="st-circle__face">
        <span className="st-circle__label">Iniciar</span>
      </span>
    </button>
  );
}

/* ── Círculo concluído ───────────────────────────────────────────────────── */

function DoneCircle({ onRepeat }: { onRepeat: () => void }) {
  return (
    <button
      className="st-circle st-circle--done"
      onClick={onRepeat}
      aria-label="Repetir teste de velocidade"
      type="button"
    >
      <span className="st-circle__check" aria-hidden="true">✓</span>
      <span className="st-circle__repeat">Repetir</span>
    </button>
  );
}

/* ── Seletor de modo ─────────────────────────────────────────────────────── */

function ModeSelector({ mode, onSelect }: { mode: ModeOption; onSelect: (m: ModeOption) => void }) {
  const modes: ModeOption[] = ['fast', 'complete', 'triplo'];
  return (
    <div className="st-mode-selector" role="group" aria-label="Modo de teste">
      {modes.map((m) => {
        const active = mode === m;
        const disabled = m === 'triplo';
        return (
          <button
            key={m}
            type="button"
            className={`st-mode-btn${active ? ' st-mode-btn--active' : ''}${disabled ? ' st-mode-btn--disabled' : ''}`}
            onClick={() => !disabled && onSelect(m)}
            aria-pressed={active}
            disabled={disabled}
            title={disabled ? 'Em breve' : undefined}
          >
            {MODE_LABELS[m]}
            {disabled && <span className="st-mode-soon">Em breve</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Card: último resultado ──────────────────────────────────────────────── */

function LastResultCard({ record, unit }: { record: TestRecord; unit: 'mbps' | 'gbps' }) {
  return (
    <div className="st-card st-card--row">
      <span className="st-card__label">Último resultado</span>
      <span className="st-card__value--accent">
        ↓ {formatMbps(record.dl, unit)} · ↑ {formatMbps(record.ul, unit)}
      </span>
    </div>
  );
}

/* ── Card: O que você consegue fazer ────────────────────────────────────── */

function CardContextoUso({ record }: { record: TestRecord }) {
  const { dl, ul, latency, jitter } = record;

  const usos = [
    {
      nome: 'Videochamada',
      ok: dl >= 10 && ul >= 3 && latency <= 80 && jitter <= 30,
      falha: 'Pode ter travamentos ou queda de qualidade',
    },
    {
      nome: 'Streaming HD',
      ok: dl >= 25,
      falha: 'Buffering provável em qualidade alta',
    },
    {
      nome: 'Jogos online',
      ok: latency <= 50 && jitter <= 20,
      falha: 'Latência ou jitter podem causar lag',
    },
    {
      nome: 'Home-office',
      ok: dl >= 5 && ul >= 5,
      falha: 'Upload insuficiente para ferramentas colaborativas',
    },
  ];

  return (
    <div className="st-card">
      <div className="st-card__header">
        <span className="st-card__title">O que você consegue fazer</span>
        <InfoIcon />
      </div>
      <div className="st-divider" />
      {usos.map((uso, i) => (
        <div key={uso.nome}>
          <div className="st-uso-row">
            <span className={`st-uso-icon ${uso.ok ? 'st-uso-icon--ok' : 'st-uso-icon--fail'}`} aria-hidden="true">
              {uso.ok ? <CheckCircleIcon /> : <ErrorCircleIcon />}
            </span>
            <div className="st-uso-text">
              <span className="st-uso-nome">{uso.nome}</span>
              {uso.ok
                ? <span className="st-uso-ok">Velocidade adequada para este uso</span>
                : <span className="st-uso-fail">{uso.falha}</span>
              }
            </div>
          </div>
          {i < usos.length - 1 && <div className="st-divider" />}
        </div>
      ))}
      <div className="st-divider" />
      <p className="st-card__footnote">
        Jitter é a variação da latência — valores altos causam lag em jogos e travamentos em videochamadas.
      </p>
    </div>
  );
}

/* ── Card: Velocidade vs. contrato (ANATEL) ─────────────────────────────── */

function CardAnatel({ downloadMbps, contractedDown, onOpenSheet }: {
  downloadMbps: number;
  contractedDown: number;
  onOpenSheet: () => void;
}) {
  const pct = (downloadMbps / contractedDown) * 100;
  const passaMinimo = pct >= 40;
  const passaNormal = pct >= 80;

  const badge = passaNormal ? { text: 'Aprovado', cls: 'success' }
    : passaMinimo ? { text: 'Parcial', cls: 'warn' }
    : { text: 'Abaixo do mínimo', cls: 'error' };

  const conclusao = passaNormal
    ? 'Sua internet está dentro do esperado pelo contrato.'
    : passaMinimo
    ? 'Velocidade acima do mínimo, mas abaixo do normal. Pode ser variação pontual — faça mais testes para confirmar.'
    : 'Se isso se repetir, você tem direito de reclamar com sua operadora.';

  return (
    <div className="st-card">
      <div className="st-card__header">
        <span className="st-card__title">Velocidade vs. contrato</span>
        <button className="st-icon-btn" onClick={onOpenSheet} aria-label="Mais informações sobre a regra ANATEL" type="button">
          <InfoIcon />
        </button>
      </div>
      <span className={`st-badge st-badge--${badge.cls}`}>{badge.text}</span>
      <div className="st-anatel-criterio">
        <CriterioIcon ok={passaMinimo} />
        <span className="st-anatel-label">Mínimo garantido (40%)</span>
      </div>
      <div className="st-anatel-criterio">
        <CriterioIcon ok={passaNormal} />
        <span className="st-anatel-label">Velocidade normal (80%)</span>
      </div>
      <p className="st-card__body">{conclusao}</p>
      <div className="st-divider" />
      <p className="st-card__footnote">Ato 7869/2022 · ANATEL</p>
    </div>
  );
}

/* ── Card: Bufferbloat ───────────────────────────────────────────────────── */

function CardBufferbloat({ severity, onOpenSheet }: {
  severity?: BufferbloatSeverity;
  onOpenSheet: () => void;
}) {
  if (!severity) return null;

  if (severity === 'low') {
    return (
      <div className="st-card st-card--success">
        <div className="st-card__row-start">
          <span className="st-uso-icon--ok"><CheckCircleIcon /></span>
          <div>
            <p className="st-card__title">Sem bufferbloat detectado</p>
            <p className="st-card__body">Sua rede não apresenta atraso extra sob carga. Jogos e videochamadas devem funcionar bem.</p>
          </div>
        </div>
      </div>
    );
  }

  const cfg: Record<Exclude<BufferbloatSeverity, 'low'>, { badge: string; cls: string; text: string }> = {
    moderate: {
      badge: 'Moderado',
      cls: 'warn',
      text: 'Em uso intenso — muitos downloads ou chamadas simultâneas — pode sentir travamentos e aumento de latência.',
    },
    high: {
      badge: 'Severo',
      cls: 'error',
      text: 'Atraso alto mesmo com boa velocidade. Chamadas de vídeo e jogos online serão afetados durante qualquer uso da rede.',
    },
    critical: {
      badge: 'Crítico',
      cls: 'error',
      text: 'Atraso crítico detectado. A rede está sobrecarregada e qualquer uso simultâneo causará degradação severa.',
    },
  };

  const { badge, cls, text } = cfg[severity] ?? cfg.high;

  return (
    <div className="st-card">
      <div className="st-card__header">
        <span className="st-card__title">Atraso extra na conexão</span>
        <button className="st-icon-btn" onClick={onOpenSheet} aria-label="O que é bufferbloat" type="button">
          <InfoIcon />
        </button>
      </div>
      <span className={`st-badge st-badge--${cls}`}>{badge}</span>
      <p className="st-card__body">{text}</p>
    </div>
  );
}

/* ── Linha: Explorar ferramentas ─────────────────────────────────────────── */

function ExploreToolsRow({ onClick }: { onClick: () => void }) {
  return (
    <button className="st-card st-card--row st-card--btn" onClick={onClick} type="button" aria-label="Explorar ferramentas">
      <span className="st-card__row-icon" aria-hidden="true"><SettingsIcon /></span>
      <span className="st-card__label" style={{ flex: 1 }}>Explorar ferramentas</span>
      <ChevronIcon />
    </button>
  );
}

/* ── Card: Status de conexão ─────────────────────────────────────────────── */

function StatusCard({ device, server }: { device: DeviceInfo | null; server: ServerInfo | null }) {
  const type = device?.connectionType ?? 'unknown';
  const connected = device !== null;

  return (
    <div className="st-card st-card--status">
      <div className="st-status-row">
        <span className="st-status-icon" aria-hidden="true">
          {type === 'wifi' ? <WifiIcon /> : type === 'cable' ? <EthernetIcon /> : type === 'mobile' ? <SignalIcon /> : <WifiOffIcon />}
        </span>
        <span className="st-status-label">
          {type === 'wifi' ? 'Wi-Fi' : type === 'cable' ? 'Cabo' : type === 'mobile' ? 'Dados móveis' : 'Sem conexão'}
        </span>
        <span className={`st-status-value ${connected ? 'st-status-value--ok' : 'st-status-value--fail'}`}>
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
      {server && (
        <>
          <div className="st-divider" />
          <div className="st-status-row">
            <span className="st-status-icon" aria-hidden="true"><GlobeIcon /></span>
            <span className="st-status-label">Servidor</span>
            <span className="st-status-value">{server.colo && server.colo !== '—' ? `${server.name} · ${server.colo}` : server.name}</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Bottom sheets ───────────────────────────────────────────────────────── */

function ToolsSheet({ onClose, onOpenDiagnostico }: { onClose: () => void; onOpenDiagnostico: () => void }) {
  return (
    <Sheet onClose={onClose} title="Ferramentas">
      <SheetRow
        title="Diagnóstico Inteligente"
        desc="Diagnóstico inteligente da conexão"
        onClick={onOpenDiagnostico}
        active
      />
      <SheetRow title="DNS Benchmark" desc="Mede a velocidade dos servidores DNS" soon />
      <SheetRow title="Ping / Latência" desc="Testa o ping para servidores externos" soon />
      <SheetRow title="Wi-Fi · Canais" desc="Análise de redes e congestionamento" soon />
      <SheetRow title="Fibra Nokia" desc="Status do modem Nokia GPON" soon />
    </Sheet>
  );
}

function AnatelSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} title="Velocidade vs. contrato">
      <p className="st-sheet-body">
        A ANATEL define dois limites de velocidade que sua operadora é obrigada a cumprir.
      </p>
      <p className="st-sheet-body">
        O <strong>mínimo garantido</strong> é 40% da velocidade que você contratou — em qualquer momento do dia. Este teste mede exatamente isso.
      </p>
      <p className="st-sheet-body">
        O limite de <strong>velocidade normal</strong> é 80% da velocidade contratada. Esse cálculo usa uma média de vários testes ao longo do tempo — não é possível confirmar esse critério com uma única medição.
      </p>
      <p className="st-card__footnote">Ato 7869/2022 · ANATEL</p>
    </Sheet>
  );
}

function BufferbloatSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} title="Atraso extra na conexão">
      <p className="st-sheet-body">
        O bufferbloat acontece quando o roteador acumula pacotes em fila durante uso intenso, causando atraso extra nas comunicações em tempo real.
      </p>
      <p className="st-sheet-body">
        Um bom roteador gerencia essa fila automaticamente (chamado de QoS ou Smart Queue Management).
      </p>
    </Sheet>
  );
}

function Sheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="st-sheet-overlay" onClick={onClose} aria-hidden="true" />
      <div className="st-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="st-sheet-handle" aria-hidden="true" />
        <h2 className="st-sheet-title">{title}</h2>
        {children}
        <div className="st-sheet-safe" />
      </div>
    </>
  );
}

function SheetRow({ title, desc, onClick, active, soon }: {
  title: string;
  desc: string;
  onClick?: () => void;
  active?: boolean;
  soon?: boolean;
}) {
  return (
    <>
      <div className="st-divider" />
      <button
        className={`st-sheet-row ${active ? 'st-sheet-row--active' : ''}`}
        onClick={onClick}
        disabled={!active}
        type="button"
      >
        <div className="st-sheet-row-text">
          <span className="st-sheet-row-title">{title}</span>
          <span className="st-sheet-row-desc">{desc}</span>
        </div>
        {soon && <span className="st-badge st-badge--neutral">Em breve</span>}
        {active && <ChevronIcon />}
      </button>
    </>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function CriterioIcon({ ok }: { ok: boolean }) {
  return (
    <span className={`st-criterio-icon ${ok ? 'st-criterio-icon--ok' : 'st-criterio-icon--fail'}`} aria-hidden="true">
      {ok ? '✓' : '✕'}
    </span>
  );
}

/* ── Ícones SVG ──────────────────────────────────────────────────────────── */

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v1M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v5M12 16v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--text-3)' }}>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EthernetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 7V5M10 7V5M14 7V5M17 7V5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 6l4 4 4-4 4 4 4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v8M9 14v4M13 12v6M17 10v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function WifiOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3a14.5 14.5 0 0 1 0 18M3 12h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.6 8h16.8M3.6 16h16.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
