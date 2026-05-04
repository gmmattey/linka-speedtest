import { getCapabilities } from '../../platform/capabilities';
import { getLocalWifiRawInfoFromBridge } from './LocalWifiBridge';
import { getUnavailableLocalWifiRawInfo, getUnavailableWifiDiagnosticResult } from './LocalWifiUnavailable';
import type { WifiDiagnosticResult as CombinedWifiDiagnosticResult } from '../../types';
import type { LocalWifiRawInfo, WifiBand, WifiChannelQuality, WifiDiagnosticResult, WifiQuality } from './types';

export function bandFromFrequency(frequencyMhz?: number): WifiBand {
  if (!frequencyMhz) return 'unknown';
  if (frequencyMhz >= 2400 && frequencyMhz < 2500) return '2.4GHz';
  if (frequencyMhz >= 4900 && frequencyMhz < 5900) return '5GHz';
  if (frequencyMhz >= 5925 && frequencyMhz <= 7125) return '6GHz';
  return 'unknown';
}

export function channelFromFrequency(frequencyMhz?: number): number | undefined {
  if (!frequencyMhz) return undefined;

  if (frequencyMhz >= 2412 && frequencyMhz <= 2472) {
    return Math.round((frequencyMhz - 2407) / 5);
  }
  if (frequencyMhz === 2484) return 14;

  if (frequencyMhz >= 5000 && frequencyMhz <= 5900) {
    return Math.round((frequencyMhz - 5000) / 5);
  }

  if (frequencyMhz >= 5955 && frequencyMhz <= 7115) {
    return Math.round((frequencyMhz - 5950) / 5);
  }

  return undefined;
}

/**
 * Label em pt-BR para a qualidade do Wi-Fi. Função única usada por
 * todas as telas que exibem qualidade ao usuário (LocalWifiScreen e
 * WifiSignalCard) — proíbe strings em inglês na UI.
 *
 * Mantém a paridade com os labels usados nos chips de grade A-F dos
 * use cases ("Excelente / Bom / Razoável / Fraco / Crítico").
 */
export function wifiQualityLabel(quality: WifiQuality): string {
  switch (quality) {
    case 'excellent': return 'Excelente';
    case 'good':      return 'Bom';
    case 'fair':      return 'Razoável';
    case 'weak':      return 'Fraco';
    case 'critical':  return 'Crítico';
    case 'unknown':
    default:          return 'Indisponível';
  }
}

export function classifyWifiQuality(input: {
  rssiDbm?: number;
  linkSpeedMbps?: number;
  band?: WifiBand;
}): WifiQuality {
  const { rssiDbm, linkSpeedMbps, band } = input;

  if (rssiDbm == null && linkSpeedMbps == null) return 'unknown';

  if (
    rssiDbm != null && rssiDbm >= -55 &&
    linkSpeedMbps != null && linkSpeedMbps >= 500 &&
    (band === '5GHz' || band === '6GHz')
  ) return 'excellent';

  if (
    rssiDbm != null && rssiDbm >= -60 &&
    linkSpeedMbps != null && linkSpeedMbps >= 300
  ) return 'good';

  if (
    rssiDbm != null && rssiDbm >= -67 &&
    (linkSpeedMbps == null || linkSpeedMbps >= 100)
  ) return 'fair';

  if (
    rssiDbm != null && rssiDbm >= -75 &&
    (linkSpeedMbps == null || linkSpeedMbps >= 50)
  ) return 'weak';

  return 'critical';
}

function nearestChannel(target: number, options: readonly number[]): number {
  return options.reduce((best, candidate) => (
    Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best
  ), options[0]);
}

export function classifyWifiChannel(input: {
  band?: WifiBand;
  channel?: number;
}): { quality: WifiChannelQuality; suggestedChannel?: number } {
  const { band, channel } = input;

  if (band === '2.4GHz') {
    const best = [1, 6, 11] as const;
    if (channel == null) return { quality: 'bad', suggestedChannel: 6 };
    if (best.includes(channel as 1 | 6 | 11)) return { quality: 'good' };
    if (best.some((item) => Math.abs(item - channel) <= 1)) return { quality: 'medium' };
    return { quality: 'bad', suggestedChannel: nearestChannel(channel, best) };
  }

  if (band === '5GHz') {
    const nonDfsA = [36, 40, 44, 48] as const;
    const nonDfsB = [149, 153, 157, 161] as const;
    const nonDfs = [...nonDfsA, ...nonDfsB] as const;
    if (channel == null) return { quality: 'bad', suggestedChannel: 48 };
    if (nonDfs.includes(channel as typeof nonDfs[number])) return { quality: 'good' };
    if (channel >= 32 && channel <= 177) return { quality: 'medium' };
    return { quality: 'bad', suggestedChannel: nearestChannel(channel, nonDfs) };
  }

  if (band === '6GHz') {
    if (channel == null) return { quality: 'medium' };
    return channel > 0 ? { quality: 'good' } : { quality: 'medium' };
  }

  return { quality: 'bad', suggestedChannel: 6 };
}

export function buildWifiCopy(quality: WifiQuality, band: WifiBand): {
  title: string;
  explanation: string;
  primaryAction: string;
} {
  if (quality === 'excellent' || quality === 'good') {
    return {
      title: 'Wi-Fi saudável',
      explanation: 'O sinal Wi-Fi local parece bom neste ponto da casa.',
      primaryAction: 'Se a internet estiver ruim, o problema pode estar fora do Wi-Fi.',
    };
  }

  if (quality === 'fair') {
    return {
      title: 'Wi-Fi aceitável, mas pode oscilar',
      explanation: 'O sinal está utilizável, mas pode perder qualidade em chamadas, jogos ou streaming.',
      primaryAction: band === '2.4GHz'
        ? 'Use a rede 5 GHz se estiver disponível.'
        : 'Aproxime-se do roteador e refaça o teste.',
    };
  }

  if (quality === 'weak') {
    return {
      title: 'Wi-Fi fraco neste local',
      explanation: 'O sinal local pode estar limitando sua experiência, mesmo que a internet esteja boa.',
      primaryAction: 'Aproxime-se do roteador ou teste outro cômodo.',
    };
  }

  if (quality === 'critical') {
    return {
      title: 'Wi-Fi crítico neste local',
      explanation: 'O sinal está muito fraco e pode causar travamentos, quedas e lentidão.',
      primaryAction: 'Teste perto do roteador antes de culpar a operadora.',
    };
  }

  return {
    title: 'Diagnóstico Wi-Fi indisponível',
    explanation: 'Não foi possível obter dados suficientes do Wi-Fi neste aparelho.',
    primaryAction: 'Verifique permissões do app ou use o SpeedTest normalmente.',
  };
}

async function getLocalWifiRawInfo(): Promise<LocalWifiRawInfo> {
  const { localWifiDiagnostics } = getCapabilities();
  if (!localWifiDiagnostics) {
    return getUnavailableLocalWifiRawInfo('web');
  }

  const raw = await getLocalWifiRawInfoFromBridge();
  if (!raw.available) {
    return getUnavailableLocalWifiRawInfo(raw.platform ?? 'unknown');
  }

  return raw;
}

export async function runLocalWifiDiagnostics(): Promise<WifiDiagnosticResult> {
  const raw = await getLocalWifiRawInfo();

  if (!raw.available) {
    // Propaga permissionStatus/platform: a UI usa esses campos para
    // distinguir "permissão negada" de "PWA sem plugin".
    return getUnavailableWifiDiagnosticResult({
      permissionStatus: raw.permissionStatus,
      platform: raw.platform,
    });
  }

  const band = bandFromFrequency(raw.frequencyMhz);
  const channel = raw.channel ?? channelFromFrequency(raw.frequencyMhz);
  const quality = classifyWifiQuality({
    rssiDbm: raw.rssiDbm,
    linkSpeedMbps: raw.linkSpeedMbps,
    band,
  });
  const channelInfo = classifyWifiChannel({ band, channel });

  const copy = buildWifiCopy(quality, band);

  return {
    ...raw,
    available: true,
    band,
    channel,
    channelQuality: channelInfo.quality,
    suggestedChannel: channelInfo.quality === 'bad' ? channelInfo.suggestedChannel : undefined,
    quality,
    ...copy,
    limitations: [
      'Este diagnóstico não mede a velocidade real entre o aparelho e o roteador.',
      'A análise é estimada com base em sinal, banda, frequência e velocidade negociada.',
    ],
  };
}

export function toCombinedWifiInput(
  result: WifiDiagnosticResult | null
): CombinedWifiDiagnosticResult | undefined {
  if (!result || !result.available) return undefined;

  return {
    available: result.available,
    rssiDbm: result.rssiDbm,
    linkSpeedMbps: result.linkSpeedMbps,
    band: result.band === 'unknown' ? undefined : result.band,
    quality: result.quality === 'unknown' ? undefined : result.quality,
  };
}
