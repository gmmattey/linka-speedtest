import { useState } from 'react';
import type { DeviceInfo, ServerInfo, SpeedTestMode, TestRecord } from '../types';
import type { Settings } from '../hooks/useSettings';
import { Header } from '../components/Header';
import { BottomSheet } from '../components/BottomSheet';
import { formatMbps } from '../utils/format';
import './StartScreen.css';

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
  onStart: (mode: SpeedTestMode) => void;
  onStartComparison: () => void;
  onStartBeforeAfter: () => void;
  onStartProvaReal: () => void;
  onStartRoomTest: () => void;
  onRetry: () => void;
  lastRecord: TestRecord | null;
  onShowLastResult: () => void;
  onShowHistory: () => void;
}

export function StartScreen({
  theme,
  onToggleTheme,
  device,
  server,
  loading,
  error,
  isOnline,
  settings,
  onUpdateSettings,
  onStart,
  onStartComparison,
  onStartBeforeAfter,
  onStartProvaReal,
  onStartRoomTest,
  onRetry,
  lastRecord,
  onShowLastResult,
  onShowHistory,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<SpeedTestMode>('quick');
  const canStart = isOnline && !loading && !!server?.available && !!device;
  const unitLabel = settings.unit === 'gbps' ? 'Gbps' : 'Mbps';

  return (
    <div className="lk-start">
      <Header theme={theme} onToggleTheme={onToggleTheme} />

      <main className="lk-start__main">
        {!isOnline ? (
          <div className="lk-start__error" role="alert">
            <span>Sem conexão. Conecte-se à internet para medir sua velocidade.</span>
          </div>
        ) : error ? (
          <div className="lk-start__error" role="alert">
            <span>⚠ {error}</span>
            <button className="btn-text" onClick={onRetry}>Tentar novamente</button>
          </div>
        ) : null}

        {/* Círculo centralizado */}
        <div className="lk-start__hero">
          <button
            className={`lk-start__cta${canStart ? ' lk-start__cta--ready' : ''}`}
            onClick={() => onStart(mode)}
            disabled={!canStart}
            aria-label={mode === 'quick' ? 'Iniciar teste rápido' : 'Iniciar teste completo'}
          >
            <span className="lk-start__cta-label">
              {loading ? 'Aguardando…' : 'Iniciar'}
            </span>
          </button>
        </div>

        {/* Controles inferiores */}
        <div className="lk-start__controls">
          {/* Toggle estilo iOS: label — switch — label */}
          <div className="lk-start__toggle-row">
            <span
              className={`lk-start__toggle-label${mode === 'quick' ? ' lk-start__toggle-label--active' : ''}`}
              onClick={() => setMode('quick')}
            >
              Teste rápido
            </span>
            <button
              className={`lk-start__toggle-switch${mode === 'complete' ? ' lk-start__toggle-switch--on' : ''}`}
              onClick={() => setMode(mode === 'quick' ? 'complete' : 'quick')}
              role="switch"
              aria-checked={mode === 'complete'}
              aria-label="Alternar entre teste rápido e completo"
            />
            <span
              className={`lk-start__toggle-label${mode === 'complete' ? ' lk-start__toggle-label--active' : ''}`}
              onClick={() => setMode('complete')}
            >
              Teste completo
            </span>
          </div>

          {settings.gamingProfile !== 'off' && (
            <p className="lk-start__data-hint lk-start__gamer-hint">
              🎮 Modo Gamer ativo: {
                settings.gamingProfile === 'casual' ? 'Casual'
                : settings.gamingProfile === 'moba'  ? 'MOBA'
                : settings.gamingProfile === 'fps'   ? 'FPS'
                : 'Cloud Gaming'
              }
            </p>
          )}

          <button
            className="btn-text lk-start__compare-link"
            onClick={onStartComparison}
            disabled={!canStart}
          >
            Comparar locais
          </button>

          <button
            className="btn-text lk-start__compare-link"
            onClick={onStartBeforeAfter}
            disabled={!canStart}
          >
            Antes e Depois
          </button>

          <button
            className="btn-text lk-start__compare-link"
            onClick={onStartProvaReal}
            disabled={!canStart}
          >
            Prova Real (3×)
          </button>

          <button
            className="btn-text lk-start__compare-link"
            onClick={onStartRoomTest}
            disabled={!canStart}
          >
            Teste por local
          </button>

          {lastRecord && (
            <button className="btn-text lk-start__last-link" onClick={onShowLastResult}>
              ↓ {formatMbps(lastRecord.dl, settings.unit)} ↑ {formatMbps(lastRecord.ul, settings.unit)} {unitLabel} · Ver último teste
            </button>
          )}

          <button className="btn-text lk-start__history-link" onClick={onShowHistory}>
            Ver histórico
          </button>
        </div>
      </main>

      <BottomSheet
        open={sheetOpen}
        onToggle={() => setSheetOpen((o) => !o)}
        onClose={() => setSheetOpen(false)}
        device={device}
        server={server}
        loading={loading}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
}
