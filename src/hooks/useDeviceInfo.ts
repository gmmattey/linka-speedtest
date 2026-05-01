import { useEffect, useState } from 'react';
import type { ConnectionType, DeviceInfo, DeviceType, ServerInfo } from '../types';
import { getDefaultServer, getServer } from '../utils/serverRegistry';

interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const w = window.innerWidth;
  let deviceType: DeviceType = 'desktop';
  if (/Mobi|Android/i.test(ua) || w <= 768) deviceType = 'mobile';
  else if (w <= 1024) deviceType = 'tablet';

  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const t = conn?.type;
  const eff = conn?.effectiveType;

  let connectionType: ConnectionType;
  // connection.type dá o tipo físico real quando disponível (Chrome Android/Windows/Mac).
  if (t === 'wifi') connectionType = 'wifi';
  else if (t === 'cellular') connectionType = 'mobile';
  else if (t === 'ethernet' || t === 'wimax') connectionType = 'cable';
  // effectiveType lento indica quase certamente rede celular.
  else if (!t && (eff === '2g' || eff === '3g' || eff === 'slow-2g')) connectionType = 'mobile';
  else {
    // Sem sinal confiável da API (Firefox, Safari, Chrome com type='unknown').
    // Usa o sistema operacional real — não o tamanho da janela — para o fallback:
    // SO mobile (iOS/Android) → provavelmente Wi-Fi doméstico.
    // SO desktop (Windows/Mac/Linux) → provavelmente cabo.
    const isMobileOS = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    connectionType = isMobileOS ? 'wifi' : 'cable';
  }

  return { deviceType, connectionType };
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

  // Re-detecta tipo de conexão quando o usuário alterna entre WiFi e dados móveis
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (!conn) return;
    const handleChange = () => {
      setState((s) => ({ ...s, device: detectDevice() }));
    };
    conn.addEventListener('change', handleChange);
    return () => conn.removeEventListener('change', handleChange);
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
        setState({
          device,
          server: { ...info, available },
          loading: false,
          error: available ? null : 'Servidor de teste indisponível.',
        });
      } catch {
        if (cancelled) return;
        setState({
          device,
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
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serverId, reloadKey]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
}
