import { getCapabilities } from '../../platform/capabilities';
import { discoverLocalNetworkFromBridge } from './LocalNetworkBridge';
import { mergeDeviceObservations, observationsFromClientIdentityProvider } from './DeviceRegistry';
import type { ClientIdentityProvider, DeviceDiscoveryResult, IdentifiedDevice } from './types';

export interface LocalNetworkScanResult {
  available: boolean;
  permissionStatus?: 'granted' | 'denied' | 'unknown';
  platform?: 'android' | 'ios' | 'web' | 'unknown';
  devices: IdentifiedDevice[];
  observationCount: number;
}

export async function discoverLocalNetworkDevices(
  clientIdentityProvider?: ClientIdentityProvider,
): Promise<LocalNetworkScanResult> {
  const { localNetworkDiscovery } = getCapabilities();
  if (!localNetworkDiscovery) {
    return {
      available: false,
      permissionStatus: 'unknown',
      platform: 'web',
      devices: [],
      observationCount: 0,
    };
  }

  const [nativeResult, routerObservations] = await Promise.all([
    discoverLocalNetworkFromBridge(),
    observationsFromClientIdentityProvider(clientIdentityProvider),
  ]);

  return buildScanResult(nativeResult, routerObservations);
}

export function buildScanResult(
  nativeResult: DeviceDiscoveryResult,
  routerObservations: DeviceDiscoveryResult['observations'] = [],
): LocalNetworkScanResult {
  const observations = [...nativeResult.observations, ...routerObservations];
  const devices = mergeDeviceObservations(observations);

  return {
    available: nativeResult.available,
    permissionStatus: nativeResult.permissionStatus,
    platform: nativeResult.platform,
    devices,
    observationCount: observations.length,
  };
}

export function confidenceLabel(confidence: IdentifiedDevice['confidence']): string {
  switch (confidence) {
    case 'confirmed': return 'confirmado';
    case 'medium': return 'médio';
    case 'probable': return 'provável';
    case 'inferred': return 'inferido';
  }
}

export function nameSourceLabel(source: IdentifiedDevice['nameSource']): string {
  switch (source) {
    case 'userDefined': return 'nome salvo';
    case 'router': return 'modem';
    case 'ssdp': return 'SSDP';
    case 'mdns': return 'mDNS';
    case 'netbios': return 'NetBIOS';
    case 'dns': return 'DNS';
    case 'vendor': return 'fabricante';
    case 'ip': return 'IP/MAC';
  }
}

export function kindLabel(kind: IdentifiedDevice['kind']): string {
  switch (kind) {
    case 'phone': return 'Celular';
    case 'computer': return 'Computador';
    case 'tv': return 'TV';
    case 'router': return 'Roteador';
    case 'printer': return 'Impressora';
    case 'speaker': return 'Caixa de som';
    case 'camera': return 'Câmera';
    case 'iot': return 'Dispositivo inteligente';
    case 'unknown': return 'Não identificado';
  }
}
