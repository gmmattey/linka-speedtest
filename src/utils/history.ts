import type { SpeedTestResult, TestRecord, DeviceType, ConnectionType, SpeedTestMode } from '../types';
import { classify } from './classifier';

const KEY = 'linka.speedtest.history.v1';
const MAX = 50;

export function loadHistory(): TestRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(items: TestRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded */
  }
}

export function appendRecord(
  result: SpeedTestResult,
  meta: { serverName: string; isp?: string; deviceType: DeviceType; connectionType: ConnectionType; testMode?: SpeedTestMode },
): TestRecord {
  const c = classify(result);
  const record: TestRecord = {
    id: `${result.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: result.timestamp,
    dl: result.dl,
    ul: result.ul,
    latency: result.latency,
    jitter: result.jitter,
    packetLoss: result.packetLoss,
    quality: c.primary,
    tags: Array.from(c.tags),
    serverName: meta.serverName,
    isp: meta.isp,
    deviceType: meta.deviceType,
    connectionType: meta.connectionType,
    testMode: meta.testMode,
  };
  const items = [record, ...loadHistory()].slice(0, MAX);
  persist(items);
  return record;
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function previousRecord(currentId?: string): TestRecord | null {
  const all = loadHistory();
  if (currentId) {
    const idx = all.findIndex((r) => r.id === currentId);
    return idx >= 0 ? all[idx + 1] ?? null : all[0] ?? null;
  }
  return all[0] ?? null;
}
