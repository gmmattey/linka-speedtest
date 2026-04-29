import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { IconGames, IconStream, IconWork, IconVideoCall, IconPdf, IconShare } from '../components/icons';
import type { ServerInfo, SpeedTestResult, TestRecord } from '../types';
import {
  buildDiagnosis,
  classify,
  qualityHeadline,
  stability,
  stabilityLabel,
  tagLabel,
} from '../utils/classifier';
import { loadHistory } from '../utils/history';
import { buildRecommendations } from '../utils/recommendations';
import { formatDate, formatMbps, formatMs } from '../utils/format';
import { exportResultPdf } from '../utils/pdfExport';
import './ResultScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  result: SpeedTestResult;
  server: ServerInfo | null;
  previous: TestRecord | null;
  onRetry: () => void;
  onShowHistory: () => void;
  unit?: 'mbps' | 'gbps';
  hideIpOnShare?: boolean;
}

type UseCaseStatus = 'good' | 'maybe' | 'limited';
type ShareStatus = 'idle' | 'copied';

interface UseCase {
  key: string;
  Icon: React.ComponentType<{ size?: number }>;
  label: string;
  evaluate: (r: SpeedTestResult) => UseCaseStatus;
}

const USE_CASES: UseCase[] = [
  {
    key: 'games', Icon: IconGames, label: 'Games online',
    evaluate(r) {
      if (r.dl >= 10 && r.latency <= 40 && r.jitter <= 20 && r.packetLoss <= 0.5) return 'good';
      if (r.dl >= 5 && r.latency <= 80) return 'maybe';
      return 'limited';
    },
  },
  {
    key: '4k', Icon: IconStream, label: 'Streaming 4K',
    evaluate(r) {
      if (r.dl >= 25) return 'good';
      if (r.dl >= 10) return 'maybe';
      return 'limited';
    },
  },
  {
    key: 'ho', Icon: IconWork, label: 'Home Office',
    evaluate(r) {
      if (r.dl >= 10 && r.ul >= 5 && r.latency <= 100) return 'good';
      if (r.dl >= 5 && r.ul >= 2) return 'maybe';
      return 'limited';
    },
  },
  {
    key: 'video', Icon: IconVideoCall, label: 'Videochamada',
    evaluate(r) {
      if (r.dl >= 5 && r.ul >= 2 && r.latency <= 100 && r.jitter <= 30) return 'good';
      if (r.dl >= 2 && r.ul >= 1 && r.latency <= 150) return 'maybe';
      return 'limited';
    },
  },
];

const STATUS_LABEL: Record<UseCaseStatus, string> = {
  good: 'Bom', maybe: 'Pode falhar', limited: 'Limitado',
};

export function buildShareText(result: SpeedTestResult, primary: ReturnType<typeof classify>['primary'], unit: 'mbps' | 'gbps' = 'mbps'): string {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  return [
    `linka SpeedTest — ${qualityHeadline(primary)}`,
    `↓ ${formatMbps(result.dl, unit)} ${unitLabel} · ↑ ${formatMbps(result.ul, unit)} ${unitLabel}`,
    `Resposta ${formatMs(result.latency)} ms · Oscilação ${formatMs(result.jitter)} ms`,
    formatDate(result.timestamp),
  ].join('\n');
}

export async function shareResultText(text: string): Promise<'shared' | 'copied' | 'none'> {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'linka SpeedTest', text });
      return 'shared';
    } catch {
      return 'none';
    }
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'none';
    }
  }

  return 'none';
}

export function ResultScreen({
  theme, onToggleTheme, result, server, previous,
  onRetry, onShowHistory, unit = 'mbps', hideIpOnShare = true,
}: Props) {
  const classification = useMemo(() => classify(result), [result]);
  const history = useMemo(() => loadHistory(), []);
  const diagnosis = useMemo(
    () => buildDiagnosis(result, classification, history),
    [result, classification, history],
  );
  const stab = useMemo(() => stability(result), [result]);
  const recommendations = useMemo(
    () => buildRecommendations(result, classification, history),
    [result, classification, history], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const shareResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (shareResetTimeoutRef.current) {
      clearTimeout(shareResetTimeoutRef.current);
    }
  }, []);

  const handleShare = async () => {
    const text = buildShareText(result, classification.primary, unit);
    const outcome = await shareResultText(text);

    if (outcome === 'copied') {
      setShareStatus('copied');
      if (shareResetTimeoutRef.current) {
        clearTimeout(shareResetTimeoutRef.current);
      }
      shareResetTimeoutRef.current = setTimeout(() => {
        setShareStatus('idle');
        shareResetTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handlePdf = async () => {
    try { await exportResultPdf(result, server?.name ?? 'Cloudflare', server?.isp); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="lk-result">
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main className="lk-result__main fade-in">

        <section className={`lk-banner lk-banner--${classification.primary}`}>
          <div className="lk-banner__icon" aria-hidden="true">
            {classification.primary === 'slow' || classification.primary === 'unavailable' ? '✗'
              : classification.primary === 'fair' ? '!' : '✓'}
          </div>
          <div className="lk-banner__body">
            <div className="lk-banner__title">{qualityHeadline(classification.primary)}</div>
            {classification.tags.size > 0 && (
              <div className="lk-banner__tags">
                {Array.from(classification.tags).map((t) => (
                  <span key={t} className="lk-chip">{tagLabel(t)}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="lk-primary">
          <div className="lk-primary__col">
            <div className="lk-primary__label">↓ Download</div>
            <div className="lk-primary__value lk-primary__value--dl numeric">
              {formatMbps(result.dl, unit)}<span className="lk-primary__unit">{unitLabel}</span>
            </div>
          </div>
          <div className="lk-primary__divider" />
          <div className="lk-primary__col">
            <div className="lk-primary__label">↑ Upload</div>
            <div className="lk-primary__value lk-primary__value--ul numeric">
              {formatMbps(result.ul, unit)}<span className="lk-primary__unit">{unitLabel}</span>
            </div>
          </div>
        </section>

        <section className="lk-secondary">
          <div className="lk-secondary__col">
            <div className="lk-secondary__value numeric">{formatMs(result.latency)} ms</div>
            <div className="lk-secondary__label">Resposta</div>
          </div>
          <div className="lk-secondary__col">
            <div className="lk-secondary__value numeric">{formatMs(result.jitter)} ms</div>
            <div className="lk-secondary__label">Oscilação</div>
          </div>
          <div className="lk-secondary__col">
            <div className="lk-secondary__value lk-secondary__value--stab">{stabilityLabel(stab)}</div>
            <div className="lk-secondary__label">Estabilidade</div>
          </div>
        </section>

        <section className="lk-section">
          <h3 className="lk-section__title">O que isso significa?</h3>
          {diagnosis.map((p, i) => <p key={i} className="lk-section__paragraph">{p}</p>)}
        </section>

        {recommendations.length > 0 && (
          <section className="lk-section lk-whatnow">
            <h3 className="lk-section__title">O que fazer agora</h3>
            <ul className="lk-rec-list">
              {recommendations.map((r) => (
                <li key={r.id} className={`lk-rec lk-rec--${r.priority}`}>
                  <span className="lk-rec__title">{r.title}</span>
                  <span className="lk-rec__desc">{r.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="lk-section">
          <h3 className="lk-section__title">Para o que sua internet serve?</h3>
          <div className="lk-usegrid">
            {USE_CASES.map((uc) => {
              const status = uc.evaluate(result);
              return (
                <div key={uc.key} className="lk-usecase">
                  <div className="lk-usecase__icon"><uc.Icon size={20} /></div>
                  <div className="lk-usecase__label">{uc.label}</div>
                  <span className={`lk-chip lk-chip--${status}`}>{STATUS_LABEL[status]}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lk-section">
          <h3 className="lk-section__title">Detalhes</h3>
          <dl className="lk-details">
            <div><dt>Servidor</dt><dd>{server?.name ?? 'Cloudflare'}{server?.colo && server.colo !== '—' ? ` · ${server.colo}` : ''}</dd></div>
            <div><dt>Operadora</dt><dd>{server?.isp && server.isp !== '—' ? server.isp : '—'}</dd></div>
            <div><dt>Seu IP</dt><dd>{hideIpOnShare ? 'Oculto' : (server?.ip ?? '—')}</dd></div>
            <div><dt>Perda de pacotes</dt><dd>{result.packetLoss.toFixed(1)}%</dd></div>
            <div><dt>Data</dt><dd>{formatDate(result.timestamp)}</dd></div>
          </dl>
        </section>

        {previous && (
          <section className="lk-section">
            <h3 className="lk-section__title">Teste anterior</h3>
            <div className="lk-prev">
              <span>{formatDate(previous.timestamp)}</span>
              <span>↓ {formatMbps(previous.dl, unit)} · ↑ {formatMbps(previous.ul, unit)} {unitLabel}</span>
              <button className="btn-text" onClick={onShowHistory}>Ver histórico →</button>
            </div>
          </section>
        )}

        <section className="lk-actions">
          <button className="btn-primary lk-actions__btn" onClick={onRetry}>Testar novamente</button>
          <button className="btn-text" onClick={handleShare}>
            <IconShare size={16} /> {shareStatus === 'copied' ? 'Copiado!' : 'Compartilhar'}
          </button>
        </section>
      </main>

      <button className="lk-fab" onClick={handlePdf} aria-label="Exportar PDF">
        <IconPdf size={22} />
      </button>
    </div>
  );
}
