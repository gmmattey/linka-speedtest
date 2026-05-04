/**
 * Testes do dicionário de copy pt-BR.
 *
 * Foco: chaves novas adicionadas no polimento de UX (Top 5 quick wins).
 * Estes testes funcionam como guarda contra regressão de fraseologia
 * — qualquer mudança nas strings amigáveis quebra um teste daqui.
 */

import { describe, it, expect } from 'vitest';
import { resolveCopy } from '../core/copyDictionary';

describe('resolveCopy — chaves de métricas', () => {
  it('metric.packetLoss → "Falhas" (curto)', () => {
    expect(resolveCopy('metric.packetLoss')).toBe('Falhas');
  });

  it('metric.packetLoss.long → "Falhas na conexão"', () => {
    expect(resolveCopy('metric.packetLoss.long')).toBe('Falhas na conexão');
  });

  it('metric.latency → "Resposta" (curto, label do app)', () => {
    expect(resolveCopy('metric.latency')).toBe('Resposta');
  });

  it('metric.latency.short → "RESP" (sigla compacta)', () => {
    expect(resolveCopy('metric.latency.short')).toBe('RESP');
  });

  it('metric.latency.loaded → "Resposta com a rede ocupada"', () => {
    expect(resolveCopy('metric.latency.loaded')).toBe('Resposta com a rede ocupada');
  });
});

describe('resolveCopy — use cases', () => {
  it('useCase.gaming.label → "Jogos online" (longo)', () => {
    expect(resolveCopy('useCase.gaming.label')).toBe('Jogos online');
  });

  it('useCase.gaming.label.short → "Jogos" (chip apertado)', () => {
    expect(resolveCopy('useCase.gaming.label.short')).toBe('Jogos');
  });

  it('useCase.streaming_4k.label → "Streaming 4K"', () => {
    expect(resolveCopy('useCase.streaming_4k.label')).toBe('Streaming 4K');
  });

  it('useCase.home_office.label → "Home office"', () => {
    expect(resolveCopy('useCase.home_office.label')).toBe('Home office');
  });

  it('useCase.video_call.label → "Videochamada"', () => {
    expect(resolveCopy('useCase.video_call.label')).toBe('Videochamada');
  });

  it('useCase.status.good → "Funciona bem" (descritivo)', () => {
    expect(resolveCopy('useCase.status.good')).toBe('Funciona bem');
  });

  it('useCase.status.good.short → "OK" (chip apertado)', () => {
    expect(resolveCopy('useCase.status.good.short')).toBe('OK');
  });

  it('useCase.status.maybe.short → "Atenção"', () => {
    expect(resolveCopy('useCase.status.maybe.short')).toBe('Atenção');
  });

  it('useCase.status.limited.short → "Ruim"', () => {
    expect(resolveCopy('useCase.status.limited.short')).toBe('Ruim');
  });
});

describe('resolveCopy — tema', () => {
  it('theme.light → "Claro"', () => {
    expect(resolveCopy('theme.light')).toBe('Claro');
  });

  it('theme.dark → "Escuro"', () => {
    expect(resolveCopy('theme.dark')).toBe('Escuro');
  });
});

describe('resolveCopy — flag.packetLoss padronizada', () => {
  it('flag.packetLoss agora usa "Falhas na conexão" (não "Perda de pacotes")', () => {
    expect(resolveCopy('flag.packetLoss')).toBe('Falhas na conexão');
  });
});
