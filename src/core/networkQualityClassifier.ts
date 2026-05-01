import type { BufferbloatSeverity, SpeedTestDiagnostics, SpeedTestResult, SpeedTestSample } from '../types';

export type BufferbloatGrade = 'A' | 'B' | 'C' | 'D' | 'F';

// Migrado de utils/bufferbloat.ts para manter compatibilidade com classifier.test.ts
export function gradeFrom(deltaMs: number): BufferbloatGrade {
  if (deltaMs < 30)  return 'A';
  if (deltaMs < 60)  return 'B';
  if (deltaMs < 200) return 'C';
  if (deltaMs < 400) return 'D';
  return 'F';
}

export function classifyBufferbloatSeverity(deltaMs: number): BufferbloatSeverity {
  if (deltaMs < 30)  return 'low';
  if (deltaMs < 100) return 'moderate';
  if (deltaMs < 300) return 'high';
  return 'critical';
}

export function severityToGrade(s: BufferbloatSeverity): BufferbloatGrade {
  if (s === 'low')      return 'A';
  if (s === 'moderate') return 'C';
  if (s === 'high')     return 'D';
  return 'F';
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Score 0–100 baseado no coeficiente de variação da janela estável de amostras
// (100 = sem variação, conexão perfeitamente estável)
export function computeStabilityFromSamples(samples: SpeedTestSample[]): number {
  if (samples.length < 3) return 50;
  const mbps = samples.map(s => s.mbps).filter(v => v > 0);
  if (mbps.length < 2) return 50;
  const avg = mean(mbps);
  if (avg === 0) return 0;
  const cv = stddev(mbps) / avg; // coeficiente de variação (0–∞)
  return Math.round(Math.max(0, Math.min(100, 100 - cv * 150)));
}

export function buildDiagnostics(result: SpeedTestResult): SpeedTestDiagnostics {
  const { dl, ul, latency, jitter, packetLoss, bufferbloatSeverity } = result;

  // Streaming: depende de download e oscilação
  const streamingVerdict: SpeedTestDiagnostics['streamingVerdict'] =
    dl >= 25 && jitter <= 30 && packetLoss <= 1 ? 'good'
    : dl >= 10 && jitter <= 50 && packetLoss <= 3 ? 'acceptable'
    : 'poor';

  // Jogos: depende de latência, jitter e perda
  const gamingVerdict: SpeedTestDiagnostics['gamingVerdict'] =
    dl >= 10 && latency <= 45 && jitter <= 20 && packetLoss <= 0.5 ? 'good'
    : dl >= 5 && latency <= 80 && jitter <= 40 && packetLoss <= 2 ? 'acceptable'
    : 'poor';

  // Videochamada: depende de upload, latência e oscilação
  const videoCallVerdict: SpeedTestDiagnostics['videoCallVerdict'] =
    dl >= 5 && ul >= 2 && latency <= 100 && jitter <= 30 && packetLoss <= 1 ? 'good'
    : dl >= 2 && ul >= 1 && latency <= 150 && jitter <= 50 && packetLoss <= 3 ? 'acceptable'
    : 'poor';

  // Gargalo principal
  let primaryBottleneck: SpeedTestDiagnostics['primaryBottleneck'] = 'none';
  if (bufferbloatSeverity === 'high' || bufferbloatSeverity === 'critical') {
    primaryBottleneck = 'bufferbloat';
  } else if (packetLoss > 2) {
    primaryBottleneck = 'packetLoss';
  } else if (latency > 100) {
    primaryBottleneck = 'latency';
  } else if (ul < 5) {
    primaryBottleneck = 'upload';
  }

  const summaryText = buildSummaryText(dl, ul, latency, bufferbloatSeverity, primaryBottleneck);

  return { streamingVerdict, gamingVerdict, videoCallVerdict, primaryBottleneck, summaryText };
}

function buildSummaryText(
  dl: number,
  ul: number,
  latency: number,
  severity: BufferbloatSeverity | undefined,
  bottleneck: SpeedTestDiagnostics['primaryBottleneck'],
): string {
  if (bottleneck === 'bufferbloat') {
    return 'A velocidade é boa, mas a latência sobe muito durante o uso. Isso pode causar travamentos em jogos e chamadas.';
  }
  if (bottleneck === 'packetLoss') {
    return 'A conexão está perdendo pacotes. Isso causa instabilidade em chamadas, jogos e transmissões.';
  }
  if (bottleneck === 'latency') {
    if (ul < 5) {
      return 'A resposta está alta e o upload é limitado. Videochamadas e jogos online podem sofrer.';
    }
    return 'A resposta está alta para jogos e chamadas em tempo real. Downloads estáveis são menos afetados.';
  }
  if (bottleneck === 'upload') {
    return 'O download está bom, mas o upload é limitado. Envio de arquivos e videochamadas podem sofrer.';
  }
  // Sem gargalo principal
  if (dl >= 100 && latency <= 30 && (severity === 'low' || severity == null)) {
    return 'Conexão rápida e estável para streaming, trabalho e jogos online.';
  }
  if (dl >= 50) {
    return 'Conexão boa para uso geral, streaming e videochamadas.';
  }
  return 'Conexão adequada para navegação e uso básico.';
}
