/**
 * Claude API Integration para Diagnóstico IA
 *
 * Phase 2d: Integra Claude 3.5 Sonnet com timeout de 3 segundos.
 * Fallback automático para Rules Engine em caso de erro ou timeout.
 *
 * Baseado em: docs/CONTRATO_DIAGNOSTICO_RECOMENDACOES_V1.md
 */

import type { DiagnosisRecommendation } from './types';
import type { DiagnosisEngineInput } from './types';
import { rulesEngine } from './rulesEngine';

const API_TIMEOUT_MS = 3000;
const MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 500;

function buildPrompt(input: DiagnosisEngineInput): string {
  const { testResult, contractInfo } = input;
  const { dl, ul, ping, jitter, packetLoss, connectionType } = testResult;

  return `Você é um especialista em diagnóstico de internet. Analise este teste de velocidade e retorne um diagnóstico estruturado como JSON válido.

RESULTADO DO TESTE:
- Download: ${dl.toFixed(2)} Mbps
- Upload: ${ul.toFixed(2)} Mbps
- Latência (Resposta): ${ping.toFixed(1)} ms
- Oscilação (Jitter): ${jitter.toFixed(1)} ms
- Perda de Pacotes: ${packetLoss.toFixed(2)}%
- Tipo de Conexão: ${connectionType}
${contractInfo?.contractedDl ? `- Download Contratado: ${contractInfo.contractedDl} Mbps` : ''}
${contractInfo?.contractedUl ? `- Upload Contratado: ${contractInfo.contractedUl} Mbps` : ''}

RETORNE UM JSON VÁLIDO COM ESTA ESTRUTURA EXATA:
{
  "cause": "healthy|congestion|wifi|dns|wan_issue|isp_limit|device|unknown",
  "severity": "healthy|warn|fail",
  "title": "Título curto do diagnóstico",
  "summary": "1-2 linhas descrevendo o problema",
  "problems": [
    {
      "id": "prob-1",
      "metric": "dl|ul|ping|jitter|packetLoss|mixed",
      "description": "Descrição do problema",
      "severity": "warn|fail|critical"
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "action": "Ação curta imperativa",
      "description": "Por que fazer esta ação",
      "priority": "high|medium|low",
      "category": "wifi|router|device|isp|dns|general",
      "icon": "nome_icone",
      "color": "hex_color"
    }
  ],
  "confidence": 0.85
}

INSTRUÇÕES:
1. Analise rigorosamente os valores contra thresholds típicos
2. Identifique apenas problemas REAIS (não especule)
3. Máximo 3 problemas, máximo 5 recomendações
4. Retorne APENAS o JSON, sem markdown ou explicação
5. Use português brasileiro para títulos e descrições
`;
}

async function callClaudeApi(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY não configurada');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };

    const textContent = data.content.find((c) => c.type === 'text');
    if (!textContent) {
      throw new Error('Nenhum texto na resposta da Claude API');
    }

    return textContent.text;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Claude API timeout (${API_TIMEOUT_MS}ms)`);
    }

    throw error;
  }
}

function parseClaudeResponse(text: string): Partial<DiagnosisRecommendation> {
  // Remove markdown code blocks se existirem
  let json = text.trim();
  if (json.startsWith('```json')) {
    json = json.slice(7);
  }
  if (json.startsWith('```')) {
    json = json.slice(3);
  }
  if (json.endsWith('```')) {
    json = json.slice(0, -3);
  }

  return JSON.parse(json.trim());
}

export async function claudeDiagnosis(
  input: DiagnosisEngineInput,
): Promise<DiagnosisRecommendation> {
  const startTime = Date.now();

  try {
    const prompt = buildPrompt(input);
    const response = await callClaudeApi(prompt);
    const parsed = parseClaudeResponse(response);

    const diagnosis: DiagnosisRecommendation = {
      id: `diag-claude-${Date.now()}`,
      timestamp: Date.now(),
      cause: parsed.cause ?? 'unknown',
      severity: parsed.severity ?? 'warn',
      title: parsed.title ?? 'Diagnóstico de conexão',
      summary: parsed.summary ?? 'Análise completa da sua conexão',
      problems: parsed.problems ?? [],
      recommendations: parsed.recommendations ?? [],
      confidence: parsed.confidence ?? 0.8,
      source: 'claude-api',
      processingTimeMs: Date.now() - startTime,
    };

    return diagnosis;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.warn('[claudeDiagnosis] Erro ao chamar Claude API:', errorMsg);

    // Fallback para Rules Engine
    return rulesEngine(input);
  }
}

export async function combinedDiagnosis(
  input: DiagnosisEngineInput,
): Promise<DiagnosisRecommendation> {
  // Tenta Claude API primeiro (3s timeout incluído em claudeDiagnosis)
  // Se falhar por qualquer motivo, fallback automático para Rules Engine
  return claudeDiagnosis(input);
}
