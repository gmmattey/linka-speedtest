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
  const isMobile = (settings.connectionOverride !== 'auto'
    ? settings.connectionOverride
    : (device?.connectionType ?? 'wifi')) === 'mobile';

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

        <p className="lk-start__tagline">
          Descubra se sua internet está pronta para o que você precisa.
        </p>

        <div className="lk-start__modes">
          <div className="lk-start__cta-group">
            <button
              className={`lk-start__mode-btn lk-start__mode-btn--cta${canStart ? ' lk-start__mode-btn--ready' : ''}`}
              onClick={() => onStart('quick')}
              disabled={!canStart}
              aria-label="Iniciar teste"
            >
              <span className="lk-start__mode-title">
                {loading ? 'Verificando…' : 'Iniciar teste'}
              </span>
            </button>
            <p className="lk-start__cta-desc">
              {isMobile
                ? 'Teste rápido · usa cerca de 80 MB de dados móveis'
                : 'Teste rápido · usa cerca de 80 MB · resultado em ~30 segundos'}
            </p>
          </div>

          <button
            className={`lk-start__mode-btn lk-start__mode-btn--secondary${canStart ? ' lk-start__mode-btn--ready' : ''}`}
            onClick={() => onStart('complete')}
            disabled={!canStart}
            aria-label="Iniciar teste completo"
          >
            <span className="lk-start__mode-title">Teste completo (mais preciso)</span>
            <span className="lk-start__mode-desc">~400 MB · recomendado no Wi-Fi ou cabo</span>
          </button>

          <button
            className={`lk-start__mode-btn lk-start__mode-btn--compare${canStart ? ' lk-start__mode-btn--ready' : ''}`}
            onClick={onStartComparison}
            disabled={!canStart}
            aria-label="Comparar Wi-Fi com operadora"
          >
            <span className="lk-start__mode-title">Wi-Fi ou operadora?</span>
            <span className="lk-start__mode-desc">Compare perto e longe do roteador e descubra onde está o problema.</span>
          </button>
        </div>

        <div className="lk-start__status" aria-live="polite">
          {loading || !server ? (
            <span>Verificando conexão…</span>
          ) : server.available ? (
            <>
              <span className="lk-start__status-dot lk-start__status-dot--ok" aria-hidden="true" />
              <span>Conectado · {server.name}</span>
            </>
          ) : (
            <>
              <span className="lk-start__status-dot lk-start__status-dot--err" aria-hidden="true" />
              <span>Servidor indisponível</span>
            </>
          )}
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

        <p className="lk-start__privacy">Seus resultados ficam salvos só neste aparelho.</p>
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
