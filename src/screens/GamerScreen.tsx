import type { SpeedTestResult } from '../types';
import { IOSList } from '../components/IOSList';
import { Chip } from '../components/Chip';
import { Icon } from '../components/icons';
import { formatMs } from '../utils/format';
import './GamerScreen.css';

interface Props {
  result: SpeedTestResult;
  onBack: () => void;
  onRetest: () => void;
}

type Tone = 'good' | 'maybe' | 'bad';

interface GameRow {
  name: string;
  games: string;
  req: string;
  verdict: string;
  tone: Tone;
  tip?: string;
}

function evaluateGames(result: SpeedTestResult): GameRow[] {
  const { latency, jitter, packetLoss, dl } = result;

  const fpsTone: Tone  = latency <= 20 && jitter <= 5 && packetLoss === 0 ? 'good' : latency <= 40 ? 'maybe' : 'bad';
  const mobaTone: Tone = latency <= 30 && jitter <= 5 ? 'good' : latency <= 60 ? 'maybe' : 'bad';
  const mmoTone: Tone  = latency <= 60 ? 'good' : latency <= 120 ? 'maybe' : 'bad';
  const cloudTone: Tone = dl >= 15 && latency <= 40 ? 'good' : dl >= 8 && latency <= 80 ? 'maybe' : 'bad';

  const verdictLabel = (t: Tone) => t === 'good' ? 'Excelente' : t === 'maybe' ? 'Atenção' : 'Ruim';

  return [
    {
      name: 'FPS competitivo',
      games: 'Valorant, CS2, Warzone, Apex',
      req: 'Ping < 20ms · Oscilação < 5ms · Sem perda',
      verdict: verdictLabel(fpsTone),
      tone: fpsTone,
      tip: fpsTone !== 'good' ? 'Conecte via cabo e feche apps em segundo plano.' : undefined,
    },
    {
      name: 'MOBA / Battle Royale',
      games: 'LoL, Dota 2, PUBG, Free Fire',
      req: 'Ping < 30ms · Oscilação < 5ms',
      verdict: verdictLabel(mobaTone),
      tone: mobaTone,
      tip: mobaTone !== 'good' ? 'Fique próximo ao roteador ou use cabo.' : undefined,
    },
    {
      name: 'MMO / RPG Online',
      games: 'WoW, FF14, GTA Online, Diablo IV',
      req: 'Ping < 60ms',
      verdict: verdictLabel(mmoTone),
      tone: mmoTone,
      tip: mmoTone === 'bad' ? 'Latência alta impacta movimentação em tempo real.' : undefined,
    },
    {
      name: 'Cloud Gaming',
      games: 'GeForce Now, Xbox Cloud, PlayStation Now',
      req: 'Download > 15 Mbps · Ping < 40ms',
      verdict: verdictLabel(cloudTone),
      tone: cloudTone,
      tip: cloudTone !== 'good' ? 'Cloud gaming precisa de conexão estável e rápida.' : undefined,
    },
  ];
}

const TONE_COLOR: Record<Tone, string> = {
  good:  'var(--success)',
  maybe: 'var(--warn)',
  bad:   'var(--error)',
};

export function GamerScreen({ result, onBack, onRetest }: Props) {
  const { latency, jitter, packetLoss } = result;
  const games = evaluateGames(result);

  const overallTone: Tone = latency <= 30 && jitter <= 5 && packetLoss === 0 ? 'good' : latency <= 60 ? 'maybe' : 'bad';
  const overallLabel = overallTone === 'good' ? 'Ótima para FPS competitivo.' : overallTone === 'maybe' ? 'Adequada para maioria dos jogos.' : 'Não recomendada para jogos competitivos.';

  return (
    <div className="lk-gamer fade-in">
      <div className="lk-gamer__head">
        <button className="lk-gamer__back" onClick={onBack}>‹ Resultados</button>
        <span className="lk-gamer__head-label">Modo Gamer</span>
      </div>

      <div className="lk-gamer__scroll">
        <div className="lk-gamer__hero">
          <Chip variant="accent">
            <Icon name="game" size={11} />Otimizado p/ jogos
          </Chip>
          <div className="lk-gamer__title">{overallLabel}</div>
          <p className="lk-gamer__sub">Resposta, oscilação e falhas — o que importa em jogo.</p>
        </div>

        {/* Stats 3-col */}
        <div className="lk-gamer__stats">
          <StatCard label="Ping" value={`${formatMs(latency)}`} unit="ms" tone={latency <= 40 ? 'good' : latency <= 80 ? 'maybe' : 'bad'} />
          <StatCard label="Oscilação" value={`${formatMs(jitter)}`} unit="ms" tone={jitter <= 5 ? 'good' : jitter <= 20 ? 'maybe' : 'bad'} />
          <StatCard label="Perda" value={`${packetLoss.toFixed(1)}`} unit="%" tone={packetLoss === 0 ? 'good' : packetLoss <= 1 ? 'maybe' : 'bad'} />
        </div>

        {/* Game rows */}
        <IOSList
          items={games.map((g) => ({
            icon: <Icon name="game" size={14} color="var(--text-2)" />,
            iconBg: 'var(--surface-3)',
            title: g.name,
            subtitle: g.games,
            trailing: (
              <span style={{ color: TONE_COLOR[g.tone], fontWeight: 600, fontSize: 12 }}>
                {g.verdict}
              </span>
            ),
          }))}
        />

        {/* Requisitos e dicas */}
        {games.some((g) => g.tone !== 'good') && (
          <div className="lk-gamer__tips">
            <p className="lk-gamer__tips-label">Requisitos mínimos</p>
            {games.map((g) => (
              <div key={g.name} className="lk-gamer__req-row">
                <span className="lk-gamer__req-name">{g.name}</span>
                <span className="lk-gamer__req-val" style={{ color: TONE_COLOR[g.tone] }}>{g.req}</span>
              </div>
            ))}
          </div>
        )}

        {overallTone !== 'good' && (
          <div className="lk-gamer__suggestion">
            <Icon name="bulb" size={14} color="var(--warn)" />
            <p className="lk-gamer__suggestion-text">
              {overallTone === 'maybe'
                ? 'Para melhorar: conecte via cabo e evite downloads simultâneos durante o jogo.'
                : 'Conexão não recomendada para jogos competitivos. Verifique sua internet ou use Wi-Fi 5 GHz.'}
            </p>
          </div>
        )}

        <div className="lk-gamer__cta">
          <button className="btn-primary lk-gamer__retest" onClick={onRetest}>
            <Icon name="refresh" size={16} />Refazer teste
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, tone }: { label: string; value: string; unit: string; tone: Tone }) {
  return (
    <div className="lk-gamer__stat">
      <div className="lk-gamer__stat-label">{label}</div>
      <div className="lk-gamer__stat-value" style={{ color: TONE_COLOR[tone] }}>
        {value}<span className="lk-gamer__stat-unit">{unit}</span>
      </div>
    </div>
  );
}
