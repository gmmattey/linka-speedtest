import { formatMbps } from '../utils/format';
import './Gauge.css';

interface Props {
  instantMbps: number | null;
  unit?: 'mbps' | 'gbps';
}

export function Gauge({ instantMbps, unit = 'mbps' }: Props) {
  const value = instantMbps != null ? formatMbps(instantMbps, unit) : '—';
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  return (
    <div className="lk-gauge">
      <div className="lk-gauge__value">{value}</div>
      <div className="lk-gauge__unit">{unitLabel}</div>
    </div>
  );
}
