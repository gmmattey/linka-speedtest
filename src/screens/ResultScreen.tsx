import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { IOSList, type IOSListItem } from '../components/IOSList';
import { Icon } from '../components/icons';
import { HamburgerMenu, HamburgerMenuIcon } from '../components/HamburgerMenu';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import { generateShareCard } from '../utils/shareCard';
import { buildShareText, shareResultText } from '../utils/share';
import type { Quality, ServerInfo, SpeedTestResult, SpeedTestSample, TestRecord } from '../types';
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
import { classifyDnsLatency, dnsLatencyLabel } from '../utils/dnsTiming';
import { aggregateDiagnosisSeverity, buildDiagnosisItems, type DiagnosisAggregate, type DiagnosisItem } from '../utils/diagnosisItems';
import { WifiSignalCard } from '../features/local-wifi/WifiSignalCard';
import { Accordion } from '../components/Accordion';
import { DNSGuideSheet } from '../features/dns/DNSGuideSheet';
import { runDNSBenchmark, type DnsBenchmarkResult, type DnsServerResult } from '../utils/dnsBenchmark';

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

  // Refator 2026-05: o DNSGuideScreen virou bottom sheet acionado pelo
  // botão "Como alterar" do accordion DNS (seção Mais detalhes).
  const [dnsSheetOpen, setDnsSheetOpen] = useState(false);

  // Benchmark comparativo de DNS (2026-05): o accordion DNS dispara o
  // benchmark dos 5 servidores DoH a partir do PRIMEIRO `open`. `started`
  // só vai pra true uma vez e o `<DnsAccordionBody>` reaproveita o
  // resultado nos opens subsequentes (sem refazer o teste).
  const [dnsBenchStarted, setDnsBenchStarted] = useState(false);

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
                <div className="lk-result__secondary-cell">
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

        {/* ── Mais detalhes (refator 2026-05) ────────────────────────────
            Section com 3 accordions consolidando 3 telas que morreram:
              - Avançado (porto da DetailsScreen): qualidade sob carga,
                bufferbloat, latência carregada, oscilação carregada,
                estabilidade do download, IP, tempo do teste.
              - Modo Gamer (porto da GamerScreen): stat cards de Resposta/
                Oscilação/Falhas + lista de jogos por categoria.
              - DNS: provider + latência + botão "Como alterar" que abre
                o `DNSGuideSheet` (substituindo a antiga DNSGuideScreen). */}
        <section className="lk-result__more">
          <h2 className="lk-result__more-label">Mais detalhes</h2>

          <Accordion
            title="Avançado"
            icon={<Icon name="cog" size={14} color="var(--text-2)" />}
          >
            <AdvancedAccordionBody
              result={result}
              server={server}
              unit={unit}
              history={history}
            />
          </Accordion>

          <Accordion
            title="Modo Gamer"
            icon={<Icon name="game" size={14} color="var(--text-2)" />}
          >
            <GamerAccordionBody result={result} />
          </Accordion>

          <Accordion
            title="DNS"
            icon={<Icon name="ping" size={14} color="var(--text-2)" />}
            onToggle={(open) => { if (open && !dnsBenchStarted) setDnsBenchStarted(true); }}
          >
            <DnsAccordionBody
              result={result}
              onOpenGuide={() => setDnsSheetOpen(true)}
              benchmarkStarted={dnsBenchStarted}
            />
          </Accordion>
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

      {/* DNSGuideSheet — overlay acionado pelo botão "Como alterar" do
          accordion DNS. Renderizado fora do scroll-container porque é
          fixed/full-screen e precisa cobrir o TopBar também. */}
      <DNSGuideSheet
        open={dnsSheetOpen}
        onClose={() => setDnsSheetOpen(false)}
        serverId="cloudflare"
      />
    </div>
  );
}

// =============================================================================
// Bodies dos accordions (refator 2026-05) — funções privadas para manter o
// JSX da ResultScreen legível. Cada body é um porto de uma das telas
// consolidadas (DetailsScreen, GamerScreen, parcial DNSBenchmarkScreen).
// =============================================================================

// ── Avançado (porto de DetailsScreen) ─────────────────────────────────────

function bufferbloatColor(grade: string): string {
  if (grade === 'A' || grade === 'B') return 'var(--ul)';
  if (grade === 'C') return 'var(--warn)';
  return 'var(--error)';
}

function bufferbloatLabel(grade: string): string {
  if (grade === 'A') return 'Excelente';
  if (grade === 'B') return 'Bom';
  if (grade === 'C') return 'Moderado';
  if (grade === 'D') return 'Ruim';
  return 'Crítico';
}

function packetLossColor(pct: number): string {
  if (pct < 1) return 'var(--ul)';
  if (pct < 2.5) return 'var(--warn)';
  return 'var(--error)';
}

function packetLossLabel(pct: number): string {
  if (pct < 1) return 'Baixo';
  if (pct < 2.5) return 'Médio';
  return 'Alto';
}

// =============================================================================
// Helpers do Avançado (enriquecimento 2026-05)
// =============================================================================

/**
 * Formata data + hora completa para o item "Realizado em" do Avançado.
 * Exemplo: "03/05/2026 às 14:35:22". Não usa relativo — o banner de
 * contexto já mostra "há 2 min"; aqui é o timestamp absoluto.
 */
function formatFullDateTime(ts: number): string {
  const d = new Date(ts);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yy = d.getFullYear();
  const hh = d.getHours().toString().padStart(2, '0');
  const mi = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${dd}/${mm}/${yy} às ${hh}:${mi}:${ss}`;
}

/**
 * Formata duração em ms para "Xs" ou "Xm Ys". Granularidade de segundos —
 * abaixo de 1 s mostra "<1s" para evitar mostrar zero.
 */
function formatElapsedMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return '<1s';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/**
 * Média aritmética dos samples filtrando os zeros das pontas (ramp-up e
 * ramp-down de cada fase). Implementação:
 *
 *  1. Encontra o primeiro índice com valor > 0 (start) e o último (end).
 *  2. Calcula média dos valores entre start..end (mantém zeros internos
 *     porque eles podem refletir stalls reais — não são ruído de borda).
 *
 * Quando nenhuma amostra > 0 existir, retorna 0.
 */
function averageFromSamples(samples: SpeedTestSample[] | undefined): number {
  if (!samples || samples.length === 0) return 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].mbps > 0) { start = i; break; }
  }
  for (let i = samples.length - 1; i >= 0; i--) {
    if (samples[i].mbps > 0) { end = i; break; }
  }
  if (start === -1 || end === -1 || start > end) return 0;
  let sum = 0;
  let count = 0;
  for (let i = start; i <= end; i++) {
    sum += samples[i].mbps;
    count++;
  }
  return count === 0 ? 0 : sum / count;
}

/**
 * Média de download dos últimos N registros. Pula o registro atual
 * (timestamp idêntico) para que a comparação compare contra o histórico
 * "anterior". Retorna `null` se o histórico não tem amostras suficientes
 * (mín 2 testes anteriores — média de 1 só não é representativa).
 */
function historicalAverageDl(
  history: TestRecord[],
  currentTimestamp: number,
  n = 10,
): { avgDl: number; count: number } | null {
  const previous = history.filter((r) => r.timestamp !== currentTimestamp).slice(0, n);
  if (previous.length < 2) return null;
  const sum = previous.reduce((acc, r) => acc + r.dl, 0);
  return { avgDl: sum / previous.length, count: previous.length };
}

/**
 * Distância estimada ao servidor (km) a partir da latência baseline. A
 * heurística assume ~200 km/ms (luz no fio = ~2/3 c, somando RTT/2 e
 * processamento) — proxy bem aproximado, NÃO geográfico. O objetivo é
 * dar a ordem de grandeza ("perto / longe"), não medição física precisa.
 */
function estimateDistanceKm(latencyMs: number): number {
  return Math.round(latencyMs * 100);
}

function AdvancedAccordionBody({
  result,
  server,
  unit,
  history,
}: {
  result: SpeedTestResult;
  server: ServerInfo | null;
  unit: 'mbps' | 'gbps';
  history: TestRecord[];
}) {
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  // ── Bloco "Métricas avançadas" ─────────────────────────────────────────
  const metricItems: IOSListItem[] = [];

  if (result.bufferbloatGrade) {
    metricItems.push({
      icon: <Icon name="bolt" size={14} color={bufferbloatColor(result.bufferbloatGrade)} />,
      iconBg: 'var(--surface-3)',
      title: resolveCopy('metric.latency.loaded'),
      trailing: (
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: bufferbloatColor(result.bufferbloatGrade), fontWeight: 700, fontSize: 15 }}>
            {result.bufferbloatGrade}
          </div>
          <div style={{ fontSize: 11, color: bufferbloatColor(result.bufferbloatGrade) }}>
            {bufferbloatLabel(result.bufferbloatGrade)}
          </div>
        </div>
      ),
    });
  }
  if (result.latencyLoaded != null) {
    metricItems.push({
      icon: <Icon name="ping" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: resolveCopy('metric.latency.loadedValue'),
      trailing: (
        <span className="lk-result__metric-sub">
          {formatMs(result.latencyLoaded)} ms
          {result.bufferbloatDeltaMs != null && result.bufferbloatDeltaMs > 0 && (
            <span style={{ color: 'var(--warn)', fontSize: 11, marginLeft: 4 }}>
              +{formatMs(result.bufferbloatDeltaMs)} ms
            </span>
          )}
        </span>
      ),
    });
  }
  if (result.jitterLoaded != null) {
    metricItems.push({
      icon: <Icon name="jitter" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Oscilação carregada',
      trailing: (
        <span className="lk-result__metric-sub">{formatMs(result.jitterLoaded)} ms</span>
      ),
    });
  }
  if (result.dlP25 != null && result.dlP75 != null) {
    metricItems.push({
      icon: <Icon name="download" size={14} color="var(--dl)" />,
      iconBg: 'var(--dl-tint, rgba(58,182,255,0.12))',
      title: 'Estabilidade download',
      trailing: (
        <span className="lk-result__metric-sub">
          {formatMbps(result.dlP25, unit)}–{formatMbps(result.dlP75, unit)} {unitLabel}
        </span>
      ),
    });
  }
  metricItems.push({
    icon: <Icon name="loss" size={14} color={result.packetLoss != null ? packetLossColor(result.packetLoss) : 'var(--text-2)'} />,
    iconBg: 'var(--surface-3)',
    title: 'Falhas na conexão',
    trailing: (
      <span className="lk-result__metric-sub" style={result.packetLoss != null ? { color: packetLossColor(result.packetLoss) } : undefined}>
        {result.packetLoss != null ? `${result.packetLoss.toFixed(1)}%  ${packetLossLabel(result.packetLoss)}` : '—'}
      </span>
    ),
  });

  // Velocidade média (samples) — mostra apenas quando o teste tem séries
  // temporais suficientes (Motor v2). Para registros legados sem
  // `dlSamples`/`ulSamples`, pulamos o item — sem fallback ao peak.
  const avgDl = averageFromSamples(result.dlSamples);
  const avgUl = averageFromSamples(result.ulSamples);
  if (avgDl > 0) {
    metricItems.push({
      icon: <Icon name="download" size={14} color="var(--dl)" />,
      iconBg: 'var(--dl-tint, rgba(58,182,255,0.12))',
      title: 'Velocidade média (DL)',
      trailing: (
        <span className="lk-result__metric-sub">
          {formatMbps(avgDl, unit)} {unitLabel}
        </span>
      ),
    });
  }
  if (avgUl > 0) {
    metricItems.push({
      icon: <Icon name="upload" size={14} color="var(--ul)" />,
      iconBg: 'var(--ul-tint, rgba(34,197,94,0.12))',
      title: 'Velocidade média (UL)',
      trailing: (
        <span className="lk-result__metric-sub">
          {formatMbps(avgUl, unit)} {unitLabel}
        </span>
      ),
    });
  }

  if (server?.ip && server.ip !== '—') {
    metricItems.push({
      icon: <Icon name="router" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'IP público',
      trailing: (
        <span className="lk-result__metric-sub lk-result__metric-sub--truncate">{server.ip}</span>
      ),
    });
  }
  if (server?.isp && server.isp !== '—') {
    metricItems.push({
      icon: <Icon name="router" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Provedor',
      trailing: (
        <span className="lk-result__metric-sub lk-result__metric-sub--truncate">{server.isp}</span>
      ),
    });
  }

  // ── Bloco "Sobre o teste" ──────────────────────────────────────────────
  const aboutItems: IOSListItem[] = [];

  // Tempo total — usa elapsedMs do orchestrator. Pulamos se não houver
  // (registros legados ou fixtures de teste).
  if (result.elapsedMs != null && result.elapsedMs > 0) {
    aboutItems.push({
      icon: <Icon name="history" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Tempo total do teste',
      trailing: (
        <span className="lk-result__metric-sub">{formatElapsedMs(result.elapsedMs)}</span>
      ),
    });
  }

  // Distância estimada ao servidor — só quando latência > 0.
  if (result.latency > 0) {
    aboutItems.push({
      icon: <Icon name="pin" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Distância estimada ao servidor',
      subtitle: 'estimado pela latência',
      trailing: (
        <span className="lk-result__metric-sub">~{estimateDistanceKm(result.latency)} km</span>
      ),
    });
  }

  aboutItems.push({
    icon: <Icon name="history" size={14} color="var(--text-2)" />,
    iconBg: 'var(--surface-3)',
    title: 'Realizado em',
    trailing: (
      <span className="lk-result__metric-sub">{formatFullDateTime(result.timestamp)}</span>
    ),
  });

  // Versão do app — `__APP_VERSION__` é injetada via Vite `define`. Em
  // ambientes onde a global não foi setada (ex.: alguns runners de teste
  // que ignoram o `define`) caímos silenciosamente para "—".
  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
  if (appVersion) {
    aboutItems.push({
      icon: <Icon name="cog" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Versão do app',
      trailing: (
        <span className="lk-result__metric-sub">v{appVersion}</span>
      ),
    });
  }

  // ── Bloco "Histórico" — comparação com média (últimos 10) ──────────────
  const historyItems: IOSListItem[] = [];
  const histAvg = historicalAverageDl(history, result.timestamp, 10);
  if (histAvg) {
    const delta = result.dl - histAvg.avgDl;
    const deltaPct = histAvg.avgDl > 0 ? (delta / histAvg.avgDl) * 100 : 0;
    const significant = Math.abs(deltaPct) > 5;
    if (significant) {
      const positive = delta > 0;
      const sign = positive ? '+' : '−';
      const color = positive ? 'var(--ul)' : 'var(--error)';
      historyItems.push({
        icon: <Icon name="trending-up" size={14} color={color} />,
        iconBg: 'var(--surface-3)',
        title: `Sua média (últimos ${histAvg.count})`,
        subtitle: `este teste: ${formatMbps(result.dl, unit)} ${unitLabel}`,
        trailing: (
          <div style={{ textAlign: 'right' }}>
            <div className="lk-result__metric-sub">
              {formatMbps(histAvg.avgDl, unit)} {unitLabel}
            </div>
            <div style={{ color, fontSize: 11, fontWeight: 600 }}>
              {sign}{Math.abs(Math.round(deltaPct))}%
            </div>
          </div>
        ),
      });
    } else {
      historyItems.push({
        icon: <Icon name="trending-up" size={14} color="var(--text-2)" />,
        iconBg: 'var(--surface-3)',
        title: `Sua média (últimos ${histAvg.count})`,
        subtitle: 'este teste está dentro da média (±5%)',
        trailing: (
          <span className="lk-result__metric-sub">
            {formatMbps(histAvg.avgDl, unit)} {unitLabel}
          </span>
        ),
      });
    }
  }

  // Body com 3 sub-blocos hairlined. Quando todos os blocos estão vazios
  // (extremamente raro — falhas na conexão sempre adiciona algo), volta
  // ao empty-state legado.
  if (metricItems.length === 0 && aboutItems.length === 0 && historyItems.length === 0) {
    return (
      <p className="lk-result__accordion-empty">
        Sem dados avançados disponíveis para este teste.
      </p>
    );
  }

  return (
    <div className="lk-result__advanced-body">
      {metricItems.length > 0 && (
        <div className="lk-result__advanced-group">
          <h4 className="lk-result__advanced-group-label">Métricas avançadas</h4>
          <IOSList items={metricItems} />
        </div>
      )}
      {aboutItems.length > 0 && (
        <div className="lk-result__advanced-group">
          <h4 className="lk-result__advanced-group-label">Sobre o teste</h4>
          <IOSList items={aboutItems} />
        </div>
      )}
      {historyItems.length > 0 && (
        <div className="lk-result__advanced-group">
          <h4 className="lk-result__advanced-group-label">Histórico</h4>
          <IOSList items={historyItems} />
        </div>
      )}
    </div>
  );
}

// ── Modo Gamer (porto de GamerScreen) ─────────────────────────────────────

type GamerTone = 'good' | 'maybe' | 'bad';

const GAMER_TONE_COLOR: Record<GamerTone, string> = {
  good: 'var(--success)',
  maybe: 'var(--warn)',
  bad: 'var(--error)',
};

interface GameRow { name: string; verdict: string; tone: GamerTone }

function evaluateGames(result: SpeedTestResult): GameRow[] {
  const { latency, jitter, packetLoss, dl } = result;

  const fpsTone: GamerTone   = latency <= 20 && jitter <= 5 && packetLoss === 0 ? 'good' : latency <= 40 ? 'maybe' : 'bad';
  const mobaTone: GamerTone  = latency <= 30 && jitter <= 5 ? 'good' : latency <= 60 ? 'maybe' : 'bad';
  const mmoTone: GamerTone   = latency <= 60 ? 'good' : latency <= 120 ? 'maybe' : 'bad';
  const cloudTone: GamerTone = dl >= 15 && latency <= 40 ? 'good' : dl >= 8 && latency <= 80 ? 'maybe' : 'bad';

  const verdictLabel = (t: GamerTone) => t === 'good' ? 'Excelente' : t === 'maybe' ? 'Atenção' : 'Ruim';

  return [
    { name: 'FPS competitivo',     verdict: verdictLabel(fpsTone),   tone: fpsTone   },
    { name: 'MOBA / Battle Royale', verdict: verdictLabel(mobaTone),  tone: mobaTone  },
    { name: 'MMO / RPG Online',    verdict: verdictLabel(mmoTone),   tone: mmoTone   },
    { name: 'Cloud Gaming',        verdict: verdictLabel(cloudTone), tone: cloudTone },
  ];
}

function GamerAccordionBody({ result }: { result: SpeedTestResult }) {
  const { latency, jitter, packetLoss } = result;
  const games = evaluateGames(result);
  const overallTone: GamerTone = latency <= 30 && jitter <= 5 && packetLoss === 0 ? 'good' : latency <= 60 ? 'maybe' : 'bad';
  const overallLabel = overallTone === 'good'
    ? 'Boa para jogos online.'
    : overallTone === 'maybe'
      ? 'Atenção para jogos competitivos.'
      : 'Conexão fraca para jogar online.';

  return (
    <div className="lk-result__gamer">
      <p className="lk-result__gamer-headline">{overallLabel}</p>

      <div className="lk-result__gamer-stats">
        <GamerStat label="Resposta"  value={formatMs(latency)}            unit="ms" tone={latency    <= 40 ? 'good' : latency    <= 80 ? 'maybe' : 'bad'} />
        <GamerStat label="Oscilação" value={formatMs(jitter)}             unit="ms" tone={jitter     <= 5  ? 'good' : jitter     <= 20 ? 'maybe' : 'bad'} />
        <GamerStat label="Falhas"    value={packetLoss.toFixed(1)}        unit="%"  tone={packetLoss === 0 ? 'good' : packetLoss <= 1  ? 'maybe' : 'bad'} />
      </div>

      <IOSList
        items={games.map((g) => ({
          icon: <Icon name="game" size={14} color="var(--text-2)" />,
          iconBg: 'var(--surface-3)',
          title: g.name,
          trailing: (
            <span style={{ color: GAMER_TONE_COLOR[g.tone], fontWeight: 600, fontSize: 12 }}>
              {g.verdict}
            </span>
          ),
        }))}
      />
    </div>
  );
}

function GamerStat({ label, value, unit, tone }: { label: string; value: string; unit: string; tone: GamerTone }) {
  return (
    <div className="lk-result__gamer-stat">
      <div className="lk-result__gamer-stat-label">{label}</div>
      <div className="lk-result__gamer-stat-value" style={{ color: GAMER_TONE_COLOR[tone] }}>
        {value}<span className="lk-result__gamer-stat-unit">{unit}</span>
      </div>
    </div>
  );
}

// ── DNS (info atual + benchmark comparativo + atalho para guia) ─────────

type DnsBenchState = 'idle' | 'running' | 'done' | 'error';

/**
 * Tabela comparativa do benchmark DNS (refator 2026-05). Disparada na
 * primeira vez que o usuário abre o accordion DNS — `runDNSBenchmark()`
 * roda em background (5 servidores DoH, ~5-15s no total) e o componente
 * vai populando linhas conforme cada servidor termina. Servidor que
 * falha (CORS estrito no Safari, timeout, offline) vira "—" sem quebrar
 * o resto da tabela.
 *
 * Chips:
 * - "Em uso": linha cujo nome bate com `result.dnsProvider`.
 * - "Mais rápido": linha vencedora (menor `p50` com amostras válidas).
 * Linhas podem ter os DOIS chips simultaneamente.
 *
 * Delta: cada linha (exceto a "em uso") mostra `±X ms` vs a "em uso"
 * — positivo (vermelho) quando o servidor é mais lento; negativo (verde)
 * quando é mais rápido. Sem comparação se `dnsLatencyMs` do resultado
 * for null OU se nenhum dos 5 corresponde ao provider atual.
 */
function DnsBenchmarkTable({
  result,
  benchmark,
  state,
  progress,
}: {
  result: SpeedTestResult;
  benchmark: DnsBenchmarkResult | null;
  state: DnsBenchState;
  progress: { done: number; total: number; current: string };
}) {
  // Derivar a latência "atual" para deltas. Preferimos a linha do bench
  // do mesmo provider (medida pela MESMA metodologia DoH); senão,
  // fallback para o valor do speedtest principal (`result.dnsLatencyMs`,
  // que pode misturar metodologias). Sem nada, deltas somem.
  const currentName = (result.dnsProvider ?? '').toLowerCase();
  const benchCurrentRow = benchmark?.servers.find(
    (s) => s.name.toLowerCase() === currentName,
  );
  const currentLatency = benchCurrentRow?.samples
    ? benchCurrentRow.p50
    : (result.dnsLatencyMs ?? null);

  if (state === 'idle' || state === 'running') {
    return (
      <div className="lk-result__dns-bench">
        <div className="lk-result__dns-bench-header">
          <span className="lk-result__dns-bench-label">Comparando 5 provedores</span>
          {state === 'running' && (
            <span className="lk-result__dns-bench-progress">
              Testando {Math.min(progress.done + 1, progress.total)} de {progress.total}
              {progress.current ? ` · ${progress.current}` : ''}
            </span>
          )}
        </div>
        <p className="lk-result__dns-bench-empty">
          {state === 'idle' ? 'Iniciando…' : 'Pode levar alguns segundos.'}
        </p>
      </div>
    );
  }

  if (state === 'error' || !benchmark) {
    return (
      <div className="lk-result__dns-bench">
        <div className="lk-result__dns-bench-header">
          <span className="lk-result__dns-bench-label">Benchmark DNS</span>
        </div>
        <p className="lk-result__dns-bench-empty">
          Não foi possível comparar (rede offline ou bloqueio CORS).
        </p>
      </div>
    );
  }

  // Ordenado: válidos por p50 ascendente; inválidos (samples=0) ao final.
  const sorted = [...benchmark.servers].sort((a, b) => {
    const va = a.samples > 0 ? 1 : 0;
    const vb = b.samples > 0 ? 1 : 0;
    if (va !== vb) return vb - va;
    return a.p50 - b.p50;
  });

  return (
    <div className="lk-result__dns-bench">
      <div className="lk-result__dns-bench-header">
        <span className="lk-result__dns-bench-label">Comparativo de servidores</span>
        <span className="lk-result__dns-bench-progress">
          Mais rápido vence
        </span>
      </div>
      <ul className="lk-result__dns-bench-list">
        {sorted.map((row) => (
          <DnsBenchmarkRow
            key={row.id}
            row={row}
            isCurrent={row.name.toLowerCase() === currentName}
            isWinner={benchmark.winner.id === row.id && row.samples > 0}
            currentLatency={currentLatency}
          />
        ))}
      </ul>
    </div>
  );
}

function DnsBenchmarkRow({
  row,
  isCurrent,
  isWinner,
  currentLatency,
}: {
  row: DnsServerResult;
  isCurrent: boolean;
  isWinner: boolean;
  currentLatency: number | null;
}) {
  const failed = row.samples === 0;
  const hasCurrent = currentLatency != null && currentLatency > 0;
  const showDelta = !failed && !isCurrent && hasCurrent;
  // `currentLatency!` é seguro porque `showDelta` só é true após o guard
  // `hasCurrent` acima (TS narrowing não atravessa a const boolean).
  const delta = showDelta ? row.p50 - currentLatency! : 0;
  const deltaSign = delta > 0 ? '+' : '−';
  const deltaColor = delta > 0 ? 'var(--error)' : 'var(--ul)';

  return (
    <li className={`lk-result__dns-bench-row${failed ? ' lk-result__dns-bench-row--failed' : ''}`}>
      <span className="lk-result__dns-bench-name">{row.name}</span>
      <span className="lk-result__dns-bench-chips">
        {isCurrent && (
          <span className="lk-result__dns-bench-chip lk-result__dns-bench-chip--current">
            Em uso
          </span>
        )}
        {isWinner && (
          <span className="lk-result__dns-bench-chip lk-result__dns-bench-chip--winner">
            Mais rápido
          </span>
        )}
      </span>
      <span className="lk-result__dns-bench-latency">
        {failed ? '—' : `${Math.round(row.p50)} ms`}
        {showDelta && Math.abs(delta) >= 1 && (
          <span style={{ color: deltaColor, fontSize: 11, marginLeft: 6, fontWeight: 600 }}>
            {deltaSign}{Math.round(Math.abs(delta))} ms
          </span>
        )}
      </span>
    </li>
  );
}

function DnsAccordionBody({
  result,
  onOpenGuide,
  benchmarkStarted,
}: {
  result: SpeedTestResult;
  onOpenGuide: () => void;
  benchmarkStarted: boolean;
}) {
  const grade = classifyDnsLatency(result.dnsLatencyMs ?? null);

  // Estado do benchmark — disparado na PRIMEIRA vez que o usuário abre
  // o accordion (`benchmarkStarted` flipa pra true uma vez pelo pai).
  // Nas vezes seguintes que o accordion abre, o resultado já está em
  // memória — não refaz o teste.
  const [state, setState] = useState<DnsBenchState>('idle');
  const [benchmark, setBenchmark] = useState<DnsBenchmarkResult | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 5, current: '' });
  const startedRef = useRef(false);

  useEffect(() => {
    if (!benchmarkStarted || startedRef.current) return;
    startedRef.current = true;
    const ctrl = new AbortController();
    setState('running');
    runDNSBenchmark(ctrl.signal, (done, total, current) => {
      setProgress({ done, total, current });
    })
      .then((r) => {
        setBenchmark(r);
        setState('done');
      })
      .catch(() => {
        // Ignora aborts (cleanup ao desmontar). Para outras falhas, vai
        // pra estado 'error' — UI mostra mensagem genérica.
        if (ctrl.signal.aborted) return;
        setState('error');
      });

    return () => {
      ctrl.abort();
    };
  }, [benchmarkStarted]);

  const items: IOSListItem[] = [];

  items.push({
    icon: <Icon name="router" size={14} color="var(--text-2)" />,
    iconBg: 'var(--surface-3)',
    title: 'Provedor DNS',
    trailing: (
      <span className="lk-result__metric-sub">
        {result.dnsProvider ?? 'Não detectado'}
      </span>
    ),
  });

  if (result.dnsLatencyMs != null) {
    items.push({
      icon: <Icon name="ping" size={14} color="var(--text-2)" />,
      iconBg: 'var(--surface-3)',
      title: 'Latência DNS',
      trailing: (
        <span className="lk-result__metric-sub">
          {Math.round(result.dnsLatencyMs)} ms{grade ? ` · ${dnsLatencyLabel(grade)}` : ''}
        </span>
      ),
    });
  }

  items.push({
    icon: <Icon name="cog" size={14} color="#fff" />,
    iconBg: 'var(--accent)',
    title: 'Como alterar',
    subtitle: 'Guia passo a passo por plataforma',
    showChevron: true,
    onClick: onOpenGuide,
  });

  return (
    <div className="lk-result__dns-body">
      <IOSList items={items} />
      <DnsBenchmarkTable
        result={result}
        benchmark={benchmark}
        state={state}
        progress={progress}
      />
    </div>
  );
}
