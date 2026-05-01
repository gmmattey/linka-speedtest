import type { LocalWifiRawInfo } from './types';

interface LinkaWifiBridge {
  getWifiInfo: () => Promise<unknown>;
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

export async function getLocalWifiRawInfoFromBridge(): Promise<LocalWifiRawInfo> {
  const bridge = (window as Window & { LinkaWifiDiagnostics?: LinkaWifiBridge }).LinkaWifiDiagnostics;

  if (!bridge || typeof bridge.getWifiInfo !== 'function') {
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
