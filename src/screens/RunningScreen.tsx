import { Gauge } from '../components/Gauge';
import { formatMbps } from '../utils/format';
import type { SpeedTestMode, TestPhase } from '../types';
import './RunningScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  phase: TestPhase;
  instantMbps: number | null;
  onCancel: () => void;
  onRetry: () => void;
  unit?: 'mbps' | 'gbps';
  sessionLabel?: string;
  mode?: SpeedTestMode;
}

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

const STEPS_NORMAL: PhaseStep[] = [
  { id: 'latency',  label: 'LAT' },
  { id: 'download', label: 'DOWN' },
  { id: 'upload',   label: 'UP' },
];

const STEPS_ADVANCED: PhaseStep[] = [
  { id: 'latency',  label: 'LAT' },
  { id: 'download', label: 'DOWN' },
  { id: 'upload',   label: 'UP' },
  { id: 'load',     label: 'CARGA' },
  { id: 'dns',      label: 'DNS' },
];

const PHASE_ORDER: TestPhase[] = ['latency', 'download', 'upload', 'load', 'dns', 'done'];

function phaseIndex(phase: TestPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

function gaugePhaseLabel(phase: TestPhase): string {
  switch (phase) {
    case 'download': return 'DOWNLOAD';
    case 'upload':   return 'UPLOAD';
    case 'latency':  return 'PING';
    case 'done':     return 'CONCLUÍDO';
    default:         return 'AGUARDANDO';
  }
}

function gaugeProgress(phase: TestPhase): number {
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
    case 'download': return 'var(--dl)';
    case 'upload':   return 'var(--ul)';
    default:         return 'var(--accent)';
  }
}

export function RunningScreen({
  theme: _theme,
  onToggleTheme: _onToggleTheme,
  phase,
  instantMbps,
  onCancel,
  onRetry,
  unit = 'mbps',
  sessionLabel,
  mode,
}: Props) {
  const steps = mode === 'advanced' ? STEPS_ADVANCED : STEPS_NORMAL;
  const currentIdx = phaseIndex(phase);
  if (phase === 'error') {
    return (
      <div className="lk-running">
        <div className="lk-running__head">
          <span />
          <span className="lk-running__head-label">Erro</span>
        </div>
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
      <div className="lk-running__head">
        <span />
        <span className="lk-running__head-label">Medindo…</span>
      </div>
      <main className="lk-running__main">
        <div className="lk-running__gauge">
          <Gauge
            value={gaugeProgress(phase)}
            phase={gaugePhaseLabel(phase)}
            num={instantMbps != null ? formatMbps(instantMbps, unit) : '—'}
            unit={unit === 'gbps' ? 'Gbps' : 'Mbps'}
            color={gaugeColor(phase)}
          />
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

        <p className="lk-running__phrase">{phraseFor(phase)}</p>
        {sessionLabel && <p className="lk-running__session-label">{sessionLabel}</p>}
        <div className="lk-running__footer">
          <button className="btn-text lk-running__cancel" onClick={onCancel}>Cancelar</button>
        </div>
      </main>
    </div>
  );
}
