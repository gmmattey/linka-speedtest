import { useCallback, useState } from 'react';

export interface Settings {
  unit: 'mbps' | 'gbps';
  scale: 'linear' | 'log';
  connectionOverride: 'auto' | 'wifi' | 'cable' | 'mobile';
  hideIpOnShare: boolean;
}

const KEY = 'linka.speedtest.settings.v1';
const DEFAULTS: Settings = {
  unit: 'mbps',
  scale: 'linear',
  connectionOverride: 'auto',
  hideIpOnShare: true,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
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
