import type { WifiContext } from '../../types';

const SHORTCUT_NAME = 'LINKA WiFi Context';
const PENDING_KEY = 'linka.pendingWifiContext';
const CONTEXT_TTL_MS = 2 * 60 * 1000; // 2 minutos

const WIFI_LIMITS = {
  rssiDbm:    { min: -100, max: -20 },
  noiseDbm:   { min: -120, max: -20 },
  snrDb:      { min: 0,    max: 80 },
  channel:    { min: 1,    max: 233 },
  txRateMbps: { min: 0,    max: 10_000 },
  rxRateMbps: { min: 0,    max: 10_000 },
} as const;

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function generateSessionId(): string {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function runWifiShortcut(sessionId: string): void {
  const returnUrl = `${window.location.origin}/wifi-callback`;
  const payload = encodeURIComponent(
    JSON.stringify({
      version: 1,
      sessionId,
      returnUrl,
      startedAt: Date.now(),
      source: 'linka-pwa',
    }),
  );
  window.location.href =
    `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${payload}`;
}

function toNumber(v: string | null): number | undefined {
  if (v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function clampedNumber(
  v: number | undefined,
  key: keyof typeof WIFI_LIMITS,
): number | undefined {
  if (v === undefined) return undefined;
  const { min, max } = WIFI_LIMITS[key];
  return v >= min && v <= max ? v : undefined;
}

function sanitizeString(v: string | null, maxLen = 64): string | undefined {
  if (!v) return undefined;
  // Remove caracteres de controle e limita o comprimento
  const s = v.replace(/[\x00-\x1F\x7F]/g, '').slice(0, maxLen).trim();
  return s || undefined;
}

export function parseWifiCallback(search: string): WifiContext | null {
  const params = new URLSearchParams(search);

  // Tenta primeiro o formato base64url (Fase 2+)
  const ctx = params.get('ctx');
  if (ctx) {
    try {
      const json = JSON.parse(atob(ctx.replace(/-/g, '+').replace(/_/g, '/')));
      return validateWifiContext(json);
    } catch {
      return null;
    }
  }

  // Fallback: query string simples (Fase 1)
  const sid = params.get('sid');
  if (!sid) return null;

  return validateWifiContext({
    version: 1,
    source: 'ios-shortcut',
    sessionId: sid,
    collectedAt: toNumber(params.get('t')) ?? Date.now(),
    available: params.get('available') !== 'false',
    ssid:         sanitizeString(params.get('ssid')),
    bssid:        sanitizeString(params.get('bssid'), 17),
    rssiDbm:      toNumber(params.get('rssi')),
    noiseDbm:     toNumber(params.get('noise')),
    snrDb:        toNumber(params.get('snr')),
    channel:      toNumber(params.get('channel')),
    txRateMbps:   toNumber(params.get('tx')),
    rxRateMbps:   toNumber(params.get('rx')),
    wifiStandard: sanitizeString(params.get('standard'), 32),
    localIp:      sanitizeString(params.get('localIp'), 45),
  });
}

function validateWifiContext(raw: Record<string, unknown>): WifiContext | null {
  if (!raw || typeof raw !== 'object') return null;
  if (raw['version'] !== 1) return null;
  if (typeof raw['sessionId'] !== 'string' || !raw['sessionId']) return null;

  const collectedAt = typeof raw['collectedAt'] === 'number' ? raw['collectedAt'] : Date.now();

  return {
    version: 1,
    source: (raw['source'] as WifiContext['source']) ?? 'unknown',
    sessionId: raw['sessionId'] as string,
    collectedAt,
    available: raw['available'] !== false,
    ssid:         sanitizeString(raw['ssid'] as string | null),
    bssid:        sanitizeString(raw['bssid'] as string | null, 17),
    rssiDbm:      clampedNumber(raw['rssiDbm'] as number | undefined, 'rssiDbm'),
    noiseDbm:     clampedNumber(raw['noiseDbm'] as number | undefined, 'noiseDbm'),
    snrDb:        clampedNumber(raw['snrDb'] as number | undefined, 'snrDb'),
    channel:      clampedNumber(raw['channel'] as number | undefined, 'channel'),
    txRateMbps:   clampedNumber(raw['txRateMbps'] as number | undefined, 'txRateMbps'),
    rxRateMbps:   clampedNumber(raw['rxRateMbps'] as number | undefined, 'rxRateMbps'),
    linkSpeedMbps: raw['linkSpeedMbps'] as number | undefined,
    wifiStandard: sanitizeString(raw['wifiStandard'] as string | null, 32),
    localIp:      sanitizeString(raw['localIp'] as string | null, 45),
  };
}

export function savePendingWifiContext(ctx: WifiContext): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(ctx));
  } catch { /* quota ou private browsing */ }
}

export function consumePendingWifiContext(): WifiContext | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    const ctx = JSON.parse(raw) as WifiContext;
    if (Date.now() - ctx.collectedAt > CONTEXT_TTL_MS) return null;
    return ctx;
  } catch {
    return null;
  }
}

/** Retorna label legível do padrão Wi-Fi (ex.: "802.11ax" → "Wi-Fi 6"). */
export function formatWifiStandard(standard?: string): string | undefined {
  if (!standard) return undefined;
  const map: Record<string, string> = {
    '802.11ax': 'Wi-Fi 6',
    '802.11be': 'Wi-Fi 7',
    '802.11ac': 'Wi-Fi 5',
    '802.11n':  'Wi-Fi 4',
    '802.11g':  '802.11g',
    '802.11a':  '802.11a',
  };
  return map[standard] ?? standard;
}

/** Classifica RSSI em 5 níveis. */
export function classifyRssi(rssi?: number): 'excellent' | 'good' | 'fair' | 'weak' | 'critical' | 'unknown' {
  if (rssi == null) return 'unknown';
  if (rssi >= -55) return 'excellent';
  if (rssi >= -67) return 'good';
  if (rssi >= -75) return 'fair';
  if (rssi >= -82) return 'weak';
  return 'critical';
}

const RSSI_LABEL: Record<ReturnType<typeof classifyRssi>, string> = {
  excellent: 'Excelente',
  good:      'Bom',
  fair:      'Regular',
  weak:      'Fraco',
  critical:  'Crítico',
  unknown:   'Desconhecido',
};

export function rssiLabel(rssi?: number): string {
  return RSSI_LABEL[classifyRssi(rssi)];
}
