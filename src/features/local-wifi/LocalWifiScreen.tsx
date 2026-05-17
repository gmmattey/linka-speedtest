import { useState } from 'react';
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

interface NetworkConnection {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

function getNetworkConnection(): NetworkConnection | null {
  const nav = navigator as Navigator & { connection?: NetworkConnection };
  return nav.connection ?? null;
}

function effectiveTypeLabel(et: string | undefined): string {
  switch (et) {
    case '4g': return '4G';
    case '3g': return '3G';
    case '2g': return '2G';
    case 'slow-2g': return '2G (lento)';
    default: return 'Desconhecido';
  }
}

function connectionTypeLabel(type: string | undefined): string {
  switch (type) {
    case 'wifi': return 'Wi-Fi';
    case 'cellular': return 'Dados móveis';
    case 'ethernet': return 'Cabo (Ethernet)';
    case 'bluetooth': return 'Bluetooth';
    case 'none': return 'Sem conexão';
    default: return 'Desconhecido';
  }
}

interface Props {
  onBack: () => void;
}

type Tab = 'wifi' | 'celulas';

export function LocalWifiScreen({ onBack }: Props) {
  const { localWifiDiagnostics } = getCapabilities();
  const { loading, result, error, run } = useLocalWifi();
  const [activeTab, setActiveTab] = useState<Tab>('wifi');
  const channelQualityLabel: Record<'good' | 'medium' | 'bad', string> = {
    good: 'bom',
    medium: 'médio',
    bad: 'ruim',
  };

  const { scrolled, topBarOpacity, scrollContainerRef, sentinelRef } = useScrollHeader();
  const conn = getNetworkConnection();

  return (
    <div className="lk-local-wifi">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        opacity={topBarOpacity}
        title="Sinal"
        showTitle={true}
      />

      <div className="lk-local-wifi__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Sinal" />

        <div className="lk-local-wifi__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'wifi'}
            className={`lk-local-wifi__tab${activeTab === 'wifi' ? ' lk-local-wifi__tab--active' : ''}`}
            onClick={() => setActiveTab('wifi')}
          >
            Wi-Fi
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'celulas'}
            className={`lk-local-wifi__tab${activeTab === 'celulas' ? ' lk-local-wifi__tab--active' : ''}`}
            onClick={() => setActiveTab('celulas')}
          >
            Células
          </button>
        </div>

        {activeTab === 'wifi' && (
          <div className="lk-local-wifi__card">
            {!localWifiDiagnostics ? (
              <div className="lk-local-wifi__browser-fallback">
                <span className="material-symbols-rounded lk-local-wifi__fallback-icon">wifi_find</span>
                <p className="lk-local-wifi__text lk-local-wifi__text--primary">
                  Análise de sinal Wi-Fi indisponível no navegador
                </p>
                <p className="lk-local-wifi__text">
                  Browsers não expõem dados de canal, frequência, RSSI nem redes vizinhas por privacidade.
                  O app Android acessa essas informações diretamente do sistema.
                </p>
                {conn && (conn.type || conn.downlink != null || conn.rtt != null) && (
                  <dl className="lk-local-wifi__list lk-local-wifi__list--browser">
                    {conn.type && (
                      <div>
                        <dt>Tipo de conexão</dt>
                        <dd>{connectionTypeLabel(conn.type)}</dd>
                      </div>
                    )}
                    {conn.downlink != null && (
                      <div>
                        <dt>Velocidade estimada</dt>
                        <dd>{conn.downlink} Mbps</dd>
                      </div>
                    )}
                    {conn.rtt != null && (
                      <div>
                        <dt>Latência estimada</dt>
                        <dd>{conn.rtt} ms</dd>
                      </div>
                    )}
                  </dl>
                )}
                <div className="lk-local-wifi__android-cta">
                  <span className="material-symbols-rounded">android</span>
                  <p className="lk-local-wifi__text">
                    Use o <strong>app linka para Android</strong> para ver canal, redes vizinhas, RSSI e qualidade de sinal em tempo real.
                  </p>
                </div>
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
        )}

        {activeTab === 'celulas' && (
          <div className="lk-local-wifi__card">
            <div className="lk-local-wifi__browser-fallback">
              <span className="material-symbols-rounded lk-local-wifi__fallback-icon">cell_tower</span>
              <p className="lk-local-wifi__text lk-local-wifi__text--primary">
                Dados de sinal celular limitados no navegador
              </p>
              <p className="lk-local-wifi__text">
                O navegador não expõe RSRP, RSRQ, SINR nem identificação de torre. Disponível apenas no app Android.
              </p>
              {conn ? (
                <dl className="lk-local-wifi__list lk-local-wifi__list--browser">
                  {conn.effectiveType && (
                    <div>
                      <dt>Tipo de rede</dt>
                      <dd>{effectiveTypeLabel(conn.effectiveType)}</dd>
                    </div>
                  )}
                  {conn.downlink != null && (
                    <div>
                      <dt>Velocidade estimada</dt>
                      <dd>{conn.downlink} Mbps</dd>
                    </div>
                  )}
                  {conn.rtt != null && (
                    <div>
                      <dt>Latência estimada</dt>
                      <dd>{conn.rtt} ms</dd>
                    </div>
                  )}
                  {conn.saveData != null && (
                    <div>
                      <dt>Economia de dados</dt>
                      <dd>{conn.saveData ? 'Ativado' : 'Desativado'}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="lk-local-wifi__text">
                  API de conexão não disponível neste navegador.
                </p>
              )}
              <div className="lk-local-wifi__android-cta">
                <span className="material-symbols-rounded">android</span>
                <p className="lk-local-wifi__text">
                  Use o <strong>app linka para Android</strong> para ver tipo de rede, força do sinal celular, SINR e operadora.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
