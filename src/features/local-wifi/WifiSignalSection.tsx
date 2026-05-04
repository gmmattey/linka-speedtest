import { lazy, Suspense, useState } from 'react';
import { useWifiDiagnostics } from './useWifiDiagnostics';
import { WifiSignalBar } from './WifiSignalBar';
import { Skeleton } from '../../components/Skeleton';
import type { ConnectionType } from '../../types';
import './WifiSignalSection.css';

// Code splitting (2026-05): a `WifiDetailsSheet` (com `ChannelQualityChart`
// e o tutorial WifiOptimizeSheet aninhado) só é necessária quando o
// usuário toca no `<WifiSignalBar>`. Lazy + montagem condicional descem
// o chunk só no primeiro click.
const WifiDetailsSheet = lazy(() =>
  import('./WifiDetailsSheet').then((m) => ({ default: m.WifiDetailsSheet })),
);

/**
 * Orquestra a seção Wi-Fi do card unificado da `ResultScreen` (refator
 * 2026-05).
 *
 * Substitui o antigo `<WifiSignalCard>` (4 cells: SSID + chip canal + WiFi
 * std) na representação INLINE do card unificado por uma barra horizontal
 * de qualidade do sinal — `<WifiSignalBar>`. A `WifiDetailsSheet` (popup
 * com os 4 dados completos) continua disponível ao clicar.
 *
 * Estados:
 *   - loading            → placeholder discreto.
 *   - permission-denied  → mensagem específica orientando habilitar
 *                          permissão de localização.
 *   - unavailable / sem rssiDbm → fallback "detalhes só no app instalado".
 *   - available + rssiDbm → `<WifiSignalBar>` clicável (abre a sheet).
 *
 * Não confunde com o antigo `WifiSignalCard.tsx` — aquele componente
 * permanece preservado (sem usos atuais conhecidos) caso outra superfície
 * decida reaproveitá-lo no futuro.
 */
interface Props {
  /**
   * Tipo de conexão atual. Usado como guarda defensiva — quando não-wifi
   * o componente nem renderiza nem tenta consumir o bridge nativo de
   * Wi-Fi. Bug-fix 2026-05: callers já validavam, mas adicionamos a
   * dupla checagem aqui para impedir vazamento de recomendações de
   * Wi-Fi quando o usuário troca de rede mid-test.
   */
  connectionType?: ConnectionType | null;
}

export function WifiSignalSection({ connectionType = 'wifi' }: Props = {}) {
  // Hooks SEM condicional (regra do React). A guarda defensiva contra
  // não-wifi acontece DEPOIS do hook — se o componente for montado fora
  // de Wi-Fi, ele simplesmente não renderiza nada.
  const state = useWifiDiagnostics();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Bug-fix 2026-05 (suprime Wi-Fi em não-wifi): defensive guard. O
  // ResultScreen já condiciona o mount em `connectionType === 'wifi'`,
  // mas se outro caller esquecer da regra, o componente devolve null em
  // vez de renderizar diagnóstico/recomendações Wi-Fi sobre uma conexão
  // móvel/cabo.
  if (connectionType !== 'wifi') return null;

  if (state.status === 'loading') {
    // Skeleton (2026-05): substitui "Lendo informações do Wi-Fi…" por
    // placeholders visuais — header label, linha SSID e barra de sinal.
    // Estrutura paralela ao shape de "available" para evitar pulo
    // perceptível quando o estado virar bar real.
    return (
      <section
        className="lk-wifi-section lk-wifi-section--placeholder"
        aria-label="Wi-Fi"
        aria-busy="true"
      >
        <div className="lk-wifi-section__skeleton-row">
          <Skeleton width={40} height={12} variant="pill" />
        </div>
        <div className="lk-wifi-section__skeleton-row">
          <Skeleton width={120} height={16} variant="pill" />
        </div>
        <div className="lk-wifi-section__skeleton-row">
          <Skeleton width="100%" height={8} variant="rect" />
        </div>
      </section>
    );
  }

  if (state.status === 'permission-denied') {
    return (
      <section className="lk-wifi-section lk-wifi-section--warn" aria-label="Wi-Fi">
        <p className="lk-wifi-section__kicker">Wi-Fi</p>
        <p className="lk-wifi-section__msg lk-wifi-section__msg--warn">
          Permissão de localização necessária para diagnóstico Wi-Fi.
          Habilite nas configurações do app.
        </p>
      </section>
    );
  }

  // unavailable / sem dados / sem rssiDbm: fallback informativo único.
  if (state.status === 'unavailable' || !state.data || state.data.rssiDbm == null) {
    return (
      <section className="lk-wifi-section lk-wifi-section--unavailable" aria-label="Wi-Fi">
        <p className="lk-wifi-section__kicker">Wi-Fi</p>
        <p className="lk-wifi-section__msg">
          Wi-Fi: detalhes disponíveis somente no app instalado.
        </p>
      </section>
    );
  }

  return (
    <>
      <WifiSignalBar
        rssiDbm={state.data.rssiDbm}
        ssid={state.data.ssid ?? null}
        channel={state.data.channel ?? null}
        onClick={() => setIsDetailsOpen(true)}
      />
      {isDetailsOpen && (
        <Suspense fallback={null}>
          <WifiDetailsSheet
            isOpen
            diagnostics={state.data}
            onClose={() => setIsDetailsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
