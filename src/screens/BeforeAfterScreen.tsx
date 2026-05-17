import { useMemo } from 'react';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import type { SpeedTestResult } from '../types';
import { calculateBeforeAfter } from '../utils/beforeAfter';
import { formatMbps, formatMs } from '../utils/format';
import './BeforeAfterScreen.css';

export type BeforeAfterStep = 'before' | 'after' | 'done';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  step: BeforeAfterStep;
  beforeResult: SpeedTestResult | null;
  afterResult: SpeedTestResult | null;
  onStartBefore: () => void;
  onStartAfter: () => void;
  onBack: () => void;
  onRetry: () => void;
  unit?: 'mbps' | 'gbps';
}

function deltaLabel(percent: number, higherIsBetter: boolean): string {
  const effective = higherIsBetter ? percent : -percent;
  const sign = effective >= 0 ? '+' : '';
  return `${sign}${effective.toFixed(0)}%`;
}

function deltaClass(percent: number, higherIsBetter: boolean): string {
  const improved = higherIsBetter ? percent > 5  : percent < -5;
  const worsened = higherIsBetter ? percent < -5 : percent > 5;
  if (improved) return 'lk-ba__delta--good';
  if (worsened) return 'lk-ba__delta--bad';
  return 'lk-ba__delta--neutral';
}

export function BeforeAfterScreen({
  step,
  beforeResult,
  afterResult,
  onStartBefore,
  onStartAfter,
  onBack,
  onRetry,
  unit = 'mbps',
}: Props) {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const comparison = useMemo(
    () => beforeResult && afterResult ? calculateBeforeAfter(beforeResult, afterResult) : null,
    [beforeResult, afterResult],
  );

  // Bloco 5 — TopBar System (2026-05).
  const { scrolled, topBarOpacity, scrollContainerRef, sentinelRef } = useScrollHeader();

  return (
    <div className="lk-ba">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        opacity={topBarOpacity}
        title="Antes e Depois"
        showTitle={scrolled}
      />

      <div className="lk-ba__scroll fade-in" ref={scrollContainerRef}>
        <PageHeader
          ref={sentinelRef}
          size="md"
          title="Antes e Depois"
          subtitle="Reinicie o roteador, troque o canal Wi‑Fi ou mude de lugar — e veja se melhorou."
        />

        {step === 'before' && (
          <div className="lk-ba__step">
            <div className="lk-ba__step-badge">Passo 1 de 2 — Antes</div>
            <p className="lk-ba__step-instruction">Inicie o teste agora, antes de fazer qualquer mudança.</p>
            <button className="btn-primary lk-ba__start-btn" onClick={onStartBefore}>
              Iniciar teste (antes)
            </button>
          </div>
        )}

        {step === 'after' && beforeResult && (
          <div className="lk-ba__step">
            <div className="lk-ba__step-badge">Passo 2 de 2 — Depois</div>
            <p className="lk-ba__step-instruction">Faça a ação desejada e inicie o segundo teste para comparar.</p>
            <div className="lk-ba__preview">
              <span className="lk-ba__preview-label">Antes</span>
              <span className="lk-ba__preview-metrics">
                ↓ {formatMbps(beforeResult.dl, unit)} · ↑ {formatMbps(beforeResult.ul, unit)} {unitLabel} · {formatMs(beforeResult.latency)} ms
              </span>
            </div>
            <div className="lk-ba__step-actions">
              <button className="btn-primary lk-ba__start-btn" onClick={onStartAfter}>
                Iniciar teste (depois)
              </button>
              <button className="btn-text" onClick={onRetry}>Refazer primeiro teste</button>
            </div>
          </div>
        )}

        {step === 'done' && beforeResult && afterResult && comparison && (
          <div className="lk-ba__result">
            <div className={`lk-ba__verdict lk-ba__verdict--${comparison.verdict}`}>
              {comparison.message}
            </div>

            <div className="lk-ba__table">
              <div className="lk-ba__table-header">
                <span />
                <span>Antes</span>
                <span>Depois</span>
                <span>Variação</span>
              </div>
              <div className="lk-ba__table-row">
                <span>↓ Download</span>
                <span className="lk-ba__val">{formatMbps(beforeResult.dl, unit)} {unitLabel}</span>
                <span className="lk-ba__val">{formatMbps(afterResult.dl, unit)} {unitLabel}</span>
                <span className={`lk-ba__delta ${deltaClass(comparison.dlDeltaPercent, true)}`}>
                  {deltaLabel(comparison.dlDeltaPercent, true)}
                </span>
              </div>
              <div className="lk-ba__table-row">
                <span>↑ Upload</span>
                <span className="lk-ba__val">{formatMbps(beforeResult.ul, unit)} {unitLabel}</span>
                <span className="lk-ba__val">{formatMbps(afterResult.ul, unit)} {unitLabel}</span>
                <span className={`lk-ba__delta ${deltaClass(comparison.ulDeltaPercent, true)}`}>
                  {deltaLabel(comparison.ulDeltaPercent, true)}
                </span>
              </div>
              <div className="lk-ba__table-row">
                <span>Resposta</span>
                <span className="lk-ba__val">{formatMs(beforeResult.latency)} ms</span>
                <span className="lk-ba__val">{formatMs(afterResult.latency)} ms</span>
                <span className={`lk-ba__delta ${deltaClass(comparison.latencyDeltaPercent, false)}`}>
                  {deltaLabel(comparison.latencyDeltaPercent, false)}
                </span>
              </div>
            </div>

            <div className="lk-ba__actions">
              <button className="btn-primary lk-ba__actions-primary" onClick={onRetry}>
                Nova comparação
              </button>
              <button className="btn-text" onClick={onBack}>Voltar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
