import { useState } from 'react';
import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import { HamburgerMenu, HamburgerMenuIcon } from '../components/HamburgerMenu';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import type { Settings } from '../hooks/useSettings';
import './ExploreScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onBack: () => void;
  /**
   * Abre o Histórico.
   */
  onShowHistory?: () => void;
  /** Reseta a flag `linka.onboarding.done` e reabre o tutorial inicial. */
  onResetOnboarding?: () => void;
}

/**
 * ExploreScreen (Ajustes) — espelhado do Kotlin (Fase 1, 2026-05).
 * 
 * Esta tela agora funciona como a central de Ajustes do PWA, seguindo
 * a hierarquia e organização visual do app Android.
 */
export function ExploreScreen({
  theme,
  onToggleTheme,
  settings,
  onUpdateSettings,
  onBack,
  onShowHistory,
  onResetOnboarding,
}: Props) {
  // Bloco 5 — TopBar System (2026-05).
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  // Bloco 6 — UX uniforme (2026-05): HamburgerMenu controlled via IconButton.
  const [menuOpen, setMenuOpen] = useState(false);

  // States para modais de edição
  const [editingField, setEditingField] = useState<'profile' | 'provider' | 'alerts' | 'data' | 'about' | null>(null);

  // Handlers de persistência local
  const handleResetApp = () => {
    if (window.confirm('Deseja realmente redefinir o app? Isso apagará todo o histórico e configurações.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja limpar o histórico de testes?')) {
      localStorage.removeItem('linka.speedtest.history.v1');
      localStorage.removeItem('linka.speedtest.previous.v1');
      window.location.reload();
    }
  };

  return (
    <div className="lk-explore lk-settings fade-in" data-theme={theme}>
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        title="Ajustes"
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
        contractedDown={settings.contractedDown}
        contractedUp={settings.contractedUp}
        onUpdateContracted={(down, up) => onUpdateSettings({ contractedDown: down, contractedUp: up })}
        showContracted={false}
        useHaptics={settings.useHaptics}
        onToggleHaptics={(next) => onUpdateSettings({ useHaptics: next })}
        onResetOnboarding={onResetOnboarding}
      />

      <div className="lk-explore__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Ajustes" />

        {/* ── PERFIL E CONTA ─────────────────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Perfil e conta</p>
          <IOSList
            items={[
              {
                icon: <Icon name="person" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Meu perfil',
                subtitle: settings.userName || 'Dispositivo',
                showChevron: true,
                onClick: () => setEditingField('profile'),
              },
              {
                icon: <Icon name="business" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Provedor de internet',
                subtitle: [settings.providerName, settings.region].filter(Boolean).join(' · ') || 'Operadora e região',
                showChevron: true,
                onClick: () => setEditingField('provider'),
              },
            ]}
          />
        </div>

        {/* ── EXPERIÊNCIA DO APP ──────────────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Experiência do app</p>
          <IOSList
            items={[
              {
                icon: <Icon name={theme === 'dark' ? 'cog' : 'bolt'} size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Tema',
                subtitle: theme === 'dark' ? 'Escuro' : 'Claro',
                showChevron: true,
                onClick: onToggleTheme,
              },
              {
                icon: <Icon name="vibration" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Vibração tátil',
                subtitle: settings.useHaptics ? 'Ativada' : 'Desativada',
                trailing: (
                  <Toggle
                    active={settings.useHaptics}
                    onToggle={() => onUpdateSettings({ useHaptics: !settings.useHaptics })}
                  />
                ),
              },
            ]}
          />
        </div>

        {/* ── MEDIÇÃO E ALERTAS ───────────────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Medição e alertas</p>
          <IOSList
            items={[
              {
                icon: <Icon name="bolt" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Modo padrão',
                subtitle: settings.defaultMode === 'complete' ? 'Completo (recomendado)' : 'Rápido',
                showChevron: true,
                onClick: () => onUpdateSettings({ defaultMode: settings.defaultMode === 'complete' ? 'fast' : 'complete' }),
              },
              {
                icon: <Icon name="upload" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Plano contratado',
                subtitle: settings.contractedDown ? `${settings.contractedDown} Mbps download` : 'Não configurado',
                showChevron: true,
                onClick: () => setEditingField('provider'),
              },
              {
                icon: <Icon name="trending-down" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Alertas de qualidade',
                subtitle: settings.qualityAlertsActive ? `Avisar abaixo de ${settings.alertThresholdMbps} Mbps` : 'Desativados',
                showChevron: true,
                onClick: () => setEditingField('alerts'),
              },
            ]}
          />
        </div>

        {/* ── HISTÓRICO E DADOS ───────────────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Histórico e dados</p>
          <IOSList
            items={[
              ...(onShowHistory ? [{
                icon: <Icon name="history" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Histórico',
                subtitle: 'Suas medições recentes',
                showChevron: true,
                onClick: onShowHistory,
              }] : []),
              {
                icon: <Icon name="info" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Dados usados pelo Linka',
                subtitle: 'O que coletamos e como usamos',
                showChevron: true,
                onClick: () => setEditingField('data'),
              },
              {
                icon: <Icon name="delete" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Gerenciar dados locais',
                subtitle: 'Limpar histórico e preferências',
                showChevron: true,
                onClick: () => setEditingField('data'),
              },
            ]}
          />
        </div>

        {/* ── AJUDA E SOBRE ───────────────────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Ajuda e sobre</p>
          <IOSList
            items={[
              ...(onResetOnboarding ? [{
                icon: <Icon name="bulb" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Ver tutorial novamente',
                subtitle: 'Rever o guia de boas-vindas',
                showChevron: true,
                onClick: onResetOnboarding,
              }] : []),
              {
                icon: <Icon name="info" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Sobre o Linka',
                subtitle: 'v3.3.2 · Web PWA',
                showChevron: true,
                onClick: () => setEditingField('about'),
              },
            ]}
          />
        </div>

        <div className="lk-explore__bottom-pad" />
      </div>

      {/* ── Modais de Edição ─────────────────────────────────────────────────── */}
      {editingField === 'profile' && (
        <SettingsSheet
          title="Meu perfil"
          onClose={() => setEditingField(null)}
        >
          <div className="lk-settings-form">
            <label className="lk-settings-field">
              <span>Seu nome ou apelido</span>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                placeholder="Ex: João"
              />
            </label>
            <button className="lk-settings-save" onClick={() => setEditingField(null)}>Salvar</button>
          </div>
        </SettingsSheet>
      )}

      {editingField === 'provider' && (
        <SettingsSheet
          title="Provedor e Plano"
          onClose={() => setEditingField(null)}
        >
          <div className="lk-settings-form">
            <label className="lk-settings-field">
              <span>Operadora / ISP</span>
              <input
                type="text"
                value={settings.providerName}
                onChange={(e) => onUpdateSettings({ providerName: e.target.value })}
                placeholder="Ex: Vivo, Claro..."
              />
            </label>
            <label className="lk-settings-field">
              <span>Região</span>
              <input
                type="text"
                value={settings.region}
                onChange={(e) => onUpdateSettings({ region: e.target.value })}
                placeholder="Ex: São Paulo - SP"
              />
            </label>
            <label className="lk-settings-field">
              <span>Download contratado (Mbps)</span>
              <input
                type="number"
                value={settings.contractedDown || ''}
                onChange={(e) => onUpdateSettings({ contractedDown: Number(e.target.value) || null })}
                placeholder="Ex: 500"
              />
            </label>
            <button className="lk-settings-save" onClick={() => setEditingField(null)}>Salvar</button>
          </div>
        </SettingsSheet>
      )}

      {editingField === 'alerts' && (
        <SettingsSheet
          title="Alertas de qualidade"
          onClose={() => setEditingField(null)}
        >
          <div className="lk-settings-form">
            <div className="lk-settings-toggle-row">
              <span>Ativar alertas</span>
              <Toggle
                active={settings.qualityAlertsActive}
                onToggle={() => onUpdateSettings({ qualityAlertsActive: !settings.qualityAlertsActive })}
              />
            </div>
            <label className="lk-settings-field">
              <span>Avisar se download for menor que (Mbps)</span>
              <input
                type="number"
                disabled={!settings.qualityAlertsActive}
                value={settings.alertThresholdMbps || ''}
                onChange={(e) => onUpdateSettings({ alertThresholdMbps: Number(e.target.value) || 0 })}
                placeholder="Ex: 50"
              />
            </label>
            <button className="lk-settings-save" onClick={() => setEditingField(null)}>Salvar</button>
          </div>
        </SettingsSheet>
      )}

      {editingField === 'data' && (
        <SettingsSheet
          title="Gerenciar dados"
          onClose={() => setEditingField(null)}
        >
          <div className="lk-settings-data">
            <p>Seus dados são armazenados apenas localmente neste dispositivo.</p>
            <button className="lk-settings-btn lk-settings-btn--warn" onClick={handleClearHistory}>
              Limpar histórico de testes
            </button>
            <button className="lk-settings-btn lk-settings-btn--danger" onClick={handleResetApp}>
              Redefinir o app (Apagar tudo)
            </button>
          </div>
        </SettingsSheet>
      )}

      {editingField === 'about' && (
        <SettingsSheet
          title="Sobre o Linka"
          onClose={() => setEditingField(null)}
        >
          <div className="lk-settings-about">
            <div className="lk-settings-about-row">
              <span>Versão</span>
              <span>v3.3.2</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Plataforma</span>
              <span>Web PWA</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Motor</span>
              <span>Cloudflare Speedtest</span>
            </div>
            <p className="lk-settings-about-desc">
              O Linka é uma ferramenta de diagnóstico de rede focada em simplicidade e precisão.
            </p>
          </div>
        </SettingsSheet>
      )}
    </div>
  );
}

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <div
      className={`lk-settings-toggle${active ? ' lk-settings-toggle--active' : ''}`}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
    >
      <div className="lk-settings-toggle__thumb" />
    </div>
  );
}

function SettingsSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="lk-settings-sheet-overlay" onClick={onClose}>
      <div className="lk-settings-sheet fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="lk-settings-sheet__header">
          <h3>{title}</h3>
          <button className="lk-settings-sheet__close" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="lk-settings-sheet__body">
          {children}
        </div>
      </div>
    </div>
  );
}
