export type WifiBand = '2.4GHz' | '5GHz' | '6GHz' | 'unknown';

export type WifiQuality =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'weak'
  | 'critical'
  | 'unknown';

export type WifiChannelQuality = 'good' | 'medium' | 'bad';

export interface LocalWifiRawInfo {
  available: boolean;
  ssid?: string;
  bssid?: string;
  rssiDbm?: number;
  linkSpeedMbps?: number;
  frequencyMhz?: number;
  channel?: number;
  gateway?: string;
  ipAddress?: string;
  permissionStatus?: 'granted' | 'denied' | 'unknown';
  platform?: 'android' | 'ios' | 'web' | 'unknown';
}

export interface WifiDiagnosticResult {
  available: boolean;
  ssid?: string;
  bssid?: string;
  rssiDbm?: number;
  linkSpeedMbps?: number;
  frequencyMhz?: number;
  band?: WifiBand;
  channel?: number;
  channelQuality?: WifiChannelQuality;
  suggestedChannel?: number;
  gateway?: string;
  ipAddress?: string;
  quality?: WifiQuality;
  title: string;
  explanation: string;
  primaryAction: string;
  limitations: string[];
}
