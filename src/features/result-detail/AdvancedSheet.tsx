import { Icon } from '../../components/icons';
import { IOSList, type IOSListItem } from '../../components/IOSList';
import { DraggableSheet } from '../../components/DraggableSheet';
import { InfoTooltip } from '../../components/InfoTooltip';
import { resolveCopy } from '../../core';
import type { BufferbloatSeverity, ServerInfo, SpeedTestResult, SpeedTestSample, TestRecord } from '../../types';
import { formatMbps, formatMs } from '../../utils/format';
import './AdvancedSheet.css';

/**
 * Wrap inline para combinar título textual + InfoTooltip dentro de um
 * IOSListItem. O `IOSListItem.title` é tipado como `string`, então
 * passamos a frase + sufixo "?" via aria; o tooltip flutua a partir do
 * ícone à direita do label numa célula separada quando aplicável. Aqui
 * usamos um JSX Element passado via `subtitle` quando o label precisa de
 * tooltip — solução pragmática sem refatorar o IOSList.
 *
 * Nota: como `title` é string, o IOSList foi ampliado mentalmente para
 * aceitar tooltip via prefixo no subtitle. Solução simples: anexamos o
 * tooltip via subtitle "?" que o usuário clica. O IOSList ignora botões
 * dentro de subtitle? Sim — o subtitle é renderizado como ReactNode-ish
 * (texto). Reformulamos: aceitamos no `title` um helper que a infra atual
 * suporta — concatenamos texto e o tooltip vira parte da `trailing`. */

interface Props {
  open: boolean;
  onClose: () => void;
  result: SpeedTestResult;
  server: ServerInfo | null;
  unit: 'mbps' | 'gbps';
  history: TestRecord[];
}

/**
 * AdvancedSheet — porto do antigo `AdvancedAccordionBody` (refator
 * arquitetura 2026-05 → drag-to-resize 2026-05). Conteúdo migrado da
 * seção "Mais detalhes" do ResultScreen, agora num bottom sheet
 * dedicado com hero (label + ícone settings) + 3 sub-blocos hairlined
 * (Métricas avançadas / Sobre o teste / Histórico).
 *
 * Usa `DraggableSheet` como base — drag-to-resize com snap entre 60vh
 * (compact) e 88vh (expanded), pull-down threshold de 30% fecha.
 */
export function AdvancedSheet({ open, onClose, result, server, unit, history }: Props) {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  // ── Bloco "Métricas avançadas" ─────────────────────────────────────────
  const metricItems: IOSListItem[] = [];

  // W5-E — Bufferbloat: estado positivo explícito quando severity === 'low'
  // (deltaMs < 30ms). Quando há problema (moderate/high/critical), mostra
  // grade com cor semântica. Usa bufferbloatSeverity (campo real do
  // orchestrator) em vez de bufferbloatGrade (legado, não preenchido).
  if (result.bufferbloatSeverity === 'low') {
    metricItems.push({
      icon: <Icon name="check-circle" size={14} color="var(--success)" />,
      iconBg: 'var(--color-good-bg)',
      title: 'Bufferbloat',
      titleAfter: (
        <InfoTooltip
          label="Bufferbloat é o aumento da latência quando a conexão está sobrecarregada. Quando não detectado, o roteador gerencia bem o tráfego pesado — ótimo para jogos e videochamadas simultâneas."
          ariaLabel="O que é Bufferbloat"
        />
      ),
      trailing: (
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>
            Sem bufferbloat detectado
          </div>
        </div>
      ),
    });
  } else if (result.bufferbloatSeverity) {
    const grade = bufferbloatSeverityToGrade(result.bufferbloatSeverity);
    metricItems.push({
      icon: <Icon name="bolt" size={14} color={bufferbloatColor(grade)} />,
      iconBg: 'var(--surface-3)',
      title: 'Bufferbloat',
      titleAfter: (
        <InfoTooltip
          label="Avalia o aumento da latência quando a conexão está saturada (bufferbloat). A é ótimo; D/F indica fila congestionada no roteador."
          ariaLabel="O que é Bufferbloat"
        />
      ),
      trailing: (
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: bufferbloatColor(grade), fontWeight: 700, fontSize: 15 }}>
            {grade}
          </div>
          <div style={{ fontSize: 11, color: bufferbloatColor(grade) }}>
            {bufferbloatLabel(grade)}
          </div>
        </div>
      ),
    });
  } else if (result.bufferbloatGrade) {
    // Fallback compat: bufferbloatGrade legado (modo avançado antigo)
    metricItems.push({
      icon: <Icon name="bolt" size={14} color={bufferbloatColor(result.bufferbloatGrade)} />,
      iconBg: 'var(--surface-3)',
      title: resolveCopy('metric.latency.loaded'),
      titleAfter: (
        <InfoTooltip
          label="Avalia o aumento da latência quando a conexão está saturada (bufferbloat). A é ótimo; D/F indica fila congestionada no roteador."
          ariaLabel="O que é Bufferbloat"
        />
      ),
      trailing: (
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: bufferbloatColor(result.bufferbloatGrade), fontWeight: 700, fontSize: 15 }}>
            {result.bufferbloatGrade}
          </div>
          <div style={{ fontSize: 11, color: bufferbloatColor(result.bufferbloatGrade) }}>
            {bufferbloatLabel(result.bufferbloatGrade)}
          </div>
        </div>
      ),
    });
  }
  if (result.latencyLoaded != null) {
    metricItems.push({
      icon: <Icon name="ping" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: resolveCopy('metric.latency.loadedValue'),
      titleAfter: (
        <InfoTooltip
          label="Latência medida durante o teste de carga (download/upload simultâneos). Comparada com a latência ociosa indica se o roteador segura bem o tráfego pesado."
          ariaLabel="O que é Latência sob carga"
        />
      ),
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
    });
  }
  if (result.jitterLoaded != null) {
    metricItems.push({
      icon: <Icon name="jitter" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Oscilação carregada',
      titleAfter: (
        <InfoTooltip
          label="Variação da latência sob carga. Alta oscilação carregada = videochamadas e jogos ficam instáveis quando alguém faz download em paralelo."
          ariaLabel="O que é Oscilação carregada"
        />
      ),
      trailing: <span className="lk-result__metric-sub">{formatMs(result.jitterLoaded)} ms</span>,
    });
  }
  if (result.dlP25 != null && result.dlP75 != null) {
    metricItems.push({
      icon: <Icon name="download" size={14} color="var(--dl)" />,
      iconBg: 'var(--dl-tint, rgba(58,182,255,0.12))',
      title: 'Estabilidade download',
      titleAfter: (
        <InfoTooltip
          label="Faixa entre o 25º e o 75º percentil do download. Quanto mais estreita, mais consistente é a velocidade ao longo do teste."
          ariaLabel="O que é Estabilidade do download"
        />
      ),
      trailing: (
        <span className="lk-result__metric-sub">
          {formatMbps(result.dlP25, unit)}–{formatMbps(result.dlP75, unit)} {unitLabel}
        </span>
      ),
    });
  }
  // Falhas: mostra valor + label qualitativo + tag "estimado" inline
  // quando a origem não é o plugin nativo Android (i.e., heurística do
  // PWA web). Tag em cor --text-3 e font-size 10px — discreta.
  const packetLossEstimated = result.packetLossSource !== 'native';
  metricItems.push({
    icon: <Icon name="loss" size={14} color={result.packetLoss != null ? packetLossColor(result.packetLoss) : 'var(--text-2)'} />,
    iconBg: 'var(--surface-3)',
    title: 'Falhas na conexão',
    trailing: (
      <span className="lk-result__metric-sub" style={result.packetLoss != null ? { color: packetLossColor(result.packetLoss) } : undefined}>
        {result.packetLoss != null ? `${result.packetLoss.toFixed(1)}%  ${packetLossLabel(result.packetLoss)}` : '—'}
        {packetLossEstimated && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 10,
              color: 'var(--text-3)',
              fontStyle: 'italic',
              fontWeight: 400,
            }}
            aria-label="valor estimado"
          >
            estimado
          </span>
        )}
      </span>
    ),
  });

  const avgDl = averageFromSamples(result.dlSamples);
  const avgUl = averageFromSamples(result.ulSamples);
  if (avgDl > 0) {
    metricItems.push({
      icon: <Icon name="download" size={14} color="var(--dl)" />,
      iconBg: 'var(--dl-tint, rgba(58,182,255,0.12))',
      title: 'Velocidade média (DL)',
      trailing: <span className="lk-result__metric-sub">{formatMbps(avgDl, unit)} {unitLabel}</span>,
    });
  }
  if (avgUl > 0) {
    metricItems.push({
      icon: <Icon name="upload" size={14} color="var(--ul)" />,
      iconBg: 'var(--ul-tint, rgba(34,197,94,0.12))',
      title: 'Velocidade média (UL)',
      trailing: <span className="lk-result__metric-sub">{formatMbps(avgUl, unit)} {unitLabel}</span>,
    });
  }

  if (server?.ip && server.ip !== '—') {
    metricItems.push({
      icon: <Icon name="router" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'IP público',
      trailing: <span className="lk-result__metric-sub lk-result__metric-sub--truncate">{server.ip}</span>,
    });
  }
  if (server?.isp && server.isp !== '—') {
    metricItems.push({
      icon: <Icon name="router" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Provedor',
      trailing: <span className="lk-result__metric-sub lk-result__metric-sub--truncate">{server.isp}</span>,
    });
  }

  // ── Bloco "Sobre o teste" ──────────────────────────────────────────────
  const aboutItems: IOSListItem[] = [];

  if (result.elapsedMs != null && result.elapsedMs > 0) {
    aboutItems.push({
      icon: <Icon name="history" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Tempo total do teste',
      trailing: <span className="lk-result__metric-sub">{formatElapsedMs(result.elapsedMs)}</span>,
    });
  }

  if (result.latency > 0) {
    aboutItems.push({
      icon: <Icon name="pin" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Distância estimada ao servidor',
      subtitle: 'estimado pela latência',
      trailing: <span className="lk-result__metric-sub">~{estimateDistanceKm(result.latency)} km</span>,
    });
  }

  aboutItems.push({
    icon: <Icon name="history" size={14} color="var(--text-2)" />,
    iconBg: 'var(--surface-3)',
    title: 'Realizado em',
    trailing: <span className="lk-result__metric-sub">{formatFullDateTime(result.timestamp)}</span>,
  });

  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
  if (appVersion) {
    aboutItems.push({
      icon: <Icon name="cog" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Versão do app',
      trailing: <span className="lk-result__metric-sub">v{appVersion}</span>,
    });
  }

  // ── Bloco "Histórico" — comparação com média (últimos 10) ──────────────
  const historyItems: IOSListItem[] = [];
  const histAvg = historicalAverageDl(history, result.timestamp, 10);
  if (histAvg) {
    const delta = result.dl - histAvg.avgDl;
    const deltaPct = histAvg.avgDl > 0 ? (delta / histAvg.avgDl) * 100 : 0;
    const significant = Math.abs(deltaPct) > 5;
    if (significant) {
      const positive = delta > 0;
      const sign = positive ? '+' : '−';
      const color = positive ? 'var(--ul)' : 'var(--error)';
      historyItems.push({
        icon: <Icon name="trending-up" size={14} color={color} />,
        iconBg: 'var(--surface-3)',
        title: `Sua média (últimos ${histAvg.count})`,
        subtitle: `este teste: ${formatMbps(result.dl, unit)} ${unitLabel}`,
        trailing: (
          <div style={{ textAlign: 'right' }}>
            <div className="lk-result__metric-sub">{formatMbps(histAvg.avgDl, unit)} {unitLabel}</div>
            <div style={{ color, fontSize: 11, fontWeight: 600 }}>
              {sign}{Math.abs(Math.round(deltaPct))}%
            </div>
          </div>
        ),
      });
    } else {
      historyItems.push({
        icon: <Icon name="trending-up" size={14} color="var(--text-2)" />,
        iconBg: 'var(--surface-3)',
        title: `Sua média (últimos ${histAvg.count})`,
        subtitle: 'este teste está dentro da média (±5%)',
        trailing: <span className="lk-result__metric-sub">{formatMbps(histAvg.avgDl, unit)} {unitLabel}</span>,
      });
    }
  }

  const isEmpty = metricItems.length === 0 && aboutItems.length === 0 && historyItems.length === 0;

  return (
    <DraggableSheet open={open} onClose={onClose} ariaLabelledBy="lk-adv-sheet-title">
      <div className="lk-adv-sheet__inner">
        <header className="lk-adv-sheet__header">
          <div className="lk-adv-sheet__title-row">
            <h2 id="lk-adv-sheet-title" className="lk-adv-sheet__title">Avançado</h2>
            <button
              type="button"
              className="lk-adv-sheet__close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <Icon name="close" size={16} color="var(--text-2)" />
            </button>
          </div>
        </header>

        <div className="lk-adv-sheet__content">
          <section className="lk-adv-sheet__hero" aria-label="Avançado">
            <div className="lk-adv-sheet__hero-icon" aria-hidden="true">
              <Icon name="cog" size={26} color="var(--text-2)" />
            </div>
            <div className="lk-adv-sheet__hero-text">
              <p className="lk-adv-sheet__hero-kicker">Detalhes técnicos</p>
              <p className="lk-adv-sheet__hero-title">Métricas, telemetria e histórico</p>
            </div>
          </section>

          {isEmpty ? (
            <p className="lk-adv-sheet__empty">
              Sem dados avançados disponíveis para este teste.
            </p>
          ) : (
            <>
              {metricItems.length > 0 && (
                <div className="lk-adv-sheet__group">
                  <h4 className="lk-adv-sheet__group-label">Métricas avançadas</h4>
                  <IOSList items={metricItems} />
                </div>
              )}
              {aboutItems.length > 0 && (
                <div className="lk-adv-sheet__group">
                  <h4 className="lk-adv-sheet__group-label">Sobre o teste</h4>
                  <IOSList items={aboutItems} />
                </div>
              )}
              {historyItems.length > 0 && (
                <div className="lk-adv-sheet__group">
                  <h4 className="lk-adv-sheet__group-label">Histórico</h4>
                  <IOSList items={historyItems} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="lk-adv-sheet__footer">
          <button type="button" className="lk-adv-sheet__cta-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </DraggableSheet>
  );
}

// ── Helpers (portados do ResultScreen.tsx) ────────────────────────────────

/** Converte BufferbloatSeverity para grade de exibição (A/C/D/F). */
function bufferbloatSeverityToGrade(severity: BufferbloatSeverity): string {
  if (severity === 'low')      return 'A';
  if (severity === 'moderate') return 'C';
  if (severity === 'high')     return 'D';
  return 'F';
}

function bufferbloatColor(grade: string): string {
  if (grade === 'A' || grade === 'B') return 'var(--ul)';
  if (grade === 'C') return 'var(--warn)';
  return 'var(--error)';
}

function bufferbloatLabel(grade: string): string {
  if (grade === 'A') return 'Excelente';
  if (grade === 'B') return 'Bom';
  if (grade === 'C') return 'Moderado';
  if (grade === 'D') return 'Ruim';
  return 'Crítico';
}

function packetLossColor(pct: number): string {
  if (pct < 1) return 'var(--ul)';
  if (pct < 2.5) return 'var(--warn)';
  return 'var(--error)';
}

function packetLossLabel(pct: number): string {
  if (pct < 1) return 'Baixo';
  if (pct < 2.5) return 'Médio';
  return 'Alto';
}

/**
 * Formata data + hora completa para "Realizado em". Exemplo:
 * "03/05/2026 às 14:35:22". Não usa relativo — o banner de contexto já
 * mostra "há 2 min"; aqui é o timestamp absoluto.
 */
function formatFullDateTime(ts: number): string {
  const d = new Date(ts);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yy = d.getFullYear();
  const hh = d.getHours().toString().padStart(2, '0');
  const mi = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${dd}/${mm}/${yy} às ${hh}:${mi}:${ss}`;
}

/**
 * Formata duração em ms para "Xs" ou "Xm Ys". Granularidade de segundos —
 * abaixo de 1 s mostra "<1s" para evitar mostrar zero.
 */
function formatElapsedMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return '<1s';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function averageFromSamples(samples: SpeedTestSample[] | undefined): number {
  if (!samples || samples.length === 0) return 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].mbps > 0) { start = i; break; }
  }
  for (let i = samples.length - 1; i >= 0; i--) {
    if (samples[i].mbps > 0) { end = i; break; }
  }
  if (start === -1 || end === -1 || start > end) return 0;
  let sum = 0;
  let count = 0;
  for (let i = start; i <= end; i++) {
    sum += samples[i].mbps;
    count++;
  }
  return count === 0 ? 0 : sum / count;
}

function historicalAverageDl(
  history: TestRecord[],
  currentTimestamp: number,
  n = 10,
): { avgDl: number; count: number } | null {
  const previous = history.filter((r) => r.timestamp !== currentTimestamp).slice(0, n);
  if (previous.length < 2) return null;
  const sum = previous.reduce((acc, r) => acc + r.dl, 0);
  return { avgDl: sum / previous.length, count: previous.length };
}

/**
 * Distância estimada ao servidor (km). Heurística: ~100 km/ms (luz no
 * fio + RTT/2 + processamento). Proxy de ordem de grandeza, não medida
 * geográfica.
 */
function estimateDistanceKm(latencyMs: number): number {
  return Math.round(latencyMs * 100);
}
