import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseWifiCallback,
  savePendingWifiContext,
  consumePendingWifiContext,
  classifyRssi,
  rssiLabel,
  formatWifiStandard,
} from '../features/ios-wifi-context/wifiShortcut';
import type { WifiContext } from '../types';

// ── parseWifiCallback ─────────────────────────────────────────────────────────

describe('parseWifiCallback — query string simples', () => {
  it('parseia payload completo', () => {
    const search = '?sid=st_123&t=1730000008123&ssid=MinhaRede&bssid=aa%3Abb%3Acc%3Add%3Aee%3Aff&rssi=-67&noise=-91&snr=24&channel=149&tx=286&rx=344&standard=802.11ax&localIp=192.168.1.42';
    const ctx = parseWifiCallback(search);

    expect(ctx).not.toBeNull();
    expect(ctx!.sessionId).toBe('st_123');
    expect(ctx!.ssid).toBe('MinhaRede');
    expect(ctx!.rssiDbm).toBe(-67);
    expect(ctx!.noiseDbm).toBe(-91);
    expect(ctx!.snrDb).toBe(24);
    expect(ctx!.channel).toBe(149);
    expect(ctx!.txRateMbps).toBe(286);
    expect(ctx!.rxRateMbps).toBe(344);
    expect(ctx!.wifiStandard).toBe('802.11ax');
    expect(ctx!.available).toBe(true);
  });

  it('retorna null quando sid ausente', () => {
    expect(parseWifiCallback('?rssi=-67')).toBeNull();
  });

  it('ignora campos faltando — mantém undefined', () => {
    const ctx = parseWifiCallback('?sid=abc');
    expect(ctx).not.toBeNull();
    expect(ctx!.rssiDbm).toBeUndefined();
    expect(ctx!.channel).toBeUndefined();
    expect(ctx!.ssid).toBeUndefined();
  });

  it('descarta rssi fora da faixa válida (-100 a -20)', () => {
    const ctx = parseWifiCallback('?sid=abc&rssi=-10');
    expect(ctx!.rssiDbm).toBeUndefined();

    const ctx2 = parseWifiCallback('?sid=abc&rssi=-105');
    expect(ctx2!.rssiDbm).toBeUndefined();
  });

  it('aceita rssi na fronteira da faixa', () => {
    expect(parseWifiCallback('?sid=abc&rssi=-20')!.rssiDbm).toBe(-20);
    expect(parseWifiCallback('?sid=abc&rssi=-100')!.rssiDbm).toBe(-100);
  });

  it('descarta channel fora da faixa (1-233)', () => {
    expect(parseWifiCallback('?sid=abc&channel=0')!.channel).toBeUndefined();
    expect(parseWifiCallback('?sid=abc&channel=234')!.channel).toBeUndefined();
  });

  it('descarta txRate negativo', () => {
    expect(parseWifiCallback('?sid=abc&tx=-5')!.txRateMbps).toBeUndefined();
  });

  it('sanitiza strings com caracteres de controle', () => {
    const ctx = parseWifiCallback('?sid=abc&ssid=Rede\x00Ruim');
    expect(ctx!.ssid).toBe('RedeRuim');
  });

  it('available=false quando parâmetro diz false', () => {
    const ctx = parseWifiCallback('?sid=abc&available=false');
    expect(ctx!.available).toBe(false);
  });
});

describe('parseWifiCallback — base64url (ctx=)', () => {
  it('parseia payload base64url válido', () => {
    const payload: WifiContext = {
      version: 1,
      source: 'ios-shortcut',
      sessionId: 'st_base64',
      collectedAt: Date.now(),
      available: true,
      rssiDbm: -65,
      channel: 6,
    };
    const b64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    const ctx = parseWifiCallback(`?ctx=${b64}`);
    expect(ctx).not.toBeNull();
    expect(ctx!.sessionId).toBe('st_base64');
    expect(ctx!.rssiDbm).toBe(-65);
  });

  it('retorna null para base64 inválido', () => {
    expect(parseWifiCallback('?ctx=!!!invalido!!!')).toBeNull();
  });
});

// ── sessionStorage ────────────────────────────────────────────────────────────
// Ambiente Vitest usa environment: 'node' — sessionStorage não existe.
// Injetamos um mock simples antes dos testes e removemos depois.

function makeSessionStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

describe('savePendingWifiContext / consumePendingWifiContext', () => {
  let mock: ReturnType<typeof makeSessionStorageMock>;

  beforeEach(() => {
    mock = makeSessionStorageMock();
    // @ts-expect-error — injeta mock em ambiente node
    global.sessionStorage = mock;
  });

  afterEach(() => {
    // @ts-expect-error — limpa mock
    delete global.sessionStorage;
  });

  const ctx: WifiContext = {
    version: 1,
    source: 'ios-shortcut',
    sessionId: 'st_test',
    collectedAt: Date.now(),
    available: true,
    rssiDbm: -70,
  };

  it('salva e consome o contexto', () => {
    savePendingWifiContext(ctx);
    const consumed = consumePendingWifiContext();
    expect(consumed).not.toBeNull();
    expect(consumed!.sessionId).toBe('st_test');
  });

  it('consome uma única vez', () => {
    savePendingWifiContext(ctx);
    consumePendingWifiContext();
    expect(consumePendingWifiContext()).toBeNull();
  });

  it('retorna null quando contexto está expirado', () => {
    const expired: WifiContext = { ...ctx, collectedAt: Date.now() - 3 * 60 * 1000 };
    savePendingWifiContext(expired);
    expect(consumePendingWifiContext()).toBeNull();
  });
});

// ── classifyRssi ──────────────────────────────────────────────────────────────

describe('classifyRssi', () => {
  it('excellent >= -55', () => expect(classifyRssi(-55)).toBe('excellent'));
  it('good -67', () => expect(classifyRssi(-67)).toBe('good'));
  it('fair -75', () => expect(classifyRssi(-75)).toBe('fair'));
  it('weak -82', () => expect(classifyRssi(-82)).toBe('weak'));
  it('critical -90', () => expect(classifyRssi(-90)).toBe('critical'));
  it('unknown quando undefined', () => expect(classifyRssi(undefined)).toBe('unknown'));
});

describe('rssiLabel', () => {
  it('retorna label em pt-BR', () => {
    expect(rssiLabel(-55)).toBe('Excelente');
    expect(rssiLabel(-90)).toBe('Crítico');
    expect(rssiLabel(undefined)).toBe('Desconhecido');
  });
});

// ── formatWifiStandard ────────────────────────────────────────────────────────

describe('formatWifiStandard', () => {
  it('mapeia 802.11ax para Wi-Fi 6', () => expect(formatWifiStandard('802.11ax')).toBe('Wi-Fi 6'));
  it('mapeia 802.11be para Wi-Fi 7', () => expect(formatWifiStandard('802.11be')).toBe('Wi-Fi 7'));
  it('mapeia 802.11ac para Wi-Fi 5', () => expect(formatWifiStandard('802.11ac')).toBe('Wi-Fi 5'));
  it('preserva string desconhecida', () => expect(formatWifiStandard('802.11x')).toBe('802.11x'));
  it('retorna undefined quando ausente', () => expect(formatWifiStandard(undefined)).toBeUndefined());
});

// ── isIOS — não testado em jsdom (userAgent não é iOS por padrão) ─────────────

describe('isIOS', () => {
  it('retorna false em ambiente jsdom/node', async () => {
    const { isIOS } = await import('../features/ios-wifi-context/wifiShortcut');
    expect(isIOS()).toBe(false);
  });
});
