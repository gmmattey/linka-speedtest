import { useEffect, useState } from 'react';
import { runLocalWifiDiagnostics } from './LocalWifiService';
import type { WifiDiagnosticResult } from './types';

/**
 * Estado público do hook auto-fetch de diagnóstico Wi-Fi.
 *
 * - `loading`: chamada ao bridge ainda em andamento.
 * - `unavailable`: ambiente não expõe o bridge (PWA puro, ou Capacitor sem o
 *   plugin LinkaWifiDiagnostics) — o consumidor deve mostrar fallback "só no
 *   app instalado".
 * - `permission-denied`: bridge respondeu mas o usuário negou a permissão
 *   de localização (Android exige ACCESS_FINE_LOCATION para ler o estado
 *   do Wi-Fi). O consumidor deve mostrar mensagem específica orientando
 *   o usuário a habilitar nas configurações.
 * - `available`: dados nativos disponíveis em `data`.
 */
export type WifiDiagnosticsStatus =
  | 'loading'
  | 'unavailable'
  | 'permission-denied'
  | 'available';

export interface WifiDiagnosticsState {
  status: WifiDiagnosticsStatus;
  data?: WifiDiagnosticResult;
}

/**
 * Variante auto-fetch do diagnóstico Wi-Fi local.
 *
 * Diferente de `useLocalWifi` (que dispara `run()` sob demanda na tela
 * dedicada `LocalWifiScreen`), este hook executa o diagnóstico no mount
 * — pensado para ser embutido em superfícies onde o resultado deve aparecer
 * sem clique do usuário (ex.: card Wi-Fi em `ResultScreen`).
 *
 * Não duplica lógica de classificação: `runLocalWifiDiagnostics` já reutiliza
 * `bandFromFrequency`, `classifyWifiQuality` e `classifyWifiChannel` do
 * `LocalWifiService`.
 */
export function useWifiDiagnostics(): WifiDiagnosticsState {
  const [state, setState] = useState<WifiDiagnosticsState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await runLocalWifiDiagnostics();
        if (cancelled) return;
        if (result.available) {
          setState({ status: 'available', data: result });
          return;
        }
        // Distingue "usuário negou a permissão" de "ambiente sem
        // plugin" para que o card mostre mensagem própria.
        if (result.permissionStatus === 'denied') {
          setState({ status: 'permission-denied', data: result });
          return;
        }
        setState({ status: 'unavailable' });
      } catch {
        if (cancelled) return;
        setState({ status: 'unavailable' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
