export type DeviceObservationSource =
  | 'arp'
  | 'tcp'
  | 'ssdp'
  | 'mdns'
  | 'netbios'
  | 'router'
  | 'cache';

export type DeviceHostnameSource =
  | 'dns'
  | 'ssdp'
  | 'mdns'
  | 'netbios'
  | 'router'
  | 'userDefined'
  | 'vendor'
  | 'ip';

export type DeviceKind =
  | 'phone'
  | 'computer'
  | 'tv'
  | 'router'
  | 'printer'
  | 'speaker'
  | 'camera'
  | 'iot'
  | 'unknown';

export type DeviceConfidence = 'confirmed' | 'medium' | 'probable' | 'inferred';

export interface DeviceObservation {
  ip: string;
  mac?: string;
  hostname?: string;
  friendlyName?: string;
  mdnsName?: string;
  netbiosName?: string;
  modemClientName?: string;
  userDefinedName?: string;
  vendor?: string;
  kind?: DeviceKind;
  source: DeviceObservationSource;
  hostnameSource?: DeviceHostnameSource;
}

export interface ClientIdentityProvider {
  getClientIdentities: () => Promise<Map<string, string>>;
}

export interface DeviceDiscoveryResult {
  available: boolean;
  permissionStatus?: 'granted' | 'denied' | 'unknown';
  platform?: 'android' | 'ios' | 'web' | 'unknown';
  observations: DeviceObservation[];
}

export interface IdentifiedDevice {
  id: string;
  displayName: string;
  ip: string;
  mac?: string;
  vendor?: string;
  kind: DeviceKind;
  nameSource: DeviceHostnameSource;
  confidence: DeviceConfidence;
  sources: DeviceObservationSource[];
}
