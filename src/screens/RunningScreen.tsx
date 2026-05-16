import { useEffect, useRef } from 'react';
import { Gauge } from '../components/Gauge';
import { LiveChart } from '../components/LiveChart';
import { TopBar } from '../components/TopBar';
import { resolveCopy } from '../core';
import { formatMbps } from '../utils/format';
import { triggerHaptic } from '../utils/haptics';
import type { ServerInfo, SpeedTestMode, TestPhase } from '../types';
import type { LivePoint } from '../hooks/useSpeedTest';
import './RunningScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  phase: TestPhase;
  instantMbps: number | null;
  /**
   * Progresso global ∈ [0,1] emitido pelo orchestrator (computeRanges +
   * phaseStart). Usado para preencher o arco do Gauge de forma contínua,
   * eliminando os saltos discretos da função `gaugeProgress(phase)` legada
   * (latência → 0.15, download → 0.5, upload → 0.85). Opcional para
   * compatibilidade com chamadas que não fornecem o progresso ainda
   * (fallback usa o degrau por fase).
   */
  overallProgress?: number;
  onCancel: () => void;
  onRetry: () => void;
  unit?: 'mbps' | 'gbps';
  sessionLabel?: string;
  mode?: SpeedTestMode;
  live?: LivePoint[];
  server?: ServerInfo | null;
  /** Habilita haptics em transições de fase, conclusão e erro. Default true. */
  useHaptics?: boolean;
}

// Fases que disparam vibração curta na entrada (Bloco 3 — Polimento, 2026-05).
// `latency` não dispara: é a primeira fase do teste, vibração ali seria
// confundida com o tap do botão "Iniciar".
const PHASE_TRANSITIONS: ReadonlySet<TestPhase> = new Set(['download', 'upload']);

function phraseFor(phase: TestPhase): string {
  switch (phase) {
    case 'latency':  return 'Verificando a resposta do servidor…';
    case 'download': return 'Medindo a velocidade de download…';
    case 'upload':   return 'Medindo a velocidade de upload…';
    case 'load':     return 'Medindo a estabilidade sob carga…';
    case 'dns':      return 'Testando servidores DNS…';
    case 'done':     return 'Quase pronto…';
    default:         return 'Preparando o teste…';
  }
}

type PhaseStep = { id: TestPhase; label: string };

const STEPS_V2: PhaseStep[] = [
  { id: 'latency',  label: resolveCopy('metric.latency.short') },
  { id: 'download', label: 'DOWN' },
  { id: 'upload',   label: 'UP' },
];

const PHASE_ORDER: TestPhase[] = ['latency', 'download', 'upload', 'load', 'dns', 'done'];

function phaseIndex(phase: TestPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

function gaugePhaseLabel(phase: TestPhase): string {
  switch (phase) {
    case 'download': return 'DOWNLOAD';
    case 'upload':   return 'UPLOAD';
    case 'latency':  return resolveCopy('metric.latency.short');
    case 'done':     return 'CONCLUÍDO';
    default:         return 'AGUARDANDO';
  }
}

/**
 * Fallback degrau por fase — usado apenas quando `overallProgress` não vier
 * do consumidor. Mantido para compatibilidade; o caminho real (`App.tsx`)
 * passa o progresso contínuo do orchestrator e o arco preenche suave.
 */
function gaugeProgressFallback(phase: TestPhase): number {
  switch (phase) {
    case 'latency':  return 0.15;
    case 'download': return 0.5;
    case 'upload':   return 0.85;
    case 'done':     return 1;
    default:         return 0;
  }
}

function gaugeColor(phase: TestPhase): string {
  switch (phase) {
    case 'download': return 'var(--phase-dl)';
    case 'upload':   return 'var(--phase-ul)';
    case 'latency':  return 'var(--phase-latency)';
    default:         return 'var(--accent)';
  }
}

export function RunningScreen({
  phase,
  instantMbps,
  overallProgress,
  onCancel,
  onRetry,
  unit = 'mbps',
  sessionLabel,
  live = [],
  server = null,
  useHaptics = true,
}: Props) {
  const steps = STEPS_V2;
  const currentIdx = phaseIndex(phase);

  // Média de download para mostrar durante a fase de upload (como Kotlin VelocidadeScreen)
  const avgDownloadMbps = phase === 'upload'
    ? (() => {
        const dlPoints = live.filter((p) => p.phase === 'download').map((p) => p.speed);
        if (dlPoints.length === 0) return null;
        return dlPoints.reduce((a, b) => a + b, 0) / dlPoints.length;
      })()
    : null;
  // Preenche o arco com o progresso contínuo do orchestrator quando ele
  // existir; cai no degrau por fase apenas como fallback. O CSS do Gauge
  // já tem `transition: stroke-dashoffset 0.5s ease`, então mesmo updates
  // a cada ~300ms ficam visualmente suaves.
  const gaugeFill =
    typeof overallProgress === 'number' && Number.isFinite(overallProgress)
      ? Math.max(0, Math.min(1, overallProgress))
      : gaugeProgressFallback(phase);

  // Linha sutil "Servidor · Local · ISP" abaixo de "Medindo…" — Bloco 2
  // (Hero confiante, 2026-05). Filtra placeholders ('—') para não poluir
  // quando algum campo não estiver disponível.
  const serverLineParts = server
    ? [server.name, server.loc, server.isp].filter((s) => !!s && s !== '—')
    : [];
  const serverLine = serverLineParts.length > 0 ? serverLineParts.join(' · ') : null;

  // Haptics em transições de fase, conclusão e erro (Bloco 3 — Polimento, 2026-05).
  // Mantém a última fase para detectar transição real (e não disparar
  // duplicado em re-renders dentro da mesma fase).
  const lastPhaseRef = useRef<TestPhase | null>(null);
  useEffect(() => {
    const last = lastPhaseRef.current;
    if (last !== phase) {
      if (phase === 'done')                      triggerHaptic('success', useHaptics);
      else if (phase === 'error')                triggerHaptic('error', useHaptics);
      else if (PHASE_TRANSITIONS.has(phase))     triggerHaptic('phaseChange', useHaptics);
      lastPhaseRef.current = phase;
    }
  }, [phase, useHaptics]);
  if (phase === 'error') {
    return (
      <div className="lk-running">
        {/* Bloco 5 — TopBar System (2026-05): tela de erro mantém TopBar
            com título "Erro" sempre visível; sem back (o usuário decide
            via botões "Testar novamente" / "Cancelar"). */}
        <TopBar title="Erro" showTitle scrolled={false} />
        <main className="lk-running__main lk-running__main--error">
          <div className="lk-running__error" role="alert">
            <div className="lk-running__error-icon" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="lk-running__error-title">Não foi possível completar o teste</h2>
            <p className="lk-running__error-msg">Verifique sua conexão e tente novamente.</p>
            <div className="lk-running__error-actions">
              <button className="btn-primary" onClick={onRetry}>Testar novamente</button>
              <button className="btn-text" onClick={onCancel}>Cancelar</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="lk-running">
      {/* Bloco 5 — TopBar System (2026-05): título "Medindo…" sempre visível
          (showTitle permanente). Sem back — não dá para abandonar mid-test
          pelo header; usuário usa o botão "Cancelar" no rodapé. */}
      <TopBar title="Medindo…" showTitle scrolled={false} />
      {serverLine && (
        <p className="lk-running__server-line" title={serverLine}>
          {serverLine}
        </p>
      )}
      <main className="lk-running__main">
        <div className="lk-running__gauge">
          <Gauge
            value={gaugeFill}
            phase={gaugePhaseLabel(phase)}
            num={instantMbps != null ? formatMbps(instantMbps, unit) : '—'}
            unit={unit === 'gbps' ? 'Gbps' : 'Mbps'}
            color={gaugeColor(phase)}
          />
        </div>
        {/* Resultado de download durante upload (idêntico ao Kotlin VelocidadeScreen) */}
        {avgDownloadMbps != null && (
          <div className="lk-running__dl-preview">
            <span className="lk-running__dl-value">
              ↓ {formatMbps(avgDownloadMbps, unit)} Mbps
            </span>
            <span className="lk-running__dl-label">download concluído</span>
          </div>
        )}

        {/* Mini-gráfico ao vivo da velocidade instantânea (Bloco Motion) */}
        <div className="lk-running__chart">
          <LiveChart points={live} phase={phase} />
        </div>
        {/* Indicador de fases (apenas durante o teste) */}
        <div className="lk-running__steps" aria-hidden="true">
          {steps.map((step, i) => {
            const stepIdx = phaseIndex(step.id);
            const isDone    = stepIdx < currentIdx;
            const isActive  = stepIdx === currentIdx;
            return (
              <div key={step.id} className="lk-running__step-item">
                <span
                  className={[
                    'lk-running__step-pill',
                    isDone   ? 'lk-running__step-pill--done'   : '',
                    isActive ? 'lk-running__step-pill--active' : '',
                  ].join(' ').trim()}
                >
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <span className={`lk-running__step-sep${isDone ? ' lk-running__step-sep--done' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* A11y (2026-05): a frase narrativa muda conforme a fase do teste
            avança. role="status" + aria-live="polite" notifica screen
            readers a cada transição (ex.: "Medindo download…" →
            "Medindo upload…") sem interromper a leitura corrente. */}
        <p className="lk-running__phrase" role="status" aria-live="polite">
          {phraseFor(phase)}
        </p>
        {sessionLabel && <p className="lk-running__session-label">{sessionLabel}</p>}
        <div className="lk-running__footer">
          <button className="btn-text lk-running__cancel" onClick={onCancel}>Cancelar</button>
        </div>
      </main>
    </div>
  );
}
