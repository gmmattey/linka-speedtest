import { useCallback, useState } from 'react';
import { discoverLocalNetworkDevices, type LocalNetworkScanResult } from './LocalNetworkService';

export function useLocalNetworkDiscovery() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocalNetworkScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await discoverLocalNetworkDevices();
      setResult(next);
    } catch {
      setError('Não foi possível verificar os dispositivos da rede.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, result, error, run };
}
