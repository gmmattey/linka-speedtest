import { Icon } from '../../components/icons';
import { IOSList } from '../../components/IOSList';
import { DraggableSheet } from '../../components/DraggableSheet';
import type { SpeedTestResult } from '../../types';
import { formatMs } from '../../utils/format';
import './GamerSheet.css';

interface Props {
  open: boolean;
  onClose: () => void;
  result: SpeedTestResult;
}

type GamerTone = 'good' | 'maybe' | 'bad';

const GAMER_TONE_COLOR: Record<GamerTone, string> = {
  good: 'var(--success)',
  maybe: 'var(--warn)',
  bad: 'var(--error)',
};

interface GameRow { name: string; verdict: string; tone: GamerTone }

/**
 * Avalia 4 categorias de jogo a partir de latência/jitter/perda/dl.
 * Mantém a mesma lógica do antigo `GamerAccordionBody` (refator
 * arquitetura 2026-05).
 */
function evaluateGames(result: SpeedTestResult): GameRow[] {
  const { latency, jitter, packetLoss, dl } = result;

  const fpsTone: GamerTone   = latency <= 20 && jitter <= 5 && packetLoss === 0 ? 'good' : latency <= 40 ? 'maybe' : 'bad';
  const mobaTone: GamerTone  = latency <= 30 && jitter <= 5 ? 'good' : latency <= 60 ? 'maybe' : 'bad';
  const mmoTone: GamerTone   = latency <= 60 ? 'good' : latency <= 120 ? 'maybe' : 'bad';
  const cloudTone: GamerTone = dl >= 15 && latency <= 40 ? 'good' : dl >= 8 && latency <= 80 ? 'maybe' : 'bad';

  const verdictLabel = (t: GamerTone) => t === 'good' ? 'Excelente' : t === 'maybe' ? 'Atenção' : 'Ruim';

  return [
    { name: 'FPS competitivo',      verdict: verdictLabel(fpsTone),   tone: fpsTone   },
    { name: 'MOBA / Battle Royale', verdict: verdictLabel(mobaTone),  tone: mobaTone  },
    { name: 'MMO / RPG Online',     verdict: verdictLabel(mmoTone),   tone: mmoTone   },
    { name: 'Cloud Gaming',         verdict: verdictLabel(cloudTone), tone: cloudTone },
  ];
}

/**
 * GamerSheet — porto do antigo `GamerAccordionBody`. Estrutura visual:
 * hero (label + ícone gamepad), 3 stat cards (Resposta/Oscilação/Falhas)
 * e lista de jogos por categoria. Usa `DraggableSheet` como base
 * (drag-to-resize com snap 60vh/88vh).
 */
export function GamerSheet({ open, onClose, result }: Props) {
  const { latency, jitter, packetLoss } = result;
  const games = evaluateGames(result);
  const overallTone: GamerTone = latency <= 30 && jitter <= 5 && packetLoss === 0 ? 'good' : latency <= 60 ? 'maybe' : 'bad';
  const overallLabel = overallTone === 'good'
    ? 'Boa para jogos online.'
    : overallTone === 'maybe'
      ? 'Atenção para jogos competitivos.'
      : 'Conexão fraca para jogar online.';

  return (
    <DraggableSheet open={open} onClose={onClose} ariaLabelledBy="lk-gamer-sheet-title">
      <div className="lk-gamer-sheet__inner">
        <header className="lk-gamer-sheet__header">
          <div className="lk-gamer-sheet__title-row">
            <h2 id="lk-gamer-sheet-title" className="lk-gamer-sheet__title">Modo Gamer</h2>
            <button
              type="button"
              className="lk-gamer-sheet__close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <Icon name="close" size={16} color="var(--text-2)" />
            </button>
          </div>
        </header>

        <div className="lk-gamer-sheet__content">
          <section
            className="lk-gamer-sheet__hero"
            style={{ ['--ribbon-color' as never]: GAMER_TONE_COLOR[overallTone] }}
            aria-label="Modo Gamer"
          >
            <div className="lk-gamer-sheet__hero-icon" style={{ color: GAMER_TONE_COLOR[overallTone] }}>
              <Icon name="game" size={26} color={GAMER_TONE_COLOR[overallTone]} />
            </div>
            <div className="lk-gamer-sheet__hero-text">
              <p className="lk-gamer-sheet__hero-kicker">Avaliação</p>
              <p className="lk-gamer-sheet__hero-title">{overallLabel}</p>
            </div>
          </section>

          <section className="lk-gamer-sheet__stats" aria-label="Métricas para jogos">
            <GamerStat label="Resposta"  value={formatMs(latency)}     unit="ms" tone={latency    <= 40 ? 'good' : latency    <= 80 ? 'maybe' : 'bad'} />
            <GamerStat label="Oscilação" value={formatMs(jitter)}      unit="ms" tone={jitter     <= 5  ? 'good' : jitter     <= 20 ? 'maybe' : 'bad'} />
            <GamerStat label="Falhas"    value={packetLoss.toFixed(1)} unit="%"  tone={packetLoss === 0 ? 'good' : packetLoss <= 1  ? 'maybe' : 'bad'} />
          </section>

          <div className="lk-gamer-sheet__group">
            <h4 className="lk-gamer-sheet__group-label">Por categoria de jogo</h4>
            <IOSList
              items={games.map((g) => ({
                icon: <Icon name="game" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: g.name,
                trailing: (
                  <span style={{ color: GAMER_TONE_COLOR[g.tone], fontWeight: 600, fontSize: 12 }}>
                    {g.verdict}
                  </span>
                ),
              }))}
            />
          </div>
        </div>

        <div className="lk-gamer-sheet__footer">
          <button type="button" className="lk-gamer-sheet__cta-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </DraggableSheet>
  );
}

function GamerStat({ label, value, unit, tone }: { label: string; value: string; unit: string; tone: GamerTone }) {
  return (
    <div className="lk-gamer-sheet__stat">
      <div className="lk-gamer-sheet__stat-label">{label}</div>
      <div className="lk-gamer-sheet__stat-value" style={{ color: GAMER_TONE_COLOR[tone] }}>
        {value}<span className="lk-gamer-sheet__stat-unit">{unit}</span>
      </div>
    </div>
  );
}
