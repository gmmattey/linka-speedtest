import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StartScreen } from './screens/StartScreen';
import { RunningScreen } from './screens/RunningScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ComparisonScreen, type ComparisonStep } from './screens/ComparisonScreen';
import { BeforeAfterScreen, type BeforeAfterStep } from './screens/BeforeAfterScreen';
import { RoomTestScreen } from './screens/RoomTestScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { LocalWifiScreen } from './features/local-wifi/LocalWifiScreen';
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { useSpeedTest } from './hooks/useSpeedTest';
import { useSettings } from './hooks/useSettings';
import { appendRecord, previousRecord, recordToResult } from './utils/history';
import { averageSpeedResults } from './utils/provaReal';
import { getCapabilities } from './platform/capabilities';
import type { SpeedTestResult, TestRecord } from './types';

// Refator 2026-05: 6 telas consolidadas no ResultScreen / removidas:
//   diagnostic / recommend / gamer / dnsbenchmark / dnsguide / details.
// Diagnóstico virou card no Result; gamer/details/dns viraram accordions
// na section "Mais detalhes"; o guia de DNS virou bottom sheet. Os IDs
// abaixo refletem apenas as rotas vivas.
type Screen = 'start' | 'running' | 'result' | 'history' | 'comparison' | 'beforeafter' | 'roomtest' | 'explore' | 'localwifi';

const THEME_KEY = 'linka.speedtest.theme';
const SWIPE_THRESHOLD_PX = 80;
const SWIPE_AXIS_RATIO = 1.5;

function readInitialTheme(): 'dark' | 'light' {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch { /* ignore */ }
  return 'dark';
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(readInitialTheme);
  const { settings, update: updateSettings } = useSettings();
  const [screen, setScreen] = useState<Screen>(() => previousRecord() ? 'result' : 'start');
  const [previous, setPrevious] = useState<TestRecord | null>(null);
  const [lastRecord, setLastRecord] = useState<TestRecord | null>(() => previousRecord());
  const [historyInitialId, setHistoryInitialId] = useState<string | undefined>(undefined);
  const [testMode, setTestMode] = useState<'fast' | 'complete'>(() => {
    // Lê o defaultMode salvo nas settings de forma síncrona
    try {
      const raw = localStorage.getItem('linka.speedtest.settings.v1');
      if (raw) {
        const parsed = JSON.parse(raw) as { defaultMode?: string };
        if (parsed.defaultMode === 'fast' || parsed.defaultMode === 'complete') return parsed.defaultMode;
      }
    } catch { /* ignore */ }
    return 'complete';
  });
  const [comparisonStep, setComparisonStep] = useState<ComparisonStep>('near');
  const [comparisonNear, setComparisonNear] = useState<SpeedTestResult | null>(null);
  const [comparisonFar, setComparisonFar] = useState<SpeedTestResult | null>(null);
  const comparisonModeRef = useRef<'near' | 'far' | null>(null);
  const [baStep, setBaStep] = useState<BeforeAfterStep>('before');
  const [baBefore, setBaBefore] = useState<SpeedTestResult | null>(null);
  const [baAfter, setBaAfter] = useState<SpeedTestResult | null>(null);
  const baModeRef = useRef<'before' | 'after' | null>(null);
  const [provaRealSession, setProvaRealSession] = useState<number | null>(null); // 1 | 2 | 3 | null
  const [provaRealOverride, setProvaRealOverride] = useState<SpeedTestResult | null>(null);
  const provaRealResultsRef = useRef<SpeedTestResult[]>([]);
  const provaRealPendingRef = useRef(false);
  const locationTagRef = useRef<string | null>(null);
  const recordedRef = useRef(false);
  const runStartTimeRef = useRef<number>(0);
  const backStackRef = useRef<Screen[]>([]);
  const forwardStackRef = useRef<Screen[]>([]);
  const returnToRef = useRef<Screen>('result');
  const screenRef = useRef<Screen>('start');

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

  const goToReturnTarget = useCallback(() => {
    forwardStackRef.current = [];
    setScreen(returnToRef.current);
  }, []);

  // Registra o instante em que o download começa (início real da medição).
  useEffect(() => {
    if (test.phase === 'download') {
      runStartTimeRef.current = Date.now();
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
      // ── Prova Real: acumula resultados intermediários sem registrar ──
      if (provaRealSession !== null) {
        provaRealResultsRef.current.push(test.result!);
        if (provaRealSession < 3) {
          setProvaRealSession(provaRealSession + 1);
          recordedRef.current = false;
          provaRealPendingRef.current = true;
          test.reset();
        } else {
          const averaged = averageSpeedResults(provaRealResultsRef.current);
          provaRealResultsRef.current = [];
          setProvaRealSession(null);
          const prev = previousRecord();
          setPrevious(prev);
          const newRecord = appendRecord(averaged, {
            serverName: deviceInfo.server!.name,
            isp: deviceInfo.server!.isp,
            deviceType: deviceInfo.device!.deviceType,
            connectionType: deviceInfo.device!.connectionType,
            testMode: 'complete',
            locationTag: locationTagRef.current ?? undefined,
          });
          locationTagRef.current = null;
          setLastRecord(newRecord);
          setProvaRealOverride(averaged);
          goTo('result');
        }
        return;
      }

      // ── Fluxo normal ─────────────────────────────────────────────────
      const prev = previousRecord();
      setPrevious(prev);
      const newRecord = appendRecord(test.result!, {
        serverName: deviceInfo.server!.name,
        isp: deviceInfo.server!.isp,
        deviceType: deviceInfo.device!.deviceType,
        connectionType: deviceInfo.device!.connectionType,
        testMode,
        locationTag: locationTagRef.current ?? undefined,
      });
      locationTagRef.current = null;
      setLastRecord(newRecord);

      const cmpMode = comparisonModeRef.current;
      if (cmpMode === 'near') {
        setComparisonNear(test.result!);
        setComparisonStep('far');
        comparisonModeRef.current = null;
        goTo('comparison');
      } else if (cmpMode === 'far') {
        setComparisonFar(test.result!);
        setComparisonStep('done');
        comparisonModeRef.current = null;
        goTo('comparison');
      } else if (baModeRef.current === 'before') {
        setBaBefore(test.result!);
        setBaStep('after');
        baModeRef.current = null;
        goTo('beforeafter');
      } else if (baModeRef.current === 'after') {
        setBaAfter(test.result!);
        setBaStep('done');
        baModeRef.current = null;
        goTo('beforeafter');
      } else {
        goTo('result');
      }
    };

    const elapsed = Date.now() - runStartTimeRef.current;
    const remaining = Math.max(0, 10_000 - elapsed);

    if (remaining <= 0) {
      proceed();
      return;
    }

    const timer = setTimeout(proceed, remaining);
    return () => clearTimeout(timer);
  }, [test, test.phase, test.result, deviceInfo.device, deviceInfo.server, goTo, provaRealSession, testMode]);

  const effectiveConnection = settings.connectionOverride !== 'auto'
    ? settings.connectionOverride
    : deviceInfo.device?.connectionType;

  // Dispara o próximo teste da Prova Real quando o reset finaliza
  useEffect(() => {
    if (provaRealPendingRef.current && test.phase === 'idle') {
      provaRealPendingRef.current = false;
      test.start(effectiveConnection, 'complete');
    }
  }, [test.phase, test, effectiveConnection]);

  const handleStart = useCallback((mode: 'fast' | 'complete') => {
    setTestMode(mode);
    updateSettings({ defaultMode: mode });
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, mode);
  }, [test, effectiveConnection, goTo, updateSettings]);

  const handleCancel = useCallback(() => {
    provaRealResultsRef.current = [];
    provaRealPendingRef.current = false;
    setProvaRealSession(null);
    test.cancel();
    test.reset();
    goTo(lastRecord ? 'result' : 'start');
  }, [test, goTo, lastRecord]);

  const handleRetry = useCallback(() => {
    // Cancela Prova Real se ativa e recomeça como teste normal
    provaRealResultsRef.current = [];
    provaRealPendingRef.current = false;
    setProvaRealSession(null);
    setProvaRealOverride(null);
    test.reset();
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, testMode);
  }, [test, effectiveConnection, testMode, goTo]);

  // handleStartProvaReal — refator 2026-05: a entrada "Prova Real" saiu da
  // ExploreScreen junto com a section "Medir". O handler foi mantido (e o
  // ciclo de vida de provaRealSession/Override/etc. abaixo no efeito de
  // término de teste continua funcional) para o caso da feature ser
  // ressurgida em outra superfície (ex.: StartScreen mode picker). Sem
  // caller atual; remover quando confirmado que a feature foi sepultada.
  const handleStartProvaReal = useCallback(() => {
    provaRealResultsRef.current = [];
    provaRealPendingRef.current = false;
    setProvaRealSession(1);
    setProvaRealOverride(null);
    setTestMode('complete');
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, 'complete');
  }, [test, effectiveConnection, goTo]);
  // Marca explicitamente que o handler é deliberadamente órfão hoje, para
  // que o linter (`@typescript-eslint/no-unused-vars`) não reclame.
  void handleStartProvaReal;

  const handleOpenRoomTest = useCallback(() => {
    returnToRef.current = screenRef.current;
    goTo('roomtest');
  }, [goTo]);

  const handleRoomStart = useCallback((locationTag: string) => {
    locationTagRef.current = locationTag;
    recordedRef.current = false;
    setTestMode('complete');
    goTo('running');
    test.start(effectiveConnection, 'complete');
  }, [test, effectiveConnection, goTo]);

  const handleStartComparison = useCallback(() => {
    returnToRef.current = screenRef.current;
    setComparisonStep('near');
    setComparisonNear(null);
    setComparisonFar(null);
    goTo('comparison');
  }, [goTo]);

  const handleComparisonStartNear = useCallback(() => {
    comparisonModeRef.current = 'near';
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, 'complete');
  }, [test, effectiveConnection, goTo]);

  const handleComparisonStartFar = useCallback(() => {
    comparisonModeRef.current = 'far';
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, 'complete');
  }, [test, effectiveConnection, goTo]);

  const handleComparisonRetryNear = useCallback(() => {
    setComparisonStep('near');
    setComparisonNear(null);
    setComparisonFar(null);
  }, []);

  const handleStartBeforeAfter = useCallback(() => {
    returnToRef.current = screenRef.current;
    setBaStep('before'); setBaBefore(null); setBaAfter(null);
    goTo('beforeafter');
  }, [goTo]);

  const handleBAStartBefore = useCallback(() => {
    baModeRef.current = 'before'; recordedRef.current = false;
    goTo('running'); test.start(effectiveConnection, 'complete');
  }, [test, effectiveConnection, goTo]);

  const handleBAStartAfter = useCallback(() => {
    baModeRef.current = 'after'; recordedRef.current = false;
    goTo('running'); test.start(effectiveConnection, 'complete');
  }, [test, effectiveConnection, goTo]);

  const handleBARetry = useCallback(() => {
    setBaStep('before'); setBaBefore(null); setBaAfter(null);
  }, []);

  const handleShowHistory = useCallback(() => {
    returnToRef.current = screenRef.current;
    setHistoryInitialId(undefined);
    goTo('history');
  }, [goTo]);

  const handleShowLastResult = useCallback(() => {
    if (!lastRecord) return;
    returnToRef.current = screenRef.current;
    setHistoryInitialId(lastRecord.id);
    goTo('history');
  }, [lastRecord, goTo]);

  // Refator 2026-05: handlers de Diagnóstico/Recomendações/Modo Gamer/
  // Detalhes/DNS Benchmark/DNS Guide foram removidos junto com suas telas.
  // Diagnóstico virou card no Result; gamer/details/dns viraram accordions
  // na section "Mais detalhes" do Result; o guia de DNS virou bottom sheet
  // local da ResultScreen.
  const handleExplore = useCallback(() => goTo('explore'), [goTo]);
  const handleShowLocalWifiDiagnostics = useCallback(() => goTo('localwifi'), [goTo]);

  const capabilities = useMemo(() => getCapabilities(), []);

  // ── Swipe lateral (back/forward) ─────────────────────────
  const swipeStartRef = useRef<{ x: number; y: number; valid: boolean } | null>(null);

  const isInteractive = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return !!target.closest('.lk-sheet, .lk-history__list, button, input, textarea, a');
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

  // Resultado para exibir: quando vindo da StartScreen via "Ver último teste",
  // construímos um SpeedTestResult a partir do TestRecord selecionado.
  const view = useMemo(() => {
    switch (screen) {
      case 'running': {
        const sessionLabel = provaRealSession !== null ? `Teste ${provaRealSession} de 3 — Prova Real` : undefined;
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
            sessionLabel={sessionLabel}
            mode={testMode}
            live={test.live}
            server={deviceInfo.server}
            useHaptics={settings.useHaptics}
          />
        );
      }
      case 'result': {
        const resultToShow = provaRealOverride ?? test.result ?? (lastRecord ? recordToResult(lastRecord) : null);
        const serverForResult: typeof deviceInfo.server = (test.result || provaRealOverride)
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
            onBack={() => goTo('start')}
            unit={settings.unit}
            hideIpOnShare={settings.hideIpOnShare}
            gamingProfile={settings.gamingProfile}
            connectionType={deviceInfo.device?.connectionType ?? null}
            contractedDown={settings.contractedDown}
            contractedUp={settings.contractedUp}
            onUpdateContracted={(down, up) => updateSettings({ contractedDown: down, contractedUp: up })}
            useHaptics={settings.useHaptics}
            onToggleHaptics={(next) => updateSettings({ useHaptics: next })}
            onStartRoomTest={handleOpenRoomTest}
            onExplore={handleExplore}
          />
        ) : null;
      }
      case 'comparison':
        return (
          <ComparisonScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            step={comparisonStep}
            nearResult={comparisonNear}
            farResult={comparisonFar}
            onStartNear={handleComparisonStartNear}
            onStartFar={handleComparisonStartFar}
            onBack={goToReturnTarget}
            onRetryNear={handleComparisonRetryNear}
            unit={settings.unit}
          />
        );
      case 'beforeafter':
        return (
          <BeforeAfterScreen
            theme={theme} onToggleTheme={onToggleTheme}
            step={baStep} beforeResult={baBefore} afterResult={baAfter}
            onStartBefore={handleBAStartBefore} onStartAfter={handleBAStartAfter}
            onBack={goToReturnTarget} onRetry={handleBARetry}
            unit={settings.unit}
          />
        );
      case 'roomtest':
        return (
          <RoomTestScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            onStart={handleRoomStart}
            onBack={goToReturnTarget}
          />
        );
      case 'explore':
        return (
          <ExploreScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            contractedDown={settings.contractedDown}
            contractedUp={settings.contractedUp}
            onUpdateContracted={(down, up) => updateSettings({ contractedDown: down, contractedUp: up })}
            onBack={goBack}
            onShowHistory={handleShowHistory}
            onStartRoomTest={handleOpenRoomTest}
            onStartComparison={handleStartComparison}
            onStartBeforeAfter={handleStartBeforeAfter}
            onShowLocalWifiDiagnostics={capabilities.localWifiDiagnostics ? handleShowLocalWifiDiagnostics : undefined}
          />
        );
      case 'localwifi':
        return <LocalWifiScreen onBack={goBack} />;
      case 'history':
        return (
          <HistoryScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            unit={settings.unit}
            initialSelectedId={historyInitialId}
            onBack={goToReturnTarget}
          />
        );
      case 'start':
      default:
        return (
          <StartScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            device={deviceInfo.device}
            server={deviceInfo.server}
            loading={deviceInfo.loading}
            error={deviceInfo.error}
            isOnline={isOnline}
            settings={settings}
            onUpdateSettings={updateSettings}
            onStart={handleStart}
            onRetry={deviceInfo.reload}
            lastRecord={lastRecord}
            onShowLastResult={handleShowLastResult}
            onShowHistory={handleShowHistory}
            onExplore={handleExplore}
          />
        );
    }
  }, [
    screen, theme, onToggleTheme, isOnline,
    test.phase, test.instantMbps, test.result,
    deviceInfo,
    previous, lastRecord, historyInitialId,
    handleStart, handleStartComparison, handleCancel, handleRetry, handleShowHistory, handleShowLastResult,
    handleComparisonStartNear, handleComparisonStartFar, handleComparisonRetryNear,
    handleStartBeforeAfter, handleBAStartBefore, handleBAStartAfter, handleBARetry,
    handleStartProvaReal, handleOpenRoomTest, handleRoomStart,
    handleExplore, handleShowLocalWifiDiagnostics,
    goBack, goToReturnTarget, capabilities.localWifiDiagnostics,
    settings, updateSettings, testMode,
    comparisonStep, comparisonNear, comparisonFar,
    baStep, baBefore, baAfter,
    provaRealSession, provaRealOverride,
  ]);

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div key={screen} className="screen-enter">
        {view}
      </div>
      <PwaUpdatePrompt />
    </div>
  );
}
