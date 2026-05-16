import type { OpcaoResposta, QuestionNode, PulseResultLevel } from './types';

export function buildInitial(params: {
  downloadMbps: number | null;
  uploadMbps: number | null;
  latencyMs: number | null;
  jitterMs: number | null;
  lossPercent: number | null;
  connectionType: string;
  severity: PulseResultLevel;
}): string {
  const lines = ['=== CONTEXTO INICIAL DO DIAGNÓSTICO ===', ''];
  lines.push('--- Speedtest ---');
  if (params.downloadMbps != null) lines.push(`Download: ${params.downloadMbps.toFixed(1)} Mbps`);
  if (params.uploadMbps != null) lines.push(`Upload: ${params.uploadMbps.toFixed(1)} Mbps`);
  if (params.latencyMs != null) lines.push(`Latência: ${params.latencyMs.toFixed(0)} ms`);
  if (params.jitterMs != null) lines.push(`Jitter: ${params.jitterMs.toFixed(0)} ms`);
  if (params.lossPercent != null) lines.push(`Perda de pacotes: ${params.lossPercent.toFixed(1)}%`);
  lines.push(`Tipo de conexão: ${params.connectionType}`);
  lines.push('');
  lines.push(`--- Diagnóstico Local ---`);
  lines.push(`Severidade: ${params.severity}`);
  return lines.join('\n');
}

export function appendChip(accumulated: string, chip: OpcaoResposta): string {
  return [
    accumulated,
    '',
    '=== CONTEXTO ADICIONAL: SELEÇÃO DO USUÁRIO ===',
    `Categoria escolhida: ${chip.label}`,
    `Contexto: ${chip.contextoParaIA}`,
  ].join('\n');
}

export function appendAnswer(accumulated: string, question: QuestionNode, answer: OpcaoResposta): string {
  return [
    accumulated,
    '',
    `Pergunta: ${question.texto}`,
    `Resposta: ${answer.label}`,
    `Contexto: ${answer.contextoParaIA}`,
  ].join('\n');
}
