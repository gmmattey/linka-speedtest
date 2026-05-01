import { useState } from 'react';
import type { DeviceInfo, ServerInfo, TestRecord } from '../types';
import type { Settings } from '../hooks/useSettings';
import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
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
  onStart: (mode: 'fast' | 'complete') => void;
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
  onRetry,
  lastRecord,
  onShowLastResult,
  onShowHistory,
}: Props) {
  const [selectedMode, setSelectedMode] = useState<'fast' | 'complete'>(settings.defaultMode ?? 'complete');

  const handleModeChange = (mode: 'fast' | 'complete') => {
    setSelectedMode(mode);
    onUpdateSettings({ defaultMode: mode });
  };

  const canStart = isOnline && !loading && !!server?.available && !!device;
  const unitLabel = settings.unit === 'gbps' ? 'Gbps' : 'Mbps';

  const connectionLabel = (() => {
    if (!device) return null;
    const type = device.connectionType;
    if (type === 'wifi') return 'Wi-Fi';
    if (type === 'mobile') return 'Dados móveis';
    return 'Cabo';
  })();

  const connectionSub = (() => {
    if (!isOnline) return 'Sem conexão';
    if (loading) return 'Detectando…';
    return 'Conectado';
  })();

  const serverLabel = server?.name ?? 'Detectando servidor…';
  const serverSub = server?.loc ? server.loc : 'Servidor mais próximo';

  return (
    <div className="lk-start" data-theme={theme}>
      {/* Cabeçalho mínimo */}
      <div className="lk-start__topbar">
        <span className="lk-start__logo">
          li<span style={{ color: 'var(--accent)' }}>n</span>ka
        </span>
        <button
          className="lk-start__topbar-btn"
          onClick={onShowHistory}
          aria-label="Ver histórico"
        >
          <Icon name="history" size={20} color="var(--text-2)" />
        </button>
      </div>

      {/* Alerta de erro */}
      {!isOnline && (
        <div className="lk-start__alert" role="alert">
          Sem conexão. Conecte-se à internet para medir.
        </div>
      )}
      {isOnline && error && (
        <div className="lk-start__alert" role="alert">
          {error}
          <button className="btn-text" style={{ fontSize: 12 }} onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Núcleo centralizado */}
      <div className="lk-start__body">
        {/* Orb pulsante */}
        <button
          className={`lk-start__orb${!canStart ? ' lk-start__orb--disabled' : ''}`}
          onClick={() => onStart(selectedMode)}
          disabled={!canStart}
          aria-label="Iniciar teste"
        >
          <span className="lk-start__orb-label">
            {loading ? 'Aguardando' : 'Iniciar'}
          </span>
        </button>

        {/* Seletor de modo */}
        <div className="lk-start__mode-toggle">
          <button
            className={`lk-start__mode-btn${selectedMode === 'fast' ? ' lk-start__mode-btn--active' : ''}`}
            onClick={() => handleModeChange('fast')}
          >
            Rápido
          </button>
          <button
            className={`lk-start__mode-btn${selectedMode === 'complete' ? ' lk-start__mode-btn--active' : ''}`}
            onClick={() => handleModeChange('complete')}
          >
            Completo
          </button>
        </div>

        {/* Linhas de info */}
        <div className="lk-start__info">
          {selectedMode === 'fast' ? (
            <>
              <div>Download, upload e ping · ~30s · bufferbloat integrado</div>
            </>
          ) : (
            <>
              <div>Diagnóstico detalhado com paralelismo progressivo · ~60s · recomendamos Wi-Fi</div>
            </>
          )}
          {server && <div>{serverLabel}</div>}
        </div>
      </div>

      {/* Último resultado */}
      {lastRecord && (
        <div className="lk-start__last">
          <button className="lk-start__last-card" onClick={onShowLastResult}>
            <span className="lk-start__last-label">Último resultado</span>
            <span className="lk-start__last-values">
              <span style={{ color: 'var(--dl)' }}>↓ {formatMbps(lastRecord.dl, settings.unit)}</span>
              {' · '}
              <span style={{ color: 'var(--ul)' }}>↑ {formatMbps(lastRecord.ul, settings.unit)}</span>
              {' '}
              <span style={{ color: 'var(--text-2)' }}>{unitLabel}</span>
            </span>
          </button>
        </div>
      )}

      {/* Lista iOS com conexão e servidor */}
      {(device || server) && (
        <div className="lk-start__list">
          <IOSList
            items={[
              ...(device ? [{
                icon: <Icon name={device.connectionType === 'wifi' ? 'wifi' : device.connectionType === 'mobile' ? 'ping' : 'router'} size={14} color="#fff" />,
                iconBg: 'var(--info)',
                title: connectionLabel ?? 'Conexão',
                subtitle: connectionSub,
              }] : []),
              ...(server ? [{
                icon: <Icon name="pin" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: serverLabel,
                subtitle: serverSub,
              }] : []),
            ]}
          />
        </div>
      )}

      {/* Tema toggle */}
      <div className="lk-start__theme">
        <div className="lk-start__theme-toggle">
          <button
            className={`lk-start__theme-btn${theme === 'light' ? ' lk-start__theme-btn--active' : ''}`}
            onClick={() => theme !== 'light' && onToggleTheme()}
          >
            Light
          </button>
          <button
            className={`lk-start__theme-btn${theme === 'dark' ? ' lk-start__theme-btn--active' : ''}`}
            onClick={() => theme !== 'dark' && onToggleTheme()}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Dica de rodapé */}
      <div className="lk-start__hint">Toque no círculo</div>
    </div>
  );
}
