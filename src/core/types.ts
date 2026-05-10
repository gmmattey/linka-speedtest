// src/core/types.ts

import type { Quality, DeviceType, ConnectionType, SpeedTestMode, ConnectionProfile, RuleSetVersion, BufferbloatSeverity, RecommendationAction } from '../types'; // Importando tipos globais necessários

export * from '../types'; // Re-exportar tipos globais para facilitar o acesso no core

// --- Tipos para o motor de interpretação ---

export type UseCaseId = 'gaming' | 'streaming_4k' | 'home_office' | 'video_call';
export type UseCaseStatus = 'excellent' | 'good' | 'acceptable' | 'fail' | 'unknown';

// Representa os fatores que podem estar limitando a conexão para um caso de uso específico.
export type BlockingFactor = 'dl' | 'ul' | 'latency' | 'jitter' | 'packetLoss' | 'unknown';

// --- Tipos principais do motor de interpretação ---

export interface SpeedTestResult {
  dl: number;
  ul: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  timestamp: number;
  mode?: SpeedTestMode;
  dnsLatencyMs?: number | null;
  dnsResolverIp?: string | null;
  dnsProvider?: string | null;
  ulFailed?: boolean;
  packetLossSource?: 'native' | 'estimated';
  // Parâmetros adicionais que podem ser incluídos ou gerados pelo motor:
  stabilityScore?: number;
  bufferbloatSeverity?: BufferbloatSeverity;
  diagnosticSummary?: string;
  peakDlMbps?: number;
  peakUlMbps?: number;
  elapsedMs?: number;
  dlSamples?: Array<{ tMs: number; mbps: number; phase: 'download' | 'upload' }>;
  ulSamples?: Array<{ tMs: number; mbps: number; phase: 'download' | 'upload' }>;
}

export interface TestRecord {
  id: string;
  timestamp: number;
  dl: number;
  ul: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  serverName: string;
  isp?: string;
  deviceType: DeviceType;
  connectionType: ConnectionType;
  testMode?: SpeedTestMode;
  connectionProfile?: ConnectionProfile;
  ruleSetVersion?: RuleSetVersion;
  locationTag?: string;
  // Propagados do SpeedTestResult para persistência:
  stabilityScore?: number;
  bufferbloatSeverity?: BufferbloatSeverity;
  diagnosticSummary?: string;
  peakDlMbps?: number;
  peakUlMbps?: number;
  dnsLatencyMs?: number | null;
  dnsResolverIp?: string | null;
  dnsProvider?: string | null;
  ulFailed?: boolean;
  packetLossSource?: 'native' | 'estimated';
}

export interface UseCaseVerdict {
  id: UseCaseId;
  status: UseCaseStatus;
  blockingFactors: BlockingFactor[]; // Fatores que impedem o uso ideal do caso de uso
}

export interface InterpretedResult {
  ruleSetVersion: RuleSetVersion;
  primary: Quality;
  flags: {
    highLatency: boolean;
    lowUpload: boolean;
    unstable: boolean;
    packetLoss: boolean;
    veryUnstable: boolean;
  };
  stability: { score: number; level: 'very_stable' | 'stable' | 'oscillating' | 'unstable' };
  useCases: UseCaseVerdict[];
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionType: RecommendationAction;
    triggeredBy: Array<keyof InterpretedResult['flags'] | 'history' | 'useCase'>;
  }>;
  copyKeys: {
    headlineKey: string;
    shortPhraseKey: string;
    diagnosisKeys: string[];
  };
}

// Type stub: UseCase thresholds structure (pending full implementation)
export interface UseCaseThresholds {
  good?: Record<string, number>;
  acceptable?: Record<string, number>;
}

// Type stub: Profile rules structure (pending full implementation)
export interface ProfileRules {
  excellent: Record<string, number>;
  good: Record<string, number>;
  fair: Record<string, number>;
  flags?: Record<string, number>;
}

// Definição dos perfis de conexão. Pode ser expandido para incluir mais configurações.
export interface ConnectionProfileConfig {
  // Thresholds gerais para o perfil (usados por `getPrimaryQualityAndTags` e `getUseCaseThresholds`)
  thresholds: UseCaseThresholds;
}

// Estrutura para os dados de uso do dispositivo e rede
export interface DeviceAndNetworkInfo {
  deviceType: DeviceType;
  connectionType: ConnectionType;
  // Informações específicas de Wi-Fi ou dados móveis podem ser adicionadas aqui
  wifi?: {
    rssiDbm?: number;
    band?: '2.4GHz' | '5GHz' | '6GHz';
    linkSpeedMbps?: number;
  };
  mobile?: {
    carrierName?: string;
    radioType?: '3G' | '4G' | '5G' | 'unknown';
    signalLevel?: 'excellent' | 'good' | 'regular' | 'weak' | 'critical';
    rsrpDbm?: number;
    rsrqDb?: number;
    sinrDb?: number;
  };
}

// Estrutura consolidada para a entrada do motor de interpretação
export interface InterpretationInput {
  result: SpeedTestResult;
  profile: ConnectionProfile;
  deviceInfo?: DeviceAndNetworkInfo;
  history?: TestRecord[];
  ruleSetVersion?: RuleSetVersion; // Opcional: especificar versão para compatibilidade com testes antigos
}
