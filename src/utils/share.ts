import type { Quality, SpeedTestResult } from '../types';
import { resolveCopy } from '../core';
import { formatMbps, formatMs } from './format';

export function buildShareText(result: SpeedTestResult, quality: Quality, unit: 'mbps' | 'gbps' = 'mbps'): string {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  return [
    `linka SpeedTest — ${resolveCopy(`quality.${quality}`)}`,
    `↓ ${formatMbps(result.dl, unit)} ${unitLabel} · ↑ ${formatMbps(result.ul, unit)} ${unitLabel}`,
    `Resposta ${formatMs(result.latency)} ms · Oscilação ${formatMs(result.jitter)} ms`,
    new Date(result.timestamp).toLocaleString('pt-BR'),
  ].join('\n');
}

export async function shareResultText(text: string): Promise<'shared' | 'copied' | 'none'> {
  if (navigator.share) {
    try { await navigator.share({ title: 'linka SpeedTest', text }); return 'shared'; }
    catch { return 'none'; }
  }
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return 'copied'; }
    catch { return 'none'; }
  }
  return 'none';
}
