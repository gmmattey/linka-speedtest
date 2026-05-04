import './PullToRefreshIndicator.css';

/**
 * PullToRefreshIndicator — feedback visual do gesto pull-to-refresh.
 *
 * Estados:
 *  - `pullDistance < threshold`: opacity proporcional ao progresso, arco do
 *    spinner cresce conforme o usuário puxa (acompanhamento progressivo).
 *  - `pullDistance ≥ threshold` (`isReady`): opacity 1, spinner fica firme
 *    (cor accent saturada).
 *  - `isRefreshing`: spinner gira (animação CSS contínua).
 *
 * Posicionamento: `position: fixed` no topo da viewport, abaixo do TopBar
 * (via `top: calc(var(--safe-top) + 56px)`). O indicador entra
 * "deslizando" de cima junto com o dedo: a transform translateY vai de
 * `-(altura)` (escondido) até `pullDistance px` (acompanha o dedo). Sem
 * box-shadow (regra do projeto) — usa `border` + `var(--surface-deep)` para
 * separar visualmente do conteúdo.
 *
 * Acessibilidade: respeita `prefers-reduced-motion: reduce`. Sem rotação
 * contínua durante refresh; o spinner aparece estático e o `aria-live`
 * comunica "Atualizando…" para screen readers.
 */

interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  isReady: boolean;
  threshold?: number;
}

const DEFAULT_THRESHOLD = 80;
const PILL_HEIGHT = 36; // px — altura do pill (deve casar com .lk-ptr no CSS)

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isReady,
  threshold = DEFAULT_THRESHOLD,
}: Props) {
  // Quando o pill está "escondido" (sem pull e sem refresh), evita render
  // até iniciar — tira do tab order e do paint quando inativo.
  const inactive = !isRefreshing && pullDistance <= 0;

  // Visual pull: quando refrescando, mantém o pill na posição "ready"
  // independente do dedo (que já soltou). Cap para não esticar infinito
  // se o usuário arrastar muito além do threshold.
  const visualPull = isRefreshing
    ? threshold
    : Math.min(pullDistance, threshold * 1.6);

  // translateY: começa em -(PILL_HEIGHT + 8px) (escondido acima do TopBar
  // virtual) e segue o dedo. +8 dá margem entre o TopBar e o pill quando
  // visível (sem cobrir o título).
  const translateY = visualPull - (PILL_HEIGHT + 8);

  const opacity = isRefreshing ? 1 : Math.min(1, pullDistance / threshold);

  // Pre-refresh: arco do spinner cresce com o pull. 0% → arco vazio,
  // 100% (threshold) → 270° de arco. Após threshold, mantém em 270°.
  const progress = Math.min(1, pullDistance / threshold);
  const arcDegrees = progress * 270;

  // SVG — círculo de raio 9 (diâmetro 18) centralizado em 12,12.
  // Perímetro = 2π × 9 ≈ 56.55. dasharray total = perímetro.
  // dashoffset controla quanto do arco está visível.
  const PERIMETER = 2 * Math.PI * 9;
  const arcLength = (arcDegrees / 360) * PERIMETER;
  const dashOffset = PERIMETER - arcLength;

  return (
    <div
      className={`lk-ptr${isReady ? ' lk-ptr--ready' : ''}${isRefreshing ? ' lk-ptr--refreshing' : ''}`}
      style={{
        transform: `translate(-50%, ${translateY}px)`,
        opacity,
        // Quando inativo (sem pull, sem refresh), o snap-back do touchend
        // já reseta `pullDistance` — animar a transform do pull-back via
        // CSS transition. Durante o pull, a transição é desligada (segue
        // o dedo em tempo real).
        transition: inactive || isRefreshing
          ? 'transform var(--t-med), opacity var(--t-fast)'
          : 'none',
        pointerEvents: 'none',
      }}
      role="status"
      aria-live="polite"
      aria-hidden={inactive}
    >
      {isRefreshing ? (
        <svg
          className="lk-ptr__spinner lk-ptr__spinner--refreshing"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={PERIMETER}
            strokeDashoffset={PERIMETER * 0.25}
          />
        </svg>
      ) : (
        <svg
          className="lk-ptr__spinner"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={PERIMETER}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 12 12)"
            style={{ transition: 'stroke-dashoffset var(--t-fast)' }}
          />
        </svg>
      )}
      <span className="lk-ptr__sr-only">
        {isRefreshing ? 'Atualizando' : isReady ? 'Solte para atualizar' : 'Puxe para atualizar'}
      </span>
    </div>
  );
}
