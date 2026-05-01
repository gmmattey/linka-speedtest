import { useCallback, useState } from 'react';
import { runLocalWifiDiagnostics } from './LocalWifiService';
import type { WifiDiagnosticResult } from './types';

interface State {
  loading: boolean;
  result: WifiDiagnosticResult | null;
  error: string | null;
}

export function useLocalWifi() {
  const [state, setState] = useState<State>({
    loading: false,
    result: null,
    error: null,
  });

  const run = useCallback(async () => {
    setState({ loading: true, result: null, error: null });

    try {
      const result = await runLocalWifiDiagnostics();
      setState({ loading: false, result, error: null });
      return result;
    } catch {
      setState({
        loading: false,
        result: null,
        error: 'Não foi possível executar o diagnóstico Wi-Fi.',
      });
      return null;
    }
  }, []);

  return { ...state, run };
}
