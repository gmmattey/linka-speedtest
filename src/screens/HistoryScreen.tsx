import { useCallback, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { IOSList } from '../components/IOSList';
import { Chip, type ChipVariant } from '../components/Chip';
import { Icon, DeviceIcon, ConnectionIcon, IconPdf, IconShare } from '../components/icons';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator';
import { useScrollHeader } from '../hooks/useScrollHeader';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import type { SpeedTestResult, TestRecord } from '../types';
import { interpretSpeedTestResult, resolveCopy } from '../core';
import { clearHistory, loadHistory } from '../utils/history';
import { buildHistoryInsights } from '../utils/historyInsights';
import { formatDate, formatMbps, formatMs } from '../utils/format';
import { exportHistoryPdf } from '../utils/pdfExport';
import {
  computeWeeklyTrend,
  computeMonthlyTrend,
  describeTrend,
  isTrendSignificant,
} from '../utils/historyTrends';
import {
  isAnatelComplaintEligible,
  generateAnatelReport,
} from '../utils/anatelReport';
import { useSettings } from '../hooks/useSettings';
import type { ConnectionProfile } from '../types';
import './HistoryScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  unit?: 'mbps' | 'gbps';
  initialSelectedId?: string;
  onBack?: () => void;
  /**
   * Callback do pull-to-refresh. Recebe `performAppRefresh` já amarrado
   * com `deviceInfo.reload` em App.tsx. Quando ausente, o gesto fica
   * desabilitado.
   */
  onRefresh?: () => Promise<void>;
}

function qualityToChipVariant(quality: string): ChipVariant {
  if (quality === 'excellent' || quality === 'good') return 'good';
  if (quality === 'fair') return 'maybe';
  return 'bad';
}

function dominantProfile(records: TestRecord[]): ConnectionProfile {
  const mobileCount = records.filter((r) => r.connectionProfile === 'mobile_broadband' || r.connectionType === 'mobile').length;
  return mobileCount > records.length / 2 ? 'mobile_broadband' : 'fixed_broadband';
}

export function HistoryScreen({
  theme,
  unit = 'mbps',
  initialSelectedId,
  onBack,
  onRefresh,
}: Props) {
  const dlColor = theme === 'dark' ? '#60A5FA' : '#2563EB';
  const ulColor = theme === 'dark' ? '#34D399' : '#16A34A';
  const [items, setItems] = useState<TestRecord[]>(() => loadHistory());
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const selected = items.find((r) => r.id === selectedId) ?? null;
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const mountTime = useState(Date.now())[0];
  const { settings } = useSettings();
  const [generatingAnatel, setGeneratingAnatel] = useState(false);

  const handleClear = () => {
    if (!confirm('Apagar todo o histórico de testes?')) return;
    clearHistory();
    setItems([]);
  };

  const chartData = useMemo(() => {
    return [...items].reverse().slice(-10).map((r, i) => ({ i, dl: r.dl, ul: r.ul }));
  }, [items]);

  const summary = useMemo(() => {
    if (items.length === 0) return null;
    const n = items.length;
    const avgDl  = items.reduce((s, r) => s + r.dl, 0)         / n;
    const avgUl  = items.reduce((s, r) => s + r.ul, 0)         / n;
    const avgLat = items.reduce((s, r) => s + r.latency, 0)    / n;
    const avgJit = items.reduce((s, r) => s + r.jitter, 0)     / n;
    const avgLos = items.reduce((s, r) => s + r.packetLoss, 0) / n;

    const avgMetrics: SpeedTestResult = {
      dl: avgDl, ul: avgUl, latency: avgLat, jitter: avgJit,
      packetLoss: avgLos,
      timestamp: 0,
    };
    const interpreted = interpretSpeedTestResult(avgMetrics, dominantProfile(items), items);
    const unstable = interpreted.stability.level === 'unstable' || interpreted.stability.level === 'oscillating';
    return {
      avgDl, avgUl, n,
      headline: unstable
        ? `Conexão ${interpreted.stability.level === 'very_stable' ? 'muito estável' : interpreted.stability.level === 'stable' ? 'estável' : interpreted.stability.level === 'oscillating' ? 'oscilante' : 'instável'}`
        : resolveCopy(interpreted.copyKeys.headlineKey),
    };
  }, [items]);

  const insights = useMemo(() => buildHistoryInsights(items), [items]);

  // Tendência (2026-05): card no topo do histórico quando há mudança >10%
  // entre as últimas duas janelas (semana ou mês). Prioriza a janela menor
  // — semana é mais "viva" para o usuário; só cai para mês se não houver
  // amostras suficientes no recorte semanal.
  const trendCard = useMemo(() => {
    const weekly  = computeWeeklyTrend(items);
    const monthly = computeMonthlyTrend(items);
    const trend = (weekly && isTrendSignificant(weekly)) ? weekly
                : (monthly && isTrendSignificant(monthly)) ? monthly
                : null;
    if (!trend) return null;
    return { trend, description: describeTrend(trend) };
  }, [items]);

  // Anatel (2026-05): card de denúncia ao final da lista quando o plano
  // contratado está cadastrado e a entrega média < 80% nos últimos 30
  // dias com pelo menos 5 testes. Suprimido em planos móveis (a Resolução
  // 717/2019 trata banda larga fixa de modo específico).
  const anatelData = useMemo(() => {
    if (!settings.contractedDown || settings.contractedDown <= 0) return null;
    // Dominante mobile: não aplica regra Anatel fixa.
    const dominant = dominantProfile(items);
    if (dominant === 'mobile_broadband') return null;
    return isAnatelComplaintEligible(
      items,
      settings.contractedDown,
      settings.contractedUp ?? 0,
    );
  }, [items, settings.contractedDown, settings.contractedUp]);

  const handleShareSelected = useCallback(async () => {
    if (!selected) return;
    const text = `${formatDate(selected.timestamp)} — ↓ ${formatMbps(selected.dl, unit)} / ↑ ${formatMbps(selected.ul, unit)} ${unitLabel} · ${formatMs(selected.latency)} ms`;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ text, title: 'linka SpeedTest' });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch { /* cancelado */ }
  }, [selected, unit, unitLabel]);

  const handleGenerateAnatel = useCallback(async () => {
    if (!anatelData || generatingAnatel) return;
    setGeneratingAnatel(true);
    try {
      // ISP dominante: o último teste registrado costuma ser o ISP atual.
      const dominantIsp = items.find((r) => r.isp && r.isp !== '—')?.isp ?? null;
      await generateAnatelReport(anatelData, dominantIsp);
    } catch {
      /* silencioso — usuário pode tentar de novo */
    } finally {
      setGeneratingAnatel(false);
    }
  }, [anatelData, generatingAnatel, items]);

  const diagnosis = useMemo(() => {
    if (items.length === 0) return null;
    const cutoff = mountTime - 24 * 3600 * 1000;
    const recent = items.filter((r) => r.timestamp >= cutoff);
    const sample = recent.length > 0 ? recent : items.slice(0, 5);
    const n = sample.length;
    const avg: SpeedTestResult = {
      dl:         sample.reduce((s, r) => s + r.dl, 0) / n,
      ul:         sample.reduce((s, r) => s + r.ul, 0) / n,
      latency:    sample.reduce((s, r) => s + r.latency, 0) / n,
      jitter:     sample.reduce((s, r) => s + r.jitter, 0) / n,
      packetLoss: sample.reduce((s, r) => s + r.packetLoss, 0) / n,
      timestamp:  mountTime,
    };
    const interpreted = interpretSpeedTestResult(avg, dominantProfile(sample), sample);
    const lines = interpreted.copyKeys.diagnosisKeys.map((k) => resolveCopy(k));
    return { lines: lines.slice(0, 2), windowLabel: recent.length > 0 ? '24h' : 'recente' };
  }, [items, mountTime]);

  const handlePdf = async () => {
    try { await exportHistoryPdf(items); } catch { /* silencioso */ }
  };

  // Bloco 5 — TopBar System (2026-05): scroll listener para alternar
  // glass effect / título pequeno do TopBar.
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  // Pull-to-refresh universal (2026-05). `useScrollHeader` expõe callback
  // ref; `usePullToRefresh` consome RefObject. Mantemos RefObject local e
  // um callback ref combinado que atualiza os dois.
  const ptrContainerRef = useRef<HTMLElement | null>(null);
  const setScrollContainer = useCallback((el: HTMLElement | null) => {
    ptrContainerRef.current = el;
    scrollContainerRef(el);
  }, [scrollContainerRef]);
  const noopRefresh = useCallback(() => Promise.resolve(), []);
  const ptr = usePullToRefresh(
    ptrContainerRef,
    onRefresh ?? noopRefresh,
    { enabled: !!onRefresh && !selected },
  );

  const rightActions = items.length > 0
    ? [{ icon: <IconPdf size={18} />, onClick: handlePdf, ariaLabel: 'Exportar histórico em PDF' }]
    : undefined;

  return (
    <div className="lk-history">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        title="Histórico"
        showTitle={scrolled}
        rightActions={rightActions}
      />

      {/* Pull-to-refresh (2026-05): pill flutuante; só aparece quando
          o usuário começa a puxar a partir do topo. */}
      <PullToRefreshIndicator
        pullDistance={ptr.pullDistance}
        isRefreshing={ptr.isRefreshing}
        isReady={ptr.isReady}
      />

      <main className="lk-history__main" ref={setScrollContainer}>
        <PageHeader ref={sentinelRef} title="Histórico" />
        {items.length === 0 ? (
          <div className="lk-history__empty">
            Nenhum teste registrado ainda. Volte e rode seu primeiro teste.
          </div>
        ) : (
          <>
            {/* Trend card (2026-05) — comparação inteligente entre testes.
                Aparece no topo (acima do diagnóstico de 24h) quando há
                mudança >10% na última janela semanal/mensal. */}
            {trendCard && (
              <section
                className={`lk-history__trend lk-history__trend--${trendCard.description.severity}`}
                aria-label="Tendência da sua internet"
              >
                <p className="lk-history__trend-headline">{trendCard.description.headline}</p>
                <p className="lk-history__trend-comparison">{trendCard.description.comparison}</p>
              </section>
            )}

            {diagnosis && diagnosis.lines.length > 0 && (
              <section className="lk-history__diagnosis">
                <p className="lk-history__diagnosis-label">Como sua internet anda · {diagnosis.windowLabel}</p>
                {diagnosis.lines.map((line, i) => (
                  <p key={i} className="lk-history__diagnosis-text">{line}</p>
                ))}
              </section>
            )}

            {insights.length > 0 && (
              <section className="lk-history__insights">
                {insights.map((ins) => (
                  <div key={ins.id} className={`lk-history__insight lk-history__insight--${ins.severity}`}>
                    <span className="lk-history__insight-title">{ins.title}</span>
                    <span className="lk-history__insight-desc">{ins.description}</span>
                  </div>
                ))}
              </section>
            )}

            {items.length < 3 && items.length > 0 && (
              <p className="lk-history__insights-hint">
                Faça mais {3 - items.length} teste{3 - items.length > 1 ? 's' : ''} para ver análise do seu histórico.
              </p>
            )}

            {chartData.length >= 2 && (
              <section className="lk-history__chart-section">
                <p className="lk-history__chart-title">Evolução recente</p>
                <div className="lk-history__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="hDl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={dlColor} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={dlColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="hUl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ulColor} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={ulColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={[0, 'auto']} />
                      <Area type="monotone" dataKey="dl" stroke={dlColor} strokeWidth={2} fill="url(#hDl)" isAnimationActive={false} dot={false} activeDot={false} />
                      <Area type="monotone" dataKey="ul" stroke={ulColor} strokeWidth={2} fill="url(#hUl)" isAnimationActive={false} dot={false} activeDot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="lk-history__chart-legend">
                  <span className="lk-history__legend-dl">↓ Download</span>
                  <span className="lk-history__legend-ul">↑ Upload</span>
                </div>
              </section>
            )}

            {summary && (
              <section className="lk-history__summary">
                <p className="lk-history__summary-label">Média dos seus testes</p>
                <div className="lk-history__summary-metrics">
                  <span className="lk-history__summary-dl">↓ {formatMbps(summary.avgDl, unit)} {unitLabel}</span>
                  <span className="lk-history__summary-ul">↑ {formatMbps(summary.avgUl, unit)} {unitLabel}</span>
                </div>
                <p className="lk-history__summary-quality">{summary.headline} — {summary.n} teste{summary.n > 1 ? 's' : ''}</p>
              </section>
            )}

            <ul className="lk-history__list">
              {items.map((r) => (
                /* A11y (2026-05): item virou <button> dentro de <li>. Antes
                   o `<li onClick>` era inacessível por teclado. Agora o
                   button real recebe foco/Enter/Space e screen reader o
                   anuncia como botão "Ver detalhes do teste de DD/MM ...". */
                <li key={r.id} className="lk-history__item-wrap">
                  <button
                    type="button"
                    className="lk-history__item lk-history__item-btn"
                    onClick={() => setSelectedId(r.id)}
                    aria-label={`Ver detalhes do teste de ${formatDate(r.timestamp)} — download ${formatMbps(r.dl, unit)} ${unitLabel}, upload ${formatMbps(r.ul, unit)} ${unitLabel}`}
                  >
                    <div className="lk-history__row1">
                      <span className="lk-history__date">{formatDate(r.timestamp)}</span>
                    </div>
                    <div className="lk-history__row2">
                      <span className="lk-history__dl">↓ {formatMbps(r.dl, unit)}</span>
                      <span className="lk-history__ul">↑ {formatMbps(r.ul, unit)} {unitLabel}</span>
                      <span className="lk-history__lat">{formatMs(r.latency)} ms</span>
                    </div>
                    <div className="lk-history__row3">
                      <span className="lk-history__icons" aria-hidden="true">
                        <DeviceIcon kind={r.deviceType} size={13} />
                        <ConnectionIcon kind={r.connectionType} size={13} />
                      </span>
                      <span>{r.serverName}{r.isp && r.isp !== '—' ? ` · ${r.isp}` : ''}</span>
                      {r.locationTag && (
                        <span className="lk-history__location-tag">
                          <Icon name="pin" size={10} color="var(--accent)" /> {r.locationTag}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Anatel (2026-05): card de denúncia quando a entrega média
                fica abaixo de 80% do plano nos últimos 30 dias. */}
            {anatelData && (
              <section className="lk-history__anatel" role="region" aria-label="Reclamação Anatel">
                <div className="lk-history__anatel-icon" aria-hidden="true">
                  <Icon name="shield" size={20} color="var(--warn)" />
                </div>
                <div className="lk-history__anatel-body">
                  <p className="lk-history__anatel-title">{resolveCopy('pdf.cta.title')}</p>
                  <p className="lk-history__anatel-desc">
                    {resolveCopy('pdf.cta.subtitle')}
                  </p>
                  <button
                    type="button"
                    className="btn-outline lk-history__anatel-cta"
                    onClick={handleGenerateAnatel}
                    disabled={generatingAnatel}
                  >
                    {generatingAnatel ? 'Gerando laudo…' : resolveCopy('pdf.cta.button')}
                  </button>
                  <p className="lk-history__anatel-tooltip">{resolveCopy('pdf.cta.tooltip')}</p>
                </div>
              </section>
            )}

            <div className="lk-history__footer">
              <button className="btn-text lk-history__clear" onClick={handleClear}>
                Limpar histórico
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── MedicaoDetailSheet ───────────────────────────────────────── */}
      {selected && (
        <div className="lk-medicao-overlay" onClick={() => setSelectedId(null)}>
          <div className="lk-medicao-sheet fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="lk-medicao-sheet__handle-row">
              <div className="lk-medicao-sheet__handle" />
            </div>
            <div className="lk-medicao-sheet__header">
              <h3>{formatDate(selected.timestamp)}</h3>
              <div className="lk-medicao-sheet__header-actions">
                <button
                  className="lk-medicao-sheet__action-btn"
                  onClick={() => void handleShareSelected()}
                  aria-label="Compartilhar"
                >
                  <IconShare size={18} />
                </button>
                <button
                  className="lk-medicao-sheet__close"
                  onClick={() => setSelectedId(null)}
                  aria-label="Fechar"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            </div>
            <div className="lk-medicao-sheet__body">
              <MedicaoDetailContent record={selected} unit={unit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MedicaoDetailContent({ record, unit }: { record: TestRecord; unit: 'mbps' | 'gbps' }) {
  const interpreted = useMemo(() => interpretSpeedTestResult(
    {
      dl: record.dl, ul: record.ul, latency: record.latency,
      jitter: record.jitter, packetLoss: record.packetLoss, timestamp: record.timestamp,
    } as SpeedTestResult,
    record.connectionProfile ?? 'fixed_broadband',
  ), [record]);

  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  const deviceLabel = `${
    record.deviceType === 'mobile' ? 'Celular' : record.deviceType === 'tablet' ? 'Tablet' : 'PC'
  } · ${
    record.connectionType === 'wifi' ? 'Wi-Fi' : record.connectionType === 'mobile' ? 'Celular' : 'Cabo'
  }`;

  return (
    <>
        <div className="lk-hist-detail__hero">
          <Chip variant={qualityToChipVariant(interpreted.primary)}>
            {resolveCopy(`quality.${interpreted.primary}`)}
          </Chip>
          <div className="lk-hist-detail__title">
            {resolveCopy(interpreted.copyKeys.headlineKey)}
          </div>
          <p className="lk-hist-detail__sub">
            {interpreted.stability.level === 'very_stable' ? 'Conexão muito estável' :
             interpreted.stability.level === 'stable' ? 'Conexão estável' :
             interpreted.stability.level === 'oscillating' ? 'Conexão oscilante' :
             'Conexão instável'}
          </p>
          {/* Bug-fix 2026-05 (rede móvel): ícone do tipo de conexão visível
              no hero do detalhe — clarifica de que rede o teste veio. */}
          <p
            className="lk-hist-detail__conn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-2)',
              fontSize: 12,
              marginTop: 4,
            }}
          >
            <ConnectionIcon kind={record.connectionType} size={20} />
            <span>
              {record.connectionType === 'wifi'   ? 'Wi-Fi' :
               record.connectionType === 'mobile' ? 'Rede móvel' :
               record.connectionType === 'cable'  ? 'Cabo' : '—'}
            </span>
          </p>
        </div>

        <IOSList
          items={[
            {
              icon: <Icon name="download" size={14} color="var(--dl)" />,
              iconBg: 'var(--dl-tint)',
              title: 'Download',
              trailing: <span style={{ color: 'var(--dl)', fontWeight: 600, fontSize: 14 }}>{formatMbps(record.dl, unit)} {unitLabel}</span>,
            },
            {
              icon: <Icon name="upload" size={14} color="var(--ul)" />,
              iconBg: 'var(--ul-tint)',
              title: 'Upload',
              trailing: <span style={{ color: 'var(--ul)', fontWeight: 600, fontSize: 14 }}>{formatMbps(record.ul, unit)} {unitLabel}</span>,
            },
            {
              icon: <Icon name="ping" size={14} color="var(--accent)" />,
              iconBg: 'var(--accent-tint)',
              title: 'Resposta',
              trailing: <span style={{ fontWeight: 600, fontSize: 14 }}>{formatMs(record.latency)} ms</span>,
            },
            {
              icon: <Icon name="jitter" size={14} color="var(--accent)" />,
              iconBg: 'var(--accent-tint)',
              title: 'Oscilação',
              trailing: <span style={{ fontWeight: 600, fontSize: 14 }}>{record.jitter.toFixed(1)} ms</span>,
            },
            {
              icon: <Icon name="loss" size={14} color="var(--accent)" />,
              iconBg: 'var(--accent-tint)',
              title: resolveCopy('metric.packetLoss'),
              trailing: <span style={{ fontWeight: 600, fontSize: 14 }}>{record.packetLoss.toFixed(1)}%</span>,
            },
          ]}
        />

        <p className="lk-hist-detail__section-label">Detalhes</p>

        <IOSList
          items={[
            {
              title: 'Servidor',
              trailing: <span className="lk-hist-detail__detail-val">{record.serverName}</span>,
            },
            {
              title: 'Provedor',
              trailing: <span className="lk-hist-detail__detail-val lk-hist-detail__detail-val--truncate">{record.isp && record.isp !== '—' ? record.isp : '—'}</span>,
            },
            {
              title: 'Dispositivo',
              trailing: <span className="lk-hist-detail__detail-val">{deviceLabel}</span>,
            },
            ...(record.locationTag ? [{
              title: 'Local',
              trailing: <span className="lk-hist-detail__detail-val" style={{ color: 'var(--accent)' }}>{record.locationTag}</span>,
            }] : []),
          ]}
        />
    </>
  );
}
