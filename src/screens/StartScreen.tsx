import { useState } from 'react';
import type { DeviceInfo, ServerInfo, SpeedTestMode, TestRecord } from '../types';
import type { Settings } from '../hooks/useSettings';
import { Header } from '../components/Header';
import { BottomSheet } from '../components/BottomSheet';
import { qualityHeadline } from '../utils/classifier';
import { formatDate, formatMbps } from '../utils/format';
import './StartScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  device: DeviceInfo | null;
  server: ServerInfo | null;
  loading: boolean;
  error: string | null;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onStart: (mode: SpeedTestMode) => void;
  onStartComparison: () => void;
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
  settings,
  onUpdateSettings,
  onStart,
  onStartComparison,
  onRetry,
  lastRecord,
  onShowLastResult,
  onShowHistory,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const canStart = !loading && !!server?.available && !!device;
  const unitLabel = settings.unit === 'gbps' ? 'Gbps' : 'Mbps';

  return (
    <div className="lk-start">
      <Header theme={theme} onToggleTheme={onToggleTheme} />

      <main className="lk-start__main">
        {error ? (
          <div className="lk-start__error" role="alert">
            <span>⚠ {error}</span>
            <button className="btn-text" onClick={onRetry}>Tentar novamente</button>
          </div>
        ) : null}

        <button
          className={`lk-start__cta${canStart ? ' lk-start__cta--ready' : ''}`}
          onClick={() => onStart('quick')}
          disabled={!canStart}
          aria-label="Iniciar teste rápido"
        >
          <span className="lk-start__cta-label">
            {loading ? 'Aguardando…' : 'Iniciar'}
          </span>
        </button>

        <p className="lk-start__cta-hint">Usa ~80 MB · Resultado em ~30 s</p>

        <div className="lk-start__modes">
          <button
            className={`lk-start__mode-btn lk-start__mode-btn--secondary${canStart ? ' lk-start__mode-btn--ready' : ''}`}
            onClick={() => onStart('complete')}
            disabled={!canStart}
            aria-label="Iniciar teste completo"
          >
            <span className="lk-start__mode-title">Teste completo</span>
            <span className="lk-start__mode-desc">Mais preciso · ~400 MB no Wi-Fi</span>
          </button>

          <button
            className="lk-start__mode-btn lk-start__mode-btn--compare"
            onClick={onStartComparison}
            disabled={!canStart}
            aria-label="Comparar locais"
          >
            <span className="lk-start__mode-title">Comparar locais</span>
            <span className="lk-start__mode-desc">Descubra se o problema é o Wi-Fi ou a operadora</span>
          </button>
        </div>

        {lastRecord && (
          <div className="lk-start__last">
            <button
              className="lk-start__last-card"
              onClick={onShowLastResult}
              aria-label="Ver último resultado"
            >
              <span className="lk-start__last-label">Último teste · {formatDate(lastRecord.timestamp)}</span>
              <span className="lk-start__last-metrics">
                <span className="lk-start__last-dl">↓ {formatMbps(lastRecord.dl, settings.unit)}</span>
                <span className="lk-start__last-ul">↑ {formatMbps(lastRecord.ul, settings.unit)} {unitLabel}</span>
              </span>
              <span className="lk-start__last-quality">{qualityHeadline(lastRecord.quality)}</span>
            </button>
            <button className="btn-text lk-start__history-link" onClick={onShowHistory}>
              Ver histórico
            </button>
          </div>
        )}

        {!lastRecord && (
          <button className="btn-text lk-start__history-link" onClick={onShowHistory}>
            Ver histórico
          </button>
        )}
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
