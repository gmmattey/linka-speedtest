import { useMemo } from 'react';
import type { LocalWifiNetworkInfo } from './types';
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
  suggestedChannel?: number;
  isLoading?: boolean;
}

export function ChannelQualityChart({
  nearbyNetworks,
  currentChannel,
  suggestedChannel,
  isLoading,
}: ChannelQualityChartProps) {
  const channels = useMemo(
    () => analyzeChannels(nearbyNetworks),
    [nearbyNetworks]
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
        Nenhum canal detectado
      </div>
    );
  }

  const maxCount = Math.max(...channels.map((c) => c.count), 1);

  return (
    <div className="lk-channel-chart">
      <div className="lk-channel-chart__bars">
        {channels.map((ch) => (
          <div key={ch.channel} className="lk-channel-chart__bar-container">
            <div
              className={`lk-channel-chart__bar lk-channel-chart__bar--${ch.quality} ${
                ch.channel === currentChannel
                  ? 'lk-channel-chart__bar--current'
                  : ''
              } ${
                ch.channel === suggestedChannel
                  ? 'lk-channel-chart__bar--suggested'
                  : ''
              }`}
              style={{
                height: `${(ch.count / maxCount) * 100}%`,
                minHeight: '12px',
              }}
              title={`Canal ${ch.channel}: ${ch.count} AP(s), RSSI médio ${ch.rssiAverage} dBm`}
            >
              {ch.count > 0 && (
                <span className="lk-channel-chart__bar-label">{ch.count}</span>
              )}
            </div>

            <div className="lk-channel-chart__channel-label">
              {ch.channel}
              {ch.channel === currentChannel && (
                <span className="lk-badge">Atual</span>
              )}
              {ch.channel === suggestedChannel && (
                <span className="lk-badge lk-badge--suggested">Recomendado</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="lk-channel-chart__legend">
        <div className="lk-channel-chart__legend-item">
          <span className="lk-channel-chart__legend-color lk-channel-chart__legend-color--excellent" />
          <span>Excelente (-50 a -60)</span>
        </div>
        <div className="lk-channel-chart__legend-item">
          <span className="lk-channel-chart__legend-color lk-channel-chart__legend-color--good" />
          <span>Bom (-60 a -70)</span>
        </div>
        <div className="lk-channel-chart__legend-item">
          <span className="lk-channel-chart__legend-color lk-channel-chart__legend-color--fair" />
          <span>Aceitável (-70 a -80)</span>
        </div>
        <div className="lk-channel-chart__legend-item">
          <span className="lk-channel-chart__legend-color lk-channel-chart__legend-color--weak" />
          <span>Fraco (&lt;-80)</span>
        </div>
      </div>

      {suggestedChannel && suggestedChannel !== currentChannel && (
        <div className="lk-channel-chart__recommendation">
          <strong>💡 Sugestão:</strong> Altere para o canal {suggestedChannel} para
          melhor qualidade.
        </div>
      )}
    </div>
  );
}

function analyzeChannels(
  nearbyNetworks?: LocalWifiNetworkInfo[]
): ChannelData[] {
  if (!nearbyNetworks || nearbyNetworks.length === 0) {
    return [];
  }

  const channelMap = new Map<number, number[]>();

  nearbyNetworks.forEach((net) => {
    const channel = frequencyToChannel(net.frequencyMhz);
    if (channel) {
      if (!channelMap.has(channel)) {
        channelMap.set(channel, []);
      }
      channelMap.get(channel)!.push(net.rssiDbm);
    }
  });

  const result: ChannelData[] = Array.from(channelMap.entries()).map(
    ([channel, rssis]) => ({
      channel,
      frequency: channelToFrequency(channel),
      count: rssis.length,
      rssiAverage: Math.round(rssis.reduce((a, b) => a + b, 0) / rssis.length),
      quality: classifyRssi(
        rssis.reduce((a, b) => a + b, 0) / rssis.length
      ),
    })
  );

  return result.sort((a, b) => a.channel - b.channel);
}

function classifyRssi(
  rssiDbm: number
): 'excellent' | 'good' | 'fair' | 'weak' | 'critical' {
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
  if (channel >= 1 && channel <= 13) {
    return 2407 + channel * 5;
  }
  if (channel === 14) return 2484;
  if (channel >= 36 && channel <= 165) {
    return 5000 + channel * 5;
  }
  if (channel >= 1 && channel <= 233) {
    return 5950 + channel * 5;
  }
  return 0;
}
