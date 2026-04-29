/**
 * Motor unificado de interpretação de resultado de speedtest.
 *
 * Função única `interpretSpeedTestResult()` substitui (eventualmente) as
 * traduções número→texto espalhadas pelo PWA. Pura, sem React/DOM/localStorage.
 *
 * Ver `docs/DocumentacaoTecnicaSistema.md` §3.10 para o contrato completo.
 */

import type { Quality, SpeedTestResult, TestRecord } from '../types';
import { RULE_SET_VERSION } from '../utils/classifier';
import { PROFILES, type ProfileRules, type UseCaseThresholds } from './profiles';
import type {
  BlockingFactor,
  InterpretedRecommendation,
  InterpretedResult,
  InterpretFlags,
  InterpretInput,
  StabilityLevel,
  UseCaseId,
  UseCaseVerdict,
} from './types';

// =============================================================================
// Helpers
// =============================================================================

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

const STABILITY_ORDER: StabilityLevel[] = [
  'unstable',
  'oscillating',
  'stable',
  'very_stable',
];

function downgradeStability(level: StabilityLevel): StabilityLevel {
  const idx = STABILITY_ORDER.indexOf(level);
  // Já no piso (`unstable`) — não rebaixa abaixo.
  if (idx <= 0) return level;
  return STABILITY_ORDER[idx - 1];
}

// =============================================================================
// Quality
// =============================================================================

function computeQuality(metrics: SpeedTestResult, rules: ProfileRules): Quality {
  const { dl, ul, latency, jitter, packetLoss } = metrics;
  const q = rules.quality;

  if (dl === 0 && ul === 0) return 'unavailable';

  if (
    dl >= q.excellent.dl &&
    ul >= q.excellent.ul &&
    latency <= q.excellent.latency &&
    jitter <= q.excellent.jitter &&
    packetLoss <= q.excellent.packetLoss
  ) {
    return 'excellent';
  }

  if (
    dl >= q.good.dl &&
    ul >= q.good.ul &&
    latency <= q.good.latency &&
    jitter <= q.good.jitter &&
    packetLoss <= q.good.packetLoss
  ) {
    return 'good';
  }

  if (
    dl >= q.fair.dl &&
    ul >= q.fair.ul &&
    latency <= q.fair.latency &&
    packetLoss <= q.fair.packetLoss
  ) {
    return 'fair';
  }

  if (dl > 0 || ul > 0) return 'slow';
  return 'unavailable';
}

// =============================================================================
// Flags
// =============================================================================

function computeFlags(metrics: SpeedTestResult, rules: ProfileRules): InterpretFlags {
  const f = rules.flags;
  return {
    highLatency:  metrics.latency > f.highLatency,
    lowUpload:    metrics.ul < f.lowUpload,
    unstable:     metrics.jitter > f.unstable,
    packetLoss:   metrics.packetLoss > f.packetLoss,
    // Paridade legacy: veryUnstable é jitter > 80 OR packetLoss > 5.
    // Mantemos o `veryUnstable: number` como threshold de jitter; a perda
    // crítica usa `packetLoss * 2.5` (gera 5 com fixa, 5 com móvel — ambos
    // refletem o mesmo limiar regulatório).
    veryUnstable: metrics.jitter > f.veryUnstable || metrics.packetLoss > f.packetLoss * 2.5,
  };
}

// =============================================================================
// Stability
// =============================================================================

function computeStabilityScore(metrics: SpeedTestResult): number {
  // Mantém a fórmula do classifier legado (stability.ts em coexistência):
  //   jitterScore = 100 - clamp((jitter/50)*100, 0, 100)
  //   lossScore   = 100 - clamp((loss/2)*100,   0, 100)
  //   score       = round(0.6 * jitterScore + 0.4 * lossScore)
  const jitterScore = 100 - clamp((metrics.jitter / 50) * 100, 0, 100);
  const lossScore = 100 - clamp((metrics.packetLoss / 2) * 100, 0, 100);
  return Math.round(0.6 * jitterScore + 0.4 * lossScore);
}

function scoreToLevel(score: number): StabilityLevel {
  if (score >= 85) return 'very_stable';
  if (score >= 60) return 'stable';
  if (score >= 35) return 'oscillating';
  return 'unstable';
}

function computeStability(
  metrics: SpeedTestResult,
  rules: ProfileRules,
): { score: number; level: StabilityLevel } {
  const score = computeStabilityScore(metrics);
  let level = scoreToLevel(score);

  // Achado #2: "Muito estável" + "Resposta alta" não pode coexistir. Se a
  // latência estoura 1.5× o limiar de highLatency, rebaixamos um nível —
  // garantia contra inconsistência percebida pelo usuário.
  if (metrics.latency > rules.flags.highLatency * 1.5) {
    level = downgradeStability(level);
  }

  return { score, level };
}

// =============================================================================
// Use cases
// =============================================================================

interface UseCaseEvaluator {
  good:  (m: SpeedTestResult) => BlockingFactor[];   // retorna fatores que falharam
  maybe: (m: SpeedTestResult) => BlockingFactor[];
}

function buildUseCaseEvaluators(rules: UseCaseThresholds): Record<UseCaseId, UseCaseEvaluator> {
  return {
    gaming: {
      good: (m) => {
        const t = rules.gaming.good;
        const fails: BlockingFactor[] = [];
        if (m.dl < t.dl) fails.push('dl');
        if (m.latency > t.latency) fails.push('latency');
        if (m.jitter > t.jitter) fails.push('jitter');
        if (m.packetLoss > t.packetLoss) fails.push('packetLoss');
        return fails;
      },
      maybe: (m) => {
        const t = rules.gaming.maybe;
        const fails: BlockingFactor[] = [];
        if (m.dl < t.dl) fails.push('dl');
        if (m.latency > t.latency) fails.push('latency');
        if (m.jitter > t.jitter) fails.push('jitter');
        if (m.packetLoss > t.packetLoss) fails.push('packetLoss');
        return fails;
      },
    },
    streaming_4k: {
      good: (m) => {
        const t = rules.streaming_4k.good;
        const fails: BlockingFactor[] = [];
        if (m.dl < t.dl) fails.push('dl');
        if (m.jitter > t.jitter) fails.push('jitter');
        if (m.packetLoss > t.packetLoss) fails.push('packetLoss');
        return fails;
      },
      maybe: (m) => {
        const t = rules.streaming_4k.maybe;
        const fails: BlockingFactor[] = [];
        if (m.dl < t.dl) fails.push('dl');
        if (m.jitter > t.jitter) fails.push('jitter');
        if (m.packetLoss > t.packetLoss) fails.push('packetLoss');
        return fails;
      },
    },
    home_office: {
      good: (m) => {
        const t = rules.home_office.good;
        const fails: BlockingFactor[] = [];
        if (m.dl < t.dl) fails.push('dl');
        if (m.ul < t.ul) fails.push('ul');
        if (m.latency > t.latency) fails.push('latency');
        if (m.jitter > t.jitter) fails.push('jitter');
        if (m.packetLoss > t.packetLoss) fails.push('packetLoss');
        return fails;
      },
      maybe: (m) => {
        const t = rules.home_office.maybe;
        const fails: BlockingFactor[] = [];
        if (m.dl < t.dl) fails.push('dl');
        if (m.ul < t.ul) fails.push('ul');
        if (m.latency > t.latency) fails.push('latency');
        if (m.jitter > t.jitter) fails.push('jitter');
        if (m.packetLoss > t.packetLoss) fails.push('packetLoss');
        return fails;
      },
    },
    video_call: {
      good: (m) => {
        const t = rules.video_call.good;
        const fails: BlockingFactor[] = [];
        if (m.dl < t.dl) fails.push('dl');
        if (m.ul < t.ul) fails.push('ul');
        if (m.latency > t.latency) fails.push('latency');
        if (m.jitter > t.jitter) fails.push('jitter');
        if (m.packetLoss > t.packetLoss) fails.push('packetLoss');
        return fails;
      },
      maybe: (m) => {
        const t = rules.video_call.maybe;
        const fails: BlockingFactor[] = [];
        if (m.dl < t.dl) fails.push('dl');
        if (m.ul < t.ul) fails.push('ul');
        if (m.latency > t.latency) fails.push('latency');
        if (m.jitter > t.jitter) fails.push('jitter');
        if (m.packetLoss > t.packetLoss) fails.push('packetLoss');
        return fails;
      },
    },
  };
}

const USE_CASE_IDS: UseCaseId[] = ['gaming', 'streaming_4k', 'home_office', 'video_call'];

function evaluateUseCases(
  metrics: SpeedTestResult,
  rules: ProfileRules,
): UseCaseVerdict[] {
  const evaluators = buildUseCaseEvaluators(rules.useCases);
  return USE_CASE_IDS.map<UseCaseVerdict>((id) => {
    const ev = evaluators[id];
    const goodFails = ev.good(metrics);
    if (goodFails.length === 0) {
      return { id, status: 'good', blockingFactors: [] };
    }
    const maybeFails = ev.maybe(metrics);
    if (maybeFails.length === 0) {
      // Subiu de "maybe-or-worse" para "maybe": os fatores que ficaram fora do
      // patamar `good` são os que justificam estar em `maybe`.
      return { id, status: 'maybe', blockingFactors: goodFails };
    }
    // Ficou abaixo até de `maybe` → limited
    return { id, status: 'limited', blockingFactors: maybeFails };
  });
}

// =============================================================================
// Recommendations
// =============================================================================

function flagPriority(flag: keyof InterpretFlags): 'low' | 'medium' | 'high' {
  switch (flag) {
    case 'veryUnstable': return 'high';
    case 'packetLoss':   return 'high';
    case 'highLatency':  return 'high';
    case 'unstable':     return 'medium';
    case 'lowUpload':    return 'medium';
  }
}

function buildRecommendations(
  flags: InterpretFlags,
  useCases: UseCaseVerdict[],
  history: TestRecord[] | undefined,
): InterpretedRecommendation[] {
  const out: InterpretedRecommendation[] = [];

  // 1) Uma recomendação por flag verdadeira.
  (Object.keys(flags) as Array<keyof InterpretFlags>).forEach((flag) => {
    if (!flags[flag]) return;
    out.push({
      id: `flag.${flag}`,
      priority: flagPriority(flag),
      triggeredBy: [flag],
    });
  });

  // 2) Uma recomendação por use case rebaixado (status !== 'good').
  useCases.forEach((uc) => {
    if (uc.status === 'good') return;
    out.push({
      id: `useCase.${uc.id}.${uc.status}`,
      priority: uc.status === 'limited' ? 'high' : 'medium',
      triggeredBy: ['useCase'],
    });
  });

  // 3) Recorrência histórica (paridade com classifier.buildDiagnosis):
  //    ≥ 3 dos últimos 5 com latência > 80 / loss > 2 / quality slow|unavailable.
  if (history && history.length >= 3) {
    const last5 = history.slice(0, 5);
    const latCount  = last5.filter((h) => h.latency > 80).length;
    const lossCount = last5.filter((h) => h.packetLoss > 2).length;
    const slowCount = last5.filter((h) => h.quality === 'slow' || h.quality === 'unavailable').length;

    if (latCount >= 3) {
      out.push({ id: 'history.latency', priority: 'medium', triggeredBy: ['history'] });
    }
    if (lossCount >= 3) {
      out.push({ id: 'history.loss', priority: 'high', triggeredBy: ['history'] });
    }
    if (slowCount >= 3) {
      out.push({ id: 'history.slow', priority: 'high', triggeredBy: ['history'] });
    }
  }

  return out;
}

// =============================================================================
// Copy keys
// =============================================================================

function pickShortPhraseKey(quality: Quality, flags: InterpretFlags): string {
  if (quality === 'unavailable') return 'shortPhrase.unavailable';
  if (quality === 'slow') {
    // Mantém a heurística do legacy: slow + sinal de instabilidade → "Conexão
    // instável". Caso contrário → "Internet lenta".
    if (flags.unstable || flags.packetLoss || flags.highLatency || flags.veryUnstable) {
      return 'shortPhrase.slow.unstable';
    }
    return 'shortPhrase.slow';
  }
  if (quality === 'fair') return 'shortPhrase.fair';
  if (quality === 'good') return 'shortPhrase.good';
  return 'shortPhrase.excellent';
}

function buildDiagnosisKeys(
  quality: Quality,
  flags: InterpretFlags,
  history: TestRecord[] | undefined,
): string[] {
  const keys: string[] = [];

  // Paridade com buildDiagnosis() legacy: parágrafo base por quality.
  keys.push(`diagnosis.${quality}`);

  // Tags em ordem de severidade (legacy).
  if (flags.veryUnstable) {
    keys.push('diagnosis.veryUnstable');
  } else if (flags.packetLoss) {
    keys.push('diagnosis.packetLoss');
  } else if (flags.unstable) {
    keys.push('diagnosis.unstable');
  }
  if (flags.highLatency) keys.push('diagnosis.highLatency');
  if (flags.lowUpload)   keys.push('diagnosis.lowUpload');

  // Histórico (paridade legacy).
  if (history && history.length >= 3) {
    const last5 = history.slice(0, 5);
    const latCount  = last5.filter((h) => h.latency > 80).length;
    const lossCount = last5.filter((h) => h.packetLoss > 2).length;
    const slowCount = last5.filter((h) => h.quality === 'slow' || h.quality === 'unavailable').length;
    if (latCount  >= 3) keys.push('diagnosis.history.latency');
    if (lossCount >= 3) keys.push('diagnosis.history.loss');
    if (slowCount >= 3) keys.push('diagnosis.history.slow');
  }

  return keys;
}

// =============================================================================
// Função principal
// =============================================================================

export function interpretSpeedTestResult(input: InterpretInput): InterpretedResult {
  const rules = PROFILES[input.profile];
  const { metrics, history } = input;

  const quality = computeQuality(metrics, rules);
  const flags = computeFlags(metrics, rules);
  const stability = computeStability(metrics, rules);
  const useCases = evaluateUseCases(metrics, rules);
  const recommendations = buildRecommendations(flags, useCases, history);

  return {
    ruleSetVersion: RULE_SET_VERSION,
    profile: input.profile,
    quality,
    flags,
    stability,
    useCases,
    recommendations,
    copyKeys: {
      headlineKey: `quality.${quality}`,
      shortPhraseKey: pickShortPhraseKey(quality, flags),
      diagnosisKeys: buildDiagnosisKeys(quality, flags, history),
      stabilityLabelKey: `stability.${stability.level}`,
    },
  };
}
