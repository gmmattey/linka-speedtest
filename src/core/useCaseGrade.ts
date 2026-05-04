/**
 * Deriva grade A-F por use case a partir das métricas e do profile ativo.
 *
 * Introduzido no Refactor visual do ResultScreen (2026-05): as grades A-F
 * deixaram de ser aplicadas por métrica individual (DL, UL, latency, jitter)
 * e passaram a viver nos use cases (gaming, streaming, home office, video
 * call) — cada use case ganha uma grade que reflete o pior ponto entre as
 * métricas relevantes ao cenário.
 *
 * Fonte da verdade dos cortes A-F: thresholds de qualidade do profile
 * (`PROFILES[profile].quality.excellent/good/fair`) + `flags.unstable` /
 * `flags.veryUnstable` para jitter (não há `fair.jitter`) e
 * `flags.packetLoss * 2.5` (limite veryUnstable de perda) para o degrau D
 * de packet loss. Isso mantém as grades coerentes entre fixed_broadband
 * e mobile_broadband sem duplicar números mágicos.
 *
 * O mapeamento métrica→use case espelha o que `interpret.ts` já avalia em
 * `buildUseCaseEvaluators()`. Atualizar aqui se o motor mudar.
 *
 * Pure: sem React/DOM. Testes em `src/__tests__/useCaseGrade.test.ts`.
 */

import type { SpeedTestResult, ConnectionProfile } from '../types';
import { PROFILES, type ProfileRules } from './profiles';
import type { UseCaseId, UseCaseVerdict } from './types';

export type UseCaseGrade = 'A' | 'B' | 'C' | 'D' | 'F';

type RelevantMetric = 'dl' | 'ul' | 'latency' | 'jitter' | 'packetLoss';

/**
 * Métricas que cada use case considera. Espelha `buildUseCaseEvaluators()`
 * em `interpret.ts` — manter sincronizado se o motor mudar.
 */
const RELEVANT_PER_USE_CASE: Record<UseCaseId, readonly RelevantMetric[]> = {
  gaming:       ['dl', 'latency', 'jitter', 'packetLoss'],
  streaming_4k: ['dl', 'jitter', 'packetLoss'],
  home_office:  ['dl', 'ul', 'latency', 'jitter', 'packetLoss'],
  video_call:   ['dl', 'ul', 'latency', 'jitter', 'packetLoss'],
};

const GRADE_RANK: Record<UseCaseGrade, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  F: 4,
};

function metricValue(m: RelevantMetric, metrics: SpeedTestResult): number {
  switch (m) {
    case 'dl':         return metrics.dl;
    case 'ul':         return metrics.ul;
    case 'latency':    return metrics.latency;
    case 'jitter':     return metrics.jitter;
    case 'packetLoss': return metrics.packetLoss;
  }
}

/**
 * Grade A-F para uma métrica isolada usando os cortes do profile.
 *
 * Exposto por questão de teste — produção consome `useCaseGrade()`.
 */
export function gradeMetric(
  metric: RelevantMetric,
  value: number,
  rules: ProfileRules,
): UseCaseGrade {
  const q = rules.quality;
  const f = rules.flags;

  switch (metric) {
    case 'dl': {
      if (value >= q.excellent.dl) return 'A';
      if (value >= q.good.dl)      return 'B';
      if (value >= q.fair.dl)      return 'C';
      if (value >= q.fair.dl / 2)  return 'D';
      return 'F';
    }
    case 'ul': {
      if (value >= q.excellent.ul) return 'A';
      if (value >= q.good.ul)      return 'B';
      if (value >= q.fair.ul)      return 'C';
      if (value >= q.fair.ul / 2)  return 'D';
      return 'F';
    }
    case 'latency': {
      if (value <= q.excellent.latency) return 'A';
      if (value <= q.good.latency)      return 'B';
      if (value <= q.fair.latency)      return 'C';
      if (value <= q.fair.latency * 1.6) return 'D';
      return 'F';
    }
    case 'jitter': {
      // `fair` não inclui jitter; usamos os limiares de flags como teto C/D.
      if (value <= q.excellent.jitter) return 'A';
      if (value <= q.good.jitter)      return 'B';
      if (value <= f.unstable)         return 'C';
      if (value <= f.veryUnstable)     return 'D';
      return 'F';
    }
    case 'packetLoss': {
      if (value <= q.excellent.packetLoss) return 'A';
      if (value <= q.good.packetLoss)      return 'B';
      if (value <= q.fair.packetLoss)      return 'C';
      // `f.packetLoss * 2.5` é o mesmo número que dispara veryUnstable em
      // `interpret.ts` (5% no profile fixo, 5% no móvel).
      if (value <= f.packetLoss * 2.5)     return 'D';
      return 'F';
    }
  }
}

function worstGrade(grades: UseCaseGrade[]): UseCaseGrade {
  let worst: UseCaseGrade = 'A';
  for (const g of grades) {
    if (GRADE_RANK[g] > GRADE_RANK[worst]) worst = g;
  }
  return worst;
}

/**
 * Deriva grade A-F para um use case baseado nos thresholds de qualidade do
 * profile e nas métricas observadas. A regra: grade do pior ponto entre as
 * métricas relevantes para o use case.
 *
 * O parâmetro `useCase` (verdict completo) é aceito em vez de só o `id` para
 * deixar a API estável caso, no futuro, a regra leve em conta `status` ou
 * `blockingFactors` — hoje só usamos `id`.
 */
export function useCaseGrade(
  useCase: UseCaseVerdict,
  metrics: SpeedTestResult,
  profile: ConnectionProfile,
): UseCaseGrade {
  const rules = PROFILES[profile];
  const relevant = RELEVANT_PER_USE_CASE[useCase.id];
  const grades = relevant.map((m) => gradeMetric(m, metricValue(m, metrics), rules));
  return worstGrade(grades);
}
