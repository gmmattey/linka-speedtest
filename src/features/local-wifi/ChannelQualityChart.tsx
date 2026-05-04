import { useMemo } from 'react';
import type { LocalWifiNetworkInfo, WifiBand } from './types';
import './ChannelQualityChart.css';

interface ChannelData {
  channel: number;
  frequency: number;
  count: number;
  rssiAverage: number;
  quality: 'excellent' | 'good' | 'fair' | 'weak' | 'critical';
}

interface ChannelQualityChartProps {
  nearbyNetworks?: LocalWifiNetworkInfo[];
  currentChannel?: number;
  /** Banda atual da conexão. Filtra o gráfico para mostrar só canais da
   *  mesma banda, evitando barras de 1px quando há mistura 2.4/5/6 GHz. */
  currentBand?: WifiBand;
  suggestedChannel?: number;
  isLoading?: boolean;
}

export function ChannelQualityChart({
  nearbyNetworks,
  currentChannel,
  currentBand,
  suggestedChannel,
  isLoading,
}: ChannelQualityChartProps) {
  const channels = useMemo(
    () => analyzeChannels(nearbyNetworks, currentBand),
    [nearbyNetworks, currentBand],
  );

  if (isLoading) {
    return (
      <div className="lk-channel-chart lk-channel-chart--loading">
        Analisando canais…
      </div>
    );
  }

  if (!channels.length) {
    return (
      <div className="lk-channel-chart lk-channel-chart--empty">
        Nenhum canal detectado nesta banda.
      </div>
    );
  }

  const maxCount = Math.max(...channels.map((c) => c.count), 1);
  const bandLabel = currentBand && currentBand !== 'unknown' ? currentBand : 'todas as bandas';

  return (
    <div className="lk-channel-chart">
      <p className="lk-channel-chart__band-label">
        Mostrando canais em <strong>{bandLabel}</strong>
      </p>

      <div className="lk-channel-chart__bars">
        {channels.map((ch) => {
          const heightPct = Math.max((ch.count / maxCount) * 100, 6);
          return (
            <div key={ch.channel} className="lk-channel-chart__bar-container">
              <div className="lk-channel-chart__bar-track">
                <div
                  className={[
                    'lk-channel-chart__bar',
                    `lk-channel-chart__bar--${ch.quality}`,
                    ch.channel === currentChannel ? 'lk-channel-chart__bar--current' : '',
                    ch.channel === suggestedChannel ? 'lk-channel-chart__bar--suggested' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ height: `${heightPct}%` }}
                  title={`Canal ${ch.channel}: ${ch.count} AP(s), RSSI médio ${ch.rssiAverage} dBm`}
                >
                  <span className="lk-channel-chart__bar-label">{ch.count}</span>
                </div>
              </div>

              <div className="lk-channel-chart__channel-label">
                <span>{ch.channel}</span>
                {ch.channel === currentChannel && (
                  <span className="lk-badge lk-badge--current">Atual</span>
                )}
                {ch.channel === suggestedChannel && ch.channel !== currentChannel && (
                  <span className="lk-badge lk-badge--suggested">Recom.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="lk-channel-chart__legend">
        <div className="lk-channel-chart__legend-item">
          <span className="lk-channel-chart__legend-color lk-channel-chart__legend-color--excellent" />
          <span>Excelente (≥ −60)</span>
        </div>
        <div className="lk-channel-chart__legend-item">
          <span className="lk-channel-chart__legend-color lk-channel-chart__legend-color--fair" />
          <span>Aceitável (−60 a −80)</span>
        </div>
        <div className="lk-channel-chart__legend-item">
          <span className="lk-channel-chart__legend-color lk-channel-chart__legend-color--weak" />
          <span>Fraco (&lt; −80)</span>
        </div>
        <div className="lk-channel-chart__legend-item">
          <span className="lk-channel-chart__legend-color lk-channel-chart__legend-color--good" style={{ opacity: 0.7 }} />
          <span>Bom (−60 a −70)</span>
        </div>
      </div>

      {suggestedChannel && suggestedChannel !== currentChannel && (
        <div className="lk-channel-chart__recommendation">
          <strong>💡 Sugestão:</strong> Altere para o canal {suggestedChannel} para reduzir interferência.
        </div>
      )}
    </div>
  );
}

/**
 * Agrupa redes próximas por canal e calcula RSSI médio + classificação.
 * Quando `currentBand` é 2.4/5/6 GHz, filtra para mostrar só canais da
 * mesma banda — evita o caso degenerado de 30+ barras com larguras
 * sub-pixel quando o usuário está em 5GHz mas o scan vê 2.4 + 5 + 6.
 */
function analyzeChannels(
  nearbyNetworks?: LocalWifiNetworkInfo[],
  currentBand?: WifiBand,
): ChannelData[] {
  if (!nearbyNetworks || nearbyNetworks.length === 0) {
    return [];
  }

  const channelMap = new Map<number, number[]>();

  nearbyNetworks.forEach((net) => {
    if (!isInBand(net.frequencyMhz, currentBand)) return;
    const channel = frequencyToChannel(net.frequencyMhz);
    if (channel == null) return;
    const list = channelMap.get(channel);
    if (list) {
      list.push(net.rssiDbm);
    } else {
      channelMap.set(channel, [net.rssiDbm]);
    }
  });

  const result: ChannelData[] = Array.from(channelMap.entries()).map(([channel, rssis]) => {
    const avg = rssis.reduce((a, b) => a + b, 0) / rssis.length;
    return {
      channel,
      frequency: channelToFrequency(channel),
      count: rssis.length,
      rssiAverage: Math.round(avg),
      quality: classifyRssi(avg),
    };
  });

  return result.sort((a, b) => a.channel - b.channel);
}

function isInBand(frequencyMhz: number, band?: WifiBand): boolean {
  if (!band || band === 'unknown') return true;
  if (band === '2.4GHz') return frequencyMhz >= 2400 && frequencyMhz <= 2500;
  if (band === '5GHz') return frequencyMhz >= 4900 && frequencyMhz <= 5950;
  if (band === '6GHz') return frequencyMhz >= 5950 && frequencyMhz <= 7200;
  return true;
}

function classifyRssi(rssiDbm: number): 'excellent' | 'good' | 'fair' | 'weak' | 'critical' {
  if (rssiDbm >= -50) return 'excellent';
  if (rssiDbm >= -60) return 'good';
  if (rssiDbm >= -70) return 'fair';
  if (rssiDbm >= -80) return 'weak';
  return 'critical';
}

function frequencyToChannel(frequencyMhz: number): number | null {
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
  return null;
}

function channelToFrequency(channel: number): number {
  if (channel >= 1 && channel <= 13) return 2407 + channel * 5;
  if (channel === 14) return 2484;
  if (channel >= 36 && channel <= 165) return 5000 + channel * 5;
  if (channel >= 1 && channel <= 233) return 5950 + channel * 5;
  return 0;
}
