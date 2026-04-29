/**
 * Contrato de embed para consumidores externos (Flutter, Node.js, WebView).
 *
 * Regra de ouro: este arquivo **não importa** de `react`, `react-dom`,
 * `../components`, `../screens`, `../hooks`, `localStorage`, `document` ou
 * qualquer API exclusiva de DOM. Usa apenas Web Platform APIs universais
 * (fetch, performance, crypto, AbortController) — disponíveis em qualquer
 * WebView moderno.
 *
 * Responsabilidades do host (PWA / Flutter):
 * - Persistência do histórico (localStorage / SQLite / SharedPreferences)
 * - Renderização e layout
 * - Internacionalização além do pt-BR (pode ignorar resolveCopy e usar chaves)
 * - Cancelamento via AbortController
 */

import type { ConnectionProfile, ConnectionType, SpeedTestMode, SpeedTestProgress, SpeedTestResult, TestRecord } from '../types';
import { runSpeedTest } from '../utils/speedtest';
import { interpretSpeedTestResult } from './interpret';
import type { InterpretedResult } from './types';

export interface HeadlessTestOptions {
  connectionType?: ConnectionType;
  mode?: SpeedTestMode;
  history?: TestRecord[];
  signal?: AbortSignal;
  onProgress?: (p: SpeedTestProgress) => void;
}

export interface HeadlessTestResult {
  metrics: SpeedTestResult;
  interpreted: InterpretedResult;
}

/**
 * Executa um speed test completo e retorna as métricas brutas + interpretação.
 *
 * Exemplo Flutter (WebView.evaluateJavascript):
 *   const result = await runHeadlessTest('fixed_broadband', { mode: 'quick' });
 *   result.interpreted.quality       // 'good'
 *   result.interpreted.copyKeys      // chaves para dicionário próprio
 *   result.metrics.dl                // Mbps download
 */
export async function runHeadlessTest(
  profile: ConnectionProfile,
  options: HeadlessTestOptions = {},
): Promise<HeadlessTestResult> {
  const { connectionType, mode, history, signal, onProgress } = options;

  const ctrl = signal ? null : new AbortController();
  const abortSignal = signal ?? ctrl!.signal;

  const noop = () => {};
  const metrics = await runSpeedTest(
    onProgress ?? noop,
    abortSignal,
    connectionType,
    mode,
  );

  const interpreted = interpretSpeedTestResult({ metrics, profile, history });

  return { metrics, interpreted };
}
