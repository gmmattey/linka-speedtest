import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { identifyDnsProvider, probeDnsResolver } from '../utils/dnsProbe';

describe('identifyDnsProvider', () => {
  it('1.1.1.1 → Cloudflare', () => {
    expect(identifyDnsProvider('1.1.1.1')).toBe('Cloudflare');
  });

  it('1.0.0.1 → Cloudflare', () => {
    expect(identifyDnsProvider('1.0.0.1')).toBe('Cloudflare');
  });

  it('8.8.8.8 → Google', () => {
    expect(identifyDnsProvider('8.8.8.8')).toBe('Google');
  });

  it('8.8.4.4 → Google', () => {
    expect(identifyDnsProvider('8.8.4.4')).toBe('Google');
  });

  it('9.9.9.9 → Quad9', () => {
    expect(identifyDnsProvider('9.9.9.9')).toBe('Quad9');
  });

  it('9.9.9.11 → Quad9 (variantes do último octeto)', () => {
    expect(identifyDnsProvider('9.9.9.11')).toBe('Quad9');
  });

  it('208.67.222.222 → OpenDNS', () => {
    expect(identifyDnsProvider('208.67.222.222')).toBe('OpenDNS');
  });

  it('208.67.220.220 → OpenDNS', () => {
    expect(identifyDnsProvider('208.67.220.220')).toBe('OpenDNS');
  });

  it('94.140.14.14 → AdGuard', () => {
    expect(identifyDnsProvider('94.140.14.14')).toBe('AdGuard');
  });

  it('IP desconhecido → "DNS do provedor" (fallback ISP)', () => {
    expect(identifyDnsProvider('192.168.1.1')).toBe('DNS do provedor');
    expect(identifyDnsProvider('200.219.130.45')).toBe('DNS do provedor');
    expect(identifyDnsProvider('10.0.0.1')).toBe('DNS do provedor');
  });

  it('string vazia → "DNS do provedor"', () => {
    expect(identifyDnsProvider('')).toBe('DNS do provedor');
  });
});

// =============================================================================
// probeDnsResolver — refator 2026-05 (Safari fix): retorno unificado
// { latencyMs, resolverIp, provider } com latência medida via performance.now()
// =============================================================================

describe('probeDnsResolver', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Silencia o console.warn da função (esperado em cenários de falha).
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sucesso (Cloudflare) → latência ≥ 0, IP e provider mapeado', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ Answer: [{ data: '"1.1.1.1"' }] }),
    } as Response);

    const result = await probeDnsResolver();
    expect(result.latencyMs).not.toBeNull();
    expect(result.latencyMs!).toBeGreaterThanOrEqual(0);
    expect(result.resolverIp).toBe('1.1.1.1');
    expect(result.provider).toBe('Cloudflare');
  });

  it('IP desconhecido → provider "DNS do provedor", mas latência preservada', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ Answer: [{ data: '"200.219.130.45"' }] }),
    } as Response);

    const result = await probeDnsResolver();
    expect(result.latencyMs).not.toBeNull();
    expect(result.resolverIp).toBe('200.219.130.45');
    expect(result.provider).toBe('DNS do provedor');
  });

  it('fetch lança (ex.: CORS, offline) → tudo null, sem propagar erro', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await probeDnsResolver();
    expect(result).toEqual({ latencyMs: null, resolverIp: null, provider: null });
  });

  it('resposta !ok → tudo null', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => ({}),
    } as Response);

    const result = await probeDnsResolver();
    expect(result).toEqual({ latencyMs: null, resolverIp: null, provider: null });
  });

  it('JSON sem Answer[0].data → latência preservada, IP/provider null', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    const result = await probeDnsResolver();
    // Latência foi medida (fetch teve sucesso), só falhou parse — preserva.
    expect(result.latencyMs).not.toBeNull();
    expect(result.resolverIp).toBeNull();
    expect(result.provider).toBeNull();
  });
});
