import { useEffect, useMemo, useRef, useState } from 'react';
import { IOSList } from '../components/IOSList';
import { Chip } from '../components/Chip';
import type { ChipVariant } from '../components/Chip';
import { Icon } from '../components/icons';
import { generateShareCard } from '../utils/shareCard';
import type { Quality, ServerInfo, SpeedTestResult, TestRecord } from '../types';
import { interpretSpeedTestResult, resolveCopy } from '../core';
import type { UseCaseId } from '../core';
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
  onShowDNSGuide?: (serverId: string) => void;
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

function bufferbloatGradeColor(grade: string): string {
  if (grade === 'A') return 'var(--ul)';
  if (grade === 'B') return 'var(--ul)';
  if (grade === 'C') return 'var(--warn)';
  return 'var(--error)';
}

function bufferbloatGradeLabel(grade: string): string {
  if (grade === 'A') return 'Excelente';
  if (grade === 'B') return 'Bom';
  if (grade === 'C') return 'Moderado';
  if (grade === 'D') return 'Ruim';
  return 'Crítico';
}

function packetLossLabel(pct: number): { text: string; color: string } {
  if (pct < 1)   return { text: 'Baixo', color: 'var(--ul)' };
  if (pct < 2.5) return { text: 'Médio', color: 'var(--warn)' };
  return { text: 'Alto', color: 'var(--error)' };
}

function useCaseLabel(id: UseCaseId): string {
  if (id === 'gaming')       return 'Jogos online';
  if (id === 'streaming_4k') return 'Vídeo 4K';
  if (id === 'home_office')  return 'Home Office';
  return 'Videochamada';
}

function useCaseIcon(id: UseCaseId): string {
  if (id === 'gaming')       return 'game';
  if (id === 'streaming_4k') return 'bolt';
  if (id === 'home_office')  return 'home';
  return 'video';
}

function useCaseIconBg(status: string): string {
  if (status === 'good')  return 'var(--ul-tint)';
  if (status === 'maybe') return 'rgba(245,166,35,0.12)';
  return 'rgba(255,69,58,0.12)';
}

function useCaseIconColor(status: string): string {
  if (status === 'good')  return 'var(--ul)';
  if (status === 'maybe') return 'var(--warn)';
  return 'var(--error)';
}

export function ResultScreen({
  theme: _theme, onToggleTheme: _onToggleTheme,
  result, server, previous: _previous,
  onRetry, onShowHistory,
  onDiagnostic, onGamer, onRecommend,
  onStartComparison, onStartBeforeAfter, onStartProvaReal, onStartRoomTest,
  onShowDNSGuide,
  unit = 'mbps', hideIpOnShare: _hideIpOnShare = true, gamingProfile: _gamingProfile = 'off',
}: Props) {
  const history = useMemo(() => loadHistory(), []);
  const interpreted = useMemo(
    () => interpretSpeedTestResult({ metrics: result, profile: 'fixed_broadband', history }),
    [result, history],
  );

  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const [maisExpanded, setMaisExpanded] = useState(false);
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

  const metricsItems = [
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
      icon: <Icon name="ping" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Latência',
      trailing: <span className="lk-result__metric-sub">{formatMs(result.latency)} ms</span>,
    },
    {
      icon: <Icon name="jitter" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Oscilação',
      trailing: <span className="lk-result__metric-sub">{formatMs(result.jitter)} ms</span>,
    },
    {
      icon: <Icon name="history" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Histórico',
      showChevron: true,
      onClick: onShowHistory,
    },
    ...(maisExpanded ? [
      {
        icon: <Icon name="loss" size={14} color="var(--text-2)" />,
        iconBg: 'var(--surface-3)',
        title: 'Perda de pacotes',
        trailing: <span className="lk-result__metric-sub">{result.packetLoss.toFixed(1)}%</span>,
      },
      ...(server?.isp && server.isp !== '—' ? [{
        icon: <Icon name="signal" size={14} color="var(--text-2)" />,
        iconBg: 'var(--surface-3)',
        title: 'Operadora',
        trailing: <span className="lk-result__metric-sub">{server.isp}</span>,
      }] : []),
      ...(server ? [{
        icon: <Icon name="pin" size={14} color="var(--text-2)" />,
        iconBg: 'var(--surface-3)',
        title: 'Servidor',
        trailing: <span className="lk-result__metric-sub">{server.name}{server.colo && server.colo !== '—' ? ` · ${server.colo}` : ''}</span>,
      }] : []),
    ] : []),
    {
      icon: <Icon name="chevron" size={14} color="var(--accent)" />,
      iconBg: 'var(--accent-tint)',
      title: maisExpanded ? 'Menos' : 'Mais',
      onClick: () => setMaisExpanded(e => !e),
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
        </div>

        {/* Pronto para — IOSList com ícones semânticos */}
        {interpreted.useCases.length > 0 && (
          <div className="lk-result__uses">
            <p className="lk-result__uses-label">Pronto para</p>
            <IOSList
              items={interpreted.useCases.map(({ id, status }) => ({
                icon: <Icon name={useCaseIcon(id)} size={14} color={useCaseIconColor(status)} />,
                iconBg: useCaseIconBg(status),
                title: useCaseLabel(id),
              }))}
            />
          </div>
        )}

        {/* Métricas */}
        <div className="lk-result__metrics">
          <IOSList items={metricsItems} />
        </div>

        {/* Seção Avançado — visível apenas quando mode === 'advanced' */}
        {result.mode === 'advanced' && (result.bufferbloatGrade || result.dlP25 != null) && (
          <div className="lk-result__advanced">
            <p className="lk-result__advanced-label">Diagnóstico avançado</p>
            <IOSList
              items={[
                ...(result.bufferbloatGrade ? [{
                  icon: <Icon name="bolt" size={14} color={bufferbloatGradeColor(result.bufferbloatGrade)} />,
                  iconBg: 'var(--surface-3)',
                  title: 'Bufferbloat',
                  subtitle: bufferbloatGradeLabel(result.bufferbloatGrade),
                  trailing: (
                    <span
                      className="lk-result__metric-sub"
                      style={{ color: bufferbloatGradeColor(result.bufferbloatGrade), fontWeight: 700, fontSize: 16 }}
                    >
                      {result.bufferbloatGrade}
                    </span>
                  ),
                }] : []),
                ...(result.latencyLoaded != null ? [{
                  icon: <Icon name="ping" size={14} color="var(--text-2)" />,
                  iconBg: 'var(--surface-3)',
                  title: 'Latência sob carga',
                  trailing: (
                    <span className="lk-result__metric-sub">
                      {formatMs(result.latencyLoaded)} ms
                      {result.bufferbloatDeltaMs != null && result.bufferbloatDeltaMs > 0 && (
                        <span style={{ color: 'var(--warn)', fontSize: 11, marginLeft: 4 }}>
                          +{formatMs(result.bufferbloatDeltaMs)} ms
                        </span>
                      )}
                    </span>
                  ),
                }] : []),
                ...(result.jitterLoaded != null ? [{
                  icon: <Icon name="jitter" size={14} color="var(--text-2)" />,
                  iconBg: 'var(--surface-3)',
                  title: 'Oscilação sob carga',
                  trailing: <span className="lk-result__metric-sub">{formatMs(result.jitterLoaded)} ms</span>,
                }] : []),
                ...(result.dlP25 != null && result.dlP75 != null ? [{
                  icon: <Icon name="download" size={14} color="var(--dl)" />,
                  iconBg: 'var(--dl-tint, rgba(58,182,255,0.12))',
                  title: 'Estabilidade download',
                  subtitle: 'Intervalo p25–p75',
                  trailing: (
                    <span className="lk-result__metric-sub">
                      {formatMbps(result.dlP25, unit)}–{formatMbps(result.dlP75, unit)} {unitLabel}
                    </span>
                  ),
                }] : []),
                ...(result.packetLoss != null ? (() => {
                  const pl = packetLossLabel(result.packetLoss);
                  return [{
                    icon: <Icon name="loss" size={14} color={pl.color} />,
                    iconBg: 'var(--surface-3)',
                    title: 'Perda de pacotes',
                    trailing: (
                      <span className="lk-result__metric-sub" style={{ color: pl.color }}>
                        {pl.text}
                      </span>
                    ),
                  }];
                })() : []),
              ]}
            />
          </div>
        )}

        {/* Seção DNS — visível apenas quando há resultado DNS */}
        {result.dns && result.dns.servers.length > 0 && (
          <div className="lk-result__advanced">
            <p className="lk-result__advanced-label">DNS</p>
            <IOSList
              items={[
                // Vencedor em destaque
                {
                  icon: <Icon name="bolt" size={14} color="var(--ul)" />,
                  iconBg: 'var(--ul-tint)',
                  title: `${result.dns.winner.name} · vencedor`,
                  subtitle: result.dns.winner.ip,
                  trailing: (
                    <span className="lk-result__metric-sub" style={{ color: 'var(--ul)', fontWeight: 600 }}>
                      {Math.round(result.dns.winner.p50)} ms
                    </span>
                  ),
                },
                // Demais servidores
                ...result.dns.servers
                  .filter(s => s.id !== result.dns!.winner.id && s.samples > 0)
                  .sort((a, b) => a.p50 - b.p50)
                  .map(s => ({
                    icon: <Icon name="ping" size={14} color="var(--text-3)" />,
                    iconBg: 'var(--surface-3)',
                    title: s.name,
                    subtitle: s.ip,
                    trailing: (
                      <span className="lk-result__metric-sub">
                        {Math.round(s.p50)} ms
                      </span>
                    ),
                  })),
                // Botão "Como trocar"
                ...(onShowDNSGuide ? [{
                  icon: <Icon name="cog" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Como trocar o DNS',
                  subtitle: `Usar ${result.dns.winner.name} no seu dispositivo`,
                  showChevron: true,
                  onClick: () => onShowDNSGuide!(result.dns!.winner.id),
                }] : []),
              ]}
            />
            <p className="lk-result__dns-disclaimer">
              Medição inclui overhead HTTP/TLS — comparação relativa entre servidores.
            </p>
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
