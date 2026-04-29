import type { ComparisonResult, SpeedTestResult } from '../types';

export function calculateComparison(
  near: SpeedTestResult,
  far: SpeedTestResult,
): ComparisonResult {
  const downloadDropPercent = near.dl > 0 ? ((near.dl - far.dl) / near.dl) * 100 : 0;
  const uploadDropPercent = near.ul > 0 ? ((near.ul - far.ul) / near.ul) * 100 : 0;
  const latencyIncreasePercent = near.latency > 0
    ? ((far.latency - near.latency) / near.latency) * 100
    : 0;

  const nearGood = near.dl >= 10 && near.latency <= 100;
  const farGood = far.dl >= 10 && far.latency <= 150;
  const hasStrongDrop = downloadDropPercent > 50;
  const hasVeryStrongDrop = downloadDropPercent > 75;

  let diagnosis: ComparisonResult['diagnosis'];
  let message: string;

  if (hasVeryStrongDrop && nearGood) {
    diagnosis = 'coverage_issue';
    message = 'A velocidade caiu muito longe do roteador. O problema parece estar na cobertura Wi‑Fi.';
  } else if (hasStrongDrop && nearGood) {
    diagnosis = 'coverage_issue';
    message = 'A internet parece boa perto do roteador, mas perde desempenho neste local. O problema pode estar na cobertura Wi‑Fi.';
  } else if (!nearGood && !farGood) {
    diagnosis = 'both_bad';
    message = 'A conexão ficou ruim nos dois pontos. O problema pode não ser apenas o Wi‑Fi da casa.';
  } else if (nearGood && farGood) {
    diagnosis = 'both_good';
    message = 'A conexão ficou boa nos dois pontos testados.';
  } else {
    diagnosis = 'other';
    message = 'Os resultados variaram entre os dois locais. Mais testes podem ajudar a identificar o padrão.';
  }

  return { downloadDropPercent, uploadDropPercent, latencyIncreasePercent, diagnosis, message };
}
