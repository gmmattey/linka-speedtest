import { useEffect, useRef, useState } from 'react';
import type { WifiDiagnosticResult } from './types';
import { ChannelQualityChart } from './ChannelQualityChart';
import { wifiQualityLabel } from './LocalWifiService';
import './WifiDetailsSheet.css';

interface WifiDetailsSheetProps {
  isOpen: boolean;
  diagnostics: WifiDiagnosticResult;
  onClose: () => void;
}

/**
 * Bottom-sheet com detalhes Wi-Fi. 4 cards principais (Rede, Desempenho,
 * Análise de Canais, Rede Local) + um toggle "Mais técnico" que expande
 * dados secundários (padrão WiFi, número de redes próximas).
 *
 * O backdrop usa `backdrop-filter: blur` + opacidade 0.6 para garantir que
 * o conteúdo da ResultScreen fique invisível (regressão fixada após
 * primeiro APK ter mostrado popup transparente).
 */
export function WifiDetailsSheet({
  isOpen,
  diagnostics,
  onClose,
}: WifiDetailsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [showTechnical, setShowTechnical] = useState(false);

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

  const ssid = diagnostics.ssid && diagnostics.ssid.trim() ? diagnostics.ssid : 'Sua rede';
  const bandText = diagnostics.band === 'unknown' || !diagnostics.band ? '—' : diagnostics.band;
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
      <div ref={sheetRef} className="lk-wifi-sheet" role="dialog" aria-modal="true" aria-labelledby="lk-wifi-sheet-title">
        <header className="lk-wifi-sheet__header">
          <div className="lk-wifi-sheet__handle" aria-hidden="true" />
          <div className="lk-wifi-sheet__title-row">
            <h2 id="lk-wifi-sheet-title" className="lk-wifi-sheet__title">Detalhes Wi-Fi</h2>
            <button
              className="lk-wifi-sheet__close"
              onClick={onClose}
              aria-label="Fechar detalhes"
              type="button"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="lk-wifi-sheet__content">
          {/* Rede */}
          <section className="lk-wifi-sheet__section">
            <h3 className="lk-wifi-sheet__section-title">Rede</h3>
            <dl className="lk-wifi-sheet__list">
              <Row label="Nome (SSID)" value={ssid} />
              <Row label="Frequência" value={bandText} />
              <Row label="Canal" value={channel} />
              <Row label="Qualidade do Canal" value={capitalizeFirst(diagnostics.channelQuality ?? '—')} />
            </dl>
          </section>

          {/* Desempenho */}
          <section className="lk-wifi-sheet__section">
            <h3 className="lk-wifi-sheet__section-title">Desempenho</h3>
            <dl className="lk-wifi-sheet__list">
              <Row label="Sinal" value={rssi} />
              <Row label="Velocidade do Link" value={linkSpeed} />
              <Row label="Qualidade da Conexão" value={qualityLabel} />
            </dl>
          </section>

          {/* Análise de Canais — filtra pela banda atual */}
          <section className="lk-wifi-sheet__section">
            <h3 className="lk-wifi-sheet__section-title">Análise de Canais</h3>
            <ChannelQualityChart
              nearbyNetworks={diagnostics.nearbyNetworks}
              currentChannel={diagnostics.channel}
              currentBand={diagnostics.band}
              suggestedChannel={diagnostics.suggestedChannel}
              isLoading={false}
            />
          </section>

          {/* Rede Local */}
          <section className="lk-wifi-sheet__section">
            <h3 className="lk-wifi-sheet__section-title">Rede Local</h3>
            <dl className="lk-wifi-sheet__list">
              <Row label="Gateway" value={gateway} />
              <Row label="IP Local" value={ipAddress} />
            </dl>
          </section>

          {/* Toggle "Mais técnico" */}
          <button
            type="button"
            className={`lk-wifi-sheet__more-toggle ${showTechnical ? 'lk-wifi-sheet__more-toggle--open' : ''}`}
            onClick={() => setShowTechnical((v) => !v)}
            aria-expanded={showTechnical}
          >
            <span>Informações técnicas</span>
            <span className="lk-wifi-sheet__more-toggle-arrow" aria-hidden="true">▾</span>
          </button>

          {showTechnical && (
            <section className="lk-wifi-sheet__section">
              <h3 className="lk-wifi-sheet__section-title">Técnico</h3>
              <dl className="lk-wifi-sheet__list">
                <Row label="Padrão WiFi" value={wifiStandard} />
                <Row label="Redes Próximas" value={`${nearbyNetworksCount}`} />
              </dl>
            </section>
          )}
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
