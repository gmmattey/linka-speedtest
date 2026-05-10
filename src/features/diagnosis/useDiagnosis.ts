/**
 * useDiagnosis hook — Compute diagnosis from speed test result
 *
 * Phase 2b: Rules Engine v1 (deterministic)
 * Phase 2d: Claude API com fallback automático para Rules Engine (3s timeout)
 *
 * Aceita SpeedTestResult do app (com latency) e adaptador para formato engine.
 *
 * Usage:
 *   const diagnosis = useDiagnosis(testResult, connectionType, contractInfo);
 *   // diagnosis: { data, loading, error, source }
 */

import { useEffect, useState } from 'react';
import type { DiagnosisRecommendation, ContractPlanInfo } from './types';
import type { ConnectionType, SpeedTestResult as AppSpeedTestResult } from '../../types';
import { speedTestResultToEngineInput } from './diagnosisAdapter';
import { combinedDiagnosis } from './claudeApi';

export interface UseDiagnosisResult {
  data: DiagnosisRecommendation | null;
  loading: boolean;
  error: string | null;
  source: 'rules-engine' | 'claude-api' | 'fallback' | null;
}

/**
 * Compute diagnosis from speed test result.
 *
 * Phase 2b (current): Uses Rules Engine v1 only
 * Phase 2d (future): Will use Claude API with Rules Engine fallback
 *
 * @param testResult - Speed test metrics (app format, com latency)
 * @param connectionType - Connection type for diagnosis context
 * @param contractInfo - Optional contract info for ANATEL checks
 * @returns Diagnosis state { data, loading, error, source }
 */
export function useDiagnosis(
  testResult: AppSpeedTestResult | null,
  connectionType?: ConnectionType | null,
  contractInfo?: ContractPlanInfo,
): UseDiagnosisResult {
  const [state, setState] = useState<UseDiagnosisResult>({
    data: null,
    loading: false,
    error: null,
    source: null,
  });

  useEffect(() => {
    if (!testResult) {
      setState({
        data: null,
        loading: false,
        error: null,
        source: null,
      });
      return;
    }

    let isMounted = true;
    const result = testResult;

    async function compute() {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const engineInput = speedTestResultToEngineInput(result, connectionType ?? null);

        // Phase 2d: Tenta Claude API (3s timeout) + fallback automático para Rules Engine
        const diagnosis = await combinedDiagnosis({
          ...engineInput,
          contractInfo,
        });

        if (isMounted) {
          setState({
            data: diagnosis,
            loading: false,
            error: null,
            source: diagnosis.source,
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useDiagnosis] Error generating diagnosis:', errorMsg);

        if (isMounted) {
          setState({
            data: {
              id: `diag-error-${Date.now()}`,
              timestamp: Date.now(),
              cause: 'unknown',
              severity: 'warn',
              title: 'Erro ao diagnosticar',
              summary: 'Não conseguimos processar o diagnóstico. Tente novamente.',
              problems: [],
              recommendations: [],
              confidence: 0,
              source: 'fallback',
              processingTimeMs: 0,
            },
            loading: false,
            error: errorMsg,
            source: 'fallback',
          });
        }
      }
    }

    compute();

    return () => {
      isMounted = false;
    };
  }, [testResult, connectionType, contractInfo]);

  return state;
}
