import { useCallback, useState } from 'react';
import type { GamingProfile } from '../types';

export interface Settings {
  unit: 'mbps' | 'gbps';
  connectionOverride: 'auto' | 'wifi' | 'cable' | 'mobile';
  hideIpOnShare: boolean;
  gamingProfile: GamingProfile;
  contractedDown: number | null;
  contractedUp: number | null;
  defaultMode: 'fast' | 'complete';
  // Bloco 3 (Polimento, 2026-05): habilita vibração tátil em transições
  // de fase, conclusão e erro do teste. Default `true` — usuário pode
  // desativar pelo HamburgerMenu.
  useHaptics: boolean;
  // Ajustes espelhados do Kotlin (Fase 1, 2026-05)
  userName: string;
  providerName: string;
  region: string;
  qualityAlertsActive: boolean;
  alertThresholdMbps: number;
}

const KEY = 'linka.speedtest.settings.v1';
const DEFAULTS: Settings = {
  unit: 'mbps',
  connectionOverride: 'auto',
  hideIpOnShare: true,
  gamingProfile: 'off',
  contractedDown: null,
  contractedUp: null,
  defaultMode: 'complete',
  useHaptics: true,
  userName: '',
  providerName: '',
  region: '',
  qualityAlertsActive: false,
  alertThresholdMbps: 0,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      // Spread tolera campos órfãos (ex.: `scale` removido em Bloco 6,
      // 2026-05). Eles ficam no objeto até o próximo `update()` reescrever
      // o storage somente com chaves de `Settings`.
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
    }
  } catch { /* ignore */ }
  return DEFAULTS;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { settings, update };
}
