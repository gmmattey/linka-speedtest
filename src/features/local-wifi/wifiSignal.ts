/**
 * Helpers de sinal Wi-Fi para a representação compacta no card unificado de
 * resultado (`WifiSignalBar`). Separados do `LocalWifiService.ts` porque a
 * conversão dBm→percentual e o threshold visual da barra (good/warn/bad) são
 * preocupação puramente de UI — diferente do `classifyWifiQuality` (que mistura
 * sinal, link speed e banda para decidir o copy técnico).
 *
 * Não substitui `classifyWifiQuality`: aquele continua sendo a fonte de
 * verdade para o copy do diagnóstico Wi-Fi local. Este módulo cobre apenas a
 * barra horizontal mostrada no card unificado da `ResultScreen`.
 */

/**
 * Converte RSSI (dBm) em percentual 0–100, clamped, usando a fórmula linear
 * padrão `2 * (rssi + 100)`.
 *
 * Mapeamento de referência:
 * - -100 dBm → 0%
 * - -75 dBm  → 50%
 * - -50 dBm  → 100%
 * - valores acima de -50 dBm são clamped a 100% (não há ganho perceptível).
 *
 * Retorna `null` se `rssiDbm` for `null`/`undefined` para que o consumidor
 * escolha o fallback (ex.: não renderizar a barra).
 */
export function rssiToPercent(rssiDbm: number | null | undefined): number | null {
  if (rssiDbm == null) return null;
  return Math.max(0, Math.min(100, Math.round(2 * (rssiDbm + 100))));
}

/**
 * Mapeia o percentual da barra Wi-Fi em uma classe de cor visual:
 * - `good` (≥80%): `var(--success)` — verde
 * - `warn` (50–79%): `var(--warn)` — amarelo
 * - `bad`  (<50%): `var(--error)` — vermelho
 *
 * Não confunde com `WifiQuality` ('excellent'|'good'|'fair'|'weak'|'critical')
 * — aquela é técnica, esta é puramente visual e tem só 3 níveis para casar com
 * a paleta semântica usada nas demais barras do app.
 */
export type WifiSignalColor = 'good' | 'warn' | 'bad';

export function signalQualityColor(pct: number): WifiSignalColor {
  if (pct >= 80) return 'good';
  if (pct >= 50) return 'warn';
  return 'bad';
}
