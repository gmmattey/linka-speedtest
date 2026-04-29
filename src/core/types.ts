/**
 * Tipos do contrato público do motor unificado de interpretação.
 *
 * Camada introduzida na Fase 1 do plano de unificação (PWA + linka Flutter).
 * Pura, sem dependência de React/DOM/localStorage. Coexiste com `classifier.ts`
 * legado durante a migração — Fase 1 só introduz o motor, sem migrar chamadores.
 *
 * Ver `docs/DocumentacaoTecnicaSistema.md` §3.10 para o contrato completo.
 */

import type {
  ConnectionProfile,
  Quality,
  RuleSetVersion,
  SpeedTestResult,
  TestRecord,
} from '../types';

// --- Use cases ---------------------------------------------------------------

/** Cenários de uso avaliados pelo motor. */
export type UseCaseId = 'gaming' | 'streaming_4k' | 'home_office' | 'video_call';

/** Resultado de cada use case. `maybe` é o intermediário entre `good` e `limited`. */
export type UseCaseStatus = 'good' | 'maybe' | 'limited';

/**
 * Métrica que rebaixou um use case.
 * Permite à camada de UX explicar *por que* algo não está bom — ex: "Games:
 * limitado por jitter alto e perda de pacotes".
 */
export type BlockingFactor = 'dl' | 'ul' | 'latency' | 'jitter' | 'packetLoss';

export interface UseCaseVerdict {
  id: UseCaseId;
  status: UseCaseStatus;
  /** Vazio quando `status === 'good'`. */
  blockingFactors: BlockingFactor[];
}

// --- Stability ---------------------------------------------------------------

/** Faixas qualitativas derivadas do score numérico de estabilidade (0–100). */
export type StabilityLevel = 'very_stable' | 'stable' | 'oscillating' | 'unstable';

// --- Flags -------------------------------------------------------------------

/**
 * Booleans correspondentes ao tipo `Tag` do classifier legado, mas sempre
 * presentes (todos os 5 campos) — facilita iteração e gera chaves de copy
 * estáveis.
 */
export interface InterpretFlags {
  highLatency: boolean;
  lowUpload: boolean;
  unstable: boolean;
  packetLoss: boolean;
  veryUnstable: boolean;
}

// --- Recommendations ---------------------------------------------------------

/**
 * O que disparou uma recomendação. Permite à camada de UX explicar o porquê
 * sem precisar reavaliar regras. `'history'` quando o disparo veio do padrão
 * de testes recentes; `'useCase'` quando veio de um cenário rebaixado.
 */
export type RecommendationTrigger = keyof InterpretFlags | 'history' | 'useCase';

export interface InterpretedRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  triggeredBy: RecommendationTrigger[];
}

// --- Output principal --------------------------------------------------------

/**
 * Conjunto de chaves de copy que a camada de UX deve resolver via
 * `resolveCopy()`. O motor não retorna strings — o dicionário pt-BR vive em
 * `copyDictionary.ts`.
 */
export interface InterpretedCopyKeys {
  headlineKey: string;
  shortPhraseKey: string;
  diagnosisKeys: string[];
  stabilityLabelKey: string;
}

export interface InterpretedResult {
  ruleSetVersion: RuleSetVersion;
  profile: ConnectionProfile;
  quality: Quality;
  flags: InterpretFlags;
  stability: { score: number; level: StabilityLevel };
  useCases: UseCaseVerdict[];
  recommendations: InterpretedRecommendation[];
  copyKeys: InterpretedCopyKeys;
}

export interface InterpretInput {
  metrics: SpeedTestResult;
  profile: ConnectionProfile;
  /** Histórico opcional para detecção de problemas recorrentes (≥3 registros). */
  history?: TestRecord[];
}
