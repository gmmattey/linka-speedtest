import type { Classification, SpeedTestResult, Tag } from '../types';
import { buildRecommendations, derivePositiveUsecases, summarizeHistory, PREVENTIVE_TIPS } from '../utils/recommendations';
import { loadHistory } from '../utils/history';
import { Icon } from '../components/icons';
import './RecommendScreen.css';

interface Props {
  result: SpeedTestResult | null;
  quality: string;
  tags: Tag[];
  onBack: () => void;
  onExportPdf?: () => void;
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

export function RecommendScreen({ result, quality, tags, onBack, onExportPdf }: Props) {
  const history = loadHistory();

  const dynamicRecs = (() => {
    if (!result) return [];
    const classification: Classification = {
      primary: quality as Classification['primary'],
      tags: new Set(tags),
    };
    return buildRecommendations(result, classification, history);
  })();

  const hasDynamic = dynamicRecs.length > 0;
  const isGoodConnection = !result || quality === 'excellent' || quality === 'good';

  // ── Dados derivados para o empty-state positivo ───────────────────────────
  const usecases = isGoodConnection && !hasDynamic
    ? derivePositiveUsecases(result)
    : [];
  const historySummary = isGoodConnection && !hasDynamic && result
    ? summarizeHistory(result.dl, history)
    : null;

  return (
    <div className="lk-rec-screen fade-in">
      <div className="lk-rec-screen__head">
        <button className="lk-rec-screen__back" onClick={onBack}>‹ Resultados</button>
        <span className="lk-rec-screen__head-label">Recomendações</span>
        <span aria-hidden="true" />
      </div>

      <div className="lk-rec-screen__scroll">

        {/* ── Estado positivo: conexão boa sem problemas detectados ─────── */}
        {isGoodConnection && !hasDynamic ? (
          <>
            {/* Bloco 1 — Hero de validação */}
            <div className="lk-validation">
              <div className="lk-validation__top">
                <div className="lk-validation__icon">
                  <Icon name="check-circle" size={22} color="var(--success)" />
                </div>
                <div className="lk-validation__title">Tudo dentro do esperado</div>
              </div>
              <p className="lk-validation__sub">
                Velocidade, latência e estabilidade passaram em todos os critérios para o seu uso atual.
              </p>
              {result && (
                <div className="lk-validation__metrics">
                  <div className="lk-metric">
                    <div className="lk-metric__label">Download</div>
                    <div className="lk-metric__value">
                      {result.dl.toFixed(0)}<span className="lk-metric__unit"> Mbps</span>
                    </div>
                  </div>
                  <div className="lk-metric">
                    <div className="lk-metric__label">Latência</div>
                    <div className="lk-metric__value">
                      {result.latency.toFixed(0)}<span className="lk-metric__unit"> ms</span>
                    </div>
                  </div>
                  <div className="lk-metric">
                    <div className="lk-metric__label">Perda</div>
                    <div className="lk-metric__value">
                      {result.packetLoss.toFixed(1)}<span className="lk-metric__unit">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 2 — Casos de uso */}
            {usecases.length > 0 && (
              <div className="lk-section-card">
                <div className="lk-section-card__title">Pronto para</div>
                <div className="lk-usecases">
                  {usecases.map((uc) => (
                    <div key={uc.id} className="lk-usecase">
                      <span className="lk-usecase__name">{uc.label}</span>
                      <span className={`lk-pill lk-pill--${uc.status}`}>
                        {uc.status === 'good' ? 'Bom' : 'Limitado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bloco 3 — Dicas preventivas */}
            <div className="lk-section-card">
              <div className="lk-section-card__title">Mantenha esse padrão</div>
              <div className="lk-tips">
                {PREVENTIVE_TIPS.map((tip) => (
                  <div key={tip.title} className="lk-tip">
                    <span className="lk-tip__bullet" aria-hidden="true" />
                    <div className="lk-tip__body">
                      <div className="lk-tip__title">{tip.title}</div>
                      <div className="lk-tip__desc">{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 4 — Comparativo histórico (condicional) */}
            {historySummary && (
              <div className="lk-history-card">
                <div className="lk-history-card__icon">
                  <Icon name="trending-up" size={18} color="var(--accent)" />
                </div>
                <div className="lk-history-card__body">
                  <div className="lk-history-card__title">
                    {historySummary.deltaPct >= 0
                      ? `${historySummary.deltaPct}% acima da sua média de 30 dias`
                      : `${Math.abs(historySummary.deltaPct)}% abaixo da sua média de 30 dias`}
                  </div>
                  <div className="lk-history-card__sub">
                    {historySummary.count} testes recentes
                  </div>
                </div>
              </div>
            )}

            {/* Bloco 5 — CTAs */}
            <div className="lk-actions">
              <button className="lk-btn-primary" onClick={onBack}>
                <Icon name="refresh" size={16} color="#fff" />
                Refazer teste
              </button>
              {onExportPdf && (
                <button className="lk-btn-outline" onClick={onExportPdf}>
                  <Icon name="document" size={14} color="var(--accent)" />
                  Gerar laudo (PDF)
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* ── Estados originais: dinâmico + dicas gerais ─────────────── */}
            <div className="lk-rec-screen__hero">
              <div className="lk-rec-screen__title">
                {hasDynamic
                  ? `${dynamicRecs.length} ${dynamicRecs.length > 1 ? 'melhorias' : 'melhoria'} identificada${dynamicRecs.length > 1 ? 's' : ''}`
                  : 'Dicas gerais de otimização'}
              </div>
              <p className="lk-rec-screen__sub">
                {hasDynamic
                  ? 'Com base no resultado do seu teste. Em ordem de impacto.'
                  : 'Ações que geralmente melhoram a qualidade da conexão em casa.'}
              </p>
            </div>

            {hasDynamic && (
              <>
                {dynamicRecs.map((rec, i) => (
                  <div key={rec.id} className="lk-rec-screen__card lk-rec-screen__card--dynamic">
                    <div className="lk-rec-screen__card-icon">
                      <Icon name="bulb" size={16} color="var(--accent)" />
                    </div>
                    <div className="lk-rec-screen__card-body">
                      <div className="lk-rec-screen__card-meta">
                        <div className="lk-rec-screen__card-title">{rec.title}</div>
                        <span className="lk-rec-screen__card-num">{i + 1}</span>
                      </div>
                      <div className="lk-rec-screen__card-desc">{rec.description}</div>
                    </div>
                  </div>
                ))}
                <p className="lk-rec-screen__section-label">Dicas gerais</p>
              </>
            )}

            {STATIC_RECS.map((rec) => (
              <div key={rec.title} className="lk-rec-screen__card">
                <div className="lk-rec-screen__card-icon">
                  <Icon name={rec.icon} size={16} color="var(--text-3)" />
                </div>
                <div className="lk-rec-screen__card-body">
                  <div className="lk-rec-screen__card-title">{rec.title}</div>
                  <div className="lk-rec-screen__card-desc">{rec.body}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
