import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PulseScreen } from './screens/PulseScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SpeedTestScreen } from './screens/SpeedTestScreen';
import { usePulseDiagnosis } from './hooks/usePulseDiagnosis';
import { RunningScreen } from './screens/RunningScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { BottomNavBar } from './components/BottomNavBar';
import type { NavTab } from './components/BottomNavBar';
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt';
import { Skeleton } from './components/Skeleton';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { useSpeedTest } from './hooks/useSpeedTest';
import { useSettings } from './hooks/useSettings';
import { appendRecord, previousRecord, recordToResult } from './utils/history';
import { performAppRefresh } from './utils/appRefresh';
import { getCapabilities } from './platform/capabilities';
import {
  parseWifiCallback,
  savePendingWifiContext,
  consumePendingWifiContext,
  runWifiShortcut,
  generateSessionId,
} from './features/ios-wifi-context/wifiShortcut';
import type { TestRecord, WifiContext } from './types';

// Code splitting: telas secundárias vão em chunks separados via React.lazy.
// HomeScreen/RunningScreen/ResultScreen/HistoryScreen permanecem eager —
// são o caminho principal do app. PulseScreen/OrbitScreen também eager.
const ExploreScreen = lazy(() =>
  import('./screens/ExploreScreen').then((m) => ({ default: m.ExploreScreen })),
);
const LocalWifiScreen = lazy(() =>
  import('./features/local-wifi/LocalWifiScreen').then((m) => ({ default: m.LocalWifiScreen })),
);
const LocalNetworkScreen = lazy(() =>
  import('./features/local-network/LocalNetworkScreen').then((m) => ({ default: m.LocalNetworkScreen })),
);
const FibraScreen = lazy(() =>
  import('./screens/FibraScreen').then((m) => ({ default: m.FibraScreen })),
);
const OnboardingScreen = lazy(() =>
  import('./screens/OnboardingScreen').then((m) => ({ default: m.OnboardingScreen })),
);

// Telas com nome alinhado ao Kotlin. Rotas de abas principais:
//   home | velocidade | orbit | dispositivos | ajustes
// Rotas de sub-telas (empilhadas):
//   running | result | historico | sinal
type Screen =
  | 'home'
  | 'velocidade'
  | 'running'
  | 'result'
  | 'historico'
  | 'orbit'
  | 'ajustes'
  | 'sinal'
  | 'dispositivos'
  | 'fibra';

// Mapeamento de tela → aba ativa no BottomNavBar.
// Sub-telas mantêm a aba da origem destacada (padrão MD3).
const TAB_MAP: Partial<Record<Screen, NavTab>> = {
  home:         'home',
  velocidade:   'velocidade',
  historico:    'home',
  orbit:        'diagnostico',
  sinal:        'home',
  dispositivos: 'dispositivos',
  fibra:        'ajustes',
  ajustes:      'ajustes',
};

// Telas em que o BottomNavBar fica oculto (fluxo de teste)
const HIDE_NAVBAR: Screen[] = ['running', 'result'];

const THEME_KEY = 'linka.speedtest.theme';
const ONBOARDING_KEY = 'linka.onboarding.done';
const SWIPE_THRESHOLD_PX = 80;
const SWIPE_AXIS_RATIO = 1.5;

function readInitialTheme(): 'dark' | 'light' {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch { /* ignore */ }
  return 'dark';
}

function readOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch { /* ignore */ }
  return false;
}

export default function App() {
  // Contexto Wi-Fi via Atalho iOS (2026-05): persiste entre o callback de
  // retorno do atalho e a conclusão do próximo teste.
  const pendingWifiContextRef = useRef<WifiContext | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(readInitialTheme);
  const [onboardingDone, setOnboardingDone] = useState<boolean>(readOnboardingDone);
  const { settings, update: updateSettings } = useSettings();
  const [screen, setScreen] = useState<Screen>(() => previousRecord() ? 'result' : 'home');
  const [previous, setPrevious] = useState<TestRecord | null>(null);
  const [lastRecord, setLastRecord] = useState<TestRecord | null>(() => previousRecord());
  const [historyInitialId, setHistoryInitialId] = useState<string | undefined>(undefined);
  const [testMode, setTestMode] = useState<'fast' | 'complete'>(() => {
    try {
      const raw = localStorage.getItem('linka.speedtest.settings.v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { defaultMode?: string };
        if (parsed.defaultMode === 'fast' || parsed.defaultMode === 'complete') return parsed.defaultMode;
      }
    } catch { /* ignore */ }
    return 'complete';
  });

  const recordedRef = useRef(false);
  const runStartTimeRef = useRef<number>(0);
  const backStackRef = useRef<Screen[]>([]);
  const forwardStackRef = useRef<Screen[]>([]);
  const screenRef = useRef<Screen>('home');

  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const deviceInfo = useDeviceInfo('cloudflare');
  const test = useSpeedTest();

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Contexto Wi-Fi via Atalho iOS (2026-05): detecta retorno do atalho na URL.
  // Roda apenas uma vez no mount — o atalho abre a returnUrl com query string.
  // Limpa a URL para não re-processar em refreshes e guarda em sessionStorage
  // para sobreviver a uma re-renderização (caso o iOS abra no Safari).
  useEffect(() => {
    const { pathname, search } = window.location;
    const isCallback = pathname === '/wifi-callback' || search.includes('sid=');
    if (!isCallback) {
      // Também tenta consumir um contexto salvo de uma sessão anterior
      const saved = consumePendingWifiContext();
      if (saved) pendingWifiContextRef.current = saved;
      return;
    }
    const ctx = parseWifiCallback(search);
    if (ctx) {
      pendingWifiContextRef.current = ctx;
      savePendingWifiContext(ctx);
    }
    // Limpa a URL sem recarregar a página
    window.history.replaceState({}, '', '/');
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => { screenRef.current = screen; }, [screen]);

  const onToggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const goTo = useCallback((next: Screen) => {
    setScreen((cur) => {
      if (cur !== next) backStackRef.current.push(cur);
      forwardStackRef.current = [];
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setScreen((cur) => {
      const prev = backStackRef.current.pop();
      if (!prev) return cur;
      forwardStackRef.current.push(cur);
      return prev;
    });
  }, []);

  const goForward = useCallback(() => {
    setScreen((cur) => {
      const next = forwardStackRef.current.pop();
      if (!next) return cur;
      backStackRef.current.push(cur);
      return next;
    });
  }, []);

  // Navegação por abas do BottomNavBar
  const handleNavTab = useCallback((tab: NavTab) => {
    const target: Screen = tab === 'home' ? 'home'
      : tab === 'velocidade' ? 'velocidade'
      : tab === 'diagnostico' ? 'orbit'
      : tab === 'dispositivos' ? 'dispositivos'
      : 'ajustes';
    backStackRef.current = [];
    forwardStackRef.current = [];
    setScreen(target);
  }, []);

  // Registra o instante em que o download começa
  useEffect(() => {
    if (test.phase === 'download') {
      runStartTimeRef.current = Date.now();
    }
  }, [test.phase]);

  // Refresh de deviceInfo no início de cada teste
  const deviceInfoReloadRef = useRef(deviceInfo.reload);
  useEffect(() => { deviceInfoReloadRef.current = deviceInfo.reload; }, [deviceInfo.reload]);
  useEffect(() => {
    if (test.phase === 'latency') {
      deviceInfoReloadRef.current();
    }
  }, [test.phase]);

  useEffect(() => {
    if (!(
      test.phase === 'done' &&
      test.result &&
      !recordedRef.current &&
      deviceInfo.device &&
      deviceInfo.server
    )) return;

    recordedRef.current = true;

    const proceed = () => {
      const prev = previousRecord();
      setPrevious(prev);
      const wifiCtxNormal = pendingWifiContextRef.current;
      pendingWifiContextRef.current = null;
      if (wifiCtxNormal) test.result!.wifiContext = wifiCtxNormal;
      const newRecord = appendRecord(test.result!, {
        serverName: deviceInfo.server!.name,
        isp: deviceInfo.server!.isp,
        deviceType: deviceInfo.device!.deviceType,
        connectionType: deviceInfo.device!.connectionType,
        testMode,
      });
      setLastRecord(newRecord);
      goTo('result');
    };

    const elapsed = Date.now() - runStartTimeRef.current;
    const remaining = Math.max(0, 10_000 - elapsed);

    if (remaining <= 0) {
      proceed();
      return;
    }

    const timer = setTimeout(proceed, remaining);
    return () => clearTimeout(timer);
  }, [test, test.phase, test.result, deviceInfo.device, deviceInfo.server, goTo, testMode]);

  const effectiveConnection = settings.connectionOverride !== 'auto'
    ? settings.connectionOverride
    : deviceInfo.device?.connectionType;

  const handleStart = useCallback((mode: 'fast' | 'complete') => {
    setTestMode(mode);
    updateSettings({ defaultMode: mode });
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, mode);
  }, [test, effectiveConnection, goTo, updateSettings]);

  const handleCancel = useCallback(() => {
    test.cancel();
    test.reset();
    goTo(lastRecord ? 'result' : 'home');
  }, [test, goTo, lastRecord]);

  const handleRetry = useCallback(() => {
    test.reset();
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, testMode);
  }, [test, effectiveConnection, testMode, goTo]);

  const handleShowHistory = useCallback(() => {
    setHistoryInitialId(undefined);
    goTo('historico');
  }, [goTo]);

  const handleOpenOrbit = useCallback(() => goTo('orbit'), [goTo]);
  const handleShowSinal = useCallback(() => goTo('sinal'), [goTo]);
  // goTo('dispositivos') available via TAB_MAP navigation
  const handleOpenAjustes = useCallback(() => goTo('ajustes'), [goTo]);
  const handleShowFibra = useCallback(() => goTo('fibra'), [goTo]);

  const goToReturnTarget = useCallback(() => {
    forwardStackRef.current = [];
    setScreen('home');
  }, []);

  const pulse = usePulseDiagnosis(deviceInfo.device?.connectionType ?? 'unknown');

  const handleOpenWifiShortcut = useCallback(() => {
    const sessionId = generateSessionId();
    runWifiShortcut(sessionId);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
    setOnboardingDone(true);
  }, []);
  const handleResetOnboarding = useCallback(() => {
    try { localStorage.removeItem(ONBOARDING_KEY); } catch { /* ignore */ }
    setOnboardingDone(false);
  }, []);

  const handleAppRefresh = useCallback(
    () => performAppRefresh({ reloadDeviceInfo: deviceInfo.reload }),
    [deviceInfo.reload],
  );

  const capabilities = useMemo(() => getCapabilities(), []);

  // ── Swipe lateral (back/forward) ─────────────────────────
  const swipeStartRef = useRef<{ x: number; y: number; valid: boolean } | null>(null);

  const isInteractive = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return !!target.closest('.lk-sheet, .lk-history__list, .lk-navbar, button, input, textarea, a');
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStartRef.current = { x: t.clientX, y: t.clientY, valid: !isInteractive(e.target) };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || !start.valid) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) return;
    if (dx > 0) goBack();
    else goForward();
  };

  const activeTab: NavTab | null = TAB_MAP[screen] ?? null;
  const showNavBar = !HIDE_NAVBAR.includes(screen);

  const view = useMemo(() => {
    switch (screen) {
      case 'velocidade':
        return (
          <SpeedTestScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            onStart={handleStart}
            onOpenDiagnostico={handleOpenOrbit}
            lastRecord={lastRecord}
            device={deviceInfo.device}
            server={deviceInfo.server}
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        );
      case 'running': {
        return (
          <RunningScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            phase={test.phase}
            instantMbps={test.instantMbps}
            overallProgress={test.overallProgress}
            onCancel={handleCancel}
            onRetry={handleRetry}
            unit={settings.unit}
            mode={testMode}
            live={test.live}
            server={deviceInfo.server}
            useHaptics={settings.useHaptics}
          />
        );
      }
      case 'result': {
        const resultToShow = test.result ?? (lastRecord ? recordToResult(lastRecord) : null);
        const serverForResult: typeof deviceInfo.server = test.result
          ? deviceInfo.server
          : lastRecord
          ? { id: 'cloudflare', name: lastRecord.serverName, ip: '—', colo: '—', loc: '—', isp: lastRecord.isp ?? '—', available: true }
          : deviceInfo.server;
        return resultToShow ? (
          <ResultScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            result={resultToShow}
            server={serverForResult}
            previous={previous}
            onRetry={handleRetry}
            onBack={() => goTo('home')}
            unit={settings.unit}
            hideIpOnShare={settings.hideIpOnShare}
            gamingProfile={settings.gamingProfile}
            connectionType={deviceInfo.device?.connectionType ?? null}
            contractedDown={settings.contractedDown}
            contractedUp={settings.contractedUp}
            onUpdateContracted={(down, up) => updateSettings({ contractedDown: down, contractedUp: up })}
            useHaptics={settings.useHaptics}
            onToggleHaptics={(next) => updateSettings({ useHaptics: next })}
            onStartRoomTest={() => {}}
            onExplore={handleOpenAjustes}
          />
        ) : null;
      }
      case 'ajustes':
        return (
          <ExploreScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            settings={settings}
            onUpdateSettings={updateSettings}
            onBack={goBack}
            onShowHistory={handleShowHistory}
            onResetOnboarding={handleResetOnboarding}
            onShowFibra={handleShowFibra}
          />
        );
      case 'sinal':
        return <LocalWifiScreen onBack={goBack} />;
      case 'dispositivos':
        return <LocalNetworkScreen onBack={goBack} />;
      case 'fibra':
        return <FibraScreen onBack={goBack} />;
      case 'orbit':
        return (
          <PulseScreen
            phase={pulse.phase}
            mensagem={pulse.mensagem}
            error={pulse.error}
            session={pulse.session}
            onIniciar={pulse.iniciar}
            onSelecionarChip={pulse.selecionarChip}
            onResponderPergunta={pulse.responderPergunta}
            onVoltar={goBack}
          />
        );
      case 'historico':
        return (
          <HistoryScreen
            theme={theme}
            unit={settings.unit}
            initialSelectedId={historyInitialId}
            onBack={goToReturnTarget}
            onRefresh={handleAppRefresh}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            theme={theme}
            device={deviceInfo.device}
            server={deviceInfo.server}
            loading={deviceInfo.loading}
            error={deviceInfo.error}
            isOnline={isOnline}
            settings={settings}
            onRetry={deviceInfo.reload}
            lastRecord={lastRecord}
            onShowHistory={handleShowHistory}
            onNavigateToSpeedTest={() => handleNavTab('velocidade')}
            onNavigateToAjustes={() => handleNavTab('ajustes')}
            onOpenOrbit={handleOpenOrbit}
            onShowSinal={capabilities.localWifiDiagnostics ? handleShowSinal : undefined}
            onRefresh={handleAppRefresh}
          />
        );
    }
  }, [
    screen, theme, onToggleTheme, isOnline,
    test.phase, test.instantMbps, test.result,
    deviceInfo,
    previous, lastRecord, historyInitialId,
    handleStart, handleCancel, handleRetry, handleShowHistory, handleNavTab,
    handleOpenOrbit, handleShowSinal, handleOpenAjustes, handleShowFibra,
    handleOpenWifiShortcut,
    pulse,
    handleAppRefresh, handleResetOnboarding,
    goBack, goToReturnTarget,
    capabilities.localWifiDiagnostics, capabilities.localNetworkDiscovery,
    settings, updateSettings, testMode,
  ]);

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <a className="lk-skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <div key={screen} className="screen-enter" id="main-content">
        <Suspense fallback={<ScreenLoadingFallback />}>{view}</Suspense>
      </div>
      {!onboardingDone && (
        <Suspense fallback={null}>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </Suspense>
      )}
      {showNavBar && activeTab && (
        <BottomNavBar active={activeTab} onNavigate={handleNavTab} />
      )}
      <PwaUpdatePrompt />
    </div>
  );
}

function ScreenLoadingFallback() {
  return (
    <div
      style={{
        height: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'calc(var(--safe-top, 0px) + 12px) 16px 16px',
        gap: 16,
      }}
      role="status"
      aria-live="polite"
      aria-label="Carregando tela"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={36} height={36} variant="circle" />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Skeleton width={140} height={16} variant="pill" />
        </div>
        <Skeleton width={36} height={36} variant="circle" />
      </div>
      <div style={{ height: 8 }} />
      <Skeleton width="100%" height={80} />
      <Skeleton width="100%" height={60} />
    </div>
  );
}
