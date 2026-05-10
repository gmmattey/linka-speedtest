// src/core/interpret.ts
import type {
  ConnectionProfile,
  InterpretedResult,
  UseCaseId,
  RuleSetVersion,
  UseCaseVerdict,
  Tag,
  Quality,
  SpeedTestResult,
  TestRecord,
} from './types';
import { resolveCopy } from './copyDictionary';
import { profiles } from './profiles'; // Removido getUseCaseThresholds pois está sendo tratado diretamente

export const RULE_SET_VERSION: RuleSetVersion = 'v2'; // Nova versão do RuleSet

// --- Helpers ---
function getMetricValue(result: SpeedTestResult, metric: keyof SpeedTestResult): number {
  return (result[metric] as number) || 0;
}

// --- Core Interpretation Logic ---

function getPrimaryQualityAndTags(
  result: SpeedTestResult,
  profile: ConnectionProfile,
): { primary: Quality; tags: Set<Tag> } {
  const tags = new Set<Tag>();
  const profileThresholds = profiles[profile];
  const flagsThresholds = profiles.flags;

  if (!profileThresholds || !flagsThresholds) {
    console.error(`Thresholds not found for profile: ${profile}`);
    return { primary: 'unavailable', tags: new Set<Tag>() };
  }

  // Tags/chips consolidados (Seção 8)
  if (getMetricValue(result, 'latency') > flagsThresholds.highLatency) tags.add('highLatency');
  if (getMetricValue(result, 'ul') < flagsThresholds.lowUpload && getMetricValue(result, 'ul') > 0) tags.add('lowUpload'); // Apenas se houver upload medido

  // PacketLoss e Unstable
  if (getMetricValue(result, 'packetLoss') > flagsThresholds.packetLossWarning) {
    tags.add('packetLoss');
    tags.add('unstable'); // Se packetLoss > 2%, ativa unstable
  }

  // Unstable por Jitter
  if (getMetricValue(result, 'jitter') > flagsThresholds.unstableJitter) {
    tags.add('unstable');
  }

  // VeryUnstable
  if (getMetricValue(result, 'packetLoss') > flagsThresholds.veryUnstablePacketLoss || getMetricValue(result, 'jitter') > flagsThresholds.veryUnstableJitter) {
    tags.add('veryUnstable');
    tags.add('unstable'); // Se veryUnstable, também ativa unstable
  }

  let primary: Quality;

  // Regra consolidada de classificação principal (Seção 7) - Ordem importa!
  if (getMetricValue(result, 'dl') === 0 && getMetricValue(result, 'ul') === 0) {
    primary = 'unavailable';
  } else if (
    getMetricValue(result, 'dl') >= profileThresholds.excellent.download &&
    getMetricValue(result, 'ul') >= profileThresholds.excellent.upload &&
    getMetricValue(result, 'latency') <= profileThresholds.excellent.latency &&
    getMetricValue(result, 'jitter') <= profileThresholds.excellent.jitter &&
    getMetricValue(result, 'packetLoss') <= profileThresholds.excellent.packetLoss
  ) {
    primary = 'excellent';
  } else if (
    getMetricValue(result, 'dl') >= profileThresholds.good.download &&
    getMetricValue(result, 'ul') >= profileThresholds.good.upload &&
    getMetricValue(result, 'latency') <= profileThresholds.good.latency &&
    getMetricValue(result, 'jitter') <= profileThresholds.good.jitter &&
    getMetricValue(result, 'packetLoss') <= profileThresholds.good.packetLoss
  ) {
    primary = 'good';
  } else if (
    getMetricValue(result, 'dl') >= profileThresholds.fair.download &&
    getMetricValue(result, 'ul') >= profileThresholds.fair.upload &&
    getMetricValue(result, 'latency') <= profileThresholds.fair.latency &&
    getMetricValue(result, 'packetLoss') <= profileThresholds.fair.packetLoss
  ) {
    primary = 'fair';
  } else if (getMetricValue(result, 'dl') > 0 || getMetricValue(result, 'ul') > 0) {
    primary = 'slow';
  } else {
    primary = 'unavailable'; // Fallback final, embora o primeiro if já cubra isso
  }

  return { primary, tags };
}

function getUseCaseStatus(
  _result: SpeedTestResult,
  useCaseId: UseCaseId,
): UseCaseVerdict {
  return { id: useCaseId, status: 'unknown', blockingFactors: [] };
}

function getRecommendations(
  _result: SpeedTestResult,
  _profile: ConnectionProfile,
  _flags: InterpretedResult['flags'],
  _useCases: UseCaseVerdict[],
  _history: TestRecord[] = [],
): InterpretedResult['recommendations'] {
  return [];
}

function getStabilityInfo(result: SpeedTestResult): InterpretedResult['stability'] {
  const flagsThresholds = profiles.flags;
  const jitter = getMetricValue(result, 'jitter');
  const packetLoss = getMetricValue(result, 'packetLoss');

  let stabilityScore: number;
  let stabilityLevel: InterpretedResult['stability']['level'];

  // Se ambos estiverem ausentes, exibir "Não medido" (cuidado: este motor não lida com isso aqui)
  // Assumimos que jitter e packetLoss serão 0 se não medidos.
  if (jitter === undefined && packetLoss === undefined) {
    // Isso deve ser tratado em um nível acima ou assumir uma pontuação baixa/desconhecida
    stabilityScore = 0; // Ou um valor que indique "não medido"
    stabilityLevel = 'unstable'; // Ou 'very_stable' se não houver fatores negativos
  } else {
    // Se oscilação estiver ausente, usar apenas perda; se perda estiver ausente, usar apenas oscilação
    const currentJitter = jitter !== undefined ? jitter : 0;
    const currentPacketLoss = packetLoss !== undefined ? packetLoss : 0;

    const jitterScore = 100 - clamp((currentJitter / flagsThresholds.unstableJitter) * 100, 0, 100);
    const lossScore = 100 - clamp((currentPacketLoss / flagsThresholds.packetLossWarning) * 100, 0, 100);

    // Regra: nunca dividir por resposta/latência; nunca retornar abaixo de 0 ou acima de 100
    // O clamp já garante 0-100.
    stabilityScore = Math.round(
      (flagsThresholds.stabilityJitterWeight * jitterScore) +
      (flagsThresholds.stabilityLossWeight * lossScore)
    );

    // Ajustar o código atual porque ele usa `>=85` para “Muito estável” e `>=60` para “Estável”.
    if (stabilityScore >= flagsThresholds.stabilityExcellentScore) {
      stabilityLevel = 'very_stable';
    } else if (stabilityScore >= flagsThresholds.stabilityGoodScore) {
      stabilityLevel = 'stable';
    } else if (stabilityScore >= flagsThresholds.stabilityFairScore) {
      stabilityLevel = 'oscillating';
    } else {
      stabilityLevel = 'unstable';
    }
  }

  return { score: stabilityScore, level: stabilityLevel };
}

// Helper para clamp, já que não temos o utilitário aqui
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function interpretSpeedTestResult(
  result: SpeedTestResult,
  profile: ConnectionProfile,
  history: TestRecord[] = [],
): InterpretedResult {
  // Ensure profile is valid before proceeding
  if (!profile || !(profile in profiles)) {
    console.error(`Invalid or missing profile: ${profile}`);
    // Fallback to a default profile or return an error/unavailable state
    profile = 'fixed_broadband'; // Defaulting to fixed_broadband as a fallback
  }

  const { primary, tags } = getPrimaryQualityAndTags(result, profile);
  const flags = {
    highLatency: tags.has('highLatency'),
    lowUpload: tags.has('lowUpload'),
    unstable: tags.has('unstable'),
    packetLoss: tags.has('packetLoss'),
    veryUnstable: tags.has('veryUnstable'),
  };

  const useCases: UseCaseId[] = ['gaming', 'streaming_4k', 'home_office', 'video_call'];
  const useCaseVerdicts = useCases.map((id) => getUseCaseStatus(result, id));

  const recommendations = getRecommendations(result, profile, flags, useCaseVerdicts, history);

  // Construct copyKeys using resolveCopy for dynamic text generation
  const copyKeys = {
    headlineKey: resolveCopy(`quality.${primary}.headline`),
    shortPhraseKey: resolveCopy(`quality.${primary}.shortPhrase`),
    diagnosisKeys: Array.from(tags).map(tag => resolveCopy(`tag.${tag}.message`)),
  };

  return {
    ruleSetVersion: RULE_SET_VERSION,
    primary,
    flags,
    stability: getStabilityInfo(result),
    useCases: useCaseVerdicts,
    recommendations,
    copyKeys,
  };
}
