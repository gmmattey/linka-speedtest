/**
 * Ponto de entrada público do motor unificado.
 *
 * Tudo que faz parte do contrato é reexportado aqui. A Fase 7 do plano de
 * unificação (embed Flutter) consumirá este index para chamar o motor sem
 * conhecer a estrutura interna.
 *
 * Regra de ouro: este pacote (`src/core/*`) **não importa** de `react`,
 * `react-dom`, `../components`, `../screens`, `../hooks`. Importa apenas de
 * `../types` (e de `../utils/classifier` somente para reusar
 * `RULE_SET_VERSION`).
 */

export { interpretSpeedTestResult } from './interpret';
export { resolveCopy } from './copyDictionary';
export { runHeadlessTest } from './embed';
export type { HeadlessTestOptions, HeadlessTestResult } from './embed';
export {
  PROFILES,
  GAMING_PROFILES,
  type ProfileRules,
  type QualityThresholds,
  type FlagThresholds,
  type UseCaseThresholds,
  type GamingProfileId,
  type GamingProfileDef,
  type GamingProfileThresholds,
} from './profiles';
export type {
  BlockingFactor,
  InterpretedCopyKeys,
  InterpretedRecommendation,
  InterpretedResult,
  InterpretFlags,
  InterpretInput,
  RecommendationTrigger,
  StabilityLevel,
  UseCaseId,
  UseCaseStatus,
  UseCaseVerdict,
} from './types';
