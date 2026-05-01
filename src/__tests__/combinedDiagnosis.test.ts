import { describe, it, expect } from 'vitest';
import { combineDiagnostics } from '../utils/combinedDiagnosis';
import type { SpeedTestResult, WifiDiagnosticResult, MobileDiagnosticResult } from '../types';

function goodSpeed(o: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return { dl: 100, ul: 30, latency: 30, jitter: 10, packetLoss: 0.5, timestamp: 0, ...o };
}

function badSpeed(o: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return { dl: 20, ul: 5, latency: 120, jitter: 40, packetLoss: 3, timestamp: 0, ...o };
}

const goodWifi: WifiDiagnosticResult = {
  available: true, rssiDbm: -55, linkSpeedMbps: 400, band: '5GHz', quality: 'excellent',
};

const badWifi: WifiDiagnosticResult = {
  available: true, rssiDbm: -72, linkSpeedMbps: 60, band: '2.4GHz', quality: 'weak',
};

const goodMobile: MobileDiagnosticResult = {
  available: true, signalLevel: 'good', rsrpDbm: -90, rsrqDb: -10, sinrDb: 15,
};

const badMobile: MobileDiagnosticResult = {
  available: true, signalLevel: 'critical', rsrpDbm: -115, rsrqDb: -18, sinrDb: 2,
};

describe('Wi-Fi', () => {
  it('speed bom + wifi bom → healthy (high)', () => {
    const r = combineDiagnostics({ speed: goodSpeed(), connectionType: 'wifi', wifi: goodWifi });
    expect(r.cause).toBe('healthy');
    expect(r.confidence).toBe('high');
  });

  it('speed ruim + wifi ruim → wifi_bottleneck (high)', () => {
    const r = combineDiagnostics({ speed: badSpeed(), connectionType: 'wifi', wifi: badWifi });
    expect(r.cause).toBe('wifi_bottleneck');
    expect(r.confidence).toBe('high');
  });

  it('speed ruim + wifi bom → operator_or_wan_issue (high)', () => {
    const r = combineDiagnostics({ speed: badSpeed(), connectionType: 'wifi', wifi: goodWifi });
    expect(r.cause).toBe('operator_or_wan_issue');
    expect(r.confidence).toBe('high');
  });

  it('speed bom + wifi ruim → local_wifi_risk (medium)', () => {
    const r = combineDiagnostics({ speed: goodSpeed(), connectionType: 'wifi', wifi: badWifi });
    expect(r.cause).toBe('local_wifi_risk');
    expect(r.confidence).toBe('medium');
  });

  it('speed ruim + sem wifi → inconclusive (low)', () => {
    const r = combineDiagnostics({ speed: badSpeed(), connectionType: 'wifi' });
    expect(r.cause).toBe('inconclusive');
    expect(r.confidence).toBe('low');
  });

  it('speed bom + sem wifi → healthy (medium)', () => {
    const r = combineDiagnostics({ speed: goodSpeed(), connectionType: 'wifi' });
    expect(r.cause).toBe('healthy');
    expect(r.confidence).toBe('medium');
  });
});

describe('Mobile', () => {
  it('speed bom + sem mobile → healthy (medium)', () => {
    const r = combineDiagnostics({ speed: goodSpeed(), connectionType: 'mobile' });
    expect(r.cause).toBe('healthy');
    expect(r.confidence).toBe('medium');
  });

  it('speed ruim + sem mobile → mobile_network_issue (medium)', () => {
    const r = combineDiagnostics({ speed: badSpeed(), connectionType: 'mobile' });
    expect(r.cause).toBe('mobile_network_issue');
    expect(r.confidence).toBe('medium');
  });

  it('speed ruim + mobile ruim → mobile_signal_risk (high)', () => {
    const r = combineDiagnostics({ speed: badSpeed(), connectionType: 'mobile', mobile: badMobile });
    expect(r.cause).toBe('mobile_signal_risk');
    expect(r.confidence).toBe('high');
  });

  it('speed ruim + mobile bom → mobile_network_issue (medium)', () => {
    const r = combineDiagnostics({ speed: badSpeed(), connectionType: 'mobile', mobile: goodMobile });
    expect(r.cause).toBe('mobile_network_issue');
    expect(r.confidence).toBe('medium');
  });

  it('speed bom + mobile ruim → mobile_signal_risk (medium)', () => {
    const r = combineDiagnostics({ speed: goodSpeed(), connectionType: 'mobile', mobile: badMobile });
    expect(r.cause).toBe('mobile_signal_risk');
    expect(r.confidence).toBe('medium');
  });
});

describe('Cabo / Desconhecido', () => {
  it('speed bom → healthy (medium)', () => {
    const r = combineDiagnostics({ speed: goodSpeed(), connectionType: 'cable' });
    expect(r.cause).toBe('healthy');
    expect(r.confidence).toBe('medium');
  });

  it('speed ruim → internet_issue (low)', () => {
    const r = combineDiagnostics({ speed: badSpeed(), connectionType: 'cable' });
    expect(r.cause).toBe('internet_issue');
    expect(r.confidence).toBe('low');
  });
});

describe('shape', () => {
  it('sempre retorna campos obrigatórios com conteúdo', () => {
    const r = combineDiagnostics({ speed: goodSpeed(), connectionType: 'unknown' });
    expect(r.cause).toBeTruthy();
    expect(r.title.length).toBeGreaterThan(0);
    expect(r.explanation.length).toBeGreaterThan(0);
    expect(r.primaryAction.length).toBeGreaterThan(0);
    expect(['low', 'medium', 'high']).toContain(r.confidence);
  });
});
