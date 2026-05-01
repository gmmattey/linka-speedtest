import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionType, SpeedTestMode, SpeedTestProgress, SpeedTestResult, TestPhase } from '../types';
import { runSpeedTest } from '../utils/speedtest';

export interface LivePoint {
  t: number;
  speed: number;
  phase: 'download' | 'upload';
}

interface State {
  phase: TestPhase;
  instantMbps: number | null;
  overallProgress: number;
  result: SpeedTestResult | null;
  error: string | null;
  live: LivePoint[];
}

const MAX_POINTS = 60;

export function useSpeedTest() {
  const [state, setState] = useState<State>({
    phase: 'idle',
    instantMbps: null,
    overallProgress: 0,
    result: null,
    error: null,
    live: [],
  });

  const ctrlRef = useRef<AbortController | null>(null);
  const targetMbpsRef = useRef<number>(0);
  const renderedMbpsRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastPushRef = useRef<number>(0);
  const liveRef = useRef<LivePoint[]>([]);
  const tickRef = useRef<(() => void) | null>(null);

  const tick = useCallback(() => {
    rafRef.current = requestAnimationFrame(() => tickRef.current?.());
    const target = targetMbpsRef.current;
    const rendered = renderedMbpsRef.current;
    if (target === 0 && rendered === 0) return;
    const next = rendered === 0 ? target : 0.25 * target + 0.75 * rendered;
    renderedMbpsRef.current = next;
    setState((s) => (s.instantMbps === next ? s : { ...s, instantMbps: next }));
  }, []);

  useEffect(() => {
    tickRef.current = tick;
  });

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (ctrlRef.current) ctrlRef.current.abort();
    };
  }, []);

  const start = useCallback(async (connectionType?: ConnectionType, mode?: SpeedTestMode) => {
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    targetMbpsRef.current = 0;
    renderedMbpsRef.current = 0;
    liveRef.current = [];
    lastPushRef.current = 0;
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);

    setState({
      phase: 'latency',
      instantMbps: null,
      overallProgress: 0,
      result: null,
      error: null,
      live: [],
    });

    const onProgress = (p: SpeedTestProgress) => {
      const instant = p.instantMbps ?? 0;
      targetMbpsRef.current = instant;

      if ((p.phase === 'download' || p.phase === 'upload') && p.instantMbps != null) {
        const now = performance.now();
        if (now - lastPushRef.current > 200) {
          lastPushRef.current = now;
          // Limpa o histórico ao entrar na fase de upload para não acumular
          // dados de fases diferentes no mesmo gráfico.
          const prev = liveRef.current;
          const lastPhase = prev.length > 0 ? prev[prev.length - 1].phase : p.phase;
          const base = lastPhase !== p.phase ? [] : prev;
          liveRef.current = [
            ...base,
            { t: now, speed: p.instantMbps, phase: p.phase },
          ].slice(-MAX_POINTS);
        }
      }

      setState((s) => ({
        ...s,
        phase: p.phase,
        overallProgress: p.overallProgress,
        live: liveRef.current,
      }));
    };

    try {
      const result = await runSpeedTest(onProgress, ctrl.signal, connectionType, mode);
      setState((s) => ({
        ...s,
        phase: 'done',
        instantMbps: null,
        overallProgress: 1,
        result,
        live: liveRef.current,
      }));
      targetMbpsRef.current = 0;
      renderedMbpsRef.current = 0;
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      setState((s) => ({
        ...s,
        phase: aborted ? 'idle' : 'error',
        error: aborted ? null : 'Falha ao executar o teste. Tente novamente.',
      }));
    }
  }, [tick]);

  const cancel = useCallback(() => {
    if (ctrlRef.current) ctrlRef.current.abort();
  }, []);

  const reset = useCallback(() => {
    targetMbpsRef.current = 0;
    renderedMbpsRef.current = 0;
    liveRef.current = [];
    setState({
      phase: 'idle',
      instantMbps: null,
      overallProgress: 0,
      result: null,
      error: null,
      live: [],
    });
  }, []);

  return { ...state, start, cancel, reset };
}
