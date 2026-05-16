import { useEffect, useState } from 'react';
import type { ConnectionType, DeviceInfo, DeviceType, ServerInfo } from '../types';
import { getDefaultServer, getServer } from '../utils/serverRegistry';
import { getLocalWifiRawInfoFromBridge } from '../features/local-wifi/LocalWifiBridge';

interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  return Boolean(cap?.isNativePlatform && cap.isNativePlatform());
}

/**
 * Cascata de detecção (Bug-fix 2026-05 — rede mobile/Wi-Fi):
 *
 * 1. **Capacitor APK** (`Capacitor.isNativePlatform() === true`): consulta o
 *    plugin nativo `LinkaWifiDiagnostics.getWifiInfo()` via
 *    `getLocalWifiRawInfoFromBridge()`. Se `available: true` (SSID, RSSI etc.
 *    foram lidos) → `wifi`. Se `available: false` → `mobile` (no APK não há
 *    cabo — ou o usuário está em Wi-Fi reconhecido pelo plugin, ou está em
 *    rede móvel). Permission-denied também cai em `mobile` por estar no APK.
 * 2. **PWA web** (sem Capacitor): usa `navigator.connection.type` quando
 *    disponível (`wifi` / `cellular` / `ethernet` / `wimax` / `bluetooth`).
 *    Pega também `effectiveType` lento como sinal indireto de celular.
 * 3. **Fallback final** (Safari iOS, Firefox, Chrome com `type='unknown'`):
 *    assume `wifi` — caso mais comum de PWA standalone instalado em casa.
 *    Log `console.warn` para diagnóstico.
 *
 * Override manual via `HamburgerMenu` (configurações → conexão) sempre vence
 * — é aplicado em `App.tsx::effectiveConnection` e nunca passa por aqui.
 */

function detectConnectionTypeFromWeb(): ConnectionType | null {
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const t = conn?.type;
  const eff = conn?.effectiveType;

  if (t === 'wifi') return 'wifi';
  if (t === 'cellular') return 'mobile';
  if (t === 'ethernet' || t === 'wimax') return 'cable';
  // `bluetooth` é tethering — geralmente celular compartilhado.
  if (t === 'bluetooth') return 'mobile';
  // effectiveType lento sem `type` = rede celular quase certo.
  if (!t && (eff === '2g' || eff === '3g' || eff === 'slow-2g')) return 'mobile';
  return null;
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const w = window.innerWidth;
  let deviceType: DeviceType = 'desktop';
  if (/Mobi|Android/i.test(ua) || w <= 768) deviceType = 'mobile';
  else if (w <= 1024) deviceType = 'tablet';

  const fromWeb = detectConnectionTypeFromWeb();
  if (fromWeb) {
    return { deviceType, connectionType: fromWeb };
  }

  // Fallback final (sem sinal confiável da Web API e sem bridge ainda):
  // PWA standalone em iOS Safari / Firefox costuma ser Wi-Fi doméstico.
  // Em desktop sem Network Information API, default é `cable` (Ethernet ou
  // Wi-Fi indistinguíveis sem dados nativos — mas não é mobile).
  // Log para diagnóstico — caso real precise de override manual.
  if (typeof console !== 'undefined' && deviceType === 'mobile') {
    console.warn(
      '[linka] navigator.connection indisponível — assumindo conexão "unknown" como default em mobile. ' +
      'Capacitor bridge resolverá no APK.',
    );
  }
  const fallback: ConnectionType = 'unknown';
  return { deviceType, connectionType: fallback };
}

/**
 * Detecção via plugin nativo Capacitor `LinkaWifiDiagnostics`. Usada no APK
 * Android (e iOS quando portado), onde a Web API `navigator.connection` é
 * inconsistente. Só é chamada quando `isCapacitorNative()` é verdadeiro.
 */
async function detectConnectionTypeFromCapacitor(): Promise<ConnectionType | null> {
  try {
    const info = await getLocalWifiRawInfoFromBridge();
    if (info.available && info.ssid) return 'wifi';
    // No APK não há ethernet — se o plugin não viu Wi-Fi, é rede móvel.
    // Permission-denied também cai aqui: usuário no APK provavelmente está
    // em rede móvel ou em Wi-Fi sem permissão. Conservador: mobile.
    return 'mobile';
  } catch {
    return null;
  }
}

interface State {
  device: DeviceInfo | null;
  server: ServerInfo | null;
  loading: boolean;
  error: string | null;
}

export function useDeviceInfo(serverId = 'cloudflare'): State & { reload: () => void } {
  const [state, setState] = useState<State>({
    device: detectDevice(),
    server: null,
    loading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  // Bug-fix 2026-05 (Capacitor APK): refina o `connectionType` lendo o
  // plugin nativo. O state inicial usa só Web APIs — em APK, a Web API
  // costuma retornar `unknown`, então o fallback síncrono vira `wifi`. Este
  // effect corrige logo após o mount (e a cada `reloadKey`, que é bumpado
  // pelo `App.tsx` no início de cada teste). O effect é noop em PWA web.
  useEffect(() => {
    if (!isCapacitorNative()) return;
    let cancelled = false;
    void (async () => {
      const ct = await detectConnectionTypeFromCapacitor();
      if (cancelled || !ct) return;
      setState((s) => {
        if (s.device?.connectionType === ct) return s;
        const baseDevice: DeviceInfo = s.device ?? { deviceType: 'mobile', connectionType: ct };
        return { ...s, device: { ...baseDevice, connectionType: ct } };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Re-detecta tipo de conexão quando o usuário alterna entre WiFi e dados móveis.
  // Bug-fix 2026-05 (ISP cached): além de atualizar `device`, dispara
  // re-fetch de `getInfo()` (via reloadKey) para que o ISP/colo/IP do banner
  // de contexto reflita a rede atual. Antes, o ISP só era resolvido no mount
  // e ficava congelado mesmo após troca de Wi-Fi → móvel (ou troca de
  // operadora). Chrome Android dispara `connection.change` de forma
  // confiável; em iOS Safari (que não expõe `navigator.connection`) o
  // refresh acontece via reload manual em `App.tsx` antes de cada teste.
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (!conn) return;
    const handleChange = () => {
      setState((s) => ({ ...s, device: detectDevice() }));
      setReloadKey((k) => k + 1);
    };
    conn.addEventListener('change', handleChange);
    return () => conn.removeEventListener('change', handleChange);
  }, []);

  // Bug-fix 2026-05 (WiFi permission): em APK, quando o usuário nega
  // ACCESS_FINE_LOCATION, o plugin retorna mobile por padrão (conservador).
  // Se o usuário depois concede a permissão nas Settings do Android e volta
  // pra app, este effect retenta a detecção — agora com permissão, deve
  // conseguir ler SSID real e atualizar de mobile → wifi.
  //
  // Removido: listener de 'resume' causava bump excessivo de reloadKey em
  // APK (resume dispara frequentemente em transições de lock/unlock). O
  // Capacitor effect inicial (line 124) já refina a conexão; o listener de
  // online/offline (line 172) captura mudanças de rede reais. Em PWA, noop.
  //
  // Nota: se WiFi permission for concedida nas Settings enquanto app está
  // em background, a próxima vez que o usuário abrir o app, a detecção
  // Capacitor (line 124) rodará normalmente e refinará de mobile → wifi.
  // Não é detecção instantânea, mas evita o loop de atualizações.

  // Bug-fix 2026-05 (ISP cached + rede móvel): também ouve `online`/`offline`
  // para refrescar quando a rede sair/voltar (caso clássico iOS: avião → 5G,
  // ou Android cabo → mobile via tether USB). Bumpa `reloadKey` para forçar
  // refresh do ISP e re-rodar a detecção via Capacitor.
  useEffect(() => {
    const handleOnline = () => {
      setState((s) => ({ ...s, device: detectDevice() }));
      setReloadKey((k) => k + 1);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOnline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!cancelled) setState((s) => (!s.loading ? { ...s, loading: true, error: null } : s));
      const device = detectDevice();
      const provider = serverId ? getServer(serverId) : getDefaultServer();
      try {
        const info = await provider.getInfo();
        const available = info.available && (await provider.checkAvailability());
        if (cancelled) return;
        setState((prev) => ({
          // Preserva connectionType refinado pelo effect Capacitor — não
          // sobrescreve com a versão sync do `detectDevice()` síncrono.
          device: prev.device ?? device,
          server: { ...info, available },
          loading: false,
          error: available ? null : 'Servidor de teste indisponível.',
        }));
      } catch {
        if (cancelled) return;
        setState((prev) => ({
          device: prev.device ?? device,
          server: {
            id: provider.id,
            name: provider.name,
            ip: '—',
            colo: '—',
            loc: '—',
            isp: '—',
            available: false,
          },
          loading: false,
          error: 'Não foi possível conectar ao servidor de teste.',
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serverId, reloadKey]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
}
