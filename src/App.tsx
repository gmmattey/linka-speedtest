import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StartScreen } from './screens/StartScreen';
import { RunningScreen } from './screens/RunningScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ComparisonScreen, type ComparisonStep } from './screens/ComparisonScreen';
import { BeforeAfterScreen, type BeforeAfterStep } from './screens/BeforeAfterScreen';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { useSpeedTest } from './hooks/useSpeedTest';
import { useSettings } from './hooks/useSettings';
import { appendRecord, previousRecord } from './utils/history';
import type { SpeedTestMode, SpeedTestResult, TestRecord } from './types';

type Screen = 'start' | 'running' | 'result' | 'history' | 'comparison' | 'beforeafter';

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
  const [screen, setScreen] = useState<Screen>('start');
  const [previous, setPrevious] = useState<TestRecord | null>(null);
  const [lastRecord, setLastRecord] = useState<TestRecord | null>(null);
  const [historyInitialId, setHistoryInitialId] = useState<string | undefined>(undefined);
  const [testMode, setTestMode] = useState<SpeedTestMode>('complete');
  const [comparisonStep, setComparisonStep] = useState<ComparisonStep>('near');
  const [comparisonNear, setComparisonNear] = useState<SpeedTestResult | null>(null);
  const [comparisonFar, setComparisonFar] = useState<SpeedTestResult | null>(null);
  const comparisonModeRef = useRef<'near' | 'far' | null>(null);
  const [baStep, setBaStep] = useState<BeforeAfterStep>('before');
  const [baBefore, setBaBefore] = useState<SpeedTestResult | null>(null);
  const [baAfter, setBaAfter] = useState<SpeedTestResult | null>(null);
  const baModeRef = useRef<'before' | 'after' | null>(null);
  const recordedRef = useRef(false);
  const backStackRef = useRef<Screen[]>([]);
  const forwardStackRef = useRef<Screen[]>([]);

  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const deviceInfo = useDeviceInfo('cloudflare');
  const test = useSpeedTest();
  const { settings, update: updateSettings } = useSettings();

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

  // Ao abrir o PWA, carrega o último registro para exibir o card na StartScreen.
  useEffect(() => {
    setLastRecord(previousRecord());
  }, []);

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

  useEffect(() => {
    if (
      test.phase === 'done' &&
      test.result &&
      !recordedRef.current &&
      deviceInfo.device &&
      deviceInfo.server
    ) {
      recordedRef.current = true;
      const prev = previousRecord();
      setPrevious(prev);
      const newRecord = appendRecord(test.result, {
        serverName: deviceInfo.server.name,
        isp: deviceInfo.server.isp,
        deviceType: deviceInfo.device.deviceType,
        connectionType: deviceInfo.device.connectionType,
        testMode,
      });
      setLastRecord(newRecord);

      const cmpMode = comparisonModeRef.current;
      if (cmpMode === 'near') {
        setComparisonNear(test.result);
        setComparisonStep('far');
        comparisonModeRef.current = null;
        goTo('comparison');
      } else if (cmpMode === 'far') {
        setComparisonFar(test.result);
        setComparisonStep('done');
        comparisonModeRef.current = null;
        goTo('comparison');
      } else if (baModeRef.current === 'before') {
        setBaBefore(test.result);
        setBaStep('after');
        baModeRef.current = null;
        goTo('beforeafter');
      } else if (baModeRef.current === 'after') {
        setBaAfter(test.result);
        setBaStep('done');
        baModeRef.current = null;
        goTo('beforeafter');
      } else {
        goTo('result');
      }
    }
  }, [test.phase, test.result, deviceInfo.device, deviceInfo.server, goTo]);

  const effectiveConnection = settings.connectionOverride !== 'auto'
    ? settings.connectionOverride
    : deviceInfo.device?.connectionType;

  const handleStart = useCallback((mode: SpeedTestMode) => {
    setTestMode(mode);
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, mode);
  }, [test, effectiveConnection, goTo]);

  const handleCancel = useCallback(() => {
    test.cancel();
    test.reset();
    goTo('start');
  }, [test, goTo]);

  const handleRetry = useCallback(() => {
    test.reset();
    recordedRef.current = false;
    goTo('running');
    test.start(effectiveConnection, testMode);
  }, [test, effectiveConnection, testMode, goTo]);

  const handleStartComparison = useCallback(() => {
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
    setHistoryInitialId(undefined);
    goTo('history');
  }, [goTo]);

  const handleShowLastResult = useCallback(() => {
    if (!lastRecord) return;
    setHistoryInitialId(lastRecord.id);
    goTo('history');
  }, [lastRecord, goTo]);

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
      case 'running':
        return (
          <RunningScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            phase={test.phase}
            instantMbps={test.instantMbps}
            onCancel={handleCancel}
            onRetry={handleRetry}
            unit={settings.unit}
          />
        );
      case 'result':
        return test.result ? (
          <ResultScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            result={test.result}
            server={deviceInfo.server}
            previous={previous}
            onRetry={handleRetry}
            onShowHistory={handleShowHistory}
            unit={settings.unit}
            hideIpOnShare={settings.hideIpOnShare}
            gamingProfile={settings.gamingProfile}
          />
        ) : null;
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
            onBack={() => goTo('start')}
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
            onBack={() => goTo('start')} onRetry={handleBARetry}
            unit={settings.unit}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            theme={theme}
            onToggleTheme={onToggleTheme}
            unit={settings.unit}
            initialSelectedId={historyInitialId}
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
            onStartComparison={handleStartComparison}
            onStartBeforeAfter={handleStartBeforeAfter}
            onRetry={deviceInfo.reload}
            lastRecord={lastRecord}
            onShowLastResult={handleShowLastResult}
            onShowHistory={handleShowHistory}
          />
        );
    }
  }, [
    screen, theme, onToggleTheme, isOnline,
    test.phase, test.instantMbps, test.result,
    deviceInfo.device, deviceInfo.server, deviceInfo.loading, deviceInfo.error, deviceInfo.reload,
    previous, lastRecord, historyInitialId,
    handleStart, handleStartComparison, handleCancel, handleRetry, handleShowHistory, handleShowLastResult,
    handleComparisonStartNear, handleComparisonStartFar, handleComparisonRetryNear,
    handleStartBeforeAfter, handleBAStartBefore, handleBAStartAfter, handleBARetry,
    settings, updateSettings, testMode,
    comparisonStep, comparisonNear, comparisonFar,
    baStep, baBefore, baAfter,
  ]);

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {view}
    </div>
  );
}
