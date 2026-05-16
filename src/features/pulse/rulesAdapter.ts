import type { PulseResultLevel } from './types';
import type { SpeedTestResult } from '../../types';

export function severityFromResult(result: SpeedTestResult): PulseResultLevel {
  const { dl, latency, jitter, packetLoss } = result;
  if (dl < 5 || latency > 300 || packetLoss > 2) return 'critical';
  if (dl < 25 || latency > 100 || jitter > 30 || packetLoss > 0.5) return 'warning';
  return 'success';
}

export function localAnalysisText(result: SpeedTestResult, severity: PulseResultLevel): string {
  const { dl, ul, latency, jitter, packetLoss } = result;
  const parts: string[] = [];

  if (severity === 'success') {
    parts.push(`Sua conexão está funcionando bem. Download de ${dl.toFixed(0)} Mbps, latência de ${latency.toFixed(0)} ms.`);
  } else if (severity === 'warning') {
    parts.push('Sua conexão apresenta alguns pontos de atenção:');
    if (dl < 25) parts.push(`• Download de ${dl.toFixed(0)} Mbps pode ser lento para streaming em HD.`);
    if (latency > 100) parts.push(`• Latência de ${latency.toFixed(0)} ms pode impactar jogos e videochamadas.`);
    if (jitter > 30) parts.push(`• Jitter de ${jitter.toFixed(0)} ms indica instabilidade na conexão.`);
    if (packetLoss > 0.5) parts.push(`• ${packetLoss.toFixed(1)}% de perda de pacotes detectada.`);
  } else {
    parts.push('Problemas críticos detectados na sua conexão:');
    if (dl < 5) parts.push(`• Download de apenas ${dl.toFixed(0)} Mbps — muito abaixo do esperado.`);
    if (latency > 300) parts.push(`• Latência extremamente alta: ${latency.toFixed(0)} ms.`);
    if (packetLoss > 2) parts.push(`• ${packetLoss.toFixed(1)}% de perda de pacotes — conexão instável.`);
    if (ul < 1) parts.push(`• Upload de ${ul.toFixed(0)} Mbps — possível problema no modem ou provedor.`);
  }

  return parts.join('\n');
}
