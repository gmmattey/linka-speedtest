import type { Classification, SpeedTestResult, Tag } from '../types';
import { buildRecommendations } from '../utils/recommendations';
import { Icon } from '../components/icons';
import './RecommendScreen.css';

interface Props {
  result: SpeedTestResult | null;
  quality: string;
  tags: Tag[];
  onBack: () => void;
}

interface StaticRec {
  icon: string;
  title: string;
  body: string;
  cta: string;
}

const STATIC_RECS: StaticRec[] = [
  {
    icon: 'wifi',
    title: 'Mude o canal Wi-Fi',
    body: 'Redes próximas podem estar usando o mesmo canal, causando interferência.',
    cta: 'Como fazer',
  },
  {
    icon: 'router',
    title: 'Reposicione o roteador',
    body: 'Aproxime do centro da casa. Evite atrás da TV ou dentro de armários.',
    cta: 'Ver guia',
  },
  {
    icon: 'bolt',
    title: 'Considere usar cabo',
    body: 'TV e desktop ganham 30%+ na velocidade se conectados via Ethernet.',
    cta: 'Saiba mais',
  },
  {
    icon: 'home',
    title: 'Sistema mesh',
    body: 'Para casas com mais de 3 cômodos com sinal fraco.',
    cta: 'Ver opções',
  },
];

export function RecommendScreen({ result, quality, tags, onBack }: Props) {
  const dynamicRecs = (() => {
    if (!result) return [];
    const classification: Classification = {
      primary: quality as Classification['primary'],
      tags: new Set(tags),
    };
    return buildRecommendations(result, classification, []);
  })();

  const hasDynamic = dynamicRecs.length > 0;

  return (
    <div className="lk-rec-screen fade-in">
      <div className="lk-rec-screen__head">
        <button className="lk-rec-screen__back" onClick={onBack}>‹ Início</button>
        <span className="lk-rec-screen__head-label">Recomendações</span>
      </div>

      <div className="lk-rec-screen__scroll">
        <div className="lk-rec-screen__hero">
          <div className="lk-rec-screen__title">
            {hasDynamic
              ? `${dynamicRecs.length} ${dynamicRecs.length > 1 ? 'ações' : 'ação'} para melhorar sua conexão`
              : '4 ações que podem melhorar seu Wi-Fi'}
          </div>
          <p className="lk-rec-screen__sub">Em ordem de impacto. Comece pela primeira.</p>
        </div>

        {/* Recomendações dinâmicas (baseadas no resultado) */}
        {hasDynamic && dynamicRecs.map((rec, i) => (
          <div key={rec.id} className="lk-rec-screen__card">
            <div className="lk-rec-screen__card-icon">
              <Icon name="bulb" size={16} color="var(--accent)" />
            </div>
            <div className="lk-rec-screen__card-body">
              <div className="lk-rec-screen__card-meta">
                <div className="lk-rec-screen__card-title">{rec.title}</div>
                <span className="lk-rec-screen__card-num">{i + 1} / {dynamicRecs.length}</span>
              </div>
              <div className="lk-rec-screen__card-desc">{rec.description}</div>
            </div>
          </div>
        ))}

        {/* Recomendações estáticas gerais */}
        {!hasDynamic && STATIC_RECS.map((rec, i) => (
          <div key={rec.title} className="lk-rec-screen__card">
            <div className="lk-rec-screen__card-icon">
              <Icon name={rec.icon} size={16} color="var(--accent)" />
            </div>
            <div className="lk-rec-screen__card-body">
              <div className="lk-rec-screen__card-meta">
                <div className="lk-rec-screen__card-title">{rec.title}</div>
                <span className="lk-rec-screen__card-num">{i + 1} / {STATIC_RECS.length}</span>
              </div>
              <div className="lk-rec-screen__card-desc">{rec.body}</div>
              <button className="btn-text lk-rec-screen__cta">
                {rec.cta} <Icon name="chevron" size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
