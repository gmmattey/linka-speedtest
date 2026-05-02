import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import { formatMbps, formatMs } from '../utils/format';
import type { ServerInfo, SpeedTestResult } from '../types';
import './DetailsScreen.css';

interface Props {
  result: SpeedTestResult;
  server: ServerInfo | null;
  unit?: 'mbps' | 'gbps';
  onBack: () => void;
}

function bufferbloatColor(grade: string): string {
  if (grade === 'A' || grade === 'B') return 'var(--ul)';
  if (grade === 'C') return 'var(--warn)';
  return 'var(--error)';
}

function bufferbloatLabel(grade: string): string {
  if (grade === 'A') return 'Excelente';
  if (grade === 'B') return 'Bom';
  if (grade === 'C') return 'Moderado';
  if (grade === 'D') return 'Ruim';
  return 'Crítico';
}

function packetLossColor(pct: number): string {
  if (pct < 1) return 'var(--ul)';
  if (pct < 2.5) return 'var(--warn)';
  return 'var(--error)';
}

function packetLossLabel(pct: number): string {
  if (pct < 1) return 'Baixo';
  if (pct < 2.5) return 'Médio';
  return 'Alto';
}

export function DetailsScreen({ result, server, unit = 'mbps', onBack }: Props) {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  const hasQualityData = !!(
    result.bufferbloatGrade ||
    result.latencyLoaded != null ||
    result.jitterLoaded != null ||
    (result.dlP25 != null && result.dlP75 != null)
  );

  return (
    <div className="lk-details fade-in">
      <div className="lk-details__head">
        <button className="lk-details__back" onClick={onBack}>‹ Resultado</button>
        <span className="lk-details__head-label">Detalhes</span>
        <span />
      </div>

      <div className="lk-details__scroll">

        <div className="lk-details__section">
          <p className="lk-details__section-label">Conexão</p>
          <IOSList
            items={[
              {
                icon: <Icon name="loss" size={14} color={result.packetLoss != null ? packetLossColor(result.packetLoss) : 'var(--text-2)'} />,
                iconBg: 'var(--surface-3)',
                title: 'Falhas na conexão',
                trailing: (
                  <span className="lk-details__metric-sub" style={result.packetLoss != null ? { color: packetLossColor(result.packetLoss) } : undefined}>
                    {result.packetLoss != null ? `${result.packetLoss.toFixed(1)}%  ${packetLossLabel(result.packetLoss)}` : '—'}
                  </span>
                ),
              },
              ...(server?.isp && server.isp !== '—' ? [{
                icon: <Icon name="router" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Provedor',
                trailing: (
                  <span className="lk-details__metric-sub lk-details__metric-sub--truncate">
                    {server.isp}
                  </span>
                ),
              }] : []),
            ]}
          />
        </div>

        {hasQualityData && (
          <div className="lk-details__section">
            <p className="lk-details__section-label">Qualidade sob carga</p>
            <IOSList
              items={[
                ...(result.bufferbloatGrade ? [{
                  icon: <Icon name="bolt" size={14} color={bufferbloatColor(result.bufferbloatGrade)} />,
                  iconBg: 'var(--surface-3)',
                  title: 'Latência sob carga',
                  trailing: (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: bufferbloatColor(result.bufferbloatGrade!), fontWeight: 700, fontSize: 15 }}>
                        {result.bufferbloatGrade}
                      </div>
                      <div style={{ fontSize: 11, color: bufferbloatColor(result.bufferbloatGrade!) }}>
                        {bufferbloatLabel(result.bufferbloatGrade!)}
                      </div>
                    </div>
                  ),
                }] : []),
                ...(result.latencyLoaded != null ? [{
                  icon: <Icon name="ping" size={14} color="var(--text-2)" />,
                  iconBg: 'var(--surface-3)',
                  title: 'Latência carregada',
                  trailing: (
                    <span className="lk-details__metric-sub">
                      {formatMs(result.latencyLoaded)} ms
                      {result.bufferbloatDeltaMs != null && result.bufferbloatDeltaMs > 0 && (
                        <span style={{ color: 'var(--warn)', fontSize: 11, marginLeft: 4 }}>
                          +{formatMs(result.bufferbloatDeltaMs)} ms
                        </span>
                      )}
                    </span>
                  ),
                }] : []),
                ...(result.jitterLoaded != null ? [{
                  icon: <Icon name="jitter" size={14} color="var(--text-2)" />,
                  iconBg: 'var(--surface-3)',
                  title: 'Oscilação carregada',
                  trailing: (
                    <span className="lk-details__metric-sub">
                      {formatMs(result.jitterLoaded)} ms
                    </span>
                  ),
                }] : []),
                ...(result.dlP25 != null && result.dlP75 != null ? [{
                  icon: <Icon name="download" size={14} color="var(--dl)" />,
                  iconBg: 'var(--dl-tint, rgba(58,182,255,0.12))',
                  title: 'Estabilidade download',
                  trailing: (
                    <span className="lk-details__metric-sub">
                      {formatMbps(result.dlP25, unit)}–{formatMbps(result.dlP75, unit)} {unitLabel}
                    </span>
                  ),
                }] : []),
              ]}
            />
          </div>
        )}

      </div>
    </div>
  );
}
