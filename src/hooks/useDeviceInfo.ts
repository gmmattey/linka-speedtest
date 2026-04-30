import { useEffect, useState } from 'react';
import type { ConnectionType, DeviceInfo, DeviceType, ServerInfo } from '../types';
import { getDefaultServer, getServer } from '../utils/serverRegistry';

interface NetworkInformation {
  type?: string;
  effectiveType?: string;
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const w = window.innerWidth;
  let deviceType: DeviceType = 'desktop';
  if (/Mobi|Android/i.test(ua) || w <= 768) deviceType = 'mobile';
  else if (w <= 1024) deviceType = 'tablet';

  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  let connectionType: ConnectionType;
  const t = conn?.type;
  const eff = conn?.effectiveType;
  // connection.type é o tipo físico real (wifi/cellular/ethernet) e tem prioridade.
  // effectiveType só indica velocidade estimada e pode reportar '4g' em ethernet rápida.
  if (t === 'wifi') connectionType = 'wifi';
  else if (t === 'cellular') connectionType = 'mobile';
  else if (t === 'ethernet' || t === 'wimax' || t === 'other') connectionType = 'cable';
  else if (!t && (eff === '2g' || eff === '3g' || eff === 'slow-2g')) connectionType = 'mobile';
  // Sem API de conexão (iOS Safari, Firefox): assume Wi-Fi pois a maioria dos
  // usuários domésticos está em Wi-Fi mesmo em dispositivos móveis.
  else if (deviceType === 'mobile') connectionType = 'wifi';
  else connectionType = 'cable';

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
    device: null,
    server: null,
    loading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
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
