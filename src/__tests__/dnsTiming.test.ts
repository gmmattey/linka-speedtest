import { describe, it, expect } from 'vitest';
import { classifyDnsLatency, dnsLatencyLabel } from '../utils/dnsTiming';

describe('classifyDnsLatency', () => {
  it('null → null (nada a classificar)', () => {
    expect(classifyDnsLatency(null)).toBeNull();
  });

  it('0 → excellent (cache hit muito rápido)', () => {
    expect(classifyDnsLatency(0)).toBe('excellent');
  });

  it('10 → excellent (<20ms)', () => {
    expect(classifyDnsLatency(10)).toBe('excellent');
  });

  it('20 → good (boundary inclusivo da próxima faixa)', () => {
    expect(classifyDnsLatency(20)).toBe('good');
  });

  it('35 → good (<50ms)', () => {
    expect(classifyDnsLatency(35)).toBe('good');
  });

  it('50 → fair (boundary)', () => {
    expect(classifyDnsLatency(50)).toBe('fair');
  });

  it('99 → fair (<100ms)', () => {
    expect(classifyDnsLatency(99)).toBe('fair');
  });

  it('150 → slow (>=100ms)', () => {
    expect(classifyDnsLatency(150)).toBe('slow');
  });

  it('299 → slow (<300ms)', () => {
    expect(classifyDnsLatency(299)).toBe('slow');
  });

  it('300 → poor (>=300ms)', () => {
    expect(classifyDnsLatency(300)).toBe('poor');
  });

  it('500 → poor', () => {
    expect(classifyDnsLatency(500)).toBe('poor');
  });
});

describe('dnsLatencyLabel', () => {
  it('mapeia todas as grades para labels pt-BR', () => {
    expect(dnsLatencyLabel('excellent')).toBe('Excelente');
    expect(dnsLatencyLabel('good')).toBe('Bom');
    expect(dnsLatencyLabel('fair')).toBe('Aceitável');
    expect(dnsLatencyLabel('slow')).toBe('Lento');
    expect(dnsLatencyLabel('poor')).toBe('Ruim');
  });
});
