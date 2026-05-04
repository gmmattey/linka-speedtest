import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import { HamburgerMenu, HamburgerMenuIcon } from '../components/HamburgerMenu';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import { generateShareCard } from '../utils/shareCard';
import { buildShareText, shareResultText } from '../utils/share';
import type { Quality, ServerInfo, SpeedTestResult, TestRecord } from '../types';
import { interpretSpeedTestResult, resolveCopy, useCaseGrade, type UseCaseGrade } from '../core';

import type { UseCaseId } from '../core';
import { loadHistory } from '../utils/history';
import { formatMbps, formatMs } from '../utils/format';
import { formatRelativeTime } from '../utils/relativeTime';
import { useCountUp } from '../hooks/useCountUp';
import type { ConnectionType, GamingProfile } from '../types';
import './ResultScreen.css';
import { combineDiagnostics } from '../utils/combinedDiagnosis';
import { toConnectionProfile } from '../utils/connectionProfile';
import { anatelGrade, anatelGradeColorVar, anatelGradeGlowVar } from '../utils/anatelColor';
import { classifyDnsLatency } from '../utils/dnsTiming';
import { aggregateDiagnosisSeverity, buildDiagnosisItems, type DiagnosisAggregate, type DiagnosisItem } from '../utils/diagnosisItems';
import { WifiSignalCard } from '../features/local-wifi/WifiSignalCard';
import { DNSGuideSheet } from '../features/dns/DNSGuideSheet';
import { AdvancedSheet } from '../features/result-detail/AdvancedSheet';
import { GamerSheet } from '../features/result-detail/GamerSheet';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  result: SpeedTestResult;
  server: ServerInfo | null;
  previous: TestRecord | null;
  onRetry: () => void;
  /**
   * Handler do back da TopBar — vai para a tela inicial de medição.
   * Antes (Bloco 5) o back ia para o Histórico; movemos o Histórico para
   * a tela "Explorar" e o back voltou ao papel natural de "voltar para
   * a entrada do app", deixando a header do resultado mais limpa.
   */
  onBack: () => void;
  /**
   * Refator 2026-05: Diagnóstico, Recomendações, Detalhes e Modo Gamer
   * deixaram de ser navegação. Diagnóstico virou o card unificado da
   * ResultScreen (com 2 estados); os demais viraram accordions na seção
   * "Mais detalhes". Apenas `onExplore` (link para a tela "Explorar")
   * sobrevive como navegação.
   */
  onExplore?: () => void;
  onStartRoomTest?: () => void;
  unit?: 'mbps' | 'gbps';
  hideIpOnShare?: boolean;
  gamingProfile?: GamingProfile;
  connectionType?: ConnectionType | null;
  contractedDown?: number | null;
  contractedUp?: number | null;
  onUpdateContracted?: (down: number | null, up: number | null) => void;
  // Bloco 3 (Polimento, 2026-05): toggle de haptics no HamburgerMenu.
  useHaptics?: boolean;
  onToggleHaptics?: (next: boolean) => void;
}

type ShareStatus = 'idle' | 'copied';

/** Sheets de "Mais detalhes" — só uma aberta por vez (refator drag-to-resize 2026-05). */
type ActiveSheet = 'advanced' | 'gamer' | 'dns' | null;

function ucIcon(id: UseCaseId): string {
  if (id === 'gaming')       return 'game';
  if (id === 'streaming_4k') return 'stream';
  if (id === 'home_office')  return 'work';
  return 'videoCall';
}

function ucLabel(id: UseCaseId): string {
  // Versão curta — cabe abaixo do ícone do use case.
  return resolveCopy(`useCase.${id}.label.short`);
}

// =============================================================================
// Grade A-F — estilo + label
// =============================================================================
// Migrado de "por métrica" para "por use case" no refactor visual de 2026-05.
// As cores vêm das CSS vars `--grade-a..f`; o background segue a paleta
// good/warn/bad já estabelecida.

function gradeLabel(g: UseCaseGrade): string {
  const map: Record<UseCaseGrade, string> = {
    A: 'Excelente',
    B: 'Bom',
    C: 'Regular',
    D: 'Ruim',
    F: 'Crítico',
  };
  return map[g];
}

function gradeStyle(g: UseCaseGrade): { background: string; color: string } {
  const lower = g.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'f';
  const bg = (g === 'A' || g === 'B') ? 'var(--color-good-bg)'
           : g === 'C' ? 'var(--color-warn-bg)'
           : 'var(--color-bad-bg)';
  return { background: bg, color: `var(--grade-${lower})` };
}

// =============================================================================
// Verdict label (pacote premium 2026-05, refatorado 2026-05) — mapping de
// Quality → texto curto. Texto continua sendo necessário para `aria-label`
// e `sr-only` do card unificado (chip flutuante foi removido — verdict
// virou ribbon visual de 3px). Mantemos mapa local enxuto porque
// `copyDictionary.ts` é zona "não tocar" e não expõe `quality.<X>.adj`.
// =============================================================================

function verdictLabel(q: Quality): string {
  const map: Record<Quality, string> = {
    excellent:   'Excelente',
    good:        'Boa',
    fair:        'Aceitável',
    slow:        'Lenta',
    unavailable: 'Sem conexão',
  };
  return map[q];
}

// =============================================================================
// Ribbon do card unificado de teste (refactor 2026-05).
// =============================================================================
// Substitui o chip flutuante "Aceitável/Boa/Lenta" por uma faixa colorida de
// 3px no topo do `.lk-result__test-card`. Decisão de cor: tokens cheios
// (`--success / --warn / --error`) e não os `--color-*-bg` (alpha 0.08-0.10
// é invisível numa faixa de 3px). Mesma semântica de quality que o antigo
// `verdictStyle()` usava para tingir o chip.
function qualityRibbonColor(q: Quality): string {
  if (q === 'excellent' || q === 'good') return 'var(--success)';
  if (q === 'fair')                       return 'var(--warn)';
  // slow / unavailable
  return 'var(--error)';
}

// =============================================================================
// DiagnosticActionList — estado "com ação" do card de Diagnóstico (2026-05).
// =============================================================================
// Render auxiliar isolado para manter o JSX da ResultScreen legível. Recebe
// itens já priorizados por `buildDiagnosisItems()` e mostra no máximo 3
// visíveis; um botão "Ver mais N" alterna a exibição dos restantes inline.
//
// Quando a lista de items vier vazia (combined diagnostico ≠ healthy mas
// nenhuma métrica individual disparou) caímos no `fallbackTitle`/`fallbackAction`
// — preserva a antiga UX de "kicker + título + ação primária" para causas
// em que a lista por métrica não tem o que dizer (ex.: combined.cause =
// 'mobile_signal_risk' com métricas todas verdes).

const SEVERITY_COLOR: Record<DiagnosisItem['severity'], string> = {
  fail: 'var(--error)',
  warn: 'var(--warn)',
};

const SEVERITY_BG: Record<DiagnosisItem['severity'], string> = {
  fail: 'var(--color-bad-bg)',
  warn: 'var(--color-warn-bg)',
};

// =============================================================================
// Glow do card de Diagnóstico (refator 2026-05).
// =============================================================================
// Mapping da severidade agregada (`aggregateDiagnosisSeverity`) para o token
// de glow que será aplicado como `--diag-glow-color` inline no contêiner
// `.lk-result__combined`. A animação `lk-result-diag-glow` (CSS) lê essa
// var e pulsa entre 24px e 32px de blur — a cor é o único delta entre os
// 3 estados visuais.
const SEVERITY_GLOW: Record<DiagnosisAggregate, string> = {
  healthy: 'var(--success-glow)',
  warn:    'var(--warn-glow)',
  fail:    'var(--error-glow)',
};

function DiagnosticActionList({
  items,
  dnsHint,
  fallbackTitle,
  fallbackAction,
  style,
}: {
  items: DiagnosisItem[];
  dnsHint: boolean;
  fallbackTitle: string;
  fallbackAction: string;
  /** Custom properties inline (ex.: `--diag-glow-color`). */
  style?: CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleLimit = 3;
  const visible = expanded ? items : items.slice(0, visibleLimit);
  const remaining = items.length - visibleLimit;

  const showFallback = items.length === 0;

  return (
    <div className="lk-result__combined" style={style}>
      <p className="lk-result__combined-kicker">Diagnóstico da conexão</p>

      {showFallback && (
        <>
          <p className="lk-result__combined-title">{fallbackTitle}</p>
          <div className="lk-result__combined-action">
            <span>O que fazer agora:</span>
            <strong>{fallbackAction}</strong>
          </div>
        </>
      )}

      {!showFallback && (
        <ul className="lk-result__combined-list" aria-label="Problemas e ações sugeridas">
          {visible.map((item) => (
            <li key={item.id} className={`lk-result__combined-item lk-result__combined-item--${item.severity}`}>
              <div
                className="lk-result__combined-item-icon"
                style={{ background: SEVERITY_BG[item.severity], color: SEVERITY_COLOR[item.severity] }}
              >
                <Icon name={item.icon} size={14} />
              </div>
              <div className="lk-result__combined-item-text">
                <span className="lk-result__combined-item-problem">{item.problem}</span>
                <span className="lk-result__combined-item-arrow" aria-hidden="true">→</span>
                <span className="lk-result__combined-item-action">{item.action}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!showFallback && !expanded && remaining > 0 && (
        <button
          type="button"
          className="lk-result__combined-more"
          onClick={() => setExpanded(true)}
        >
          Ver mais {remaining}
        </button>
      )}

      {dnsHint && (
        <div className="lk-result__combined-action lk-result__combined-action--secondary">
          <span>Otimização adicional:</span>
          <strong>
            Trocar para Cloudflare ou Google DNS pode reduzir a latência das
            suas conexões. Veja como em Mais detalhes &gt; DNS &gt; Como alterar.
          </strong>
        </div>
      )}
    </div>
  );
}

export function ResultScreen({
  theme, onToggleTheme,
  result,
  server,
  onRetry, onBack,
  onExplore,
  unit = 'mbps',
  connectionType, contractedDown = null, contractedUp = null, onUpdateContracted,
  useHaptics, onToggleHaptics,
}: Props) {
  const history = useMemo(() => loadHistory(), []);
  const profile = useMemo(
    () => toConnectionProfile(connectionType ?? undefined),
    [connectionType],
  );
  const interpreted = useMemo(
    () => interpretSpeedTestResult({
      metrics: result,
      profile,
      history,
    }),
    [result, profile, history],
  );

  const combined = useMemo(
    () =>
      combineDiagnostics({
        speed: result,
        connectionType: connectionType ?? 'unknown',
        wifi: undefined,
        mobile: undefined,
      }),
    [result, connectionType],
  );

  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  // Animação count-up dos números das duas faixas (Bloco Motion).
  const animDl     = useCountUp(result.dl,         700, 1);
  const animUl     = useCountUp(result.ul,         700, 1);
  const animLat    = useCountUp(result.latency,    700, 0);
  const animJitter = useCountUp(result.jitter,     700, 0);
  const animLoss   = useCountUp(result.packetLoss, 700, 0);
  // DNS feature (2026-05): count-up só anima quando há valor — quando
  // dnsLatencyMs é null/undefined a cell mostra "—" em vez do número.
  const animDns    = useCountUp(result.dnsLatencyMs ?? 0, 700, 0);

  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [waGenerating, setWaGenerating] = useState(false);
  const [imgGenerating, setImgGenerating] = useState(false);
  const shareResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (shareResetRef.current) clearTimeout(shareResetRef.current);
  }, []);

  // Opcionais passados ao share card — headline qualitativa do motor +
  // ISP detectado pelo serverRegistry (rodapé do PNG). A headline continua
  // sendo gerada pelo motor (`interpret.ts`) — só não é mais renderizada
  // como hero na tela de resultado (refactor visual 2026-05).
  const shareCardHeadline = resolveCopy(interpreted.copyKeys.headlineKey);
  const shareCardIsp = server?.isp ?? null;

  const handleShare = async () => {
    const text = buildShareText(result, interpreted.quality, unit);
    const outcome = await shareResultText(text);
    if (outcome === 'copied') {
      setShareStatus('copied');
      if (shareResetRef.current) clearTimeout(shareResetRef.current);
      shareResetRef.current = setTimeout(() => {
        setShareStatus('idle');
        shareResetRef.current = null;
      }, 2000);
    }
  };

  const handleWhatsApp = async () => {
    if (waGenerating) return;
    setWaGenerating(true);
    try {
      const blob = await generateShareCard(result, interpreted.quality, unit, {
        headline: shareCardHeadline,
        isp: shareCardIsp,
      });
      const file = new File([blob], 'linka-speedtest.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'linka SpeedTest' });
      } else {
        const text = buildShareText(result, interpreted.quality, unit);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }
    } catch { /* cancelado */ }
    finally { setWaGenerating(false); }
  };

  // Botão "Compartilhar imagem" do footer (Bloco 3 — Polimento, 2026-05).
  // Tenta Web Share API com `files`; se indisponível, dispara download
  // direto do PNG via objeto URL (fallback funcional sem perder a imagem).
  const handleShareImage = useCallback(async () => {
    if (imgGenerating) return;
    setImgGenerating(true);
    try {
      const blob = await generateShareCard(result, interpreted.quality, unit, {
        headline: shareCardHeadline,
        isp: shareCardIsp,
      });
      const file = new File([blob], 'linka-speedtest.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'linka SpeedTest' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'linka-speedtest.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { /* cancelado */ }
    finally { setImgGenerating(false); }
  }, [result, interpreted.quality, unit, shareCardHeadline, shareCardIsp, imgGenerating]);

  // Mantido para o HamburgerMenu (mesmo fluxo do botão de imagem).
  const handleNativeShare = useCallback(async () => {
    await handleShareImage();
  }, [handleShareImage]);

  // Bloco 5 — TopBar System (2026-05): scroll listener para alternar
  // glass effect + título "Último teste" no TopBar quando o usuário rola.
  // Padronização Large Title (2026-05, frente B): o sentinel agora é o
  // próprio <PageHeader> "Último teste" no topo do scroll content — mesmo
  // padrão de Explore/History/Diagnostic. Substitui o div invisível que
  // existia no slot anterior.
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  // Bloco 6 — UX uniforme (2026-05): HamburgerMenu agora é controlled;
  // o trigger é um IconButton no rightActions do TopBar.
  const [menuOpen, setMenuOpen] = useState(false);

  // Refator 2026-05 (drag-to-resize): a seção "Mais detalhes" virou 3
  // rows clicáveis (Avançado / Modo Gamer / DNS). Cada uma abre um
  // bottom sheet dedicado (AdvancedSheet, GamerSheet, DNSGuideSheet).
  // `activeSheet` unifica os 3 estados — só uma sheet aberta por vez.
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const closeActiveSheet = useCallback(() => setActiveSheet(null), []);

  return (
    <div className="lk-result fade-in">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        title="Último teste"
        showTitle={scrolled}
        useHaptics={useHaptics ?? false}
        rightActions={[{
          icon: <HamburgerMenuIcon />,
          onClick: () => setMenuOpen((o) => !o),
          ariaLabel: 'Menu',
        }]}
      />
      <HamburgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onShare={handleNativeShare}
        contractedDown={contractedDown}
        contractedUp={contractedUp}
        onUpdateContracted={onUpdateContracted ?? (() => {})}
        showContracted={connectionType !== 'mobile'}
        useHaptics={useHaptics}
        onToggleHaptics={onToggleHaptics}
      />

      <div className="lk-result__scroll" ref={scrollContainerRef}>
        {/* Large Title pattern (2026-05, frente B): título grande "Último
            teste" no início do scroll, idêntico a Explore/History/
            Diagnostic. Funciona como sentinel do `useScrollHeader` — ao
            sair da viewport, TopBar ganha glass + título pequeno. */}
        <PageHeader ref={sentinelRef} size="md" title="Último teste" />

        {/* ── Banner de contexto (pacote premium 2026-05, refeito 2026-05) ─
            Linha única discreta logo após o Large Title: server · loc ·
            isp · DNS · tempo relativo. Cada pedaço some individualmente
            quando o dado falta — a linha inteira some se todos os campos
            forem nulos.

            Refactor 2026-05 (card unificado): o "chip flutuante" de
            verdict que vivia aqui foi removido — o verdict agora é
            comunicado pela cor do ribbon de 3px no topo do
            `.lk-result__test-card` (ver `qualityRibbonColor`). Texto do
            verdict permanece acessível via `aria-label` + `<span class=
            "sr-only">` no card. */}
        {(() => {
          const parts: string[] = [];
          if (server?.name) parts.push(server.name);
          if (server?.loc && server.loc !== '—') parts.push(server.loc);
          if (server?.isp && server.isp !== '—') parts.push(server.isp);
          // DNS feature (2026-05, Fase B): peça DNS no banner — "DNS
          // Cloudflare", "DNS Google", ou "DNS do provedor" (fallback do
          // identificador). Some quando o probe falhou (provider null).
          if (result.dnsProvider) parts.push(`DNS ${result.dnsProvider}`);
          const rel = formatRelativeTime(result.timestamp);
          if (rel) parts.push(rel);
          // Sem peças, sem banner. Verdict não é mais chip aqui — é ribbon
          // do card abaixo, então não há motivo para manter linha vazia.
          if (parts.length === 0) return null;
          return (
            <div className="lk-result__context-bar" role="contentinfo">
              <span className="lk-result__context-bar-meta">
                {parts.map((p, i) => (
                  <span key={`${i}-${p}`} className="lk-result__context-bar-item">
                    {i > 0 && <span className="lk-result__context-bar-sep" aria-hidden="true">·</span>}
                    {p}
                  </span>
                ))}
              </span>
            </div>
          );
        })()}

        {/* ── Card unificado de teste (refactor 2026-05) ──────────────────
            Os 4 blocos (PRIMARY, SECONDARY, USE CASES, WI-FI) viviam como
            cards separados, e o "verdict" da medição era um chip
            flutuante que pairava acima deles. Agora tudo está dentro de
            UM `.lk-result__test-card`, separado por hairlines internos,
            com um ribbon colorido de 3px no topo (cor derivada de
            `interpreted.quality`) substituindo o chip flutuante. O
            verdict continua acessível via `aria-label` + texto
            `sr-only`. */}
        <section
          className="lk-result__test-card"
          style={{ ['--ribbon-color' as never]: qualityRibbonColor(interpreted.quality) } as CSSProperties}
          aria-label={`Resultado: ${verdictLabel(interpreted.quality)}`}
        >
          <span className="sr-only">Verdict: {verdictLabel(interpreted.quality)}</span>

        {/* ── Bloco PRIMARY — Download e Upload em fonte enorme ───────────
            Hierarquia visual nova (refactor 2026-05): as duas métricas
            "principais" (banda) ganham peso máximo. Sem badge de grade
            por métrica — as grades agora vivem no chip de cada use case
            abaixo, refletindo o pior caso por cenário.

            Plano vs entregue (pacote premium 2026-05): quando o usuário
            cadastrou velocidade contratada (`contractedDown`/`Up`), cada
            cell exibe `entregue / contratado · %`. O número grande é o
            entregue (animado pelo count-up); a fração `/ Y` e o `· Z%`
            ficam em fonte menor logo abaixo, sem animar (% é contexto,
            usuário lê o absoluto primeiro). Sem cap em 100%.

            Cores semânticas Anatel (2026-05): quando o plano está
            cadastrado, o número grande deixa o azul/verde de marca e
            passa a refletir % de entrega via `anatelGrade()`. As regras
            mudam por perfil (fixa: 80/40 · móvel: 60/20 — Resolução
            Anatel 717/2019). Sem plano: comportamento original
            preservado (`var(--dl)` / `var(--ul)`). O `text-shadow` (glow)
            também muda de família para casar com a nova cor — sem isso o
            número verde teria aura azul. O `· 97%` da linha plan ganha
            a mesma cor (sutilmente — só o número, nunca a fração). */}
        {(() => {
          const dlAnatel = anatelGrade(result.dl, contractedDown, profile);
          const ulAnatel = anatelGrade(result.ul, contractedUp,   profile);

          // Inline style respeita o `text-shadow !important` do CSS
          // setando `text-shadow` também com `!important` via property
          // fora do React style API — usamos `setProperty` num ref ou,
          // mais simples, deixamos o CSS receber a cor via custom prop
          // e mantemos o text-shadow do CSS. Aqui escolhemos a 2ª via:
          // setamos `--cell-glow` e a regra CSS lê. Mais clean que
          // `style!important` (que React não suporta nativamente).
          const dlStyle: CSSProperties = dlAnatel
            ? ({
                color: anatelGradeColorVar(dlAnatel),
                ['--cell-glow' as never]: anatelGradeGlowVar(dlAnatel),
              } as CSSProperties)
            : { color: 'var(--dl)' };
          const ulStyle: CSSProperties = ulAnatel
            ? ({
                color: anatelGradeColorVar(ulAnatel),
                ['--cell-glow' as never]: anatelGradeGlowVar(ulAnatel),
              } as CSSProperties)
            : { color: 'var(--ul)' };

          const dlPctStyle: CSSProperties | undefined = dlAnatel
            ? { color: anatelGradeColorVar(dlAnatel) }
            : undefined;
          const ulPctStyle: CSSProperties | undefined = ulAnatel
            ? { color: anatelGradeColorVar(ulAnatel) }
            : undefined;

          return (
            <div className="lk-result__primary-block">
              <div className="lk-result__primary-cell">
                <div className="lk-result__primary-cell-label">Download</div>
                <div className="lk-result__primary-cell-value" style={dlStyle}>
                  {formatMbps(animDl, unit)}
                </div>
                {contractedDown && contractedDown > 0 ? (
                  <div className="lk-result__primary-cell-plan">
                    <span className="lk-result__primary-cell-plan-frac">/ {formatMbps(contractedDown, unit)} {unitLabel}</span>
                    <span className="lk-result__primary-cell-plan-sep" aria-hidden="true">·</span>
                    <span className="lk-result__primary-cell-plan-pct" style={dlPctStyle}>{Math.round((result.dl / contractedDown) * 100)}%</span>
                  </div>
                ) : (
                  <div className="lk-result__primary-cell-unit">{unitLabel}</div>
                )}
              </div>
              <div className="lk-result__primary-cell">
                <div className="lk-result__primary-cell-label">Upload</div>
                <div className="lk-result__primary-cell-value" style={ulStyle}>
                  {formatMbps(animUl, unit)}
                </div>
                {contractedUp && contractedUp > 0 ? (
                  <div className="lk-result__primary-cell-plan">
                    <span className="lk-result__primary-cell-plan-frac">/ {formatMbps(contractedUp, unit)} {unitLabel}</span>
                    <span className="lk-result__primary-cell-plan-sep" aria-hidden="true">·</span>
                    <span className="lk-result__primary-cell-plan-pct" style={ulPctStyle}>{Math.round((result.ul / contractedUp) * 100)}%</span>
                  </div>
                ) : (
                  <div className="lk-result__primary-cell-unit">{unitLabel}</div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Bloco SECONDARY — diagnóstico em fonte média ──────────────
            Resposta (latency), Oscilação (jitter) e Falhas (packet loss).
            Padronização Polimento UX: packet loss = "Falhas" (curto).
            DNS (2026-05, refatorado para Safari): 4ª cell renderizada
            apenas quando há latência OU provider — quando ambos forem
            null (probe DoH falhou E Resource Timing zerada), o bloco
            colapsa para 3 colunas em vez de mostrar "—". */}
        {(() => {
          const showDnsCell = result.dnsLatencyMs != null || result.dnsProvider != null;
          const gridStyle = showDnsCell
            ? undefined
            : { gridTemplateColumns: 'repeat(3, 1fr)' };
          return (
            <div className="lk-result__secondary-block" style={gridStyle}>
              <div className="lk-result__secondary-cell">
                <div className="lk-result__secondary-cell-label">Resposta</div>
                <div className="lk-result__secondary-cell-value">
                  {formatMs(result.latency > 0 ? Math.max(0.1, animLat) : animLat)}
                  <span className="lk-result__secondary-cell-unit"> ms</span>
                </div>
              </div>
              <div className="lk-result__secondary-cell">
                <div className="lk-result__secondary-cell-label">Oscilação</div>
                <div className="lk-result__secondary-cell-value">
                  {formatMs(result.jitter > 0 ? Math.max(0.1, animJitter) : animJitter)}
                  <span className="lk-result__secondary-cell-unit"> ms</span>
                </div>
              </div>
              <div className="lk-result__secondary-cell">
                <div className="lk-result__secondary-cell-label">Falhas</div>
                <div className="lk-result__secondary-cell-value">
                  {Math.round(animLoss)}
                  <span className="lk-result__secondary-cell-unit"> %</span>
                </div>
              </div>
              {showDnsCell && (
                /* Atalho (2026-05, atualizado para drag-to-resize 2026-05):
                   clique na cell DNS abre o DNSGuideSheet diretamente, sem
                   precisar passar pela row "DNS" da section "Mais detalhes".
                   Os dois caminhos continuam válidos. role/tabIndex/
                   aria-label garantem acessibilidade. */
                <div
                  className="lk-result__secondary-cell lk-result__secondary-cell--clickable"
                  role="button"
                  tabIndex={0}
                  aria-label="Abrir guia de DNS"
                  onClick={() => setActiveSheet('dns')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveSheet('dns');
                    }
                  }}
                >
                  <div className="lk-result__secondary-cell-label">DNS</div>
                  <div className="lk-result__secondary-cell-value">
                    {result.dnsLatencyMs == null ? (
                      <>—</>
                    ) : (
                      <>
                        {Math.round(animDns)}
                        <span className="lk-result__secondary-cell-unit"> ms</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Use cases row — agora com grade A-F por cenário ──────────
            A grade vem de `useCaseGrade()` (src/core/useCaseGrade.ts):
            pior das métricas relevantes para cada use case avaliada
            contra os thresholds de qualidade do profile ativo. */}
        {interpreted.useCases.length > 0 && (
          <div className="lk-result__use-row">
            {interpreted.useCases.map(({ id, status, blockingFactors }) => {
              const grade = useCaseGrade({ id, status, blockingFactors }, result, profile);
              const gStyle = gradeStyle(grade);
              return (
                <div key={id} className="lk-result__use-item">
                  <div
                    className="lk-result__use-icon"
                    style={gStyle}
                  >
                    <Icon name={ucIcon(id)} size={18} />
                  </div>
                  <span className="lk-result__use-lbl">{ucLabel(id)}</span>
                  <span className="lk-result__use-row__chip" style={gStyle}>
                    {grade} · {gradeLabel(grade)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Wi-Fi signal card ─────────────────────────────────────────
            Inserido entre a use-row e o "Diagnóstico da conexão" quando
            a conexão atual é Wi-Fi. Lê dados nativos via bridge
            `LinkaWifiDiagnostics` (Capacitor); se o bridge não responde
            (PWA puro ou APK sem o plugin), o card mostra a mensagem
            "Wi-Fi: detalhes disponíveis somente no app instalado.". */}
        {connectionType === 'wifi' && <WifiSignalCard />}
        </section>

        {/* ── Diagnóstico da conexão (refator 2026-05) ────────────────────
            Antes era um bloco fixo: kicker + título + 1 ação imperativa
            (com card adicional opcional para DNS lento). Agora é um card
            com DOIS estados:

            (a) HEALTHY — quando `combined.cause === 'healthy'` e nenhum
                item por métrica disparou warn/fail. Layout centralizado:
                ícone check verde com drop-shadow + título grande "Tudo
                certo com sua rede". Sem subcards.

            (b) COM AÇÃO — lista compacta `[problema] → [ação]` derivada
                de `buildDiagnosisItems()` (porto da DiagnosticScreen
                morta). Limita a 3 visíveis; "ver mais N" expande inline.
                Priorizado por severidade (fail > warn). Mantém a
                recomendação extra de DNS lento como item adicional.

            Glow por severidade (refator 2026-05): a cor do box-shadow do
            card reflete a severidade agregada — healthy → verde, warn →
            amarelo, fail → vermelho. A escolha vem de
            `aggregateDiagnosisSeverity(items)` mapeada via
            `SEVERITY_GLOW`; a cor é injetada como custom property
            `--diag-glow-color` lida pela animação CSS
            `lk-result-diag-glow`. */}
        {(() => {
          const items = buildDiagnosisItems(result, connectionType ?? null);
          const dnsGrade = classifyDnsLatency(result.dnsLatencyMs ?? null);
          const isSlowDns = dnsGrade === 'slow' || dnsGrade === 'poor';
          const isIspDns = result.dnsProvider === 'DNS do provedor';
          const hasDnsHint = isSlowDns && isIspDns;
          const isHealthy = combined.cause === 'healthy' && items.length === 0;

          // Severidade agregada → cor do glow do card. A animação CSS
          // `lk-result-diag-glow` lê `--diag-glow-color` e pulsa em todos
          // os estados — só a cor diferencia healthy/warn/fail.
          const severity = aggregateDiagnosisSeverity(items);
          const glowStyle = {
            ['--diag-glow-color' as never]: SEVERITY_GLOW[severity],
          } as CSSProperties;

          if (isHealthy && !hasDnsHint) {
            return (
              <div
                className="lk-result__combined lk-result__combined--healthy"
                style={glowStyle}
              >
                <div className="lk-result__combined-check-icon" aria-hidden="true">
                  <Icon name="check-circle" size={48} color="var(--success)" />
                </div>
                <p className="lk-result__combined-healthy-title">
                  Tudo certo com sua rede
                </p>
              </div>
            );
          }

          return (
            <DiagnosticActionList
              items={items}
              dnsHint={hasDnsHint}
              fallbackTitle={combined.title}
              fallbackAction={combined.primaryAction}
              style={glowStyle}
            />
          );
        })()}

        {/* ── Mais detalhes (refator drag-to-resize 2026-05) ─────────────
            Os 3 accordions inline (Avançado, Modo Gamer, DNS) viraram 3
            rows clicáveis no estilo "Ferramentas". Cada click abre uma
            bottom sheet dedicada (AdvancedSheet / GamerSheet /
            DNSGuideSheet) montada sobre `DraggableSheet` — drag-to-resize
            com snap entre 60vh e 88vh, pull-down threshold de 30% fecha. */}
        <section className="lk-result__more">
          <h2 className="lk-result__more-label">Mais detalhes</h2>
          <IOSList
            items={[
              {
                icon: <Icon name="cog" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Avançado',
                subtitle: 'Métricas detalhadas, telemetria e histórico',
                showChevron: true,
                onClick: () => setActiveSheet('advanced'),
              },
              {
                icon: <Icon name="game" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Modo Gamer',
                subtitle: 'Avaliação para FPS, MOBA, MMO e cloud gaming',
                showChevron: true,
                onClick: () => setActiveSheet('gamer'),
              },
              {
                icon: <Icon name="ping" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'DNS',
                subtitle: 'Provedor, latência e como alterar',
                showChevron: true,
                onClick: () => setActiveSheet('dns'),
              },
            ]}
          />
        </section>

        {/* Atalho residual para a tela "Explorar" (Histórico + Ferramentas).
            Fica como item único — o que era "Diagnóstico/Recomendações/
            Detalhes" virou conteúdo desta própria tela. */}
        {onExplore && (
          <div className="lk-result__tools">
            <IOSList
              items={[
                {
                  icon: <Icon name="cog" size={14} color="var(--text-2)" />,
                  iconBg: 'var(--surface-3)',
                  title: 'Ferramentas',
                  subtitle: 'Histórico, comparações e teste por local',
                  showChevron: true,
                  onClick: onExplore,
                },
              ]}
            />
          </div>
        )}

        <div className="lk-result__footer">
          <button className="btn-primary lk-result__retry" onClick={onRetry}>
            <Icon name="refresh" size={16} />Testar novamente
          </button>
          <div className="lk-result__footer-row">
            <button className="btn-text" onClick={handleWhatsApp} disabled={waGenerating}>
              {waGenerating ? 'Gerando…' : 'WhatsApp'}
            </button>
            <button className="btn-text" onClick={handleShareImage} disabled={imgGenerating}>
              {imgGenerating ? 'Gerando…' : 'Compartilhar imagem'}
            </button>
            <button className="btn-text" onClick={handleShare}>
              {shareStatus === 'copied' ? 'Copiado!' : 'Compartilhar texto'}
            </button>
          </div>
        </div>
      </div>

      {/* Sheets de "Mais detalhes" (refator drag-to-resize 2026-05). As 3
          são montadas fora do scroll-container porque são fixed/full-screen
          e precisam cobrir o TopBar. Mount permanece — `open` controla a
          visibilidade e o cleanup interno (DraggableSheet) cuida de body
          scroll lock e Esc. */}
      <AdvancedSheet
        open={activeSheet === 'advanced'}
        onClose={closeActiveSheet}
        result={result}
        server={server}
        unit={unit}
        history={history}
      />
      <GamerSheet
        open={activeSheet === 'gamer'}
        onClose={closeActiveSheet}
        result={result}
      />
      <DNSGuideSheet
        open={activeSheet === 'dns'}
        onClose={closeActiveSheet}
        result={result}
      />
    </div>
  );
}

// =============================================================================
// As bodies dos antigos 3 accordions (Avançado, Modo Gamer, DNS) foram
// migradas para sheets dedicadas (refator drag-to-resize 2026-05):
//   - Avançado  → src/features/result-detail/AdvancedSheet.tsx
//   - Modo Gamer → src/features/result-detail/GamerSheet.tsx
//   - DNS        → src/features/dns/DNSGuideSheet.tsx (já existia)
// =============================================================================



