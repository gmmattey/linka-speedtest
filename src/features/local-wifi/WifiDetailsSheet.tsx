import { lazy, Suspense, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../../components/icons';
import { DraggableSheet } from '../../components/DraggableSheet';
import { InfoTooltip } from '../../components/InfoTooltip';
import type { WifiDiagnosticResult, WifiQuality } from './types';
import { ChannelQualityChart } from './ChannelQualityChart';
import { wifiQualityLabel } from './LocalWifiService';
import './WifiDetailsSheet.css';

// Code splitting (2026-05): WifiOptimizeSheet é um sub-sheet acionado
// pelo CTA "Como otimizar Wi-Fi". Carrega o chunk apenas quando o usuário
// pede o tutorial — o sheet pai não precisa do conteúdo da otimização
// para abrir.
const WifiOptimizeSheet = lazy(() =>
  import('./WifiOptimizeSheet').then((m) => ({ default: m.WifiOptimizeSheet })),
);

interface WifiDetailsSheetProps {
  isOpen: boolean;
  diagnostics: WifiDiagnosticResult;
  onClose: () => void;
}

/**
 * Bottom-sheet de detalhes Wi-Fi (refator "premium" 2026-05). Sai do dump
 * de dados em 4 dl/dt para uma estrutura hierárquica:
 *
 *   1. Hero verdict — ribbon colorido por severidade + ícone + verdict +
 *      sub-frase contextual.
 *   2. Métricas 2x2 — Sinal (cor por dBm), Velocidade do link (cor por
 *      Mbps), Banda, Canal.
 *   3. Visualização de canais — `ChannelQualityChart` quando há vizinhos;
 *      fallback "Canal X em <banda>" quando o scan não retornou nada.
 *   4. Recomendação inline — opcional. Aparece só quando há ação útil
 *      (canal alternativo mais limpo, sinal fraco, link speed abaixo do
 *      esperado).
 *   5. CTA pareado — "Como otimizar Wi-Fi" abre o `WifiOptimizeSheet`;
 *      "Fechar" dispensa o sheet.
 *
 * Toda a copy de qualidade vem do `wifiQualityLabel()` (LocalWifiService) —
 * não introduz strings em inglês ("Good") em parte alguma.
 *
 * Mantém o backdrop com `backdrop-filter: blur` herdado do bug de transparência
 * resolvido no primeiro APK.
 */
export function WifiDetailsSheet({
  isOpen,
  diagnostics,
  onClose,
}: WifiDetailsSheetProps) {
  const [optimizeOpen, setOptimizeOpen] = useState(false);

  // Body scroll lock + Esc + backdrop click são tratados pelo DraggableSheet —
  // não duplicamos aqui (refator 2026-05).

  const quality: WifiQuality = diagnostics.quality ?? 'unknown';
  const verdictLabel = wifiQualityLabel(quality);
  const ribbonColor = ribbonColorFor(quality);
  const tintBg = ribbonTintFor(quality);
  const subFrase = subFraseFor(diagnostics);

  const rssi = diagnostics.rssiDbm;
  const linkSpeed = diagnostics.linkSpeedMbps;
  const bandText = diagnostics.band === 'unknown' || !diagnostics.band ? '—' : diagnostics.band;
  const channel = diagnostics.channel != null ? String(diagnostics.channel) : '—';

  const recommendation = buildInlineRecommendation(diagnostics);

  return (
    <>
      <DraggableSheet
        open={isOpen}
        onClose={onClose}
        ariaLabelledBy="lk-wifi-sheet-title"
      >
        <div className="lk-wifi-sheet__inner">
          <header className="lk-wifi-sheet__header">
            <div className="lk-wifi-sheet__title-row">
              <h2 id="lk-wifi-sheet-title" className="lk-wifi-sheet__title">
                Detalhes do Wi-Fi
              </h2>
              <button
                className="lk-wifi-sheet__close"
                onClick={onClose}
                aria-label="Fechar detalhes"
                type="button"
              >
                <Icon name="close" size={16} color="var(--text-2)" />
              </button>
            </div>
          </header>

          <div className="lk-wifi-sheet__content">
            {/* 1. Hero verdict ──────────────────────────────────────── */}
            <section
              className="lk-wifi-sheet__hero"
              style={{ ['--ribbon-color' as never]: ribbonColor } as CSSProperties}
            >
              <div className="lk-wifi-sheet__hero-icon" style={{ background: tintBg, color: ribbonColor }}>
                <Icon name="wifi" size={26} color={ribbonColor} />
              </div>
              <div className="lk-wifi-sheet__hero-text">
                <p className="lk-wifi-sheet__hero-kicker">Estado do Wi-Fi</p>
                <p className="lk-wifi-sheet__hero-title">{verdictLabel}</p>
                {subFrase && <p className="lk-wifi-sheet__hero-sub">{subFrase}</p>}
              </div>
            </section>

            {/* 2. Métricas 2x2 ──────────────────────────────────────── */}
            <section className="lk-wifi-sheet__metrics" aria-label="Métricas Wi-Fi">
              <Metric
                label="Sinal"
                value={rssi != null ? `${rssi}` : '—'}
                unit={rssi != null ? 'dBm' : ''}
                accent={signalColor(rssi)}
                tooltip={
                  <InfoTooltip
                    label="RSSI: força do sinal Wi-Fi recebido pelo aparelho. Mais próximo de 0 é melhor. Acima de −60 dBm é forte; abaixo de −75 dBm já compromete a velocidade."
                    ariaLabel="O que é Sinal Wi-Fi (RSSI)"
                  />
                }
              />
              <Metric
                label="Velocidade do link"
                value={linkSpeed != null ? `${linkSpeed}` : '—'}
                unit={linkSpeed != null ? 'Mbps' : ''}
                accent={linkSpeedColor(linkSpeed)}
                tooltip={
                  <InfoTooltip
                    label="Taxa PHY negociada entre seu aparelho e o roteador. É o teto teórico da conexão Wi-Fi local — não da internet contratada."
                    ariaLabel="O que é Velocidade do link"
                  />
                }
              />
              <Metric
                label="Banda"
                value={bandText}
                unit=""
                tooltip={
                  <InfoTooltip
                    label="Frequência da rede. 2.4 GHz alcança mais longe mas é congestionado; 5 GHz é mais rápido e limpo, porém atravessa menos paredes."
                    ariaLabel="O que é Banda Wi-Fi"
                  />
                }
              />
              <Metric label="Canal" value={channel} unit="" />
            </section>

            {/* 3. Canais 5 GHz / 2.4 GHz na área ─────────────────────── */}
            {(diagnostics.nearbyNetworks?.length ?? 0) > 0 ? (
              <section className="lk-wifi-sheet__section">
                <header className="lk-wifi-sheet__section-head">
                  <h3 className="lk-wifi-sheet__section-title">
                    Canais {bandText} na área
                  </h3>
                  <span className="lk-wifi-sheet__section-count">
                    {diagnostics.nearbyNetworks!.length}{' '}
                    {diagnostics.nearbyNetworks!.length === 1 ? 'rede' : 'redes'}
                  </span>
                </header>
                <ChannelQualityChart
                  nearbyNetworks={diagnostics.nearbyNetworks}
                  currentChannel={diagnostics.channel}
                  currentBand={diagnostics.band}
                  suggestedChannel={diagnostics.suggestedChannel}
                  isLoading={false}
                />
              </section>
            ) : (
              <section className="lk-wifi-sheet__section lk-wifi-sheet__section--simple">
                <p className="lk-wifi-sheet__section-simple-label">Canal atual</p>
                <p className="lk-wifi-sheet__section-simple-value">
                  Canal {channel} ({bandText})
                </p>
                <p className="lk-wifi-sheet__section-simple-hint">
                  Lista de redes vizinhas indisponível neste aparelho.
                </p>
              </section>
            )}

            {/* 4. Recomendação inline (condicional) ──────────────────── */}
            {recommendation && (
              <aside className="lk-wifi-sheet__recommendation" role="note">
                <span className="lk-wifi-sheet__recommendation-icon" aria-hidden="true">
                  <Icon name="bulb" size={16} color="var(--accent)" />
                </span>
                <div className="lk-wifi-sheet__recommendation-body">
                  <p className="lk-wifi-sheet__recommendation-title">{recommendation.title}</p>
                  <p className="lk-wifi-sheet__recommendation-text">{recommendation.text}</p>
                </div>
              </aside>
            )}
          </div>

          {/* 5. CTA pareado ──────────────────────────────────────── */}
          <div className="lk-wifi-sheet__footer">
            <button
              type="button"
              className="lk-wifi-sheet__cta-primary"
              onClick={() => setOptimizeOpen(true)}
            >
              Como otimizar Wi-Fi
            </button>
            <button
              type="button"
              className="lk-wifi-sheet__cta-secondary"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </DraggableSheet>

      {optimizeOpen && (
        <Suspense fallback={null}>
          <WifiOptimizeSheet
            isOpen={optimizeOpen}
            onClose={() => setOptimizeOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

interface MetricProps {
  label: string;
  value: string;
  unit: string;
  accent?: 'good' | 'warn' | 'error' | undefined;
  /** Tooltip educacional opcional renderizado ao lado do label. */
  tooltip?: ReactNode;
}

function Metric({ label, value, unit, accent, tooltip }: MetricProps) {
  const accentClass = accent ? ` lk-wifi-sheet__metric--${accent}` : '';
  return (
    <div className={`lk-wifi-sheet__metric${accentClass}`}>
      <span className="lk-wifi-sheet__metric-label">
        {label}
        {tooltip}
      </span>
      <span className="lk-wifi-sheet__metric-value">
        {value}
        {unit && <span className="lk-wifi-sheet__metric-unit">{unit}</span>}
      </span>
    </div>
  );
}

// ── Helpers de cor/copy ────────────────────────────────────────────────

/**
 * Cor da ribbon e do hero por severidade. Usa as 5 grades canônicas do
 * `WifiQuality`. Tokens semânticos puxam o tema (dark/light) automaticamente.
 */
function ribbonColorFor(quality: WifiQuality): string {
  switch (quality) {
    case 'excellent':
    case 'good':      return 'var(--success)';
    case 'fair':      return 'var(--warn)';
    case 'weak':      return 'var(--warn)';
    case 'critical':  return 'var(--error)';
    case 'unknown':
    default:          return 'var(--text-3)';
  }
}

function ribbonTintFor(quality: WifiQuality): string {
  switch (quality) {
    case 'excellent':
    case 'good':      return 'rgba(52, 211, 153, 0.14)';
    case 'fair':
    case 'weak':      return 'rgba(251, 191, 36, 0.14)';
    case 'critical':  return 'rgba(248, 113, 113, 0.14)';
    case 'unknown':
    default:          return 'var(--surface-2)';
  }
}

/**
 * Sub-frase contextual abaixo do verdict. Mistura sinal + canal numa
 * descrição curta. Mantém pt-BR e tom objetivo.
 */
function subFraseFor(d: WifiDiagnosticResult): string {
  const q = d.quality ?? 'unknown';
  const ch = d.channelQuality;

  if (q === 'unknown') return 'Não foi possível avaliar o sinal.';

  const sinal =
    q === 'excellent' ? 'Sinal forte' :
    q === 'good'      ? 'Sinal bom' :
    q === 'fair'      ? 'Sinal médio' :
    q === 'weak'      ? 'Sinal fraco' :
                        'Sinal crítico';

  const canal =
    ch === 'good'   ? 'canal limpo' :
    ch === 'medium' ? 'canal aceitável' :
    ch === 'bad'    ? 'canal congestionado' :
                      undefined;

  return canal ? `${sinal}, ${canal}` : `${sinal}.`;
}

function signalColor(rssiDbm?: number): 'good' | 'warn' | 'error' | undefined {
  if (rssiDbm == null) return undefined;
  if (rssiDbm >= -60) return 'good';
  if (rssiDbm >= -75) return 'warn';
  return 'error';
}

function linkSpeedColor(mbps?: number): 'good' | 'warn' | 'error' | undefined {
  if (mbps == null) return undefined;
  if (mbps < 10) return 'error';
  if (mbps < 30) return 'warn';
  return undefined;
}

interface InlineRecommendation {
  title: string;
  text: string;
}

/**
 * Decide se há uma ação útil para mostrar inline. Ordem de prioridade:
 *  1. Canal alternativo mais limpo (`channelQuality === 'bad'` + sugestão).
 *  2. Sinal fraco/crítico — sugere aproximar ou trocar pra 2.4 GHz.
 *  3. Link speed bem abaixo do esperado pra banda — sugere checar padrão Wi-Fi.
 * Retorna `null` quando não há ação relevante (Wi-Fi saudável).
 */
function buildInlineRecommendation(d: WifiDiagnosticResult): InlineRecommendation | null {
  // 1. Canal melhor disponível
  if (d.channelQuality === 'bad' && d.suggestedChannel != null && d.suggestedChannel !== d.channel) {
    return {
      title: `Canal ${d.suggestedChannel} está mais limpo`,
      text: 'Pode reduzir interferência se você trocar nas configurações do roteador.',
    };
  }

  // 2. Sinal fraco
  if (d.quality === 'weak' || d.quality === 'critical') {
    const naoEh24 = d.band !== '2.4GHz';
    return {
      title: 'Sinal fraco neste local',
      text: naoEh24
        ? 'Aproxime-se do roteador ou troque para a rede 2.4 GHz, que alcança mais.'
        : 'Aproxime-se do roteador para melhorar o sinal.',
    };
  }

  // 3. Link speed muito abaixo da capacidade da banda
  if (d.linkSpeedMbps != null && d.band === '5GHz' && d.linkSpeedMbps < 100) {
    return {
      title: 'Velocidade abaixo do esperado',
      text: 'Verifique se o roteador suporta padrão ax (Wi-Fi 6) ou ac (Wi-Fi 5).',
    };
  }
  if (d.linkSpeedMbps != null && d.band === '2.4GHz' && d.linkSpeedMbps < 30) {
    return {
      title: 'Velocidade abaixo do esperado',
      text: 'Em 2.4 GHz, paredes e interferência reduzem a taxa. Considere trocar para 5 GHz.',
    };
  }

  return null;
}
