import { useMemo } from 'react';
import type { LivePoint } from '../hooks/useSpeedTest';
import './LiveChart.css';

interface Props {
  points: LivePoint[];
  phase: 'latency' | 'download' | 'upload' | 'load' | 'dns' | 'done' | 'idle' | 'error';
}

const VIEW_W = 320;
const VIEW_H = 64;
const PAD_X = 2;
const PAD_Y = 4;

/**
 * Mini-gráfico ao vivo da velocidade instantânea.
 *
 * Renderiza apenas pontos cuja `phase` coincida com a fase atual — assim a
 * série visual é resetada implicitamente quando download → upload.
 *
 * Auto-escala vertical pelo máximo amostrado. Sem libs.
 */
export function LiveChart({ points, phase }: Props) {
  const isActive = phase === 'download' || phase === 'upload';
  const stroke = phase === 'upload' ? 'var(--ul)' : 'var(--dl)';

  const polyline = useMemo(() => {
    if (!isActive) return '';
    const series = points.filter((p) => p.phase === phase);
    if (series.length < 2) return '';
    const t0 = series[0].t;
    const tN = series[series.length - 1].t;
    const dt = Math.max(1, tN - t0);
    const max = Math.max(1, ...series.map((p) => p.speed));
    const innerW = VIEW_W - PAD_X * 2;
    const innerH = VIEW_H - PAD_Y * 2;
    return series
      .map((p) => {
        const x = PAD_X + ((p.t - t0) / dt) * innerW;
        const y = PAD_Y + innerH - (p.speed / max) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, phase, isActive]);

  return (
    <div className="lk-livechart" aria-hidden="true">
      <svg
        className="lk-livechart__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
      >
        {polyline && (
          <polyline
            points={polyline}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}
