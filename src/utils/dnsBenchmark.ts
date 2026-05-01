export type DnsGrade = 'A' | 'B' | 'C' | 'D';

export interface DnsServerResult {
  id: string;
  name: string;
  ip: string;
  p50: number;       // ms — mediana das latências válidas
  p95: number;       // ms — percentil 95
  samples: number;   // amostras válidas (<5000ms)
  grade: DnsGrade;
}

export interface DnsBenchmarkResult {
  servers: DnsServerResult[];
  winner: DnsServerResult;
  testedAt: number;
}

const DNS_STORAGE_KEY = 'linka.dns.result.v1';

const TEST_DOMAINS = [
  'google.com',
  'youtube.com',
  'facebook.com',
  'amazon.com.br',
  'netflix.com',
];

const WARMUP_ROUNDS = 2;
const MEASURE_ROUNDS = 2; // per domain

// DoH endpoints (JSON format)
const SERVERS: Array<{ id: string; name: string; ip: string; doh: string }> = [
  { id: 'cloudflare', name: 'Cloudflare',  ip: '1.1.1.1',          doh: 'https://cloudflare-dns.com/dns-query' },
  { id: 'google',     name: 'Google',      ip: '8.8.8.8',           doh: 'https://dns.google/resolve' },
  { id: 'adguard',    name: 'AdGuard',     ip: '94.140.14.14',      doh: 'https://dns.adguard-dns.com/resolve' },
  { id: 'quad9',      name: 'Quad9',       ip: '9.9.9.9',           doh: 'https://dns.quad9.net/dns-query' },
  { id: 'opendns',    name: 'OpenDNS',     ip: '208.67.222.222',    doh: 'https://doh.opendns.com/dns-query' },
];

const QUERY_TIMEOUT_MS  = 5000;
const MIN_SERVER_PACING = 1500; // ms between servers for UX perception

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

function gradeFor(p50: number): DnsGrade {
  if (p50 <= 15)  return 'A';
  if (p50 <= 30)  return 'B';
  if (p50 <= 50)  return 'C';
  return 'D';
}

async function queryOnce(doh: string, domain: string, signal: AbortSignal): Promise<number> {
  const url = `${doh}?name=${domain}&type=A`;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), QUERY_TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  signal.addEventListener('abort', onAbort);
  const t0 = performance.now();
  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    await resp.json();
    return performance.now() - t0;
  } finally {
    clearTimeout(tid);
    signal.removeEventListener('abort', onAbort);
  }
}

async function benchmarkServer(
  server: typeof SERVERS[0],
  signal: AbortSignal,
): Promise<DnsServerResult> {
  const latencies: number[] = [];

  // Warmup — descarta resultados
  for (let w = 0; w < WARMUP_ROUNDS; w++) {
    if (signal.aborted) break;
    try { await queryOnce(server.doh, TEST_DOMAINS[0], signal); } catch { /* ignore */ }
  }

  // Medição
  for (const domain of TEST_DOMAINS) {
    for (let r = 0; r < MEASURE_ROUNDS; r++) {
      if (signal.aborted) break;
      try {
        const ms = await queryOnce(server.doh, domain, signal);
        if (ms < 5000) latencies.push(ms);
      } catch { /* timeout ou erro — ignorar amostra */ }
    }
  }

  const p50 = percentile(latencies, 0.5);
  const p95 = percentile(latencies, 0.95);
  return { id: server.id, name: server.name, ip: server.ip, p50, p95, samples: latencies.length, grade: gradeFor(p50) };
}

export async function runDNSBenchmark(
  signal: AbortSignal,
  onProgress?: (done: number, total: number, current: string) => void,
): Promise<DnsBenchmarkResult> {
  const results: DnsServerResult[] = [];

  for (let i = 0; i < SERVERS.length; i++) {
    if (signal.aborted) break;
    const server = SERVERS[i];
    onProgress?.(i, SERVERS.length, server.name);

    const serverStart = performance.now();
    const result = await benchmarkServer(server, signal);
    results.push(result);

    // Pacing mínimo entre servidores para UX
    const elapsed = performance.now() - serverStart;
    const wait = MIN_SERVER_PACING - elapsed;
    if (wait > 0 && !signal.aborted) {
      await new Promise<void>((resolve) => {
        const tid = setTimeout(resolve, wait);
        signal.addEventListener('abort', () => { clearTimeout(tid); resolve(); }, { once: true });
      });
    }
  }

  // Vencedor = maior número de amostras com menor p50
  const valid = results.filter(r => r.samples > 0);
  const winner = valid.length > 0
    ? valid.reduce((best, r) => r.p50 < best.p50 ? r : best)
    : results[0];

  const benchmarkResult: DnsBenchmarkResult = { servers: results, winner, testedAt: Date.now() };

  try { localStorage.setItem(DNS_STORAGE_KEY, JSON.stringify(benchmarkResult)); } catch { /* ignore */ }

  onProgress?.(SERVERS.length, SERVERS.length, '');
  return benchmarkResult;
}

export function loadLastDnsResult(): DnsBenchmarkResult | null {
  try {
    const raw = localStorage.getItem(DNS_STORAGE_KEY);
    return raw ? JSON.parse(raw) as DnsBenchmarkResult : null;
  } catch {
    return null;
  }
}
