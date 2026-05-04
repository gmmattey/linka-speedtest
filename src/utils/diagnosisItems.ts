import type { ConnectionType, SpeedTestResult } from '../types';

/**
 * Itens compactos `[problema] → [ação]` consumidos pelo card de Diagnóstico
 * da ResultScreen (refator 2026-05).
 *
 * Antes essa avaliação por métrica vivia inteira em `DiagnosticScreen.tsx`
 * (cards Internet / Wi-Fi / Resposta / Oscilação / Falhas / Qualidade por uso).
 * A DiagnosticScreen foi consolidada no card `.lk-result__combined` da
 * ResultScreen — mas a lógica de "por métrica" continua útil para gerar
 * a lista compacta. Esta utility é o porto dela.
 *
 * Regras-chave:
 * - Só retorna itens com severidade `warn` ou `fail`. Métricas `good` somem.
 * - Ordena por severidade (`fail` > `warn`); empates preservam a ordem
 *   declarativa abaixo (Internet → Wi-Fi → Resposta → Oscilação → Falhas).
 * - Texto de ação é CURTO (uma frase, modo imperativo). O contêiner expande
 *   apenas até 3 itens visíveis; o resto vai para "ver mais".
 */

export type DiagnosisSeverity = 'fail' | 'warn';

export interface DiagnosisItem {
  /** Identificador estável para `key` em listas React. */
  id: string;
  /** Nome do ícone (set centralizado em `components/icons.tsx`). */
  icon: string;
  /** Frase curta descrevendo o problema (ex.: "Wi-Fi instável"). */
  problem: string;
  /** Frase curta descrevendo a ação imediata (ex.: "Reinicie seu modem"). */
  action: string;
  /** `fail` puxa cor `--error`; `warn` cor `--warn`. */
  severity: DiagnosisSeverity;
}

// =============================================================================
// Thresholds
// =============================================================================
// Replicam os critérios da DiagnosticScreen original. Não duplicar valores —
// se um threshold mudar lá no motor (`profiles.ts`), avaliar consistência.

function downloadSeverity(dl: number): DiagnosisSeverity | null {
  if (dl >= 25) return null;
  if (dl >= 5) return 'warn';
  return 'fail';
}

function uploadSeverity(ul: number): DiagnosisSeverity | null {
  if (ul >= 5) return null;
  if (ul >= 2) return 'warn';
  return 'fail';
}

function latencySeverity(ms: number): DiagnosisSeverity | null {
  if (ms <= 60) return null;
  if (ms <= 100) return 'warn';
  return 'fail';
}

function jitterSeverity(ms: number): DiagnosisSeverity | null {
  if (ms <= 15) return null;
  if (ms <= 30) return 'warn';
  return 'fail';
}

function packetLossSeverity(pct: number): DiagnosisSeverity | null {
  if (pct === 0) return null;
  if (pct <= 1) return 'warn';
  return 'fail';
}

// =============================================================================
// Builder principal
// =============================================================================

export function buildDiagnosisItems(
  result: SpeedTestResult,
  connectionType: ConnectionType | null,
): DiagnosisItem[] {
  const { dl, ul, latency, jitter, packetLoss } = result;
  const items: DiagnosisItem[] = [];

  const dlSev = downloadSeverity(dl);
  if (dlSev) {
    items.push({
      id: 'internet',
      icon: 'bolt',
      problem: dlSev === 'fail' ? 'Internet muito lenta' : 'Internet abaixo do ideal',
      action: dlSev === 'fail'
        ? 'Reinicie o modem e contate sua operadora'
        : 'Feche apps em segundo plano e teste novamente',
      severity: dlSev,
    });
  }

  const ulSev = uploadSeverity(ul);
  if (ulSev) {
    items.push({
      id: 'upload',
      icon: 'upload',
      problem: ulSev === 'fail' ? 'Upload muito baixo' : 'Upload abaixo do ideal',
      action: 'Tente conectar via cabo para chamadas e envios',
      severity: ulSev,
    });
  }

  // "Wi-Fi instável" só faz sentido em Wi-Fi. Em cabo/dados móveis o sintoma
  // é coberto pelos itens de latência/jitter/oscilação.
  if (connectionType === 'wifi') {
    const wifiLatencySev = latencySeverity(latency);
    if (wifiLatencySev) {
      items.push({
        id: 'wifi',
        icon: 'wifi',
        problem: wifiLatencySev === 'fail' ? 'Wi-Fi instável' : 'Wi-Fi com sinal fraco',
        action: wifiLatencySev === 'fail'
          ? 'Reinicie o roteador e mude para 5 GHz'
          : 'Aproxime-se do roteador',
        severity: wifiLatencySev,
      });
    }
  }

  const respSev = latencySeverity(latency);
  // Evita duplicar com o item de Wi-Fi quando ambos disparam pelo mesmo
  // sintoma (latência alta em Wi-Fi).
  const wifiAlreadyAdded = items.some((i) => i.id === 'wifi');
  if (respSev && !wifiAlreadyAdded) {
    items.push({
      id: 'response',
      icon: 'ping',
      problem: respSev === 'fail' ? 'Resposta lenta' : 'Resposta com atraso',
      action: respSev === 'fail'
        ? 'Conecte via cabo para jogos e chamadas'
        : 'Avalie troca de canal Wi-Fi',
      severity: respSev,
    });
  }

  const jitSev = jitterSeverity(jitter);
  if (jitSev) {
    items.push({
      id: 'jitter',
      icon: 'jitter',
      problem: jitSev === 'fail' ? 'Conexão muito instável' : 'Oscilação perceptível',
      action: 'Reduza dispositivos simultâneos no Wi-Fi',
      severity: jitSev,
    });
  }

  const lossSev = packetLossSeverity(packetLoss);
  if (lossSev) {
    items.push({
      id: 'loss',
      icon: 'loss',
      problem: lossSev === 'fail' ? 'Falhas frequentes na conexão' : 'Falhas pontuais detectadas',
      action: lossSev === 'fail'
        ? 'Reinicie o modem e verifique cabos'
        : 'Refaça o teste para confirmar',
      severity: lossSev,
    });
  }

  // Ordena por severidade (fail antes de warn). Sort estável preserva a
  // ordem declarativa acima entre itens da mesma severidade.
  const order: Record<DiagnosisSeverity, number> = { fail: 0, warn: 1 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}

// =============================================================================
// Severidade agregada
// =============================================================================
// Reduz a lista de itens a uma única "severidade do card" — usada pela
// ResultScreen para escolher a cor do glow do `.lk-result__combined`:
//   - 'healthy' → glow verde (--success-glow)
//   - 'warn'    → glow amarelo (--warn-glow)
//   - 'fail'    → glow vermelho (--error-glow)
//
// Regra: lista vazia = saudável; algum `fail` = falha; senão `warn`. A
// função NÃO consulta `combinedDiagnosis.cause` por design — o sinal vem
// puramente das métricas individuais. O caller (ResultScreen) pode ajustar
// se quiser combinar com `combined.cause` em casos de fallback.

export type DiagnosisAggregate = 'healthy' | 'warn' | 'fail';

export function aggregateDiagnosisSeverity(items: DiagnosisItem[]): DiagnosisAggregate {
  if (items.length === 0) return 'healthy';
  if (items.some((i) => i.severity === 'fail')) return 'fail';
  return 'warn';
}
