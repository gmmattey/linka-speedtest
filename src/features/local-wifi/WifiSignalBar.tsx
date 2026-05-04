import { useEffect, useState } from 'react';
import { Icon } from '../../components/icons';
import { rssiToPercent, signalQualityColor } from './wifiSignal';
import './WifiSignalBar.css';

/**
 * Representação compacta do Wi-Fi no card unificado da `ResultScreen`.
 *
 * Layout:
 *   [WI-FI]                                            [ícone]
 *   SSID · Canal X
 *   [████████░░░░░░░] 72%
 *
 * Substitui o `<WifiSignalCard>` de 4 cells (SSID + chip canal + WiFi std)
 * INLINE no card de resultado. A `<WifiDetailsSheet>` (clicar para detalhes)
 * continua mostrando os 4 dados completos quando aberta — esta barra é
 * apenas a representação resumida.
 *
 * Animação: barra anima de 0 ao percentual final em 600ms cubic-bezier(.2,.7,
 * .2,1) no mount. `prefers-reduced-motion: reduce` desliga a transição. O %
 * numérico animado é deixado fora — o número se cristaliza no valor final
 * desde o 1º frame para evitar a leitura "12% → 72%" enquanto a barra ainda
 * desliza (acessibilidade: lê o número certo se o usuário pausar a animação).
 */
interface Props {
  rssiDbm: number;
  ssid?: string | null;
  channel?: number | null;
  /**
   * Handler de clique opcional — quando definido, a row inteira vira
   * `<button>` clicável (mesmo padrão do antigo `WifiSignalCard`) para abrir
   * a `WifiDetailsSheet`. Sem o handler, vira uma `<div>` estática.
   */
  onClick?: () => void;
}

export function WifiSignalBar({ rssiDbm, ssid, channel, onClick }: Props) {
  const finalPct = rssiToPercent(rssiDbm) ?? 0;
  const color = signalQualityColor(finalPct);

  // SSID pode vir vazio em Android 13+ sem NEARBY_WIFI_DEVICES; usamos "Sua
  // rede" como fallback neutro — paridade com o WifiSignalCard antigo.
  const ssidLabel = ssid && ssid.trim() ? ssid : 'Sua rede';
  const channelLabel = channel != null ? `Canal ${channel}` : null;

  // Mount com width=0 e, no próximo frame, atualiza para o valor real — a
  // CSS transition no `width` cuida da animação. requestAnimationFrame
  // garante que o browser paint o estado inicial 0 antes da troca.
  const [renderedPct, setRenderedPct] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setRenderedPct(finalPct));
    return () => cancelAnimationFrame(raf);
  }, [finalPct]);

  const ariaLabel = `Wi-Fi ${ssidLabel}${channelLabel ? `, ${channelLabel}` : ''}, sinal ${finalPct}%`;

  const content = (
    <>
      <div className="lk-wifi-signal-bar__header">
        <span className="lk-wifi-signal-bar__kicker">Wi-Fi</span>
        <span className="lk-wifi-signal-bar__icon" aria-hidden="true">
          <Icon name="wifi" size={14} color="var(--text-3)" />
        </span>
      </div>

      <div className="lk-wifi-signal-bar__info">
        <span className="lk-wifi-signal-bar__ssid">{ssidLabel}</span>
        {channelLabel && (
          <>
            <span className="lk-wifi-signal-bar__sep" aria-hidden="true">·</span>
            <span className="lk-wifi-signal-bar__channel">{channelLabel}</span>
          </>
        )}
      </div>

      <div className="lk-wifi-signal-bar__row">
        <div className="lk-wifi-signal-bar__bar" role="progressbar" aria-valuenow={finalPct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`lk-wifi-signal-bar__fill lk-wifi-signal-bar__fill--${color}`}
            style={{ width: `${renderedPct}%` }}
          />
        </div>
        <span className={`lk-wifi-signal-bar__pct lk-wifi-signal-bar__pct--${color}`}>
          {finalPct}%
        </span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="lk-wifi-signal-bar lk-wifi-signal-bar--clickable"
        onClick={onClick}
        aria-label={`${ariaLabel}. Clique para detalhes`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="lk-wifi-signal-bar" aria-label={ariaLabel}>
      {content}
    </div>
  );
}
