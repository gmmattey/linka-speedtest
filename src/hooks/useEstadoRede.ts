/**
 * Hook de monitoramento de rede em duas camadas.
 *
 * Camada 1 (passiva): tipo de interface via navigator.onLine / navigator.connection /
 * plugin Capacitor LinkaWifiDiagnostics.
 * Camada 2 (ativa): validação real de internet via HEAD ao endpoint canônico Cloudflare.
 *
 * Segue a spec em docs/contratos/MonitoramentoRede.md.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocalWifiRawInfoFromBridge } from '../features/local-wifi/LocalWifiBridge';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type TipoRede = 'wifi' | 'celular' | 'ethernet' | 'nenhuma' | 'desconhecida';

export interface EstadoRede {
  tipo: TipoRede;
  internet: boolean;
  ssid: string | null;
  ipLocal: string | null;
  gateway: string | null;
  timestamp: number; // Date.now()
}

// ── Helpers internos ──────────────────────────────────────────────────────────

interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

function getNavConn(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform && cap.isNativePlatform());
}

function tipoDeInterface(): TipoRede {
  if (!navigator.onLine) return 'nenhuma';
  const conn = getNavConn();
  const t = conn?.type;
  const eff = conn?.effectiveType;
  if (t === 'wifi') return 'wifi';
  if (t === 'cellular') return 'celular';
  if (t === 'ethernet' || t === 'wimax') return 'ethernet';
  if (t === 'bluetooth') return 'celular';
  if (!t && (eff === '2g' || eff === '3g' || eff === 'slow-2g')) return 'celular';
  return 'desconhecida';
}

async function tipoDeInterfaceCapacitor(): Promise<TipoRede | null> {
  if (!isCapacitorNative()) return null;
  try {
    const info = await getLocalWifiRawInfoFromBridge();
    if (info.available && info.ssid) return 'wifi';
    return 'celular';
  } catch {
    return null;
  }
}

async function verificarInternet(): Promise<boolean> {
  try {
    const cb = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const resp = await fetch(
      `https://speed.cloudflare.com/__down?bytes=0&_cb=${cb}`,
      { cache: 'no-store', signal: AbortSignal.timeout(1500) },
    );
    return resp.ok;
  } catch {
    return false;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

const ESTADO_INICIAL: EstadoRede = {
  tipo: 'desconhecida',
  internet: false,
  ssid: null,
  ipLocal: null,
  gateway: null,
  timestamp: Date.now(),
};

// Atrasos da rajada pós-suspeita: 0 ms, 1 s, 3 s, 6 s.
const RAJADA_DELAYS_MS = [0, 1000, 3000, 6000];
// Polling estável quando nada muda.
const POLLING_ESTAVEL_MS = 60_000;

export function useEstadoRede(): EstadoRede & { revalidarAgora: () => Promise<EstadoRede> } {
  const [estado, setEstado] = useState<EstadoRede>(ESTADO_INICIAL);
  const rajadaAtivaRef = useRef(false);
  const rajadaIdRef = useRef(0);

  const atualizarEstado = useCallback(async (): Promise<EstadoRede> => {
    let tipo = tipoDeInterface();

    // Refinamento via Capacitor (APK Android/iOS).
    if (isCapacitorNative()) {
      const tipoNativo = await tipoDeInterfaceCapacitor();
      if (tipoNativo) tipo = tipoNativo;
    }

    const internet = await verificarInternet();

    const novo: EstadoRede = {
      tipo,
      internet,
      ssid: null,   // SSID via Capacitor plugin é exposto por useDeviceInfo — não duplicar aqui.
      ipLocal: null, // idem
      gateway: null,
      timestamp: Date.now(),
    };

    setEstado((prev) => {
      if (prev.tipo === novo.tipo && prev.internet === novo.internet) {
        // Atualiza timestamp sem notificar re-render dos consumidores de tipo/internet.
        return { ...prev, timestamp: novo.timestamp };
      }
      return novo;
    });

    return novo;
  }, []);

  const dispararRajada = useCallback(() => {
    if (rajadaAtivaRef.current) return;
    rajadaAtivaRef.current = true;
    const id = ++rajadaIdRef.current;

    void (async () => {
      for (const delayMs of RAJADA_DELAYS_MS) {
        if (rajadaIdRef.current !== id) break;
        if (delayMs > 0) await new Promise<void>((r) => setTimeout(r, delayMs));
        if (rajadaIdRef.current !== id) break;
        await atualizarEstado();
      }
      if (rajadaIdRef.current === id) rajadaAtivaRef.current = false;
    })();
  }, [atualizarEstado]);

  // Revalidação forçada (usar antes de iniciar speedtest).
  const revalidarAgora = useCallback(async (): Promise<EstadoRede> => {
    return atualizarEstado();
  }, [atualizarEstado]);

  // Inicialização e polling estável.
  useEffect(() => {
    dispararRajada();
    const timer = setInterval(() => {
      if (!rajadaAtivaRef.current) void atualizarEstado();
    }, POLLING_ESTAVEL_MS);
    return () => clearInterval(timer);
  }, [dispararRajada, atualizarEstado]);

  // Eventos passivos de interface (online/offline).
  useEffect(() => {
    const handler = () => dispararRajada();
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, [dispararRajada]);

  // navigator.connection.change.
  useEffect(() => {
    const conn = getNavConn();
    if (!conn) return;
    const handler = () => dispararRajada();
    conn.addEventListener('change', handler);
    return () => conn.removeEventListener('change', handler);
  }, [dispararRajada]);

  // Foreground: visibilitychange + pageshow (bfcache).
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') dispararRajada();
    };
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) dispararRajada();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [dispararRajada]);

  return { ...estado, revalidarAgora };
}
