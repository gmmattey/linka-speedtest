/**
 * Adaptador: Compatibilidade entre SpeedTest e DiagnosisEngine
 *
 * Converte:
 * 1. SpeedTestResult (speed test) → SpeedTestResult (diagnosis engine)
 * 2. DiagnosisRecommendation → DiagnosisItem[]
 */

import type { ConnectionType, SpeedTestResult as AppSpeedTestResult } from '../../types';
import type {
  DiagnosisRecommendation,
  SpeedTestResult as EngineSpeedTestResult,
  DiagnosisEngineInput,
} from './types';
import type { DiagnosisItem } from '../../utils/diagnosisItems';

/**
 * Converte SpeedTestResult do app para formato do DiagnosisEngine.
 * O app usa `latency`; o engine espera `ping`.
 */
export function speedTestResultToEngineInput(
  result: AppSpeedTestResult,
  connectionType: ConnectionType | null,
): DiagnosisEngineInput {
  return {
    testResult: {
      dl: result.dl,
      ul: result.ul,
      ping: result.latency,
      jitter: result.jitter,
      packetLoss: result.packetLoss,
      connectionType: (connectionType ?? 'unknown') as EngineSpeedTestResult['connectionType'],
      timestamp: result.timestamp,
    },
  };
}

/**
 * Converte DiagnosisRecommendation (engine) para DiagnosisItem[] (ResultScreen).
 * Permite reutilizar a renderização existente do DiagnosticActionList.
 */
export function diagnosisRecommendationToItems(
  recommendation: DiagnosisRecommendation,
): DiagnosisItem[] {
  // Diagnósticos saudáveis não geram itens
  if (recommendation.cause === 'healthy') {
    return [];
  }

  // Mapeie cada recomendação para um DiagnosisItem
  const items: DiagnosisItem[] = recommendation.recommendations.map((rec, index) => ({
    id: rec.id || `rec-${index}`,
    icon: rec.icon || 'info',
    problem: recommendation.problems[index]?.description || 'Problema detectado',
    action: rec.action,
    severity: recommendation.severity === 'fail' ? 'fail' : 'warn',
  }));

  return items;
}
