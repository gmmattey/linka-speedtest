/**
 * Rules Engine v1 — Diagnóstico determinístico sem IA
 * Fallback quando Claude API falha ou timeout
 *
 * Baseado em: docs/CONTRATO_DIAGNOSTICO_RECOMENDACOES_V1.md
 */

import type {
  DiagnosisRecommendation,
  DiagnosisCause,
  Severity,
  DiagnosisProblem,
  Recommendation,
  SpeedTestResult,
  ContractPlanInfo,
  DiagnosisEngineInput,
} from './types';

// ──────────────────────────────────────────────────────────────────────────
// Thresholds (2026-05)
// ──────────────────────────────────────────────────────────────────────────

interface ConnectionThresholds {
  minDl: number;      // Mbps
  minUl: number;
  maxPing: number;    // ms
  maxJitter: number;
}

const CONNECTION_THRESHOLDS: Record<'wifi' | 'mobile' | 'cable', ConnectionThresholds> = {
  wifi: {
    minDl: 50,
    minUl: 10,
    maxPing: 50,
    maxJitter: 15,
  },
  mobile: {
    minDl: 10,
    minUl: 5,
    maxPing: 100,
    maxJitter: 30,
  },
  cable: {
    minDl: 100,
    minUl: 10,
    maxPing: 30,
    maxJitter: 5,
  },
};

const RULES_THRESHOLDS = {
  ...CONNECTION_THRESHOLDS,
  // Global fail thresholds
  fail: {
    packetLoss: 1.0,          // % — acima disso = fail
    jitter: 30,               // ms
    ping: 300,                // ms
  },
  // ANATEL: delivery % of contract
  anatel: {
    minDeliveryPercent: 70,   // Se < 70%, reclamação válida
  },
};

// ──────────────────────────────────────────────────────────────────────────
// Helper: Generate deterministic test ID
// ──────────────────────────────────────────────────────────────────────────

function generateDiagnosisId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `diag-${ts}-${rand}`;
}

// ──────────────────────────────────────────────────────────────────────────
// Decision Tree Implementation
// ──────────────────────────────────────────────────────────────────────────

interface DiagnosisContext {
  testResult: SpeedTestResult;
  contractInfo?: ContractPlanInfo;
  connectionType: 'wifi' | 'mobile' | 'cable' | 'unknown';
  thresholds: ConnectionThresholds;
}

function analyzeMetrics(ctx: DiagnosisContext): {
  cause: DiagnosisCause;
  severity: Severity;
  problems: DiagnosisProblem[];
} {
  const { testResult, contractInfo, thresholds, connectionType } = ctx;
  const { dl, ul, ping, jitter, packetLoss } = testResult;

  const problems: DiagnosisProblem[] = [];

  // Check packet loss (critical)
  if (packetLoss > RULES_THRESHOLDS.fail.packetLoss) {
    problems.push({
      id: `prob-pl-${Date.now()}`,
      metric: 'packetLoss',
      description: `Perda de pacotes elevada (${packetLoss.toFixed(1)}%)`,
      severity: 'fail',
    });
  }

  // Check jitter (warn → fail)
  if (jitter > RULES_THRESHOLDS.fail.jitter) {
    problems.push({
      id: `prob-jitter-fail-${Date.now()}`,
      metric: 'jitter',
      description: `Oscilação crítica (${jitter.toFixed(1)}ms)`,
      severity: 'fail',
    });
  } else if (jitter > thresholds.maxJitter) {
    problems.push({
      id: `prob-jitter-warn-${Date.now()}`,
      metric: 'jitter',
      description: `Oscilação elevada (${jitter.toFixed(1)}ms)`,
      severity: 'warn',
    });
  }

  // Check ping (warn → fail)
  if (ping > RULES_THRESHOLDS.fail.ping) {
    problems.push({
      id: `prob-ping-fail-${Date.now()}`,
      metric: 'ping',
      description: `Latência crítica (${ping.toFixed(0)}ms)`,
      severity: 'fail',
    });
  } else if (ping > thresholds.maxPing) {
    problems.push({
      id: `prob-ping-warn-${Date.now()}`,
      metric: 'ping',
      description: `Latência elevada (${ping.toFixed(0)}ms)`,
      severity: 'warn',
    });
  }

  // All healthy
  if (problems.length === 0) {
    return {
      cause: 'healthy',
      severity: 'healthy',
      problems: [],
    };
  }

  // Has fail-level problems
  if (problems.some(p => p.severity === 'fail')) {
    // Jitter > 30ms indicates congestion
    if (jitter > 30 || packetLoss > RULES_THRESHOLDS.fail.packetLoss) {
      return {
        cause: 'congestion',
        severity: 'fail',
        problems,
      };
    }

    // Check if below contracted speeds (ISP issue)
    if (contractInfo?.contractedDl && dl < contractInfo.contractedDl * (RULES_THRESHOLDS.anatel.minDeliveryPercent / 100)) {
      return {
        cause: 'isp_limit',
        severity: 'fail',
        problems: [
          {
            id: `prob-isp-${Date.now()}`,
            metric: 'dl',
            description: `Download ${dl.toFixed(0)} Mbps vs ${contractInfo.contractedDl} Mbps (${((dl / contractInfo.contractedDl) * 100).toFixed(0)}%)`,
            severity: 'fail',
          },
          ...problems,
        ],
      };
    }

    // Ping > 300ms → network/WAN issue
    if (ping > RULES_THRESHOLDS.fail.ping) {
      return {
        cause: 'wan_issue',
        severity: 'fail',
        problems,
      };
    }
  }

  // Warn-level problems
  // High jitter → congestion
  if (jitter > thresholds.maxJitter) {
    return {
      cause: 'congestion',
      severity: 'warn',
      problems,
    };
  }

  // Low bandwidth for connection type
  if (dl < thresholds.minDl || ul < thresholds.minUl) {
    if (connectionType === 'wifi') {
      return {
        cause: 'wifi',
        severity: 'warn',
        problems: [
          {
            id: `prob-wifi-speed-${Date.now()}`,
            metric: 'dl',
            description: `Download ${dl.toFixed(0)} Mbps está abaixo do esperado para WiFi`,
            severity: 'warn',
          },
          ...problems,
        ],
      };
    } else if (connectionType === 'cable') {
      return {
        cause: 'wan_issue',
        severity: 'warn',
        problems: [
          {
            id: `prob-wan-speed-${Date.now()}`,
            metric: 'dl',
            description: `Download ${dl.toFixed(0)} Mbps abaixo do esperado para conexão cabeada`,
            severity: 'warn',
          },
          ...problems,
        ],
      };
    }
  }

  // High ping → DNS or WAN
  if (ping > thresholds.maxPing) {
    return {
      cause: 'dns',
      severity: 'warn',
      problems,
    };
  }

  // No specific cause identified
  return {
    cause: 'unknown',
    severity: 'warn',
    problems,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Recommendation Generation
// ──────────────────────────────────────────────────────────────────────────

function generateRecommendations(
  cause: DiagnosisCause,
  _severity: Severity,
  testResult: SpeedTestResult,
  contractInfo?: ContractPlanInfo,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  switch (cause) {
    case 'healthy':
      // No recommendations for healthy
      break;

    case 'congestion':
      recommendations.push(
        {
          id: 'rec-congestion-1',
          action: 'Reduzir dispositivos conectados',
          description: 'Desconecte dispositivos ociosos da WiFi para reduzir congestionamento',
          priority: 'high',
          category: 'wifi',
          icon: 'wifi',
          color: '#FFC107',
        },
        {
          id: 'rec-congestion-2',
          action: 'Trocar canal WiFi',
          description: 'Mude para um canal menos congestionado (1, 6 ou 11 em 2.4GHz)',
          priority: 'high',
          category: 'router',
          icon: 'cog',
          color: '#FFC107',
        },
        {
          id: 'rec-congestion-3',
          action: 'Usar 5GHz se disponível',
          description: 'A banda 5GHz geralmente tem menos interferência que 2.4GHz',
          priority: 'medium',
          category: 'wifi',
          icon: 'signal',
          color: '#FFC107',
        },
      );
      break;

    case 'wifi':
      recommendations.push(
        {
          id: 'rec-wifi-1',
          action: 'Reiniciar roteador',
          description: 'Desconecte por 30 segundos e reconecte para resetar a conexão',
          priority: 'high',
          category: 'router',
          icon: 'restart',
          color: '#FF9800',
        },
        {
          id: 'rec-wifi-2',
          action: 'Aproximar do roteador',
          description: 'Sinal WiFi enfraquece com distância; tente se aproximar',
          priority: 'high',
          category: 'wifi',
          icon: 'location',
          color: '#FF9800',
        },
        {
          id: 'rec-wifi-3',
          action: 'Verificar posicionamento de antenas',
          description: 'Alinhe as antenas do roteador para melhor cobertura',
          priority: 'medium',
          category: 'router',
          icon: 'cog',
          color: '#FF9800',
        },
      );
      break;

    case 'dns':
      recommendations.push(
        {
          id: 'rec-dns-1',
          action: 'Trocar para DNS Cloudflare',
          description: 'Primary: 1.1.1.1 | Secondary: 1.0.0.1 — mais rápido e privado',
          priority: 'high',
          category: 'dns',
          icon: 'dns',
          color: '#2196F3',
        },
        {
          id: 'rec-dns-2',
          action: 'Ou use DNS Google',
          description: 'Primary: 8.8.8.8 | Secondary: 8.8.4.4',
          priority: 'high',
          category: 'dns',
          icon: 'dns',
          color: '#2196F3',
        },
        {
          id: 'rec-dns-3',
          action: 'Resetar configurações de rede',
          description: 'Às vezes a cache de DNS fica corrompida; resetar pode resolver',
          priority: 'medium',
          category: 'device',
          icon: 'refresh',
          color: '#2196F3',
        },
      );
      break;

    case 'wan_issue':
      recommendations.push(
        {
          id: 'rec-wan-1',
          action: 'Reiniciar modem',
          description: 'Desconecte o modem por 1 minuto e reconecte para resetar',
          priority: 'high',
          category: 'router',
          icon: 'restart',
          color: '#F44336',
        },
        {
          id: 'rec-wan-2',
          action: 'Verificar cabos e conexões',
          description: 'Certifique-se que todos os cabos estão bem conectados',
          priority: 'high',
          category: 'device',
          icon: 'cable',
          color: '#F44336',
        },
        {
          id: 'rec-wan-3',
          action: 'Contatar ISP se persistir',
          description: 'Se o problema continuar, abra uma ocorrência com seu provedor',
          priority: 'medium',
          category: 'isp',
          icon: 'phone',
          color: '#F44336',
        },
      );
      break;

    case 'isp_limit':
      if (contractInfo?.contractedDl) {
        const delivery = ((testResult.dl / contractInfo.contractedDl) * 100).toFixed(0);
        recommendations.push(
          {
            id: 'rec-anatel-1',
            action: 'Contatar o ISP',
            description: `Você está recebendo ${delivery}% da velocidade contratada. Abra uma ocorrência técnica.`,
            priority: 'high',
            category: 'isp',
            icon: 'phone',
            color: '#F44336',
          },
          {
            id: 'rec-anatel-2',
            action: 'Registrar em ANATEL',
            description: 'Você pode registrar uma reclamação no portal ANATEL se o ISP não resolver.',
            priority: 'medium',
            category: 'isp',
            icon: 'alert',
            color: '#F44336',
          },
        );
      }
      break;

    case 'device':
      recommendations.push(
        {
          id: 'rec-device-1',
          action: 'Reiniciar dispositivo',
          description: 'Desligue o dispositivo completamente e ligue novamente',
          priority: 'high',
          category: 'device',
          icon: 'power',
          color: '#FF5722',
        },
        {
          id: 'rec-device-2',
          action: 'Fechar aplicativos em background',
          description: 'Apps rodando podem consumir banda; feche os desnecessários',
          priority: 'high',
          category: 'device',
          icon: 'close',
          color: '#FF5722',
        },
      );
      break;

    case 'unknown':
    default:
      recommendations.push(
        {
          id: 'rec-unknown-1',
          action: 'Tentar novamente',
          description: 'Execute o teste de novo para confirmar os resultados',
          priority: 'high',
          category: 'general',
          icon: 'refresh',
          color: '#9C27B0',
        },
        {
          id: 'rec-unknown-2',
          action: 'Contatar suporte',
          description: 'Se o problema persistir, entre em contato com nosso suporte',
          priority: 'medium',
          category: 'general',
          icon: 'help',
          color: '#9C27B0',
        },
      );
  }

  // Limit to 3 recommendations, sorted by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 3);
}

// ──────────────────────────────────────────────────────────────────────────
// Main Engine
// ──────────────────────────────────────────────────────────────────────────

export function rulesEngine(input: DiagnosisEngineInput): DiagnosisRecommendation {
  const startTime = Date.now();
  const { testResult, contractInfo } = input;

  // Determine connection type and thresholds
  const connectionType = testResult.connectionType;
  const thresholds = (() => {
    switch (connectionType) {
      case 'wifi':
        return RULES_THRESHOLDS.wifi;
      case 'mobile':
        return RULES_THRESHOLDS.mobile;
      case 'cable':
        return RULES_THRESHOLDS.cable;
      default:
        // Unknown: use most conservative (cable)
        return RULES_THRESHOLDS.cable;
    }
  })();

  // Analyze metrics
  const { cause, severity, problems } = analyzeMetrics({
    testResult,
    contractInfo,
    connectionType,
    thresholds,
  });

  // Generate recommendations
  const recommendations = generateRecommendations(cause, severity, testResult, contractInfo);

  // Generate title & summary
  const { title, summary } = (() => {
    switch (cause) {
      case 'healthy':
        return {
          title: 'Tudo certo com sua rede',
          summary: 'Sua conexão está operando normalmente dentro do esperado.',
        };
      case 'congestion':
        return {
          title: 'Congestionamento de rede local',
          summary:
            severity === 'fail'
              ? 'Sua rede está muito congestionada. Reduza o número de dispositivos conectados.'
              : 'Sua WiFi pode estar congestionada. Tente reduzir dispositivos ou trocar de canal.',
        };
      case 'wifi':
        return {
          title: 'Problema com WiFi',
          summary: 'O sinal WiFi parece estar enfraquecido. Tente se aproximar do roteador.',
        };
      case 'dns':
        return {
          title: 'DNS lento ou instável',
          summary:
            'Resoluções DNS estão lentas. Tente trocar de DNS para Cloudflare (1.1.1.1) ou Google (8.8.8.8).',
        };
      case 'wan_issue':
        return {
          title: 'Problema com a Internet',
          summary: 'Sua conexão com a Internet está lenta ou instável. Reinicie o modem.',
        };
      case 'isp_limit':
        return {
          title: 'Entrega abaixo do contratado',
          summary: `Sua conexão está ${((testResult.dl / (contractInfo?.contractedDl || 1)) * 100).toFixed(0)}% abaixo do plano contratado. Contate seu ISP.`,
        };
      case 'device':
        return {
          title: 'Possível problema no dispositivo',
          summary: 'O dispositivo pode estar com problemas de desempenho. Tente reiniciá-lo.',
        };
      case 'unknown':
      default:
        return {
          title: 'Não consegui diagnosticar',
          summary: 'Não consegui identificar a causa específica. Tente novamente ou contate suporte.',
        };
    }
  })();

  const processingTimeMs = Date.now() - startTime;

  return {
    id: generateDiagnosisId(),
    timestamp: Date.now(),
    cause,
    severity,
    title,
    summary,
    problems,
    recommendations,
    confidence: cause === 'unknown' ? 0.2 : cause === 'healthy' ? 1.0 : 0.85,
    source: 'rules-engine',
    processingTimeMs,
  };
}
