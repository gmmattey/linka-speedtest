import { describe, expect, it } from 'vitest';
import { rssiToPercent, signalQualityColor } from '../features/local-wifi/wifiSignal';

describe('rssiToPercent', () => {
  it('-50 dBm → 100%', () => {
    expect(rssiToPercent(-50)).toBe(100);
  });

  it('-75 dBm → 50%', () => {
    expect(rssiToPercent(-75)).toBe(50);
  });

  it('-100 dBm → 0%', () => {
    expect(rssiToPercent(-100)).toBe(0);
  });

  it('null/undefined → null', () => {
    expect(rssiToPercent(null)).toBeNull();
    expect(rssiToPercent(undefined)).toBeNull();
  });

  it('valor extremo positivo (-30 dBm) clampado a 100', () => {
    expect(rssiToPercent(-30)).toBe(100);
  });

  it('valor extremo negativo (-130 dBm) clampado a 0', () => {
    expect(rssiToPercent(-130)).toBe(0);
  });

  it('-67 dBm arredonda para 66%', () => {
    expect(rssiToPercent(-67)).toBe(66);
  });
});

describe('signalQualityColor', () => {
  it('≥80% → good', () => {
    expect(signalQualityColor(80)).toBe('good');
    expect(signalQualityColor(100)).toBe('good');
  });

  it('50–79% → warn', () => {
    expect(signalQualityColor(50)).toBe('warn');
    expect(signalQualityColor(79)).toBe('warn');
  });

  it('<50% → bad', () => {
    expect(signalQualityColor(0)).toBe('bad');
    expect(signalQualityColor(49)).toBe('bad');
  });
});
