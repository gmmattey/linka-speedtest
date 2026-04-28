import type { ServerInfo } from '../types';

export interface ServerProvider {
  id: string;
  name: string;
  checkAvailability(): Promise<boolean>;
  getInfo(): Promise<ServerInfo>;
  downloadUrl(bytes: number): string;
  uploadUrl(): string;
}

const CF_DOWN  = 'https://speed.cloudflare.com/__down';
const CF_UP    = 'https://speed.cloudflare.com/__up';
const CF_TRACE = 'https://speed.cloudflare.com/cdn-cgi/trace';
const CF_META  = 'https://speed.cloudflare.com/meta';

function parseTrace(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) out[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return out;
}

// Cloudflare retorna o asOrganization da ASN, que costuma ser o nome corporativo
// (ex.: "TELEFONICA BRASIL S.A."). Mapeamos para o nome comercial conhecido pelo
// usuário final brasileiro.
function friendlyIsp(raw: string): string {
  const s = raw.toUpperCase();
  if (s.includes('TELEFONICA') || s.includes('VIVO')) return 'Vivo';
  if (s.includes('CLARO') || s.includes('AMERICA MOVIL') || s.includes('NET SERVICOS')) return 'Claro';
  if (s.includes('TIM ')) return 'TIM';
  if (s.startsWith('OI ') || s.includes(' OI ') || s.includes('TELEMAR')) return 'Oi';
  if (s.includes('ALGAR')) return 'Algar';
  return raw;
}

export const CloudflareProvider: ServerProvider = {
  id: 'cloudflare',
  name: 'Cloudflare',

  async checkAvailability() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const resp = await fetch(`${CF_DOWN}?bytes=0&_cb=${Date.now()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      clearTimeout(t);
      return resp.ok;
    } catch {
      return false;
    }
  },

  async getInfo() {
    let ip = '—', colo = '—', loc = '—', isp = '—';
    let available = false;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const [traceResp, metaResp] = await Promise.allSettled([
        fetch(`${CF_TRACE}?_cb=${Date.now()}`, { signal: ctrl.signal, cache: 'no-store' }),
        fetch(`${CF_META}?_cb=${Date.now()}`,  { signal: ctrl.signal, cache: 'no-store' }),
      ]);
      clearTimeout(t);

      if (traceResp.status === 'fulfilled' && traceResp.value.ok) {
        const parsed = parseTrace(await traceResp.value.text());
        ip    = parsed.ip   ?? ip;
        colo  = parsed.colo ?? colo;
        loc   = parsed.loc  ?? loc;
        available = true;
      }
      if (metaResp.status === 'fulfilled' && metaResp.value.ok) {
        const meta = await metaResp.value.json() as { asOrganization?: string };
        if (meta.asOrganization) isp = friendlyIsp(meta.asOrganization);
      }
    } catch {
      available = false;
    }
    return { id: this.id, name: this.name, ip, colo, loc, isp, available };
  },

  downloadUrl(bytes: number) { return `${CF_DOWN}?bytes=${bytes}`; },
  uploadUrl()                { return CF_UP; },
};

export const SERVERS: ServerProvider[] = [CloudflareProvider];

export function getServer(id: string): ServerProvider {
  return SERVERS.find((s) => s.id === id) ?? SERVERS[0];
}

export function getDefaultServer(): ServerProvider {
  return SERVERS[0];
}
