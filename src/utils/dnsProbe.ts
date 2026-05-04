/**
 * dnsProbe.ts — Identificação do resolver DNS efetivamente em uso pelo
 * cliente E latência da resolução, ambos derivados de uma única request
 * DoH ao endpoint `whoami.cloudflare-dns.com`.
 *
 * Por que medir latência aqui (e não via Resource Timing API)
 * ──────────────────────────────────────────────────────────
 * Safari mobile zera `domainLookupStart` / `domainLookupEnd` para recursos
 * cross-origin que não enviam `Timing-Allow-Origin: *` — Cloudflare Speed
 * Test endpoints, `cdn-cgi/trace`, etc. Resultado: a leitura passiva via
 * `PerformanceResourceTiming` retorna `null` quase sempre no iOS, deixando
 * a 4ª cell DNS da ResultScreen vazia.
 *
 * Solução: medir diretamente com `performance.now()` em torno do fetch DoH
 * que já fazemos. O número resultante inclui DNS-do-sistema + TLS + RTT
 * HTTP — não é DNS puro, mas é uma proxy honesta da latência percebida
 * pelo usuário ao abrir um site novo (cenário onde DNS importa).
 *
 * Importante
 * ──────────
 * - Faz UMA request DoH (JSON). É leve e não altera a rede do cliente.
 * - Roda em paralelo com a fase de upload (não serializa). A latência
 *   medida sofre contaminação do upload, mas para propósitos de UX
 *   ("DNS rápido/lento") é aceitável — Safari sem isso nem mostra DNS.
 * - Falhas (offline, CORS estrito, fetch bloqueado) NÃO causam erro no
 *   teste: retornam `{ latencyMs: null, resolverIp: null, provider: null }`.
 * - O mapping IP → nome cobre os principais resolvers públicos. IPs não
 *   mapeados são reportados como `'DNS do provedor'` — a heurística é
 *   que, na ausência de configuração explícita, o resolver é o do ISP.
 */

export type DnsProbeResult = {
  latencyMs:  number | null;
  resolverIp: string | null;
  provider:   string | null;
};

/**
 * Padrões de IP → nome do provedor DNS público. Patterns são RegExp
 * porque algumas ranges variam o último octeto (ex.: Quad9 usa
 * 9.9.9.9, 9.9.9.10, 9.9.9.11). Adicione novos em ordem específica →
 * genérica (a primeira regex que casa vence).
 */
const KNOWN_DNS_PROVIDERS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /^1\.1\.1\.[01]$/,           name: 'Cloudflare' },
  { pattern: /^1\.0\.0\.[01]$/,           name: 'Cloudflare' },
  { pattern: /^8\.8\.[48]\.[48]$/,        name: 'Google' },
  { pattern: /^9\.9\.9\.\d+$/,            name: 'Quad9' },
  { pattern: /^149\.112\.112\.\d+$/,      name: 'Quad9' },
  { pattern: /^208\.67\.22[02]\.222$/,    name: 'OpenDNS' },
  { pattern: /^208\.67\.22[02]\.220$/,    name: 'OpenDNS' },
  { pattern: /^94\.140\.14\.(14|15)$/,    name: 'AdGuard' },
  { pattern: /^94\.140\.15\.(15|16)$/,    name: 'AdGuard' },
  { pattern: /^77\.88\.8\.[18]$/,         name: 'Yandex' },
];

/**
 * Mapeia um IPv4 para o nome do provedor DNS público. Quando o IP não
 * casa nenhum padrão conhecido, devolve `'DNS do provedor'` — heurística
 * de "provavelmente resolver default da operadora".
 */
export function identifyDnsProvider(ip: string): string {
  for (const { pattern, name } of KNOWN_DNS_PROVIDERS) {
    if (pattern.test(ip)) return name;
  }
  return 'DNS do provedor';
}

/**
 * Pergunta ao Cloudflare whoami qual resolver serviu a query e mede o
 * roundtrip da própria request via `performance.now()`. Devolve os três
 * campos (latência, IP, provider) em uma única chamada.
 *
 * Fluxo:
 * 1. `t0 = performance.now()`
 * 2. fetch DoH JSON a https://cloudflare-dns.com/dns-query?name=whoami.cloudflare.com
 * 3. `latencyMs = round(now - t0)` — só atribuído se o fetch teve sucesso
 * 4. parsing do `Answer[]` array → busca pelo campo "remote_ip:" → IP do resolver →
 *    provider via `identifyDnsProvider()`
 *
 * Nunca lança. Em qualquer falha (CORS, offline, timeout, parse, !ok)
 * retorna `{ latencyMs: null, resolverIp: null, provider: null }` e
 * loga em `console.warn` com o motivo (ajuda debug em DevTools mobile).
 */
export async function probeDnsResolver(signal?: AbortSignal): Promise<DnsProbeResult> {
  const url = 'https://cloudflare-dns.com/dns-query?name=whoami.cloudflare.com&type=TXT';
  const start = performance.now();
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      cache: 'no-store',
      signal,
    });
    const latencyMs = Math.round(performance.now() - start);
    if (!response.ok) {
      console.warn('[dnsProbe] resposta não-OK:', response.status, response.statusText);
      return { latencyMs: null, resolverIp: null, provider: null };
    }
    const data = await response.json();

    // Busca pelo campo "remote_ip" nas respostas TXT de whoami.cloudflare.com.
    // Resposta típica tem vários TXT records: asn, country_code, remote_ip.
    // Extrai o IP do campo remote_ip: <ipv4/ipv6>
    const answers = (data?.Answer ?? []) as Array<{ data: string }>;
    let resolverIp: string | null = null;

    for (const answer of answers) {
      const data_str = answer.data?.replace(/^"|"$/g, '') ?? '';
      if (data_str.startsWith('remote_ip:')) {
        // Formato: "remote_ip: xxx.xxx.xxx.xxx" ou "remote_ip: ipv6::addr"
        resolverIp = data_str.replace(/^remote_ip:\s*/, '').trim();
        break;
      }
    }

    if (!resolverIp) {
      console.warn('[dnsProbe] resposta sem remote_ip:', data);
      return { latencyMs, resolverIp: null, provider: null };
    }

    return { latencyMs, resolverIp, provider: identifyDnsProvider(resolverIp) };
  } catch (err) {
    // Aborto pelo orchestrator (cancelamento do teste) é cenário esperado:
    // não emite warning para não poluir o console.
    if (!(err instanceof DOMException && err.name === 'AbortError')) {
      console.warn('[dnsProbe] falha no fetch DoH:', err);
    }
    return { latencyMs: null, resolverIp: null, provider: null };
  }
}
