import type { ConnectionType, SpeedTestResult } from '../types';
import { Icon } from '../components/icons';
import './DiagnosticScreen.css';

interface Props {
  result: SpeedTestResult;
  connectionType: ConnectionType | null;
  onBack: () => void;
  onRecommend?: () => void;
}

type Tone = 'good' | 'maybe' | 'bad';

interface DiagCard {
  icon: string;
  title: string;
  verdict: string;
  note: string;
  tone: Tone;
}

function buildCards(result: SpeedTestResult, connectionType: ConnectionType | null): DiagCard[] {
  const { dl, ul, latency, jitter, packetLoss } = result;

  const internetTone: Tone = dl >= 25 ? 'good' : dl >= 5 ? 'maybe' : 'bad';
  const responseTone: Tone = latency <= 60 ? 'good' : latency <= 100 ? 'maybe' : 'bad';
  const jitterTone: Tone = jitter <= 15 ? 'good' : jitter <= 30 ? 'maybe' : 'bad';
  const lossTone: Tone = packetLoss === 0 ? 'good' : packetLoss <= 1 ? 'maybe' : 'bad';
  const wifiTone: Tone = connectionType !== 'wifi' ? 'good' : latency <= 60 ? 'good' : 'maybe';

  const goodUseCases = [dl >= 25, ul >= 5, latency <= 60, jitter <= 15, packetLoss <= 0.5].filter(Boolean).length;
  const useTone: Tone = goodUseCases >= 4 ? 'good' : goodUseCases >= 2 ? 'maybe' : 'bad';

  const verdict = (tone: Tone, g: string, m: string, b: string) => tone === 'good' ? g : tone === 'maybe' ? m : b;

  return [
    {
      icon: 'bolt',
      title: 'Internet',
      verdict: verdict(internetTone, 'Aprovado', 'Atenção', 'Falha'),
      note: internetTone === 'good'
        ? 'Velocidade compatível com uso diário.'
        : internetTone === 'maybe'
          ? 'Velocidade abaixo do recomendado para 4K e multi-dispositivos.'
          : 'Velocidade muito baixa — impacta a maioria dos usos.',
      tone: internetTone,
    },
    {
      icon: 'wifi',
      title: 'Wi-Fi',
      verdict: verdict(wifiTone, 'Aprovado', 'Atenção', 'Falha'),
      note: connectionType !== 'wifi'
        ? 'Conexão cabeada — sem dependência de sinal Wi-Fi.'
        : wifiTone === 'good'
          ? 'Sinal estável. Latência dentro do esperado para Wi-Fi.'
          : 'Latência elevada pode indicar sinal fraco ou congestionamento.',
      tone: wifiTone,
    },
    {
      icon: 'ping',
      title: 'Resposta',
      verdict: verdict(responseTone, 'Aprovado', 'Atenção', 'Falha'),
      note: responseTone === 'good'
        ? `${Math.round(latency)} ms — dentro do esperado para uso diário.`
        : responseTone === 'maybe'
          ? `${Math.round(latency)} ms — aceitável, mas pode afetar jogos competitivos.`
          : `${Math.round(latency)} ms — latência alta compromete chamadas e jogos.`,
      tone: responseTone,
    },
    {
      icon: 'jitter',
      title: 'Oscilação',
      verdict: verdict(jitterTone, 'Aprovado', 'Atenção', 'Falha'),
      note: jitterTone === 'good'
        ? `Oscilação ${jitter.toFixed(1)} ms — variação dentro do esperado.`
        : jitterTone === 'maybe'
          ? `Oscilação ${jitter.toFixed(1)} ms — perceptível em chamadas.`
          : `Oscilação ${jitter.toFixed(1)} ms — conexão instável.`,
      tone: jitterTone,
    },
    {
      icon: 'loss',
      title: 'Falhas',
      verdict: verdict(lossTone, 'Aprovado', 'Atenção', 'Falha'),
      note: lossTone === 'good'
        ? 'Sem perda de pacotes detectada.'
        : lossTone === 'maybe'
          ? `${packetLoss.toFixed(1)}% de perda — pode causar engasgos.`
          : `${packetLoss.toFixed(1)}% de perda — conexão com problemas sérios.`,
      tone: lossTone,
    },
    {
      icon: 'shield',
      title: 'Qualidade por uso',
      verdict: `${goodUseCases} de 5`,
      note: useTone === 'good'
        ? 'Conexão adequada para praticamente todos os usos.'
        : useTone === 'maybe'
          ? 'Alguns usos intensivos podem oscilar.'
          : 'Conexão limitada — usos básicos apenas.',
      tone: useTone,
    },
  ];
}

const TONE_COLOR: Record<Tone, string> = {
  good:  'var(--success)',
  maybe: 'var(--warn)',
  bad:   'var(--error)',
};

const TONE_BG: Record<Tone, string> = {
  good:  'var(--color-good-bg)',
  maybe: 'var(--color-warn-bg)',
  bad:   'var(--color-bad-bg)',
};

export function DiagnosticScreen({ result, connectionType, onBack, onRecommend }: Props) {
  const cards = buildCards(result, connectionType);
  const approvedCount = cards.filter((c) => c.tone === 'good').length;
  const hasProblems = approvedCount < cards.length;

  return (
    <div className="lk-diag fade-in">
      <div className="lk-diag__head">
        <button className="lk-diag__back" onClick={onBack}>‹ Resultados</button>
        <span className="lk-diag__head-label">Diagnóstico</span>
        <span aria-hidden="true" />
      </div>

      <div className="lk-diag__scroll">
        <div className="lk-diag__hero">
          <div className="lk-diag__hero-title">
            {approvedCount} de 6 áreas{' '}
            <span style={{ color: approvedCount >= 5 ? 'var(--success)' : 'var(--warn)' }}>OK</span>
          </div>
          <p className="lk-diag__hero-sub">
            {approvedCount >= 5
              ? 'Sua conexão está saudável.'
              : approvedCount >= 3
                ? 'Alguns pontos de atenção encontrados.'
                : 'Sua conexão apresenta problemas significativos.'}
          </p>
        </div>

        <div className="lk-diag__grid">
          {cards.map((card) => (
            <div key={card.title} className={`lk-diag__card lk-diag__card--${card.tone}`}>
              <div className="lk-diag__card-top">
                <div
                  className="lk-diag__card-icon"
                  style={{ background: TONE_BG[card.tone], color: TONE_COLOR[card.tone] }}
                >
                  <Icon name={card.icon} size={14} />
                </div>
                <span
                  className="lk-diag__card-badge"
                  style={{ background: TONE_BG[card.tone], color: TONE_COLOR[card.tone] }}
                >
                  {card.verdict}
                </span>
              </div>
              <div className="lk-diag__card-title">{card.title}</div>
              <div className="lk-diag__card-note">{card.note}</div>
            </div>
          ))}
        </div>

        {hasProblems && onRecommend && (
          <div className="lk-diag__recommend-cta">
            <p className="lk-diag__recommend-text">
              Encontramos pontos de melhoria. Veja como resolver.
            </p>
            <button className="btn-primary lk-diag__recommend-btn" onClick={onRecommend}>
              <Icon name="bulb" size={16} />Ver recomendações
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
