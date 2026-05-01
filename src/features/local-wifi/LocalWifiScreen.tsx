import { getCapabilities } from '../../platform/capabilities';
import { useLocalWifi } from './useLocalWifi';
import './LocalWifiScreen.css';

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

  return (
    <div className="lk-local-wifi">
      <div className="lk-local-wifi__head">
        <button className="lk-local-wifi__back" onClick={onBack}>‹ Explorar</button>
        <span className="lk-local-wifi__head-label">Diagnóstico Wi-Fi</span>
        <span aria-hidden="true" />
      </div>

      <div className="lk-local-wifi__scroll">
        <div className="lk-local-wifi__card">
          {!localWifiDiagnostics ? (
            <>
              <p className="lk-local-wifi__text">Diagnóstico Wi-Fi indisponível no PWA.</p>
              <p className="lk-local-wifi__text">
                Este recurso usa dados do sistema disponíveis apenas no app nativo.
              </p>
            </>
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
                    <div><dt>Qualidade</dt><dd>{result.quality ?? 'unknown'}</dd></div>
                    {result.ssid && <div><dt>SSID</dt><dd>{result.ssid}</dd></div>}
                    {result.rssiDbm != null && <div><dt>Sinal</dt><dd>{result.rssiDbm} dBm</dd></div>}
                    {result.linkSpeedMbps != null && <div><dt>Velocidade negociada</dt><dd>{result.linkSpeedMbps} Mbps</dd></div>}
                    {result.band && <div><dt>Banda</dt><dd>{result.band}</dd></div>}
                    {result.channel != null && <div><dt>Canal</dt><dd>{result.channel}</dd></div>}
                    {result.gateway && <div><dt>Gateway</dt><dd>{result.gateway}</dd></div>}
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
