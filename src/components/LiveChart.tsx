import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import type { LivePoint } from '../hooks/useSpeedTest';

interface Props {
  data: LivePoint[];
  scale?: 'linear' | 'log';
}

export function LiveChart({ data, scale = 'linear' }: Props) {
  return (
    <div style={{ width: '100%', height: 200, marginTop: 'auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="lk-speed-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C2BFF" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#6C2BFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, 'auto']} scale={scale === 'log' ? 'log' : 'auto'} allowDataOverflow />
          <Area
            type="monotone"
            dataKey="speed"
            stroke="#6C2BFF"
            strokeWidth={2}
            fill="url(#lk-speed-fill)"
            isAnimationActive={false}
            connectNulls
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
