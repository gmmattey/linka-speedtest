import { useEffect, useRef } from 'react';
import type { WifiDiagnosticResult } from './types';
import { ChannelQualityChart } from './ChannelQualityChart';
import { wifiQualityLabel } from './LocalWifiService';
import './WifiDetailsSheet.css';

interface WifiDetailsSheetProps {
  isOpen: boolean;
  diagnostics: WifiDiagnosticResult;
  onClose: () => void;
}

export function WifiDetailsSheet({
  isOpen,
  diagnostics,
  onClose,
}: WifiDetailsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    backdropRef.current?.addEventListener('click', handleBackdropClick);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      backdropRef.current?.removeEventListener('click', handleBackdropClick);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const bandText = diagnostics.band === 'unknown' ? '—' : diagnostics.band ?? '—';
  const channel = diagnostics.channel != null ? String(diagnostics.channel) : '—';
  const rssi = diagnostics.rssiDbm != null ? `${diagnostics.rssiDbm} dBm` : '—';
  const linkSpeed = diagnostics.linkSpeedMbps != null ? `${diagnostics.linkSpeedMbps} Mbps` : '—';
  const quality = diagnostics.quality ?? 'unknown';
  const qualityLabel = wifiQualityLabel(quality);
  const gateway = diagnostics.gateway ?? '—';
  const ipAddress = diagnostics.ipAddress ?? '—';
  const wifiStandard = diagnostics.platform === 'web' ? '—' : diagnostics.wifiStandard ?? '—';
  const nearbyNetworksCount = diagnostics.nearbyNetworks?.length ?? 0;

  return (
    <div ref={backdropRef} className="lk-wifi-sheet__backdrop">
      <div ref={sheetRef} className="lk-wifi-sheet">
        <div className="lk-wifi-sheet__handle" />
        <button
          className="lk-wifi-sheet__close"
          onClick={onClose}
          aria-label="Fechar detalhes"
        >
          ✕
        </button>

        <div className="lk-wifi-sheet__content">
          {/* Rede */}
          <section className="lk-wifi-sheet__section">
            <h2 className="lk-wifi-sheet__section-title">Rede</h2>
            <div className="lk-wifi-sheet__list">
              <Row label="Nome (SSID)" value={diagnostics.ssid ?? '—'} />
              <Row label="Frequência" value={bandText} />
              <Row label="Canal" value={channel} />
              <Row label="Qualidade do Canal" value={capitalizeFirst(diagnostics.channelQuality ?? 'desconhecida')} />
            </div>
          </section>

          {/* Desempenho */}
          <section className="lk-wifi-sheet__section">
            <h2 className="lk-wifi-sheet__section-title">Desempenho</h2>
            <div className="lk-wifi-sheet__list">
              <Row label="Sinal" value={rssi} />
              <Row label="Velocidade do Link" value={linkSpeed} />
              <Row label="Qualidade da Conexão" value={qualityLabel} />
            </div>
          </section>

          {/* Análise de Canais */}
          <section className="lk-wifi-sheet__section">
            <h2 className="lk-wifi-sheet__section-title">Análise de Canais</h2>
            <ChannelQualityChart
              nearbyNetworks={diagnostics.nearbyNetworks}
              currentChannel={diagnostics.channel}
              suggestedChannel={diagnostics.suggestedChannel}
              isLoading={false}
            />
          </section>

          {/* Rede Local */}
          <section className="lk-wifi-sheet__section">
            <h2 className="lk-wifi-sheet__section-title">Rede Local</h2>
            <div className="lk-wifi-sheet__list">
              <Row label="Gateway" value={gateway} />
              <Row label="IP Local" value={ipAddress} />
            </div>
          </section>

          {/* Técnico */}
          <section className="lk-wifi-sheet__section">
            <h2 className="lk-wifi-sheet__section-title">Técnico</h2>
            <div className="lk-wifi-sheet__list">
              <Row label="Padrão WiFi" value={wifiStandard} />
              <Row label="Redes Próximas" value={`${nearbyNetworksCount}`} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  return (
    <div className="lk-wifi-sheet__row">
      <dt className="lk-wifi-sheet__row-label">{label}</dt>
      <dd className="lk-wifi-sheet__row-value">{value}</dd>
    </div>
  );
}

function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
