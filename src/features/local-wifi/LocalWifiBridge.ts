import type { LocalWifiRawInfo } from './types';

interface LinkaWifiBridge {
  getWifiInfo: () => Promise<unknown>;
}

interface CapacitorGlobal {
  Plugins?: Record<string, unknown>;
  isNativePlatform?: () => boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function toLocalWifiNetworkArray(value: unknown): Array<{
  ssid: string;
  bssid: string;
  frequencyMhz: number;
  rssiDbm: number;
  capabilities: string;
}> | undefined {
  if (!Array.isArray(value)) return undefined;
  const result = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const ssid = toText(item.ssid);
    const bssid = toText(item.bssid);
    const freq = toNumber(item.frequencyMhz);
    const rssi = toNumber(item.rssiDbm);
    const caps = toText(item.capabilities);
    if (ssid && bssid && freq != null && rssi != null && caps) {
      result.push({ ssid, bssid, frequencyMhz: freq, rssiDbm: rssi, capabilities: caps });
    }
  }
  return result.length > 0 ? result : undefined;
}

/**
 * Resolve a referência ao plugin nativo. Capacitor 8 expõe plugins
 * registrados via `Capacitor.Plugins.<name>`. Mantemos um fallback em
 * `window.LinkaWifiDiagnostics` para compatibilidade com builds antigos
 * que injetavam a bridge via `addJavascriptInterface`.
 */
function resolveBridge(): LinkaWifiBridge | null {
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  const fromCapacitor = cap?.Plugins?.LinkaWifiDiagnostics as LinkaWifiBridge | undefined;
  if (fromCapacitor && typeof fromCapacitor.getWifiInfo === 'function') {
    return fromCapacitor;
  }

  const fromWindow = (window as Window & { LinkaWifiDiagnostics?: LinkaWifiBridge }).LinkaWifiDiagnostics;
  if (fromWindow && typeof fromWindow.getWifiInfo === 'function') {
    return fromWindow;
  }

  return null;
}

export async function getLocalWifiRawInfoFromBridge(): Promise<LocalWifiRawInfo> {
  const bridge = resolveBridge();

  if (!bridge) {
    return {
      available: false,
      permissionStatus: 'unknown',
      platform: 'unknown',
    };
  }

  try {
    const payload = await bridge.getWifiInfo();

    if (!isRecord(payload)) {
      return {
        available: false,
        permissionStatus: 'unknown',
        platform: 'unknown',
      };
    }

    const permissionStatus = payload.permissionStatus;
    const platform = payload.platform;

    return {
      available: Boolean(payload.available),
      ssid: toText(payload.ssid),
      bssid: toText(payload.bssid),
      rssiDbm: toNumber(payload.rssiDbm),
      linkSpeedMbps: toNumber(payload.linkSpeedMbps),
      frequencyMhz: toNumber(payload.frequencyMhz),
      channel: toNumber(payload.channel),
      gateway: toText(payload.gateway),
      ipAddress: toText(payload.ipAddress),
      wifiStandard: toText(payload.wifiStandard),
      nearbyNetworks: toLocalWifiNetworkArray(payload.nearbyNetworks),
      permissionStatus:
        permissionStatus === 'granted' || permissionStatus === 'denied' || permissionStatus === 'unknown'
          ? permissionStatus
          : 'unknown',
      platform: platform === 'android' || platform === 'ios' || platform === 'web' || platform === 'unknown'
        ? platform
        : 'unknown',
    };
  } catch {
    return {
      available: false,
      permissionStatus: 'unknown',
      platform: 'unknown',
    };
  }
}
