import { describe, expect, it } from 'vitest';
import {
  bandFromFrequency,
  channelFromFrequency,
  classifyWifiChannel,
  classifyWifiQuality,
  runLocalWifiDiagnostics,
  toCombinedWifiInput,
} from '../features/local-wifi/LocalWifiService';

describe('LocalWifiService helpers', () => {
  it('frequency 2412 -> 2.4GHz canal 1', () => {
    expect(bandFromFrequency(2412)).toBe('2.4GHz');
    expect(channelFromFrequency(2412)).toBe(1);
  });

  it('frequency 2437 -> 2.4GHz canal 6', () => {
    expect(bandFromFrequency(2437)).toBe('2.4GHz');
    expect(channelFromFrequency(2437)).toBe(6);
  });

  it('frequency 2462 -> 2.4GHz canal 11', () => {
    expect(bandFromFrequency(2462)).toBe('2.4GHz');
    expect(channelFromFrequency(2462)).toBe(11);
  });

  it('frequency 5180 -> 5GHz canal 36', () => {
    expect(bandFromFrequency(5180)).toBe('5GHz');
    expect(channelFromFrequency(5180)).toBe(36);
  });

  it('frequency 5955 -> 6GHz canal aproximado', () => {
    expect(bandFromFrequency(5955)).toBe('6GHz');
    expect(channelFromFrequency(5955)).toBeGreaterThan(0);
  });

  it('RSSI -50 + 600 Mbps + 5GHz -> excellent', () => {
    expect(classifyWifiQuality({ rssiDbm: -50, linkSpeedMbps: 600, band: '5GHz' })).toBe('excellent');
  });

  it('RSSI -58 + 400 Mbps -> good', () => {
    expect(classifyWifiQuality({ rssiDbm: -58, linkSpeedMbps: 400, band: '2.4GHz' })).toBe('good');
  });

  it('RSSI -65 + 150 Mbps -> fair', () => {
    expect(classifyWifiQuality({ rssiDbm: -65, linkSpeedMbps: 150, band: '2.4GHz' })).toBe('fair');
  });

  it('RSSI -72 + 60 Mbps -> weak', () => {
    expect(classifyWifiQuality({ rssiDbm: -72, linkSpeedMbps: 60, band: '2.4GHz' })).toBe('weak');
  });

  it('RSSI -82 -> critical', () => {
    expect(classifyWifiQuality({ rssiDbm: -82, band: '2.4GHz' })).toBe('critical');
  });

  it('canal 2.4GHz 1 -> bom', () => {
    expect(classifyWifiChannel({ band: '2.4GHz', channel: 1 })).toEqual({ quality: 'good' });
  });

  it('canal 2.4GHz adjacente -> médio', () => {
    expect(classifyWifiChannel({ band: '2.4GHz', channel: 2 })).toEqual({ quality: 'medium' });
  });

  it('canal 2.4GHz ruim -> sugere 1/6/11 mais próximo', () => {
    expect(classifyWifiChannel({ band: '2.4GHz', channel: 9 })).toEqual({ quality: 'bad', suggestedChannel: 11 });
  });

  it('canal 5GHz não-DFS comum -> bom', () => {
    expect(classifyWifiChannel({ band: '5GHz', channel: 149 })).toEqual({ quality: 'good' });
  });

  it('canal 5GHz válido fora da lista comum -> médio', () => {
    expect(classifyWifiChannel({ band: '5GHz', channel: 100 })).toEqual({ quality: 'medium' });
  });

  it('canal 5GHz inválido -> ruim com sugestão', () => {
    expect(classifyWifiChannel({ band: '5GHz', channel: 200 })).toEqual({ quality: 'bad', suggestedChannel: 161 });
  });

  it('6GHz fica médio quando não há canal', () => {
    expect(classifyWifiChannel({ band: '6GHz' })).toEqual({ quality: 'medium' });
  });

  it('web unavailable retorna available false', async () => {
    const result = await runLocalWifiDiagnostics();
    expect(result.available).toBe(false);
    expect(result.quality).toBe('unknown');
  });

  it('toCombinedWifiInput remove band unknown', () => {
    const result = toCombinedWifiInput({
      available: true,
      title: 'x',
      explanation: 'y',
      primaryAction: 'z',
      limitations: [],
      band: 'unknown',
      quality: 'unknown',
      rssiDbm: -60,
      linkSpeedMbps: 300,
    });

    expect(result).toEqual({
      available: true,
      rssiDbm: -60,
      linkSpeedMbps: 300,
      band: undefined,
      quality: undefined,
    });
  });
});
