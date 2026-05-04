/**
 * dnsTiming.ts — Captura e classificação da latência de resolução DNS
 * usando a Resource Timing API.
 *
 * Estratégia
 * ──────────
 * Durante o speedtest o navegador emite vários `PerformanceResourceTiming`
 * para cada request HTTP. O par `domainLookupStart` / `domainLookupEnd`
 * mede o tempo gasto na resolução DNS daquele recurso. Algumas requests
 * retornam zero porque (a) a resposta veio do cache DNS do sistema/sessão,
 * (b) o servidor não envia o header `Timing-Allow-Origin: *` (recursos
 * cross-origin sem TAO entregam timings zerados por privacidade) ou (c)
 * a conexão foi reaproveitada via keep-alive.
 *
 * Heurística adotada
 * ──────────────────
 * Após o teste pegamos a primeira entry com timing DNS > 1ms — costuma
 * ser a primeira request da sessão (ainda sem cache). Quando nenhuma
 * entry traz timing DNS válido (resposta totalmente cacheada ou bloqueio
 * por CORS estrito), retornamos `null`.
 *
 * Sem rede / sem fallback
 * ───────────────────────
 * O helper é puro leitura da API local — não inicia novos requests, não
 * pode falhar nem atrasar o teste. Pode ser chamado livremente após o
 * orchestrator terminar.
 */

export type DnsLatencyGrade = 'excellent' | 'good' | 'fair' | 'slow' | 'poor';

const DNS_LATENCY_LABELS: Record<DnsLatencyGrade, string> = {
  excellent: 'Excelente',
  good:      'Bom',
  fair:      'Aceitável',
  slow:      'Lento',
  poor:      'Ruim',
};

/**
 * Lê os entries da Resource Timing API e devolve a primeira latência DNS
 * "real" (>1ms). Retorna `null` quando não há nenhuma medição válida.
 *
 * Critério "real": `domainLookupEnd > domainLookupStart` E delta > 1ms.
 * O `>1ms` filtra ruído de timer (algumas implementações reportam 0.x ms
 * para sub-resoluções idempotentes — não é um lookup novo de fato).
 */
export function getDnsLatencyMs(): number | null {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return null;
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  if (!entries.length) return null;

  const withDns = entries.filter(
    (e) => e.domainLookupEnd > 0 && e.domainLookupEnd > e.domainLookupStart,
  );
  if (!withDns.length) return null;

  const first = withDns.find((e) => e.domainLookupEnd - e.domainLookupStart > 1);
  if (!first) return null;

  return Math.round(first.domainLookupEnd - first.domainLookupStart);
}

/**
 * Classifica latência DNS em 5 faixas. Retorna `null` quando o valor é
 * `null` (nada a classificar).
 *
 * Faixas (alinhadas com a comunidade DNS-perf):
 *  - <20ms  excellent
 *  - <50ms  good
 *  - <100ms fair
 *  - <300ms slow
 *  - >=300  poor
 */
export function classifyDnsLatency(ms: number | null): DnsLatencyGrade | null {
  if (ms == null) return null;
  if (ms < 20)  return 'excellent';
  if (ms < 50)  return 'good';
  if (ms < 100) return 'fair';
  if (ms < 300) return 'slow';
  return 'poor';
}

/**
 * Label pt-BR para a grade — segue o mesmo vocabulário das outras
 * classificações da app (verdictLabel/gradeLabel na ResultScreen).
 */
export function dnsLatencyLabel(grade: DnsLatencyGrade): string {
  return DNS_LATENCY_LABELS[grade];
}
