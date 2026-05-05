import type { DeviceDiscoveryResult, DeviceKind, DeviceObservation, DeviceObservationSource } from './types';

interface LocalNetworkBridge {
  discoverDevices: () => Promise<unknown>;
}

interface CapacitorGlobal {
  Plugins?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function toSource(value: unknown): DeviceObservationSource | undefined {
  if (
    value === 'arp' ||
    value === 'tcp' ||
    value === 'ssdp' ||
    value === 'mdns' ||
    value === 'netbios' ||
    value === 'router' ||
    value === 'cache'
  ) return value;
  return undefined;
}

function toKind(value: unknown): DeviceKind | undefined {
  if (
    value === 'phone' ||
    value === 'computer' ||
    value === 'tv' ||
    value === 'router' ||
    value === 'printer' ||
    value === 'speaker' ||
    value === 'camera' ||
    value === 'iot' ||
    value === 'unknown'
  ) return value;
  return undefined;
}

function resolveBridge(): LocalNetworkBridge | null {
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  const fromCapacitor = cap?.Plugins?.LinkaLocalNetworkDiscovery as LocalNetworkBridge | undefined;
  if (fromCapacitor && typeof fromCapacitor.discoverDevices === 'function') {
    return fromCapacitor;
  }
  return null;
}

function toObservation(value: unknown): DeviceObservation | undefined {
  if (!isRecord(value)) return undefined;
  const ip = toText(value.ip);
  const source = toSource(value.source);
  if (!ip || !source) return undefined;

  return {
    ip,
    mac: toText(value.mac),
    hostname: toText(value.hostname),
    friendlyName: toText(value.friendlyName),
    mdnsName: toText(value.mdnsName),
    netbiosName: toText(value.netbiosName),
    modemClientName: toText(value.modemClientName),
    vendor: toText(value.vendor),
    kind: toKind(value.kind),
    source,
  };
}

export async function discoverLocalNetworkFromBridge(): Promise<DeviceDiscoveryResult> {
  const bridge = resolveBridge();
  if (!bridge) {
    return {
      available: false,
      permissionStatus: 'unknown',
      platform: 'web',
      observations: [],
    };
  }

  try {
    const payload = await bridge.discoverDevices();
    if (!isRecord(payload)) {
      return { available: false, permissionStatus: 'unknown', platform: 'unknown', observations: [] };
    }

    const observations = Array.isArray(payload.observations)
      ? payload.observations.flatMap((item) => {
        const observation = toObservation(item);
        return observation ? [observation] : [];
      })
      : [];

    const permissionStatus = payload.permissionStatus;
    const platform = payload.platform;

    return {
      available: Boolean(payload.available),
      permissionStatus:
        permissionStatus === 'granted' || permissionStatus === 'denied' || permissionStatus === 'unknown'
          ? permissionStatus
          : 'unknown',
      platform: platform === 'android' || platform === 'ios' || platform === 'web' || platform === 'unknown'
        ? platform
        : 'unknown',
      observations,
    };
  } catch {
    return { available: false, permissionStatus: 'unknown', platform: 'unknown', observations: [] };
  }
}
