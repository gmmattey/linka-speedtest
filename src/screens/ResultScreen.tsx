import { useEffect, useMemo, useRef, useState } from 'react';
import { IOSList } from '../components/IOSList';
import { Chip } from '../components/Chip';
import type { ChipVariant } from '../components/Chip';
import { Icon } from '../components/icons';
import { generateShareCard } from '../utils/shareCard';
import type { Quality, ServerInfo, SpeedTestResult, TestRecord } from '../types';
import { interpretSpeedTestResult, resolveCopy } from '../core';
import type { UseCaseId, UseCaseStatus } from '../core';
import { loadHistory } from '../utils/history';
import { formatMbps, formatMs } from '../utils/format';
import type { GamingProfile } from '../types';
import './ResultScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  result: SpeedTestResult;
  server: ServerInfo | null;
  previous: TestRecord | null;
  onRetry: () => void;
  onShowHistory: () => void;
  onDiagnostic?: () => void;
  onGamer?: () => void;
  onRecommend?: () => void;
  onStartComparison?: () => void;
  onStartBeforeAfter?: () => void;
  onStartProvaReal?: () => void;
  onStartRoomTest?: () => void;
  unit?: 'mbps' | 'gbps';
  hideIpOnShare?: boolean;
  gamingProfile?: GamingProfile;
}

type ShareStatus = 'idle' | 'copied';

export function buildShareText(result: SpeedTestResult, quality: Quality, unit: 'mbps' | 'gbps' = 'mbps'): string {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  return [
    `linka SpeedTest — ${resolveCopy(`quality.${quality}`)}`,
    `↓ ${formatMbps(result.dl, unit)} ${unitLabel} · ↑ ${formatMbps(result.ul, unit)} ${unitLabel}`,
    `Resposta ${formatMs(result.latency)} ms · Oscilação ${formatMs(result.jitter)} ms`,
    new Date(result.timestamp).toLocaleString('pt-BR'),
  ].join('\n');
}

export async function shareResultText(text: string): Promise<'shared' | 'copied' | 'none'> {
  if (navigator.share) {
    try { await navigator.share({ title: 'linka SpeedTest', text }); return 'shared'; }
    catch { return 'none'; }
  }
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return 'copied'; }
    catch { return 'none'; }
  }
  return 'none';
}

function qualityToChipVariant(q: Quality): ChipVariant {
  if (q === 'excellent' || q === 'good') return 'good';
  if (q === 'fair') return 'maybe';
  return 'bad';
}

function qualityBadgeLabel(q: Quality): string {
  if (q === 'excellent') return 'Excelente';
  if (q === 'good') return 'Boa';
  if (q === 'fair') return 'Regular';
  if (q === 'slow') return 'Lenta';
  return 'Sem conexão';
}

function useCaseLabel(id: UseCaseId): string {
  if (id === 'gaming')       return 'Jogos online';
  if (id === 'streaming_4k') return 'Vídeo 4K';
  if (id === 'home_office')  return 'Home Office';
  return 'Videochamada';
}

function useCaseVariant(status: UseCaseStatus): ChipVariant {
  if (status === 'good')  return 'good';
  if (status === 'maybe') return 'maybe';
  return 'bad';
}

export function ResultScreen({
  theme: _theme, onToggleTheme: _onToggleTheme,
  result, server, previous: _previous,
  onRetry, onShowHistory,
  onDiagnostic, onGamer, onRecommend,
  onStartComparison, onStartBeforeAfter, onStartProvaReal, onStartRoomTest,
  unit = 'mbps', hideIpOnShare = true, gamingProfile: _gamingProfile = 'off',
}: Props) {
  const history = useMemo(() => loadHistory(), []);
  const interpreted = useMemo(
    () => interpretSpeedTestResult({ metrics: result, profile: 'fixed_broadband', history }),
    [result, history],
  );

  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [waGenerating, setWaGenerating] = useState(false);
  const shareResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (shareResetRef.current) clearTimeout(shareResetRef.current);
  }, []);

  const handleShare = async () => {
    const text = buildShareText(result, interpreted.quality, unit);
    const outcome = await shareResultText(text);
    if (outcome === 'copied') {
      setShareStatus('copied');
      if (shareResetRef.current) clearTimeout(shareResetRef.current);
      shareResetRef.current = setTimeout(() => {
        setShareStatus('idle');
        shareResetRef.current = null;
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
    } catch { /* cancelado */ }
    finally { setWaGenerating(false); }
  };

  const shortPhrase = resolveCopy(interpreted.copyKeys.shortPhraseKey);

  const iosListItems = [
    {
      icon: <Icon name="download" size={14} color="#fff" />,
      iconBg: 'var(--dl)',
      title: 'Download',
      trailing: <span className="lk-result__metric">{formatMbps(result.dl, unit)} {unitLabel}</span>,
    },
    {
      icon: <Icon name="upload" size={14} color="#fff" />,
      iconBg: 'var(--ul)',
      title: 'Upload',
      trailing: <span className="lk-result__metric">{formatMbps(result.ul, unit)} {unitLabel}</span>,
    },
    {
      icon: <Icon name="ping" size={14} color="#fff" />,
      iconBg: 'var(--accent)',
      title: 'Latência',
      trailing: <span className="lk-result__metric">{formatMs(result.latency)} ms</span>,
    },
    {
      icon: <Icon name="jitter" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Jitter',
      subtitle: 'Variação da latência',
      trailing: <span className="lk-result__metric">{formatMs(result.jitter)} ms</span>,
    },
    {
      icon: <Icon name="loss" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Perda de pacotes',
      trailing: <span className="lk-result__metric">{result.packetLoss.toFixed(1)}%</span>,
    },
  ];

  return (
    <div className="lk-result fade-in">
      {/* Header */}
      <div className="lk-result__head">
        <button className="lk-result__back" onClick={onShowHistory}>‹ Início</button>
        <button className="lk-result__share-btn" onClick={handleShare} aria-label="Compartilhar">
          <Icon name="share" size={18} />
        </button>
      </div>

      <div className="lk-result__scroll">
        {/* Hero */}
        <div className="lk-result__hero">
          <Chip variant={qualityToChipVariant(interpreted.quality)}>
            {qualityBadgeLabel(interpreted.quality)}
          </Chip>
          <div className="lk-result__title">{shortPhrase}</div>
          <p className="lk-result__desc">{resolveCopy(`diagnosis.${interpreted.quality}`)}</p>
        </div>

        {/* Pronta para… chips */}
        {interpreted.useCases.length > 0 && (
          <div className="lk-result__uses">
            <div className="lk-result__uses-label">Pronta para</div>
            <div className="lk-result__uses-chips">
              {interpreted.useCases.map(({ id, status }) => (
                <Chip key={id} variant={useCaseVariant(status)}>
                  {useCaseLabel(id)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* iOS-list métricas */}
        <div className="lk-result__metrics">
          <IOSList items={iosListItems} />
        </div>

        {/* Detalhes do servidor */}
        {server && (
          <div className="lk-result__detail">
            <div className="lk-result__detail-row">
              <span className="lk-result__detail-k">Servidor</span>
              <span className="lk-result__detail-v">{server.name}{server.colo && server.colo !== '—' ? ` · ${server.colo}` : ''}</span>
            </div>
            {server.isp && server.isp !== '—' && (
              <div className="lk-result__detail-row">
                <span className="lk-result__detail-k">Operadora</span>
                <span className="lk-result__detail-v">{server.isp}</span>
              </div>
            )}
            {!hideIpOnShare && server.ip && (
              <div className="lk-result__detail-row">
                <span className="lk-result__detail-k">IP</span>
                <span className="lk-result__detail-v">{server.ip}</span>
              </div>
            )}
          </div>
        )}

        {/* Ferramentas — IOSList */}
        <div className="lk-result__tools">
          <p className="lk-result__tools-label">Explorar</p>
          <IOSList
            items={[
              ...(onDiagnostic ? [{
                icon: <Icon name="shield" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Diagnóstico',
                subtitle: 'Análise detalhada por métrica',
                showChevron: true,
                onClick: onDiagnostic,
              }] : []),
              ...(onGamer ? [{
                icon: <Icon name="game" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Modo Gamer',
                subtitle: 'Avaliação por jogo e categoria',
                showChevron: true,
                onClick: onGamer,
              }] : []),
              ...(onRecommend ? [{
                icon: <Icon name="bulb" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Recomendações',
                subtitle: 'Como melhorar sua internet',
                showChevron: true,
                onClick: onRecommend,
              }] : []),
              ...(onStartComparison ? [{
                icon: <Icon name="cmp" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Comparar locais',
                subtitle: 'Perto vs. longe do roteador',
                showChevron: true,
                onClick: onStartComparison,
              }] : []),
              ...(onStartBeforeAfter ? [{
                icon: <Icon name="cmp" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Antes e Depois',
                subtitle: 'Meça o impacto de uma ação',
                showChevron: true,
                onClick: onStartBeforeAfter,
              }] : []),
              ...(onStartProvaReal ? [{
                icon: <Icon name="refresh" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Prova Real (3×)',
                subtitle: 'Média de 3 testes consecutivos',
                showChevron: true,
                onClick: onStartProvaReal,
              }] : []),
              ...(onStartRoomTest ? [{
                icon: <Icon name="pin" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Teste por local',
                subtitle: 'Associe um cômodo ao resultado',
                showChevron: true,
                onClick: onStartRoomTest,
              }] : []),
            ]}
          />
        </div>

        {/* Footer de ações primárias */}
        <div className="lk-result__footer">
          <button className="btn-primary lk-result__retry" onClick={onRetry}>
            <Icon name="refresh" size={16} />Testar novamente
          </button>
          <div className="lk-result__footer-row">
            <button className="btn-text" onClick={handleWhatsApp} disabled={waGenerating}>
              {waGenerating ? 'Gerando…' : 'WhatsApp'}
            </button>
            <button className="btn-text" onClick={handleShare}>
              {shareStatus === 'copied' ? 'Copiado!' : 'Compartilhar texto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
