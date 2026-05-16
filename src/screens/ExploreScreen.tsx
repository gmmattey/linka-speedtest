import { useState } from 'react';
import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import type { Settings } from '../hooks/useSettings';
import { resolveCopy } from '../core';
import './ExploreScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onBack: () => void;
  onShowHistory?: () => void;
  onResetOnboarding?: () => void;
}

const ICON_BG_ACCENT = 'var(--accent-tint)';
const ICON_BG_DANGER = 'var(--error-tint)';

const Ic = ({ name }: { name: string }) => (
  <Icon name={name} size={16} color="var(--accent)" />
);
const IcDanger = ({ name }: { name: string }) => (
  <Icon name={name} size={16} color="var(--error)" />
);

const Badge = ({ label }: { label: string }) => (
  <span className="lk-explore__badge">{label}</span>
);

const CHANGELOG = [
  {
    version: 'v1.1.0',
    date: 'maio/2026',
    items: [
      'Diagnóstico inteligente Orbit IA com análise por atividade',
      'Tela inicial remodelada com caminho da rede',
      'Histórico detalhado de medições',
      'Chips de sintoma e perguntas contextuais no diagnóstico',
      'Bottom navigation bar com 4 abas',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'março/2026',
    items: [
      'Lançamento do Linka PWA',
      'Speed test com múltiplos provedores (Cloudflare)',
      'Diagnóstico básico de rede',
      'Histórico local de testes',
    ],
  },
];

export function ExploreScreen({
  theme,
  onToggleTheme,
  settings,
  onUpdateSettings,
  onBack: _onBack,
  onShowHistory,
  onResetOnboarding,
}: Props) {
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  const [showPerfil, setShowPerfil] = useState(false);
  const [showProvedor, setShowProvedor] = useState(false);
  const [showAlertas, setShowAlertas] = useState(false);
  const [showDados, setShowDados] = useState(false);
  const [showDadosLocais, setShowDadosLocais] = useState(false);
  const [showSobre, setShowSobre] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showDiagnosticoApp, setShowDiagnosticoApp] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleClearHistory = () => {
    localStorage.removeItem('linka.speedtest.history.v1');
    localStorage.removeItem('linka.speedtest.previous.v1');
    window.location.reload();
  };

  const handleResetApp = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="lk-explore lk-settings fade-in" data-theme={theme}>
      <TopBar
        scrolled={scrolled}
        title="Ajustes"
        showTitle={scrolled}
      />

      <div className="lk-explore__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Ajustes" />

        {/* ── PERFIL E CONTA ──────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Perfil e conta</p>
          <IOSList items={[
            {
              icon: <Ic name="person" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Meu perfil',
              subtitle: settings.userName || 'Dispositivo',
              showChevron: true,
              onClick: () => setShowPerfil(true),
            },
            {
              icon: <Ic name="business" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Provedor de internet',
              subtitle: [settings.providerName, settings.region].filter(Boolean).join(' · ') || 'Operadora e região',
              showChevron: true,
              onClick: () => setShowProvedor(true),
            },
          ]} />
        </div>

        {/* ── EXPERIÊNCIA DO APP ──────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Experiência do app</p>
          <IOSList items={[
            {
              icon: <Ic name={theme === 'dark' ? 'moon' : 'sun'} />,
              iconBg: ICON_BG_ACCENT,
              title: 'Tema',
              subtitle: theme === 'dark' ? 'Escuro' : 'Claro',
              showChevron: true,
              onClick: onToggleTheme,
            },
            {
              icon: <Ic name="vibration" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Vibração tátil',
              subtitle: settings.useHaptics ? 'Ativada' : 'Desativada',
              trailing: (
                <Toggle
                  active={settings.useHaptics}
                  onToggle={() => onUpdateSettings({ useHaptics: !settings.useHaptics })}
                />
              ),
            },
          ]} />
        </div>

        {/* ── MEDIÇÃO E ALERTAS ───────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Medição e alertas</p>
          <IOSList items={[
            {
              icon: <Ic name="trending-down" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Alertas de qualidade',
              subtitle: settings.qualityAlertsActive
                ? `Alertar abaixo de ${settings.alertThresholdMbps} Mbps`
                : 'Sem limite configurado',
              showChevron: true,
              onClick: () => setShowAlertas(true),
            },
            {
              icon: <Ic name="bolt" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Modo padrão',
              subtitle: settings.defaultMode === 'complete' ? 'Completo (recomendado)' : 'Rápido',
              showChevron: true,
              onClick: () => onUpdateSettings({ defaultMode: settings.defaultMode === 'complete' ? 'fast' : 'complete' }),
            },
          ]} />
        </div>

        {/* ── HISTÓRICO E DADOS ───────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Histórico e dados</p>
          <IOSList items={[
            ...(onShowHistory ? [{
              icon: <Ic name="history" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Histórico de testes',
              subtitle: 'Suas medições recentes',
              showChevron: true,
              onClick: onShowHistory,
            }] : []),
            {
              icon: <Ic name="upload" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Exportar dados',
              subtitle: 'CSV, JSON ou PDF',
              trailing: <Badge label="Em breve" />,
              onClick: undefined,
            },
            {
              icon: <Ic name="info" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Dados usados pelo Linka',
              subtitle: 'O que coletamos e como usamos',
              showChevron: true,
              onClick: () => setShowDados(true),
            },
            {
              icon: <Ic name="delete" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Gerenciar dados locais',
              subtitle: 'Limpar histórico e preferências',
              showChevron: true,
              onClick: () => setShowDadosLocais(true),
            },
          ]} />
        </div>

        {/* ── AJUDA E SOBRE ───────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Ajuda e sobre</p>
          <IOSList items={[
            {
              icon: <Ic name="bolt" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Novidades',
              subtitle: 'Confira o que mudou nas últimas versões',
              showChevron: true,
              onClick: () => setShowChangelog(true),
            },
            ...(onResetOnboarding ? [{
              icon: <Ic name="bulb" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Ver tutorial novamente',
              subtitle: 'Rever o guia de boas-vindas',
              showChevron: true,
              onClick: onResetOnboarding,
            }] : []),
            {
              icon: <Ic name="shield" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Diagnóstico do app',
              subtitle: 'Informações técnicas e integridade',
              showChevron: true,
              onClick: () => setShowDiagnosticoApp(true),
            },
            {
              icon: <IcDanger name="delete" />,
              iconBg: ICON_BG_DANGER,
              title: 'Redefinir o app',
              subtitle: 'Apaga todos os dados e restaura configurações iniciais',
              showChevron: true,
              onClick: () => setShowConfirmReset(true),
            },
            {
              icon: <Ic name="info" />,
              iconBg: ICON_BG_ACCENT,
              title: 'Sobre o Linka',
              subtitle: 'v1.1.0 · Web PWA',
              showChevron: true,
              onClick: () => setShowSobre(true),
            },
          ]} />
        </div>

        <div className="lk-explore__bottom-pad" />
      </div>

      {/* ── Perfil Sheet ──────────────────────────────────────────────── */}
      {showPerfil && (
        <SettingsSheet title="Meu perfil" onClose={() => setShowPerfil(false)}>
          <div className="lk-settings-form">
            <label className="lk-settings-field">
              <span>Seu nome ou apelido</span>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                placeholder="Ex: João"
                autoFocus
              />
            </label>
            <div className="lk-settings-info-rows">
              <div className="lk-settings-info-row">
                <span>Plataforma</span>
                <span>Web PWA</span>
              </div>
              <div className="lk-settings-info-row">
                <span>Versão</span>
                <span>v1.1.0</span>
              </div>
            </div>
            <button className="lk-settings-save" onClick={() => setShowPerfil(false)}>Salvar perfil</button>
          </div>
        </SettingsSheet>
      )}

      {/* ── Provedor Sheet ────────────────────────────────────────────── */}
      {showProvedor && (
        <SettingsSheet title="Dados do provedor" onClose={() => setShowProvedor(false)}>
          <div className="lk-settings-form">
            <p className="lk-settings-desc">Informe sua operadora e plano para análises personalizadas.</p>
            <label className="lk-settings-field">
              <span>Operadora / ISP</span>
              <input
                type="text"
                value={settings.providerName}
                onChange={(e) => onUpdateSettings({ providerName: e.target.value })}
                placeholder="Ex: Vivo, Claro, NET…"
                autoFocus
              />
            </label>
            <label className="lk-settings-field">
              <span>Plano contratado</span>
              <input
                type="text"
                value={settings.contractedDown ? `${settings.contractedDown} Mbps` : ''}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
                  onUpdateSettings({ contractedDown: Number.isNaN(n) ? null : n });
                }}
                placeholder="Ex: 500 Mbps fibra"
              />
            </label>
            <label className="lk-settings-field">
              <span>Cidade / Região</span>
              <input
                type="text"
                value={settings.region}
                onChange={(e) => onUpdateSettings({ region: e.target.value })}
                placeholder="Ex: São Paulo – SP"
              />
            </label>
            <button className="lk-settings-save" onClick={() => setShowProvedor(false)}>Salvar</button>
          </div>
        </SettingsSheet>
      )}

      {/* ── Alertas Sheet ─────────────────────────────────────────────── */}
      {showAlertas && (
        <SettingsSheet title="Alertas de qualidade" onClose={() => setShowAlertas(false)}>
          <div className="lk-settings-form">
            <p className="lk-settings-desc">
              Defina um limite mínimo de download. Quando sua conexão ficar abaixo desse valor, o Linka pode alertar você.
            </p>
            <div className="lk-settings-toggle-row">
              <span>Ativar alertas</span>
              <Toggle
                active={settings.qualityAlertsActive}
                onToggle={() => onUpdateSettings({ qualityAlertsActive: !settings.qualityAlertsActive })}
              />
            </div>
            <label className="lk-settings-field">
              <span>Mínimo de download (Mbps)</span>
              <input
                type="number"
                disabled={!settings.qualityAlertsActive}
                value={settings.alertThresholdMbps || ''}
                onChange={(e) => onUpdateSettings({ alertThresholdMbps: Number(e.target.value) || 0 })}
                placeholder="Ex: 50"
              />
            </label>
            {!settings.alertThresholdMbps && (
              <p className="lk-settings-hint">Deixe em branco para desativar os alertas.</p>
            )}
            <button className="lk-settings-save" onClick={() => setShowAlertas(false)}>Salvar</button>
          </div>
        </SettingsSheet>
      )}

      {/* ── Dados usados Sheet (W1-09 — Privacidade) ─────────────────── */}
      {showDados && (
        <SettingsSheet title="Dados usados pelo Linka" onClose={() => setShowDados(false)}>
          <PrivacyContent onClose={() => setShowDados(false)} />
        </SettingsSheet>
      )}

      {/* ── Gerenciar dados locais Sheet ──────────────────────────────── */}
      {showDadosLocais && (
        <SettingsSheet title="Gerenciar dados locais" onClose={() => setShowDadosLocais(false)}>
          <div className="lk-settings-data">
            <p>Estas ações são irreversíveis. Os dados serão removidos permanentemente do dispositivo.</p>
            <button
              className="lk-settings-btn lk-settings-btn--warn"
              onClick={() => {
                if (window.confirm('Deseja limpar o histórico de testes? Esta ação não pode ser desfeita.')) {
                  handleClearHistory();
                }
              }}
            >
              <Icon name="history" size={16} color="var(--warn)" />
              Limpar histórico de testes
            </button>
            <button
              className="lk-settings-btn lk-settings-btn--danger"
              onClick={() => {
                setShowDadosLocais(false);
                setShowConfirmReset(true);
              }}
            >
              <Icon name="delete" size={16} color="var(--error)" />
              Apagar dados locais
            </button>
          </div>
        </SettingsSheet>
      )}

      {/* ── Changelog Sheet ───────────────────────────────────────────── */}
      {showChangelog && (
        <SettingsSheet title="Novidades" onClose={() => setShowChangelog(false)}>
          <div className="lk-settings-changelog">
            {CHANGELOG.map((release) => (
              <div key={release.version} className="lk-settings-changelog-entry">
                <div className="lk-settings-changelog-header">
                  <span className="lk-settings-changelog-version">{release.version}</span>
                  <span className="lk-settings-changelog-date">{release.date}</span>
                </div>
                <ul className="lk-settings-changelog-list">
                  {release.items.map((item) => (
                    <li key={item}>
                      <span className="lk-settings-changelog-bullet">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="lk-settings-changelog-divider" />
              </div>
            ))}
          </div>
        </SettingsSheet>
      )}

      {/* ── Diagnóstico App Sheet ─────────────────────────────────────── */}
      {showDiagnosticoApp && (
        <SettingsSheet title="Diagnóstico do app" onClose={() => setShowDiagnosticoApp(false)}>
          <div className="lk-settings-about">
            <div className="lk-settings-about-row">
              <span>Versão</span>
              <span>v1.1.0</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Plataforma</span>
              <span>Web PWA</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Motor</span>
              <span>Cloudflare Speedtest</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Integridade</span>
              <span className="lk-settings-status-ok">✓ OK</span>
            </div>
          </div>
          <div className="lk-settings-diag-note">
            <Icon name="shield" size={14} color="var(--success)" />
            Nenhuma anomalia detectada
          </div>
        </SettingsSheet>
      )}

      {/* ── Sobre Sheet ───────────────────────────────────────────────── */}
      {showSobre && (
        <SettingsSheet title="Sobre o Linka" onClose={() => setShowSobre(false)}>
          <div className="lk-settings-about">
            <div className="lk-settings-about-row">
              <span>Versão</span>
              <span>v1.1.0</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Plataforma</span>
              <span>Web PWA</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Central de medição</span>
              <span>Cloudflare</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Desenvolvido por</span>
              <span>Equipe LINKA</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Suporte</span>
              <span>suporte@linka.app</span>
            </div>
            <p className="lk-settings-about-desc">
              O Linka é uma ferramenta de diagnóstico de rede focada em simplicidade e precisão.
            </p>
          </div>
        </SettingsSheet>
      )}

      {/* ── Confirm Reset Dialog ──────────────────────────────────────── */}
      {showConfirmReset && (
        <ConfirmDialog
          title="Redefinir o app?"
          message="Esta ação apagará todos os dados locais: histórico de testes, configurações salvas e preferências. O app voltará ao estado inicial. Esta ação não pode ser desfeita."
          onConfirm={handleResetApp}
          onCancel={() => setShowConfirmReset(false)}
        />
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

/** W1-09: Conteúdo do sheet de privacidade. Usa o copyDictionary como
 *  fonte da verdade — não duplica texto aqui. */
function PrivacyContent({ onClose }: { onClose: () => void }) {
  const collects = [
    'privacy.collects.1',
    'privacy.collects.2',
    'privacy.collects.3',
    'privacy.collects.4',
  ];
  const nots = [
    'privacy.not.1',
    'privacy.not.2',
    'privacy.not.3',
    'privacy.not.4',
  ];
  const rights = [
    'privacy.rights.1',
    'privacy.rights.2',
    'privacy.rights.3',
  ];
  return (
    <div className="lk-settings-privacy">
      <p className="lk-settings-privacy-section-title">{resolveCopy('privacy.collects.header')}</p>
      <ul className="lk-settings-data-list lk-settings-privacy-list">
        {collects.map((k) => <li key={k}>{resolveCopy(k)}</li>)}
      </ul>

      <p className="lk-settings-privacy-section-title lk-settings-privacy-section-title--nok">{resolveCopy('privacy.not.header')}</p>
      <ul className="lk-settings-data-list lk-settings-privacy-list">
        {nots.map((k) => (
          <li key={k} className="lk-settings-privacy-list-item--nok">
            {resolveCopy(k)}
          </li>
        ))}
      </ul>

      <p className="lk-settings-privacy-section-title">{resolveCopy('privacy.rights.header')}</p>
      <ul className="lk-settings-data-list lk-settings-privacy-list">
        {rights.map((k) => <li key={k}>{resolveCopy(k)}</li>)}
      </ul>

      <div className="lk-settings-privacy-delete">
        <p className="lk-settings-privacy-delete-sub">{resolveCopy('privacy.delete.subtitle')}</p>
        <a
          href="mailto:suporte@linka.app?subject=Exclusão de dados"
          className="lk-settings-btn lk-settings-btn--danger lk-settings-privacy-delete-btn"
          onClick={onClose}
        >
          {resolveCopy('privacy.delete.button')}
        </a>
      </div>
    </div>
  );
}

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <div
      className={`lk-settings-toggle${active ? ' lk-settings-toggle--active' : ''}`}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      role="switch"
      aria-checked={active}
    >
      <div className="lk-settings-toggle__thumb" />
    </div>
  );
}

function SettingsSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="lk-settings-sheet-overlay" onClick={onClose}>
      <div className="lk-settings-sheet fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="lk-settings-sheet__handle-row">
          <div className="lk-settings-sheet__handle" />
        </div>
        <div className="lk-settings-sheet__header">
          <h3>{title}</h3>
          <button className="lk-settings-sheet__close" onClick={onClose} aria-label="Fechar">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="lk-settings-sheet__body">
          {children}
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="lk-settings-dialog-overlay" onClick={onCancel}>
      <div className="lk-settings-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="lk-settings-dialog__title">{title}</h3>
        <p className="lk-settings-dialog__message">{message}</p>
        <div className="lk-settings-dialog__actions">
          <button className="lk-settings-dialog__btn lk-settings-dialog__btn--cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="lk-settings-dialog__btn lk-settings-dialog__btn--confirm" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
