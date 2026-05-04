import { useState } from 'react';
import { useWifiDiagnostics } from './useWifiDiagnostics';
import type { WifiDiagnosticResult, WifiQuality } from './types';
import { WifiDetailsSheet } from './WifiDetailsSheet';
import './WifiSignalCard.css';

/**
 * Card embutido na ResultScreen que mostra a qualidade do sinal Wi-Fi
 * percebido pelo dispositivo. Renderizado pelo pai apenas quando
 * `connectionType === 'wifi'`. Quando o bridge nativo
 * (`LinkaWifiDiagnostics.getWifiInfo`) não responde — caso de PWA standalone
 * ou APK sem o plugin embutido — exibe fallback informativo único.
 *
 * Clicável: abre popup bottom-sheet com 5 seções de detalhes.
 * Reutiliza integralmente as funções de classificação de
 * `LocalWifiService` (banda, qualidade do sinal). Não cria thresholds
 * próprios.
 */
export function WifiSignalCard() {
  const state = useWifiDiagnostics();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (state.status === 'loading') {
    return (
      <section className="lk-wifi-card lk-wifi-card--placeholder" aria-label="Wi-Fi">
        <p className="lk-wifi-card__kicker">Wi-Fi</p>
        <p className="lk-wifi-card__placeholder">Lendo informações do Wi-Fi…</p>
      </section>
    );
  }

  if (state.status === 'permission-denied') {
    return (
      <section className="lk-wifi-card lk-wifi-card--permission-denied" aria-label="Wi-Fi">
        <p className="lk-wifi-card__kicker">Wi-Fi</p>
        <p className="lk-wifi-card__unavailable">
          Permissão de localização necessária para diagnóstico Wi-Fi.
          Habilite nas configurações do app.
        </p>
      </section>
    );
  }

  if (state.status === 'unavailable' || !state.data) {
    return (
      <section className="lk-wifi-card lk-wifi-card--unavailable" aria-label="Wi-Fi">
        <p className="lk-wifi-card__kicker">Wi-Fi</p>
        <p className="lk-wifi-card__unavailable">
          Wi-Fi: detalhes disponíveis somente no app instalado.
        </p>
      </section>
    );
  }

  return (
    <>
      <WifiSignalCardAvailable data={state.data} onOpen={() => setIsDetailsOpen(true)} />
      <WifiDetailsSheet
        isOpen={isDetailsOpen}
        diagnostics={state.data}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
}

interface AvailableProps {
  data: WifiDiagnosticResult;
  onOpen: () => void;
}

function WifiSignalCardAvailable({ data, onOpen }: AvailableProps) {
  const channel = data.channel != null ? String(data.channel) : '—';
  const ssid = data.ssid ?? 'Rede desconhecida';
  const wifiStandard = data.wifiStandard ? formatWifiStandard(data.wifiStandard) : '—';

  const quality = data.quality ?? 'unknown';
  const channelColor = getChannelColorClass(quality);

  return (
    <button
      className="lk-wifi-card lk-wifi-card--compact"
      onClick={onOpen}
      aria-label={`Wi-Fi: ${ssid}, canal ${channel}. Clique para detalhes`}
    >
      <p className="lk-wifi-card__kicker">Wi-Fi</p>
      <div className="lk-wifi-card__compact-content">
        <div className="lk-wifi-card__compact-ssid">{ssid}</div>
        <div className="lk-wifi-card__compact-meta">
          <span className={`lk-wifi-card__channel ${channelColor}`}>
            Canal {channel}
          </span>
          <span className="lk-wifi-card__standard">
            {wifiStandard}
          </span>
        </div>
      </div>
    </button>
  );
}

function formatWifiStandard(standard: string): string {
  if (!standard) return '—';
  if (standard.includes('802.11ax')) return 'WiFi 6';
  if (standard.includes('802.11ac')) return 'WiFi 5';
  if (standard.includes('802.11n')) return 'WiFi 4';
  return standard;
}

function getChannelColorClass(quality: WifiQuality): string {
  if (quality === 'excellent' || quality === 'good') return 'lk-wifi-card__channel--good';
  if (quality === 'fair') return 'lk-wifi-card__channel--fair';
  return 'lk-wifi-card__channel--bad';
}

