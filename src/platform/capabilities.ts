export interface AppCapabilities {
  localWifiDiagnostics: boolean;
  localNetworkDiscovery: boolean;
}

export function isNativeApp(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  return Boolean(
    (window as Window & { Capacitor?: unknown }).Capacitor ||
    (window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView ||
    navigator.userAgent.includes('LinkaNative')
  );
}

export function getCapabilities(): AppCapabilities {
  const native = isNativeApp();
  return {
    localWifiDiagnostics: native,
    localNetworkDiscovery: native,
  };
}
