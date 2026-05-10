/**
 * Hook: Diagnosis Items da ResultScreen
 *
 * Encapsula useDiagnosis + adapter para retornar DiagnosisItem[]
 * já formatados para o DiagnosticActionList da ResultScreen.
 */

import { useMemo } from 'react';
import type { ContractPlanInfo } from './types';
import type { ConnectionType, SpeedTestResult } from '../../types';
import type { DiagnosisItem } from '../../utils/diagnosisItems';
import { useDiagnosis } from './useDiagnosis';
import { diagnosisRecommendationToItems } from './diagnosisAdapter';

export interface UseDiagnosisItemsResult {
  items: DiagnosisItem[];
  loading: boolean;
  error: string | null;
}

export function useDiagnosisItems(
  testResult: SpeedTestResult | null,
  connectionType?: ConnectionType | null,
  contractInfo?: ContractPlanInfo,
): UseDiagnosisItemsResult {
  const diagnosis = useDiagnosis(testResult, connectionType, contractInfo);

  const items = useMemo(() => {
    if (!diagnosis.data) return [];
    return diagnosisRecommendationToItems(diagnosis.data);
  }, [diagnosis.data]);

  return {
    items,
    loading: diagnosis.loading,
    error: diagnosis.error,
  };
}
