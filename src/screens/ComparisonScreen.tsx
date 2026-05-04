import { useMemo } from 'react';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import type { SpeedTestResult } from '../types';
import { calculateComparison } from '../utils/comparison';
import { formatMbps, formatMs } from '../utils/format';
import './ComparisonScreen.css';

export type ComparisonStep = 'near' | 'far' | 'done';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  step: ComparisonStep;
  nearResult: SpeedTestResult | null;
  farResult: SpeedTestResult | null;
  onStartNear: () => void;
  onStartFar: () => void;
  onBack: () => void;
  onRetryNear: () => void;
  unit?: 'mbps' | 'gbps';
}

export function ComparisonScreen({
  step,
  nearResult,
  farResult,
  onStartNear,
  onStartFar,
  onBack,
  onRetryNear,
  unit = 'mbps',
}: Props) {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const comparison = useMemo(
    () => nearResult && farResult ? calculateComparison(nearResult, farResult) : null,
    [nearResult, farResult],
  );

  // Bloco 5 — TopBar System (2026-05).
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  return (
    <div className="lk-cmp">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        title="Comparar locais"
        showTitle={scrolled}
      />

      <div className="lk-cmp__scroll fade-in" ref={scrollContainerRef}>
        <PageHeader
          ref={sentinelRef}
          size="md"
          title="Comparar locais"
          subtitle="Meça perto e longe do roteador para ver onde o sinal perde força."
        />

        {step === 'near' && (
          <div className="lk-cmp__step">
            <div className="lk-cmp__step-badge">Passo 1 de 2</div>
            <p className="lk-cmp__step-instruction">
              Fique bem perto do roteador e inicie o teste.
            </p>
            <button className="btn-primary lk-cmp__start-btn" onClick={onStartNear}>
              Iniciar teste perto do roteador
            </button>
          </div>
        )}

        {step === 'far' && nearResult && (
          <div className="lk-cmp__step">
            <div className="lk-cmp__step-badge">Passo 2 de 2</div>
            <p className="lk-cmp__step-instruction">
              Vá para o local onde a internet fica ruim e inicie o teste.
            </p>
            <div className="lk-cmp__preview">
              <span className="lk-cmp__preview-label">Perto do roteador</span>
              <span className="lk-cmp__preview-metrics">
                ↓ {formatMbps(nearResult.dl, unit)} · ↑ {formatMbps(nearResult.ul, unit)} {unitLabel} · {formatMs(nearResult.latency)} ms
              </span>
            </div>
            <div className="lk-cmp__step-actions">
              <button className="btn-primary lk-cmp__start-btn" onClick={onStartFar}>
                Iniciar teste neste local
              </button>
              <button className="btn-text" onClick={onRetryNear}>
                Refazer primeiro teste
              </button>
            </div>
          </div>
        )}

        {step === 'done' && nearResult && farResult && comparison && (
          <div className="lk-cmp__result">
            <div className={`lk-cmp__verdict lk-cmp__verdict--${comparison.diagnosis}`}>
              {comparison.message}
            </div>

            <div className="lk-cmp__table">
              <div className="lk-cmp__table-header">
                <span />
                <span>Perto</span>
                <span>Longe</span>
              </div>
              <div className="lk-cmp__table-row">
                <span>↓ Download</span>
                <span className="lk-cmp__val lk-cmp__val--near">
                  {formatMbps(nearResult.dl, unit)} {unitLabel}
                </span>
                <span className={`lk-cmp__val ${comparison.downloadDropPercent > 50 ? 'lk-cmp__val--bad' : 'lk-cmp__val--ok'}`}>
                  {formatMbps(farResult.dl, unit)} {unitLabel}
                </span>
              </div>
              <div className="lk-cmp__table-row">
                <span>↑ Upload</span>
                <span className="lk-cmp__val lk-cmp__val--near">
                  {formatMbps(nearResult.ul, unit)} {unitLabel}
                </span>
                <span className={`lk-cmp__val ${comparison.uploadDropPercent > 50 ? 'lk-cmp__val--bad' : 'lk-cmp__val--ok'}`}>
                  {formatMbps(farResult.ul, unit)} {unitLabel}
                </span>
              </div>
              <div className="lk-cmp__table-row">
                <span>Resposta</span>
                <span className="lk-cmp__val lk-cmp__val--near">
                  {formatMs(nearResult.latency)} ms
                </span>
                <span className={`lk-cmp__val ${comparison.latencyIncreasePercent > 100 ? 'lk-cmp__val--bad' : 'lk-cmp__val--ok'}`}>
                  {formatMs(farResult.latency)} ms
                </span>
              </div>
              {comparison.downloadDropPercent > 1 && (
                <div className="lk-cmp__table-row lk-cmp__table-row--drop">
                  <span>Queda no download</span>
                  <span />
                  <span className="lk-cmp__drop">
                    -{comparison.downloadDropPercent.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            <div className="lk-cmp__actions">
              <button className="btn-primary lk-cmp__actions-primary" onClick={onRetryNear}>
                Nova comparação
              </button>
              <button className="btn-text" onClick={onBack}>
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
