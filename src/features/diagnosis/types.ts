/**
 * Tipos compartilhados do sistema de diagnóstico
 * Baseado em: docs/CONTRATO_DIAGNOSTICO_RECOMENDACOES_V1.md
 */

export type DiagnosisCause =
  | 'healthy'       // Tudo certo
  | 'congestion'    // WiFi/LAN congestionada
  | 'wifi'          // Problema WiFi específico
  | 'dns'           // DNS lento/instável
  | 'wan_issue'     // Problema Internet/ISP
  | 'isp_limit'     // Limite de velocidade contratada
  | 'device'        // Problema do dispositivo
  | 'unknown';      // Não conseguiu diagnosticar

export type Severity = 'healthy' | 'warn' | 'fail';

export type RecommendationCategory =
  | 'wifi'          // WiFi/rede local
  | 'router'        // Roteador
  | 'device'        // Dispositivo
  | 'isp'           // ISP/internet
  | 'dns'           // DNS
  | 'general';      // Geral

export interface SpeedTestResult {
  // Bandwidth (Mbps)
  dl: number;           // Download (≥0)
  ul: number;           // Upload (≥0)

  // Latency & Jitter (ms)
  ping: number;         // RTT médio (≥0)
  jitter: number;       // Oscilação (≥0)

  // Packet Loss (%)
  packetLoss: number;   // 0-100

  // Connection info
  connectionType: 'wifi' | 'mobile' | 'cable' | 'unknown';

  // Server & location (optional)
  serverId?: string;
  serverName?: string;
  serverLocation?: string;

  // Device info (optional)
  deviceInfo?: {
    model?: string;
    os?: string;
    browser?: string;
  };

  // Timestamp
  timestamp: number;    // epoch ms
}

export interface ContractPlanInfo {
  // Plano contratado (ANATEL)
  contractedDl?: number;    // Mbps
  contractedUl?: number;    // Mbps

  // Histórico prévio (para trends)
  previousDl?: number;
  previousUl?: number;
  previousTimestamp?: number;
}

export interface DiagnosisProblem {
  id: string;                       // problema ID
  metric: string;                   // qual métrica afetada ('dl', 'ul', 'ping', 'jitter', 'packetLoss', 'mixed')
  description: string;              // descrição curta
  severity: 'warn' | 'fail' | 'critical'; // urgência deste problema
}

export interface Recommendation {
  id: string;                       // recomendação ID
  action: string;                   // verbo + substantivo
  description: string;              // por quê fazer
  priority: 'high' | 'medium' | 'low'; // ordem de execução
  category: RecommendationCategory; // tipo

  // Metadados para UI
  icon?: string;                    // nome de ícone
  color?: string;                   // cor CSS para destaque
}

export interface DiagnosisRecommendation {
  // Identificação
  id: string;                        // UUID
  timestamp: number;                 // epoch ms

  // Diagnóstico agregado
  cause: DiagnosisCause;            // tipo de problema
  severity: Severity;               // nível de urgência

  // Título e descrição
  title: string;                    // ex: "Congestionamento de rede local"
  summary: string;                  // 1-2 linhas, linguagem clara (pt-BR)

  // Detalhes estruturados
  problems: DiagnosisProblem[];     // 1-3 problemas identificados

  // Recomendações acionáveis
  recommendations: Recommendation[]; // ações concretas

  // Metadata
  confidence: number;               // 0-1 (nível de confiança)
  source: 'rules-engine' | 'claude-api' | 'fallback'; // qual motor gerou
  processingTimeMs: number;         // tempo de processamento
}

export interface DiagnosisEngineInput {
  testResult: SpeedTestResult;
  contractInfo?: ContractPlanInfo;
}
