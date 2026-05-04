import { useState } from 'react';
import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import { HamburgerMenu, HamburgerMenuIcon } from '../components/HamburgerMenu';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import './ExploreScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  contractedDown: number | null;
  contractedUp: number | null;
  onUpdateContracted: (down: number | null, up: number | null) => void;
  onBack: () => void;
  /**
   * Abre o Histórico. Item da seção "Histórico" no topo da lista.
   */
  onShowHistory?: () => void;
  onStartRoomTest?: () => void;
  onStartComparison?: () => void;
  onStartBeforeAfter?: () => void;
  onShowLocalWifiDiagnostics?: () => void;
}

/**
 * ExploreScreen — refator 2026-05.
 *
 * A tela "Explorar" foi reduzida para 2 sections:
 *   1. Histórico — entrada do Histórico de testes (mantida).
 *   2. Ferramentas — Comparar locais, Teste por local, Antes e Depois,
 *      e (quando a capability nativa existe) Diagnóstico Wi-Fi.
 *
 * O que saiu:
 *   - "Resultado" (Diagnóstico / Recomendações / Modo Gamer) — virou
 *     conteúdo da própria ResultScreen (card unificado + accordions).
 *   - "Rede" (Verificar DNS / Guia DNS) — DNS virou accordion no Result;
 *     guia virou bottom sheet.
 *   - "Prova Real" — promovida para a ação de teste no StartScreen ou
 *     reaproveitada quando o usuário pedir; deixou de ser entrada da
 *     Explore para encurtar o menu.
 */
export function ExploreScreen({
  theme,
  onToggleTheme,
  contractedDown,
  contractedUp,
  onUpdateContracted,
  onBack,
  onShowHistory,
  onStartRoomTest,
  onStartComparison,
  onStartBeforeAfter,
  onShowLocalWifiDiagnostics,
}: Props) {
  const showToolsSection = !!(
    onStartComparison || onStartRoomTest || onStartBeforeAfter || onShowLocalWifiDiagnostics
  );

  // Bloco 5 — TopBar System (2026-05).
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  // Bloco 6 — UX uniforme (2026-05): HamburgerMenu controlled via IconButton.
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lk-explore fade-in" data-theme={theme}>
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        title="Explorar"
        showTitle={scrolled}
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
        contractedDown={contractedDown}
        contractedUp={contractedUp}
        onUpdateContracted={onUpdateContracted}
        showContracted={false}
      />

      <div className="lk-explore__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Explorar" />

        {onShowHistory && (
          <div className="lk-explore__section">
            <p className="lk-explore__section-label">Histórico</p>
            <IOSList
              items={[
                {
                  icon: <Icon name="history" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Histórico de testes',
                  subtitle: 'Veja medições anteriores e tendências',
                  showChevron: true,
                  onClick: onShowHistory,
                },
              ]}
            />
          </div>
        )}

        {showToolsSection && (
          <div className="lk-explore__section">
            <p className="lk-explore__section-label">Ferramentas</p>
            <IOSList
              items={[
                ...(onStartComparison ? [{
                  icon: <Icon name="cmp" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Comparar locais',
                  subtitle: 'Perto vs. longe do roteador',
                  showChevron: true,
                  onClick: onStartComparison,
                }] : []),
                ...(onStartRoomTest ? [{
                  icon: <Icon name="pin" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Teste por local',
                  subtitle: 'Meça o sinal em cada cômodo',
                  showChevron: true,
                  onClick: onStartRoomTest,
                }] : []),
                ...(onStartBeforeAfter ? [{
                  icon: <Icon name="swap" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Antes e Depois',
                  subtitle: 'Compare o impacto de uma mudança',
                  showChevron: true,
                  onClick: onStartBeforeAfter,
                }] : []),
                ...(onShowLocalWifiDiagnostics ? [{
                  icon: <Icon name="wifi" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Diagnóstico Wi-Fi',
                  subtitle: 'Sinal local, banda e qualidade do link',
                  showChevron: true,
                  onClick: onShowLocalWifiDiagnostics,
                }] : []),
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
