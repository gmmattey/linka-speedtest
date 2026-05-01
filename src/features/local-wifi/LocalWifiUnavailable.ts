import type { LocalWifiRawInfo, WifiDiagnosticResult } from './types';

export function getUnavailableLocalWifiRawInfo(platform: LocalWifiRawInfo['platform'] = 'web'): LocalWifiRawInfo {
  return {
    available: false,
    permissionStatus: 'unknown',
    platform,
  };
}

export function getUnavailableWifiDiagnosticResult(): WifiDiagnosticResult {
  return {
    available: false,
    quality: 'unknown',
    title: 'Diagnóstico Wi-Fi indisponível',
    explanation: 'Não foi possível obter dados do Wi-Fi neste aparelho.',
    primaryAction: 'Verifique permissões do app ou use o SpeedTest normalmente.',
    limitations: [
      'Este recurso não está disponível no PWA.',
      'Algumas informações dependem de permissões do sistema.',
    ],
  };
}
