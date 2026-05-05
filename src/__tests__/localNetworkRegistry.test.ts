import { describe, expect, it } from 'vitest';
import { mergeDeviceObservations, normalizeMac, observationsFromClientIdentities } from '../features/local-network/DeviceRegistry';
import { buildScanResult, confidenceLabel, nameSourceLabel } from '../features/local-network/LocalNetworkService';
import type { DeviceObservation } from '../features/local-network/types';

describe('DeviceRegistry', () => {
  it('normaliza MAC e descarta formato inválido', () => {
    expect(normalizeMac('AA:BB:CC:DD:EE:FF')).toBe('aabbccddeeff');
    expect(normalizeMac('aa-bb-cc-dd-ee-ff')).toBe('aabbccddeeff');
    expect(normalizeMac('sem-mac')).toBeUndefined();
  });

  it('consolida fontes em um único device por IP/MAC', () => {
    const observations: DeviceObservation[] = [
      { ip: '192.168.1.42', mac: 'AA:BB:CC:DD:EE:FF', source: 'arp' },
      { ip: '192.168.1.42', source: 'tcp' },
      { ip: '192.168.1.42', friendlyName: 'TV Sala', source: 'ssdp', kind: 'tv' },
    ];

    const devices = mergeDeviceObservations(observations);

    expect(devices).toHaveLength(1);
    expect(devices[0]).toMatchObject({
      displayName: 'TV Sala',
      ip: '192.168.1.42',
      mac: 'aabbccddeeff',
      kind: 'tv',
      nameSource: 'ssdp',
      confidence: 'confirmed',
    });
    expect(devices[0].sources).toEqual(['arp', 'tcp', 'ssdp']);
  });

  it('respeita hierarquia de nomes', () => {
    const devices = mergeDeviceObservations([
      { ip: '192.168.1.10', friendlyName: 'Chromecast', source: 'ssdp' },
      { ip: '192.168.1.10', modemClientName: 'TV Quarto', source: 'router' },
      { ip: '192.168.1.10', userDefinedName: 'Projetor', source: 'cache' },
    ]);

    expect(devices[0].displayName).toBe('Projetor');
    expect(devices[0].nameSource).toBe('userDefined');
  });

  it('ignora nomes NetBIOS técnicos', () => {
    const devices = mergeDeviceObservations([
      { ip: '192.168.1.20', netbiosName: 'WORKGROUP', source: 'netbios' },
    ]);

    expect(devices[0].displayName).toBe('192.168.1.20');
    expect(devices[0].nameSource).toBe('ip');
  });

  it('transforma identidades do modem em observações de router', () => {
    const observations = observationsFromClientIdentities(new Map([
      ['AA:BB:CC:DD:EE:FF', 'Galaxy S23'],
      ['192.168.1.42', 'TV Sala'],
    ]));

    expect(observations).toEqual([
      { ip: '', mac: 'aabbccddeeff', modemClientName: 'Galaxy S23', source: 'router', hostnameSource: 'router' },
      { ip: '192.168.1.42', mac: undefined, modemClientName: 'TV Sala', source: 'router', hostnameSource: 'router' },
    ]);
  });

  it('monta o resultado final sempre pelo merge único', () => {
    const result = buildScanResult(
      {
        available: true,
        platform: 'android',
        observations: [
          { ip: '192.168.1.42', mac: 'AA:BB:CC:DD:EE:FF', source: 'arp' },
          { ip: '192.168.1.42', source: 'tcp' },
        ],
      },
      [{ ip: '', mac: 'AA:BB:CC:DD:EE:FF', modemClientName: 'Galaxy S23', source: 'router' }],
    );

    expect(result.devices).toHaveLength(1);
    expect(result.devices[0].displayName).toBe('Galaxy S23');
    expect(result.devices[0].confidence).toBe('confirmed');
    expect(result.observationCount).toBe(3);
  });

  it('mantém labels pt-BR para UI', () => {
    expect(confidenceLabel('medium')).toBe('médio');
    expect(nameSourceLabel('router')).toBe('modem');
  });
});
