import type { TestRecord } from '../types';

/**
 * historyTrends — comparação inteligente entre janelas temporais do histórico.
 *
 * Compara a "janela atual" (últimos 7 ou 30 dias) com a "janela anterior"
 * imediatamente antes (7-14 dias atrás, ou 30-60 dias atrás), retornando
 * delta percentual em DL/UL/latência. Usado pela `HistoryScreen` para
 * mostrar um card sutil no topo quando há mudança significativa (>10%).
 *
 * Convenção de sinais:
 *   - DL/UL: positivo = melhorou (mais Mbps).
 *   - Latência: positivo = piorou (mais ms). A função normaliza isso em
 *     `describeTrend` invertendo o sinal pra exibição.
 *
 * Retorna `null` quando uma das janelas tem menos de 5 testes — não vale
 * tirar média de menos amostras.
 */

export interface TrendWindow {
  dlAvg: number;
  ulAvg: number;
  latencyAvg: number;
  testCount: number;
}

export interface TrendComparison {
  current: TrendWindow;
  previous: TrendWindow;
  /** Delta % de download. Positivo = melhorou (current > previous). */
  dlChangePct: number;
  /** Delta % de upload. Positivo = melhorou. */
  ulChangePct: number;
  /** Delta % de latência. Positivo = piorou (current > previous). Para
   *  `describeTrend` o sinal é invertido na exibição (− significa "melhorou"). */
  latencyChangePct: number;
  /** Rótulo curto da janela atual ("essa semana", "esse mês"). */
  windowLabel: string;
}

const MIN_TESTS = 5;
const DAY_MS = 24 * 3600 * 1000;

function meanOr(records: TestRecord[], pick: (r: TestRecord) => number): number {
  if (records.length === 0) return 0;
  const sum = records.reduce((s, r) => s + pick(r), 0);
  return sum / records.length;
}

function buildWindow(records: TestRecord[]): TrendWindow {
  return {
    dlAvg:      meanOr(records, (r) => r.dl),
    ulAvg:      meanOr(records, (r) => r.ul),
    latencyAvg: meanOr(records, (r) => r.latency),
    testCount:  records.length,
  };
}

function pctDelta(current: number, previous: number): number {
  if (previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Helper interno: dado um número de dias, particiona o histórico em janela
 * "atual" (últimos N dias a partir de `now`) e "anterior" (N dias antes
 * disso). Retorna comparison se ambas tiverem >= MIN_TESTS, senão null.
 *
 * `now` é parametrizado para facilitar testes determinísticos.
 */
function computeTrend(
  records: TestRecord[],
  windowDays: number,
  windowLabel: string,
  now = Date.now(),
): TrendComparison | null {
  if (records.length < MIN_TESTS * 2) return null;

  const currentStart  = now - windowDays * DAY_MS;
  const previousStart = now - 2 * windowDays * DAY_MS;

  const current  = records.filter((r) => r.timestamp >= currentStart  && r.timestamp <= now);
  const previous = records.filter((r) => r.timestamp >= previousStart && r.timestamp <  currentStart);

  if (current.length < MIN_TESTS || previous.length < MIN_TESTS) return null;

  const cw = buildWindow(current);
  const pw = buildWindow(previous);

  return {
    current:  cw,
    previous: pw,
    dlChangePct:      pctDelta(cw.dlAvg,      pw.dlAvg),
    ulChangePct:      pctDelta(cw.ulAvg,      pw.ulAvg),
    latencyChangePct: pctDelta(cw.latencyAvg, pw.latencyAvg),
    windowLabel,
  };
}

/** Janela: últimos 7 dias vs. 7-14 dias. */
export function computeWeeklyTrend(records: TestRecord[], now = Date.now()): TrendComparison | null {
  return computeTrend(records, 7, 'essa semana', now);
}

/** Janela: últimos 30 dias vs. 30-60 dias. */
export function computeMonthlyTrend(records: TestRecord[], now = Date.now()): TrendComparison | null {
  return computeTrend(records, 30, 'esse mês', now);
}

// ── Narrativa ────────────────────────────────────────────────────────────

export type TrendSeverity = 'good' | 'neutral' | 'bad';

export interface TrendDescription {
  /** Headline curto: "Sua média essa semana é 580 Mbps". */
  headline: string;
  /** Comparação com janela anterior: "▼ 12% pior que a semana passada". */
  comparison: string;
  /** Severidade pra coloração do card. */
  severity: TrendSeverity;
}

const SIGNIFICANT_PCT = 10;
const SEVERE_PCT      = 20;

function formatMbps(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} Gbps`;
  return `${Math.round(value)} Mbps`;
}

function previousWindowLabel(label: string): string {
  if (label === 'essa semana') return 'a semana passada';
  if (label === 'esse mês')    return 'o mês passado';
  return 'período anterior';
}

/**
 * Gera narrativa em pt-BR para o card de tendência. A métrica priorizada
 * é o download (que o usuário associa diretamente com "minha internet").
 * Se DL não tem variação significativa mas latência sim, tenta latência.
 *
 * Severidade:
 *   - DL/UL melhorou >10%   → good
 *   - DL/UL piorou >10%     → bad (já forte; >20% é "bad" também — só
 *                            mudamos a ênfase do texto)
 *   - Variação <10%         → neutral (caller geralmente não renderiza)
 *
 *   - Latência: lógica invertida. Diminuiu >10% → good. Aumentou >10% → bad.
 */
export function describeTrend(trend: TrendComparison): TrendDescription {
  const dlAbs       = Math.abs(trend.dlChangePct);
  const latAbs      = Math.abs(trend.latencyChangePct);

  // Decisão de "qual métrica narra" — DL prevalece quando significativa.
  const dlSignificant  = dlAbs  >= SIGNIFICANT_PCT;
  const latSignificant = latAbs >= SIGNIFICANT_PCT;

  if (dlSignificant) {
    return narrateDownload(trend);
  }
  if (latSignificant) {
    return narrateLatency(trend);
  }
  // Variação irrelevante — o caller normalmente não renderiza, mas
  // mantemos a função total: retornamos um snapshot neutro.
  return {
    headline:   `Sua média ${trend.windowLabel} é ${formatMbps(trend.current.dlAvg)}`,
    comparison: `Estável em relação a ${previousWindowLabel(trend.windowLabel)}.`,
    severity:   'neutral',
  };
}

function narrateDownload(trend: TrendComparison): TrendDescription {
  const pct = Math.round(trend.dlChangePct);
  const absPct = Math.abs(pct);
  const headline = `Sua média ${trend.windowLabel} é ${formatMbps(trend.current.dlAvg)}`;
  const prevLabel = previousWindowLabel(trend.windowLabel);

  if (pct > 0) {
    const adj = absPct >= SEVERE_PCT ? 'bem melhor' : 'melhor';
    return {
      headline,
      comparison: `▲ ${absPct}% ${adj} que ${prevLabel}.`,
      severity: 'good',
    };
  }
  // pct < 0
  const adj = absPct >= SEVERE_PCT ? 'bem pior' : 'pior';
  return {
    headline,
    comparison: `▼ ${absPct}% ${adj} que ${prevLabel}.`,
    severity: 'bad',
  };
}

function narrateLatency(trend: TrendComparison): TrendDescription {
  const pct = Math.round(trend.latencyChangePct);
  const absPct = Math.abs(pct);
  const headline = `Resposta média ${trend.windowLabel}: ${Math.round(trend.current.latencyAvg)} ms`;
  const prevLabel = previousWindowLabel(trend.windowLabel);

  if (pct > 0) {
    // Latência subiu = piorou.
    return {
      headline,
      comparison: `▲ ${absPct}% pior que ${prevLabel}.`,
      severity: 'bad',
    };
  }
  return {
    headline,
    comparison: `▼ ${absPct}% melhor que ${prevLabel}.`,
    severity: 'good',
  };
}

/**
 * Helper de UI: decide se vale a pena mostrar o card. Usado pela
 * HistoryScreen para evitar renderizar quando a variação é insignificante.
 */
export function isTrendSignificant(trend: TrendComparison): boolean {
  return Math.abs(trend.dlChangePct) >= SIGNIFICANT_PCT
    || Math.abs(trend.ulChangePct) >= SIGNIFICANT_PCT
    || Math.abs(trend.latencyChangePct) >= SIGNIFICANT_PCT;
}
