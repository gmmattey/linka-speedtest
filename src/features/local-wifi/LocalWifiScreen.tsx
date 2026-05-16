import { getCapabilities } from '../../platform/capabilities';
import { TopBar } from '../../components/TopBar';
import { PageHeader } from '../../components/PageHeader';
import { useScrollHeader } from '../../hooks/useScrollHeader';
import { useLocalWifi } from './useLocalWifi';
import { wifiQualityLabel } from './LocalWifiService';
import './LocalWifiScreen.css';

function rssiLabel(dbm: number): string {
  if (dbm >= -50) return 'Ótimo';
  if (dbm >= -65) return 'Bom';
  if (dbm >= -75) return 'Regular';
  return 'Fraco';
}

interface Props {
  onBack: () => void;
}

export function LocalWifiScreen({ onBack }: Props) {
  const { localWifiDiagnostics } = getCapabilities();
  const { loading, result, error, run } = useLocalWifi();
  const channelQualityLabel: Record<'good' | 'medium' | 'bad', string> = {
    good: 'bom',
    medium: 'médio',
    bad: 'ruim',
  };

  // Bloco 5 — TopBar System (2026-05).
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  return (
    <div className="lk-local-wifi">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        title="Diagnóstico Wi-Fi"
        showTitle={scrolled}
      />

      <div className="lk-local-wifi__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Diagnóstico Wi-Fi" />
        <div className="lk-local-wifi__card">
          {!localWifiDiagnostics ? (
            <div className="lk-local-wifi__unavailable">
              <p className="lk-local-wifi__text lk-local-wifi__text--primary">
                Diagnóstico de sinal Wi-Fi requer acesso aos dados do sistema.
              </p>
              <p className="lk-local-wifi__text">
                Navegadores não expõem informações de sinal por privacidade. Use o app Android para ver a qualidade do seu Wi-Fi.
              </p>
            </div>
          ) : (
            <>
              <p className="lk-local-wifi__text">
                Este diagnóstico não mede a velocidade real entre o aparelho e o roteador.
                Ele avalia o sinal e os dados da conexão Wi-Fi para identificar possíveis problemas locais.
              </p>

              <button className="btn-primary" onClick={() => void run()} disabled={loading}>
                {loading ? 'Executando...' : 'Executar diagnóstico'}
              </button>

              {error && <p className="lk-local-wifi__error">{error}</p>}

              {result && (
                <div className="lk-local-wifi__result">
                  <h2 className="lk-local-wifi__subtitle">{result.title}</h2>
                  <p className="lk-local-wifi__text">{result.explanation}</p>

                  <dl className="lk-local-wifi__list">
                    <div><dt>Qualidade</dt><dd>{wifiQualityLabel(result.quality ?? 'unknown')}</dd></div>
                    {result.ssid && <div><dt>Nome da rede</dt><dd>{result.ssid}</dd></div>}
                    {result.rssiDbm != null && (
                      <div>
                        <dt>Força do sinal</dt>
                        <dd>{rssiLabel(result.rssiDbm)} <span className="lk-local-wifi__tech">({result.rssiDbm} dBm)</span></dd>
                      </div>
                    )}
                    {result.linkSpeedMbps != null && <div><dt>Velocidade Wi-Fi</dt><dd>{result.linkSpeedMbps} Mbps</dd></div>}
                    {result.band && <div><dt>Frequência</dt><dd>{result.band}</dd></div>}
                    {result.channel != null && <div><dt>Canal</dt><dd>{result.channel}</dd></div>}
                    {result.gateway && <div><dt>Roteador</dt><dd>{result.gateway}</dd></div>}
                    {result.ipAddress && <div><dt>IP local</dt><dd>{result.ipAddress}</dd></div>}
                  </dl>

                  {result.channel != null && result.channelQuality && (
                    <div className="lk-local-wifi__channel">
                      <p className="lk-local-wifi__text">
                        Canal atual: <span className={`lk-local-wifi__channel-value lk-local-wifi__channel-value--${result.channelQuality}`}>{result.channel}</span>
                      </p>
                      <p className="lk-local-wifi__text">
                        Qualidade do canal: <span className={`lk-local-wifi__channel-value lk-local-wifi__channel-value--${result.channelQuality}`}>{channelQualityLabel[result.channelQuality]}</span>
                      </p>
                      {result.channelQuality === 'bad' && result.suggestedChannel != null && (
                        <p className="lk-local-wifi__text">Canal sugerido: {result.suggestedChannel}</p>
                      )}
                    </div>
                  )}

                  <h3 className="lk-local-wifi__subtitle">O que fazer agora</h3>
                  <p className="lk-local-wifi__text">{result.primaryAction}</p>

                  <h3 className="lk-local-wifi__subtitle">Limitações</h3>
                  <ul className="lk-local-wifi__limitations">
                    {result.limitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
