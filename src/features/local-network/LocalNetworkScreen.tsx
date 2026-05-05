import { IOSList } from '../../components/IOSList';
import { PageHeader } from '../../components/PageHeader';
import { TopBar } from '../../components/TopBar';
import { Icon } from '../../components/icons';
import { useScrollHeader } from '../../hooks/useScrollHeader';
import { getCapabilities } from '../../platform/capabilities';
import { confidenceLabel, kindLabel, nameSourceLabel } from './LocalNetworkService';
import { useLocalNetworkDiscovery } from './useLocalNetworkDiscovery';
import './LocalNetworkScreen.css';

interface Props {
  onBack: () => void;
}

export function LocalNetworkScreen({ onBack }: Props) {
  const { localNetworkDiscovery } = getCapabilities();
  const { loading, result, error, run } = useLocalNetworkDiscovery();
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  return (
    <div className="lk-local-network">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        title="Dispositivos na rede"
        showTitle={scrolled}
      />

      <div className="lk-local-network__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Dispositivos na rede" />

        <div className="lk-local-network__card">
          {!localNetworkDiscovery ? (
            <>
              <p className="lk-local-network__text">Descoberta de dispositivos indisponível no PWA.</p>
              <p className="lk-local-network__text">
                Este recurso precisa do app nativo para acessar a rede local com transparência.
              </p>
            </>
          ) : (
            <>
              <p className="lk-local-network__text">
                A linka cruza sinais da rede local para identificar dispositivos. Quando o nome não for confiável,
                mostramos a origem da evidência.
              </p>

              <button className="btn-primary" onClick={() => void run()} disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar dispositivos'}
              </button>

              {error && <p className="lk-local-network__error">{error}</p>}

              {result && (
                <div className="lk-local-network__result">
                  <div className="lk-local-network__summary">
                    <span>{result.devices.length} dispositivos</span>
                    <span>{result.observationCount} evidências</span>
                  </div>

                  {result.devices.length === 0 ? (
                    <p className="lk-local-network__text">
                      Nenhum dispositivo foi identificado agora. Alguns aparelhos bloqueiam resposta local ou dormem fora de uso.
                    </p>
                  ) : (
                    <IOSList
                      items={result.devices.map((device) => ({
                        icon: <Icon name="wifi" size={14} color="#fff" />,
                        iconBg: 'var(--accent)',
                        title: device.displayName,
                        subtitle: [
                          device.ip,
                          device.mac ? device.mac : undefined,
                          kindLabel(device.kind),
                        ].filter(Boolean).join(' · '),
                        trailing: (
                          <span className={`lk-local-network__confidence lk-local-network__confidence--${device.confidence}`}>
                            {confidenceLabel(device.confidence)}
                          </span>
                        ),
                        titleAfter: (
                          <span className="lk-local-network__source">
                            {nameSourceLabel(device.nameSource)}
                          </span>
                        ),
                      }))}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
