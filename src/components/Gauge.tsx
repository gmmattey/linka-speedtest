import './Gauge.css';

interface Props {
  value: number;       // 0–1 fill progress
  phase: string;       // ex: 'DOWNLOAD' | 'UPLOAD' | 'LATÊNCIA'
  num: string;         // número a exibir no centro
  unit: string;        // ex: 'Mbps' | 'ms'
  color: string;       // CSS color ou var()
  size?: number;       // diâmetro do gauge (default 220)
}

export function Gauge({ value, phase, num, unit, color, size = 220 }: Props) {
  const r = 92;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, value)));
  const cx = size / 2;
  const vb = size;

  return (
    <div className="lk-gauge" style={{ width: size, height: size }}>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${vb} ${vb}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth="8"
        />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            // Glow sutil no arco ativo (Bloco 3 — Polimento, 2026-05).
            // O blur escala levemente com o progresso da fase (4-7px) para
            // dar a sensação de "ganhar energia" enquanto a barra completa.
            // Cor herda do `stroke`, então o glow muda com a fase (DL=azul,
            // UL=verde, accent=lilás). `filter` é animado para acompanhar
            // a transição do dashoffset.
            transition: 'stroke-dashoffset 0.5s ease, filter 0.5s ease',
            filter: `drop-shadow(0 0 ${4 + value * 3}px ${color})`,
          }}
        />
      </svg>
      <div className="lk-gauge__center">
        <div className="lk-gauge__phase" style={{ color }}>{phase}</div>
        <div className="lk-gauge__num" style={{ color }}>{num}</div>
        <div className="lk-gauge__unit">{unit}</div>
      </div>
    </div>
  );
}
