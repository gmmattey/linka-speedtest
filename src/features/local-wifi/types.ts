export type WifiBand = '2.4GHz' | '5GHz' | '6GHz' | 'unknown';

export type WifiQuality =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'weak'
  | 'critical'
  | 'unknown';

export type WifiChannelQuality = 'good' | 'medium' | 'bad';

export interface LocalWifiNetworkInfo {
  ssid: string;
  bssid: string;
  frequencyMhz: number;
  rssiDbm: number;
  capabilities: string;
}

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
  wifiStandard?: string;
  nearbyNetworks?: LocalWifiNetworkInfo[];
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
  /**
   * Padrão WiFi (e.g., "802.11ac", "802.11ax"). Disponível em Android API 30+.
   */
  wifiStandard?: string;
  /**
   * Array de redes Wi-Fi próximas, resultado do scan assíncrono.
   * Pode estar vazio na primeira chamada (scan em background).
   */
  nearbyNetworks?: LocalWifiNetworkInfo[];
  /**
   * Estado da permissão de localização propagado pelo plugin nativo
   * (Android exige ACCESS_FINE_LOCATION). Permite a UI distinguir
   * "indisponível porque o usuário negou" de "indisponível porque é PWA".
   */
  permissionStatus?: 'granted' | 'denied' | 'unknown';
  /** Plataforma de origem do diagnóstico, propagado do raw bridge. */
  platform?: 'android' | 'ios' | 'web' | 'unknown';
  title: string;
  explanation: string;
  primaryAction: string;
  limitations: string[];
}
