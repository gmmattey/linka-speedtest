import { Header } from '../components/Header';
import { Gauge } from '../components/Gauge';
import type { TestPhase } from '../types';
import './RunningScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  phase: TestPhase;
  instantMbps: number | null;
  onCancel: () => void;
  onRetry: () => void;
  unit?: 'mbps' | 'gbps';
}

function phraseFor(phase: TestPhase): string {
  switch (phase) {
    case 'latency':  return 'Verificando a resposta do servidor…';
    case 'download': return 'Medindo a velocidade de download…';
    case 'upload':   return 'Medindo a velocidade de upload…';
    case 'done':     return 'Quase pronto…';
    default:         return 'Preparando o teste…';
  }
}

export function RunningScreen({
  theme,
  onToggleTheme,
  phase,
  instantMbps,
  onCancel,
  onRetry,
  unit = 'mbps',
}: Props) {
  if (phase === 'error') {
    return (
      <div className="lk-running">
        <Header theme={theme} onToggleTheme={onToggleTheme} />
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
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main className="lk-running__main">
        <div className="lk-running__gauge">
          <Gauge instantMbps={instantMbps} unit={unit} />
        </div>
        <p className="lk-running__phrase">{phraseFor(phase)}</p>
        <div className="lk-running__footer">
          <button className="btn-text lk-running__cancel" onClick={onCancel}>Cancelar</button>
        </div>
      </main>
    </div>
  );
}
