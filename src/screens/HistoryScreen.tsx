import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { IOSList } from '../components/IOSList';
import { Chip, type ChipVariant } from '../components/Chip';
import { Icon, DeviceIcon, ConnectionIcon, IconPdf } from '../components/icons';
import type { SpeedTestResult, TestRecord } from '../types';
import { interpretSpeedTestResult, resolveCopy } from '../core';
import { clearHistory, loadHistory } from '../utils/history';
import { buildHistoryInsights } from '../utils/historyInsights';
import { formatDate, formatMbps, formatMs } from '../utils/format';
import { exportHistoryPdf } from '../utils/pdfExport';
import './HistoryScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  unit?: 'mbps' | 'gbps';
  initialSelectedId?: string;
  onBack?: () => void;
}

function qualityToChipVariant(quality: string): ChipVariant {
  if (quality === 'excellent' || quality === 'good') return 'good';
  if (quality === 'fair') return 'maybe';
  return 'bad';
}

export function HistoryScreen({
  theme,
  unit = 'mbps',
  initialSelectedId,
  onBack,
}: Props) {
  const dlColor = theme === 'dark' ? '#60A5FA' : '#2563EB';
  const ulColor = theme === 'dark' ? '#34D399' : '#16A34A';
  const [items, setItems] = useState<TestRecord[]>(() => loadHistory());
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const selected = items.find((r) => r.id === selectedId) ?? null;
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const mountTime = useState(Date.now)[0];

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

    const last5 = items.slice(0, 5);
    const syntheticLoss = (last5.filter((r) => r.quality === 'slow' || r.quality === 'unavailable').length / last5.length) * 100;

    const avgMetrics: SpeedTestResult = {
      dl: avgDl, ul: avgUl, latency: avgLat, jitter: avgJit,
      packetLoss: Math.max(avgLos, syntheticLoss),
      timestamp: 0,
    };
    const interpreted = interpretSpeedTestResult({ metrics: avgMetrics, profile: 'fixed_broadband', history: items });
    const unstable = interpreted.stability.level === 'unstable' || interpreted.stability.level === 'oscillating';
    return {
      avgDl, avgUl, n,
      headline: unstable
        ? resolveCopy(interpreted.copyKeys.stabilityLabelKey)
        : resolveCopy(interpreted.copyKeys.headlineKey),
    };
  }, [items]);

  const insights = useMemo(() => buildHistoryInsights(items), [items]);

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
    const interpreted = interpretSpeedTestResult({ metrics: avg, profile: 'fixed_broadband', history: sample });
    const lines = interpreted.copyKeys.diagnosisKeys.map((k) => resolveCopy(k));
    return { lines: lines.slice(0, 2), windowLabel: recent.length > 0 ? '24h' : 'recente' };
  }, [items, mountTime]);

  const handlePdf = async () => {
    try { await exportHistoryPdf(items); } catch { /* silencioso */ }
  };

  if (selected) {
    return <HistoryDetail record={selected} onBack={() => setSelectedId(null)} unit={unit} />;
  }

  return (
    <div className="lk-history">
      <div className="lk-history__head">
        {onBack ? (
          <button className="lk-history__back" onClick={onBack}>‹ Início</button>
        ) : <span />}
        <span className="lk-history__head-label">Histórico</span>
      </div>

      <main className="lk-history__main">
        {items.length === 0 ? (
          <div className="lk-history__empty">
            Nenhum teste registrado ainda. Volte e rode seu primeiro teste.
          </div>
        ) : (
          <>
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
                <li key={r.id} className="lk-history__item" onClick={() => setSelectedId(r.id)}>
                  <div className="lk-history__row1">
                    <span className="lk-history__date">{formatDate(r.timestamp)}</span>
                    <Chip variant={qualityToChipVariant(r.quality)}>
                      {resolveCopy(`quality.${r.quality}`)}
                    </Chip>
                  </div>
                  <div className="lk-history__row2">
                    <span className="lk-history__dl">↓ {formatMbps(r.dl, unit)}</span>
                    <span className="lk-history__ul">↑ {formatMbps(r.ul, unit)} {unitLabel}</span>
                    <span className="lk-history__lat">{formatMs(r.latency)} ms</span>
                  </div>
                  <div className="lk-history__row3">
                    <span className="lk-history__icons">
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
                </li>
              ))}
            </ul>

            <div className="lk-history__footer">
              <button className="btn-text lk-history__clear" onClick={handleClear}>
                Limpar histórico
              </button>
            </div>
          </>
        )}
      </main>

      {items.length > 0 && (
        <button className="lk-fab" onClick={handlePdf} aria-label="Exportar histórico em PDF">
          <IconPdf size={22} />
        </button>
      )}
    </div>
  );
}

function HistoryDetail({ record, onBack, unit }: { record: TestRecord; onBack: () => void; unit: 'mbps' | 'gbps' }) {
  const interpreted = useMemo(() => interpretSpeedTestResult({
    metrics: {
      dl: record.dl, ul: record.ul, latency: record.latency,
      jitter: record.jitter, packetLoss: record.packetLoss, timestamp: record.timestamp,
    },
    profile: record.connectionProfile ?? 'fixed_broadband',
  }), [record]);

  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  const deviceLabel = `${
    record.deviceType === 'mobile' ? 'Celular' : record.deviceType === 'tablet' ? 'Tablet' : 'PC'
  } · ${
    record.connectionType === 'wifi' ? 'Wi-Fi' : record.connectionType === 'mobile' ? 'Celular' : 'Cabo'
  }`;

  return (
    <div className="lk-history lk-history--detail fade-in">
      <div className="lk-hist-detail__head">
        <button className="lk-hist-detail__back" onClick={onBack}>‹ Voltar</button>
        <span className="lk-hist-detail__date">{formatDate(record.timestamp)}</span>
      </div>

      <div className="lk-hist-detail__scroll">
        <div className="lk-hist-detail__hero">
          <Chip variant={qualityToChipVariant(interpreted.quality)}>
            {resolveCopy(`quality.${interpreted.quality}`)}
          </Chip>
          <div className="lk-hist-detail__title">
            {resolveCopy(interpreted.copyKeys.headlineKey)}
          </div>
          <p className="lk-hist-detail__sub">
            {resolveCopy(interpreted.copyKeys.stabilityLabelKey)}
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
              title: 'Perda',
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
      </div>
    </div>
  );
}
