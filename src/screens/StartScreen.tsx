import { useCallback, useRef, useState } from 'react';
import type { DeviceInfo, ServerInfo, TestRecord } from '../types';
import type { Settings } from '../hooks/useSettings';
import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import { TopBar } from '../components/TopBar';
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator';
import { useScrollHeader } from '../hooks/useScrollHeader';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { resolveCopy } from '../core';
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
  onExplore?: () => void;
  /**
   * Callback do pull-to-refresh. Recebe `performAppRefresh` já
   * pré-amarrado com `deviceInfo.reload` em App.tsx. Quando ausente, o
   * gesto fica visualmente desabilitado (hook `enabled: false`).
   */
  onRefresh?: () => Promise<void>;
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
  onExplore,
  onRefresh,
}: Props) {
  const [selectedMode, setSelectedMode] = useState<'fast' | 'complete'>(settings.defaultMode ?? 'complete');

  // Bloco 6 — UX uniforme (2026-05): sentinel sintético para o
  // useScrollHeader. A StartScreen não tem `<PageHeader>`, então o
  // hook não tinha alvo. Hoje fica idêntico (sem rolagem, sem glass);
  // se a tela ganhar conteúdo no futuro, o glass passa a aparecer.
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  // Pull-to-refresh universal (2026-05). `useScrollHeader` expõe um
  // callback ref; `usePullToRefresh` consome um RefObject. Mantemos uma
  // RefObject local e um callback ref combinado que atualiza ambos.
  const ptrContainerRef = useRef<HTMLElement | null>(null);
  const setScrollContainer = useCallback((el: HTMLElement | null) => {
    ptrContainerRef.current = el;
    scrollContainerRef(el);
  }, [scrollContainerRef]);
  const noopRefresh = useCallback(() => Promise.resolve(), []);
  const ptr = usePullToRefresh(
    ptrContainerRef,
    onRefresh ?? noopRefresh,
    { enabled: !!onRefresh },
  );

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
    <div className="lk-start" data-theme={theme} ref={setScrollContainer}>
      {/* Pull-to-refresh (2026-05): pill flutuante abaixo do TopBar. Só
          renderiza quando o gesto está armado pelo usuário. */}
      <PullToRefreshIndicator
        pullDistance={ptr.pullDistance}
        isRefreshing={ptr.isRefreshing}
        isReady={ptr.isReady}
      />
      {/* Bloco 6 — UX uniforme (2026-05): sentinel sintético posicionado
          logo abaixo da altura do TopBar. No-op visual hoje (a tela
          não rola), mas mantém o useScrollHeader funcional caso a tela
          ganhe conteúdo no futuro. */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="lk-start__sentinel"
      />
      {/* Bloco 5 — TopBar System (2026-05): logo à esquerda no leftSlot,
          ícone histórico no rightActions. Sem PageHeader — o orb pulsante
          central já é o hero da tela. */}
      <TopBar
        scrolled={scrolled}
        leftSlot={
          <span className="lk-start__logo">
            li<span style={{ color: 'var(--accent)' }}>n</span>ka
          </span>
        }
        rightActions={[{
          icon: <Icon name="history" size={18} color="var(--text-2)" />,
          onClick: onShowHistory,
          ariaLabel: 'Ver histórico',
        }]}
      />

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
              <div>Download, upload e resposta · cerca de 30s</div>
            </>
          ) : (
            <>
              <div>Teste mais completo para entender estabilidade · cerca de 60s</div>
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

      {/* Acesso discreto a Explorar */}
      {onExplore && (
        <div className="lk-start__explore">
          <button className="lk-start__explore-btn btn-text" onClick={onExplore}>
            <Icon name="cog" size={14} color="var(--accent)" />
            <span>Explorar ferramentas</span>
            <Icon name="chevron" size={12} color="var(--text-3)" />
          </button>
        </div>
      )}

      {/* Lista iOS com conexão e servidor */}
      {(device || server) && (
        <div className="lk-start__list">
          <IOSList
            items={[
              ...(device ? [{
                icon: <Icon name={device.connectionType === 'wifi' ? 'wifi' : device.connectionType === 'mobile' ? 'cellular' : 'router'} size={14} color="#fff" />,
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
            {resolveCopy('theme.light')}
          </button>
          <button
            className={`lk-start__theme-btn${theme === 'dark' ? ' lk-start__theme-btn--active' : ''}`}
            onClick={() => theme !== 'dark' && onToggleTheme()}
          >
            {resolveCopy('theme.dark')}
          </button>
        </div>
      </div>

      {/* Dica de rodapé */}
      <div className="lk-start__hint">Toque no círculo</div>
    </div>
  );
}
