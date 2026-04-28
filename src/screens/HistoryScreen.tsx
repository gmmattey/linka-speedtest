import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { Header } from '../components/Header';
import { DeviceIcon, ConnectionIcon, IconPdf } from '../components/icons';
import type { TestRecord } from '../types';
import { buildDiagnosis, classify, qualityHeadline, stability, stabilityLabel, tagLabel } from '../utils/classifier';
import { clearHistory, loadHistory } from '../utils/history';
import { formatDate, formatMbps, formatMs } from '../utils/format';
import { exportHistoryPdf } from '../utils/pdfExport';
import './HistoryScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  unit?: 'mbps' | 'gbps';
  initialSelectedId?: string;
}

export function HistoryScreen({ theme, onToggleTheme, unit = 'mbps', initialSelectedId }: Props) {
  const [items, setItems] = useState<TestRecord[]>([]);
  const [selected, setSelected] = useState<TestRecord | null>(null);
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  useEffect(() => {
    const loaded = loadHistory();
    setItems(loaded);
    if (initialSelectedId) {
      const found = loaded.find((r) => r.id === initialSelectedId);
      setSelected(found ?? null);
    } else {
      setSelected(null);
    }
  }, [initialSelectedId]);

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
    const c = classify({ dl: avgDl, ul: avgUl, latency: avgLat, jitter: avgJit, packetLoss: avgLos, timestamp: 0 });
    return { avgDl, avgUl, quality: c.primary, n };
  }, [items]);

  const diagnosis = useMemo(() => {
    if (items.length === 0) return null;
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const recent = items.filter((r) => r.timestamp >= cutoff);
    const sample = recent.length > 0 ? recent : items.slice(0, 5);
    const n = sample.length;
    const avg = {
      dl:         sample.reduce((s, r) => s + r.dl, 0)         / n,
      ul:         sample.reduce((s, r) => s + r.ul, 0)         / n,
      latency:    sample.reduce((s, r) => s + r.latency, 0)    / n,
      jitter:     sample.reduce((s, r) => s + r.jitter, 0)     / n,
      packetLoss: sample.reduce((s, r) => s + r.packetLoss, 0) / n,
      timestamp:  Date.now(),
    };
    const c = classify(avg);
    const lines = buildDiagnosis(avg, c, sample);
    return { lines: lines.slice(0, 2), windowLabel: recent.length > 0 ? '24h' : 'recente' };
  }, [items]);

  const handlePdf = async () => {
    try { await exportHistoryPdf(items); } catch (e) { console.error(e); }
  };

  if (selected) {
    return <HistoryDetail record={selected} onBack={() => setSelected(null)} unit={unit} />;
  }

  return (
    <div className="lk-history">
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main className="lk-history__main">
        <h2 className="lk-history__title">Histórico de testes</h2>

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

            {chartData.length >= 2 && (
              <section className="lk-history__chart-section">
                <p className="lk-history__chart-title">Evolução recente</p>
                <div className="lk-history__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="hDl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3AB6FF" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#3AB6FF" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="hUl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={[0, 'auto']} />
                      <Area type="monotone" dataKey="dl" stroke="#3AB6FF" strokeWidth={2} fill="url(#hDl)" isAnimationActive={false} dot={false} activeDot={false} />
                      <Area type="monotone" dataKey="ul" stroke="#22C55E" strokeWidth={2} fill="url(#hUl)" isAnimationActive={false} dot={false} activeDot={false} />
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
                <p className="lk-history__summary-quality">{qualityHeadline(summary.quality)} — {summary.n} teste{summary.n > 1 ? 's' : ''}</p>
              </section>
            )}

            <ul className="lk-history__list">
              {items.map((r) => (
                <li key={r.id} className="lk-history__item" onClick={() => setSelected(r)}>
                  <div className="lk-history__row1">
                    <span className="lk-history__date">{formatDate(r.timestamp)}</span>
                    <span className={`lk-chip lk-chip--${r.quality === 'slow' || r.quality === 'unavailable' ? 'limited' : r.quality === 'fair' ? 'maybe' : 'good'}`}>
                      {qualityHeadline(r.quality)}
                    </span>
                  </div>
                  <div className="lk-history__row2">
                    <span className="lk-history__dl">↓ {formatMbps(r.dl, unit)}</span>
                    <span className="lk-history__ul">↑ {formatMbps(r.ul, unit)} {unitLabel}</span>
                    <span>lat {formatMs(r.latency)} ms</span>
                  </div>
                  <div className="lk-history__row3">
                    <span className="lk-history__icons">
                      <DeviceIcon kind={r.deviceType} size={14} />
                      <ConnectionIcon kind={r.connectionType} size={14} />
                    </span>
                    <span>{r.serverName}{r.isp && r.isp !== '—' ? ` · ${r.isp}` : ''}</span>
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
  const c = useMemo(() => classify({
    dl: record.dl, ul: record.ul, latency: record.latency,
    jitter: record.jitter, packetLoss: record.packetLoss, timestamp: record.timestamp,
  }), [record]);
  const stab = useMemo(() => stability({
    dl: record.dl, ul: record.ul, latency: record.latency,
    jitter: record.jitter, packetLoss: record.packetLoss, timestamp: record.timestamp,
  }), [record]);
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  return (
    <div className="lk-history lk-history--detail fade-in">
      <div className="lk-hist-detail__header">
        <button className="btn-text" onClick={onBack}>← Voltar</button>
        <span className="lk-hist-detail__date">{formatDate(record.timestamp)}</span>
      </div>

      <main className="lk-result__main">
        <section className={`lk-banner lk-banner--${c.primary}`}>
          <div className="lk-banner__icon">{c.primary === 'slow' || c.primary === 'unavailable' ? '✗' : c.primary === 'fair' ? '!' : '✓'}</div>
          <div className="lk-banner__body">
            <div className="lk-banner__title">{qualityHeadline(c.primary)}</div>
            {c.tags.size > 0 && (
              <div className="lk-banner__tags">
                {Array.from(c.tags).map((t) => <span key={t} className="lk-chip">{tagLabel(t)}</span>)}
              </div>
            )}
          </div>
        </section>

        <section className="lk-primary">
          <div className="lk-primary__col">
            <div className="lk-primary__label">↓ Download</div>
            <div className="lk-primary__value lk-primary__value--dl numeric">
              {formatMbps(record.dl, unit)}<span className="lk-primary__unit">{unitLabel}</span>
            </div>
          </div>
          <div className="lk-primary__divider" />
          <div className="lk-primary__col">
            <div className="lk-primary__label">↑ Upload</div>
            <div className="lk-primary__value lk-primary__value--ul numeric">
              {formatMbps(record.ul, unit)}<span className="lk-primary__unit">{unitLabel}</span>
            </div>
          </div>
        </section>

        <section className="lk-secondary">
          <div className="lk-secondary__col">
            <div className="lk-secondary__value numeric">{formatMs(record.latency)} ms</div>
            <div className="lk-secondary__label">Resposta</div>
          </div>
          <div className="lk-secondary__col">
            <div className="lk-secondary__value numeric">{formatMs(record.jitter)} ms</div>
            <div className="lk-secondary__label">Oscilação</div>
          </div>
          <div className="lk-secondary__col">
            <div className="lk-secondary__value lk-secondary__value--stab">{stabilityLabel(stab)}</div>
            <div className="lk-secondary__label">Estabilidade</div>
          </div>
        </section>

        <section className="lk-section">
          <h3 className="lk-section__title">Detalhes</h3>
          <dl className="lk-details">
            <div><dt>Servidor</dt><dd>{record.serverName}</dd></div>
            <div><dt>Operadora</dt><dd>{record.isp && record.isp !== '—' ? record.isp : '—'}</dd></div>
            <div><dt>Dispositivo</dt><dd>{record.deviceType === 'mobile' ? 'Celular' : record.deviceType === 'tablet' ? 'Tablet' : 'PC'} · {record.connectionType === 'wifi' ? 'Wi-Fi' : record.connectionType === 'mobile' ? 'Celular' : 'Cabo'}</dd></div>
            <div><dt>Perda de pacotes</dt><dd>{record.packetLoss.toFixed(1)}%</dd></div>
          </dl>
        </section>
      </main>
    </div>
  );
}
