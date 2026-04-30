import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { IconGames, IconStream, IconWork, IconVideoCall, IconPdf, IconShare, IconWhatsApp } from '../components/icons';
import { generateShareCard } from '../utils/shareCard';
import type { Classification, Quality, ServerInfo, SpeedTestResult, Tag, TestRecord } from '../types';
import { interpretSpeedTestResult, resolveCopy } from '../core';
import type { UseCaseId, UseCaseStatus } from '../core';
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

type ShareStatus = 'idle' | 'copied';

const USE_CASE_DISPLAY: Record<UseCaseId, { Icon: React.ComponentType<{ size?: number }>; label: string }> = {
  gaming:       { Icon: IconGames,     label: 'Games online' },
  streaming_4k: { Icon: IconStream,    label: 'Streaming 4K' },
  home_office:  { Icon: IconWork,      label: 'Home Office' },
  video_call:   { Icon: IconVideoCall, label: 'Videochamada' },
};

function chipLabel(id: UseCaseId, status: UseCaseStatus): string {
  if (id === 'gaming' && status === 'limited') return 'Pode falhar';
  if (status === 'good') return 'Bom';
  if (status === 'maybe') return 'Atenção';
  return 'Ruim';
}

export function buildShareText(result: SpeedTestResult, quality: Quality, unit: 'mbps' | 'gbps' = 'mbps'): string {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  return [
    `linka SpeedTest — ${resolveCopy(`quality.${quality}`)}`,
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
  const history = useMemo(() => loadHistory(), []);
  const interpreted = useMemo(
    () => interpretSpeedTestResult({ metrics: result, profile: 'fixed_broadband', history }),
    [result, history],
  );
  const recommendations = useMemo(() => {
    const tags = new Set<Tag>(
      (Object.keys(interpreted.flags) as Tag[]).filter((k) => interpreted.flags[k]),
    );
    const classification: Classification = { primary: interpreted.quality, tags };
    return buildRecommendations(result, classification, history);
  }, [result, interpreted, history]);

  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [waGenerating, setWaGenerating] = useState(false);
  const shareResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (shareResetTimeoutRef.current) {
      clearTimeout(shareResetTimeoutRef.current);
    }
  }, []);

  const handleShare = async () => {
    const text = buildShareText(result, interpreted.quality, unit);
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

  const handleWhatsApp = async () => {
    if (waGenerating) return;
    setWaGenerating(true);
    try {
      const blob = await generateShareCard(result, interpreted.quality, unit);
      const file = new File([blob], 'linka-speedtest.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'linka SpeedTest' });
      } else {
        const text = buildShareText(result, interpreted.quality, unit);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }
    } catch {
      // cancelado ou sem suporte — silencioso
    } finally {
      setWaGenerating(false);
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
            <div className="lk-secondary__value lk-secondary__value--stab">
              {resolveCopy(interpreted.copyKeys.stabilityLabelKey)}
            </div>
            <div className="lk-secondary__label">Estabilidade</div>
          </div>
        </section>

        <p className="lk-diagnosis">{resolveCopy(interpreted.copyKeys.shortPhraseKey)}</p>

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

        <div className="lk-usegrid">
          {interpreted.useCases.map(({ id, status }) => {
            const { Icon, label } = USE_CASE_DISPLAY[id];
            return (
              <div key={id} className="lk-usecase">
                <div className="lk-usecase__icon"><Icon size={24} /></div>
                <div className="lk-usecase__label">{label}</div>
                <span className={`lk-chip lk-chip--${status}`}>{chipLabel(id, status)}</span>
              </div>
            );
          })}
        </div>

        <section className="lk-section">
          <h3 className="lk-section__title">Detalhes</h3>
          <dl className="lk-details">
            <div><dt>Servidor</dt><dd>{server?.name ?? 'Cloudflare'}{server?.colo && server.colo !== '—' ? ` · ${server.colo}` : ''}</dd></div>
            <div><dt>Operadora</dt><dd>{server?.isp && server.isp !== '—' ? server.isp : '—'}</dd></div>
            <div><dt>Seu IP</dt><dd>{hideIpOnShare ? 'Oculto' : (server?.ip ?? '—')}</dd></div>
            <div><dt>Perda de sinal</dt><dd>{result.packetLoss.toFixed(1)}%</dd></div>
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
          <button className="btn-text lk-actions__whatsapp" onClick={handleWhatsApp} disabled={waGenerating}>
            <IconWhatsApp size={16} /> {waGenerating ? 'Gerando…' : 'Compartilhar no WhatsApp'}
          </button>
          <button className="btn-text" onClick={handleShare}>
            <IconShare size={16} /> {shareStatus === 'copied' ? 'Copiado!' : 'Compartilhar texto'}
          </button>
        </section>
      </main>

      <button className="lk-fab" onClick={handlePdf} aria-label="Exportar PDF">
        <IconPdf size={22} />
      </button>
    </div>
  );
}
