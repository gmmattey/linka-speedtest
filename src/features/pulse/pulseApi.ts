import type { AiAnalysisEntry } from './types';
import type { SpeedTestResult } from '../../types';
import { localAnalysisText, severityFromResult } from './rulesAdapter';

const WORKER_URL = 'https://linka-ai-diagnosis-worker.giammattey-luiz.workers.dev';
const AI_TIMEOUT_MS = 15000;

interface WorkerRequest {
  context: string;
  trigger: string;
}

interface WorkerResponse {
  resumo: string;
  textoLaudo: string;
}

async function callWorker(trigger: string, context: string): Promise<string> {
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);

  try {
    const body: WorkerRequest = { context, trigger };
    const res = await fetch(`${WORKER_URL}/pulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Worker error ${res.status}`);
    const data = (await res.json()) as WorkerResponse;
    return (data.resumo || data.textoLaudo || '').trim();
  } catch {
    clearTimeout(timeoutId);
    throw new Error('Worker unavailable');
  }
}

export async function generateInitialAnalysis(
  result: SpeedTestResult,
  contextAccumulated: string,
  trigger: string,
): Promise<AiAnalysisEntry> {
  try {
    const text = await callWorker(trigger, contextAccumulated);
    if (text) {
      return { trigger, content: text, isFallback: false, timestamp: Date.now() };
    }
  } catch { /* fall through */ }

  const severity = severityFromResult(result);
  const fallbackText = localAnalysisText(result, severity);
  return { trigger, content: fallbackText, isFallback: true, timestamp: Date.now() };
}

export async function generateFollowUpAnalysis(
  result: SpeedTestResult,
  contextAccumulated: string,
  trigger: string,
): Promise<AiAnalysisEntry> {
  return generateInitialAnalysis(result, contextAccumulated, trigger);
}

export function localFallback(result: SpeedTestResult): AiAnalysisEntry {
  const severity = severityFromResult(result);
  return {
    trigger: 'fallback',
    content: localAnalysisText(result, severity),
    isFallback: true,
    timestamp: Date.now(),
  };
}
