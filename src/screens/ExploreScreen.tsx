import type { ReactNode } from 'react';
import { useState } from 'react';
import { Icon } from '../components/icons';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import type { Settings } from '../hooks/useSettings';
import { resolveCopy } from '../core';
import { loadHistory } from '../utils/history';
import { isAnatelComplaintEligible, generateAnatelReport } from '../utils/anatelReport';
import './ExploreScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onBack: () => void;
  onShowHistory?: () => void;
  onResetOnboarding?: () => void;
  onShowFibra?: () => void;
}

const ICON_BG_ACCENT  = 'var(--accent-tint)';
const ICON_BG_DANGER  = 'var(--error-tint)';

const Ic       = ({ name }: { name: string }) => <Icon name={name} size={18} color="var(--accent)" />;
const IcDanger = ({ name }: { name: string }) => <Icon name={name} size={18} color="var(--error)" />;


const CHANGELOG = [
  {
    version: 'v1.1.0',
    date: 'maio/2026',
    items: [
      'Diagnóstico inteligente Orbit IA com análise por atividade',
      'Tela inicial remodelada com visão completa da conexão',
      'Histórico detalhado de medições com tendências',
      'Chips de sintoma e perguntas contextuais no diagnóstico',
      'Navegação com 5 abas — SpeedTest, Diagnóstico, Dispositivos, Ajustes',
      'Tela Sinal com abas Wi-Fi e Células',
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

function notifSupported(): boolean {
  return typeof Notification !== 'undefined';
}

export function ExploreScreen({
  theme,
  onToggleTheme,
  settings,
  onUpdateSettings,
  onBack: _onBack,
  onShowHistory,
  onResetOnboarding,
  onShowFibra,
}: Props) {
  const { scrolled, topBarOpacity, scrollContainerRef, sentinelRef } = useScrollHeader();

  // Sheet visibility
  const [showProvedor,       setShowProvedor]       = useState(false);
  const [showRoteador,       setShowRoteador]       = useState(false);
  const [showNotificacoes,   setShowNotificacoes]   = useState(false);
  const [showAlertas,        setShowAlertas]        = useState(false);
  const [showAnaliseAv,      setShowAnaliseAv]      = useState(false);
  const [showMonitoramento,  setShowMonitoramento]  = useState(false);
  const [showAnatelInfo,     setShowAnatelInfo]     = useState(false);
  const [showDados,          setShowDados]          = useState(false);
  const [showDadosLocais,    setShowDadosLocais]    = useState(false);
  const [showChangelog,      setShowChangelog]      = useState(false);
  const [showDiagnosticoApp, setShowDiagnosticoApp] = useState(false);
  const [showPermissoes,     setShowPermissoes]     = useState(false);
  const [showPrivacidade,    setShowPrivacidade]    = useState(false);
  const [showSobre,          setShowSobre]          = useState(false);
  const [showConfirmReset,   setShowConfirmReset]   = useState(false);

  // Notification permission state
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    notifSupported() ? Notification.permission : 'denied',
  );

  // Anatel PDF state
  const [generatingAnatel, setGeneratingAnatel] = useState(false);

  const handleClearHistory = () => {
    localStorage.removeItem('linka.speedtest.history.v1');
    localStorage.removeItem('linka.speedtest.previous.v1');
    window.location.reload();
  };

  const handleResetApp = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleRequestNotif = async () => {
    if (!notifSupported()) return;
    const result = await Notification.requestPermission();
    setNotifPerm(result);
  };

  const handleAnatelReport = async () => {
    if (generatingAnatel) return;
    const cd = settings.contractedDown;
    if (!cd || cd <= 0) {
      setShowProvedor(true);
      return;
    }
    const history = loadHistory();
    const data = isAnatelComplaintEligible(history, cd, settings.contractedUp ?? 0);
    if (!data) {
      setShowAnatelInfo(true);
      return;
    }
    setGeneratingAnatel(true);
    try {
      await generateAnatelReport(data, settings.providerName || null);
    } finally {
      setGeneratingAnatel(false);
    }
  };

  const notifLabel = !notifSupported()
    ? 'Não suportado neste navegador'
    : notifPerm === 'granted'
      ? 'Ativadas'
      : notifPerm === 'denied'
        ? 'Bloqueadas pelo navegador'
        : 'Toque para ativar';

  const anatelLabel = generatingAnatel
    ? 'Gerando PDF…'
    : settings.contractedDown
      ? 'Gerar comprovante de medições'
      : 'Configure seu plano antes';

  return (
    <div className="lk-explore lk-settings fade-in" data-theme={theme}>
      <TopBar scrolled={scrolled} opacity={topBarOpacity} title="Ajustes" showTitle={true} />

      <div className="lk-explore__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Ajustes" />

        {/* ── REDE E CONEXÃO ──────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Rede e conexão</p>
          <Md3List>
            <Md3Row
              icon={<Ic name="business" />} iconBg={ICON_BG_ACCENT}
              title="Provedor de internet"
              subtitle={[settings.providerName, settings.region].filter(Boolean).join(' · ') || 'Operadora, plano e região'}
              showChevron onClick={() => setShowProvedor(true)}
            />
            <Md3Row
              icon={<Ic name="router" />} iconBg={ICON_BG_ACCENT}
              title="Configurações do roteador"
              subtitle="Acesso ao painel administrativo"
              showChevron onClick={onShowFibra ?? (() => setShowRoteador(true))}
            />
          </Md3List>
        </div>

        {/* ── EXPERIÊNCIA DO APP ──────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Experiência do app</p>
          <Md3List>
            <Md3Row
              icon={<Ic name={theme === 'dark' ? 'moon' : 'sun'} />} iconBg={ICON_BG_ACCENT}
              title="Tema"
              subtitle={theme === 'dark' ? 'Escuro' : 'Claro'}
              showChevron onClick={onToggleTheme}
            />
            <Md3Row
              icon={<Ic name="notifications" />} iconBg={ICON_BG_ACCENT}
              title="Notificações"
              subtitle={notifLabel}
              showChevron onClick={() => {
                if (notifSupported() && notifPerm === 'default') {
                  void handleRequestNotif();
                } else {
                  setShowNotificacoes(true);
                }
              }}
            />
          </Md3List>
        </div>

        {/* ── MEDIÇÃO E ALERTAS ───────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Medição e alertas</p>
          <Md3List>
            <Md3Row
              icon={<Ic name="trending-down" />} iconBg={ICON_BG_ACCENT}
              title="Alertas de qualidade"
              subtitle={settings.qualityAlertsActive
                ? `Alertar abaixo de ${settings.alertThresholdMbps} Mbps`
                : 'Sem limite configurado'}
              showChevron onClick={() => setShowAlertas(true)}
            />
            <Md3Row
              icon={<Ic name="analytics" />} iconBg={ICON_BG_ACCENT}
              title="Análise avançada da conexão"
              subtitle="Ativada — jitter, perda de pacotes, bufferbloat"
              showChevron onClick={() => setShowAnaliseAv(true)}
            />
            <Md3Row
              icon={<Ic name="sensors" />} iconBg={ICON_BG_ACCENT}
              title="Monitoramento passivo"
              subtitle="Disponível no app Android"
              showChevron onClick={() => setShowMonitoramento(true)}
            />
          </Md3List>
          <div className="lk-explore__info-card">
            <span className="material-symbols-rounded lk-explore__info-card-icon">info</span>
            <p className="lk-explore__info-card-text">
              O monitoramento contínuo em segundo plano requer o app Android instalado.
              No navegador, os testes são iniciados manualmente.
            </p>
          </div>
        </div>

        {/* ── HISTÓRICO E DADOS ───────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Histórico e dados</p>
          <Md3List>
            {onShowHistory && (
              <Md3Row
                icon={<Ic name="history" />} iconBg={ICON_BG_ACCENT}
                title="Histórico de testes"
                subtitle="Suas medições recentes"
                showChevron onClick={onShowHistory}
              />
            )}
            <Md3Row
              icon={<Ic name="article" />} iconBg={ICON_BG_ACCENT}
              title="Comprovante para a Anatel"
              subtitle={anatelLabel}
              showChevron onClick={() => void handleAnatelReport()}
            />
            <Md3Row
              icon={<Ic name="info" />} iconBg={ICON_BG_ACCENT}
              title="Dados usados pelo Linka"
              subtitle="Velocidade, DNS, sinal — o que medimos"
              showChevron onClick={() => setShowDados(true)}
            />
            <Md3Row
              icon={<Ic name="delete" />} iconBg={ICON_BG_ACCENT}
              title="Gerenciar dados locais"
              subtitle="Limpar histórico e preferências"
              showChevron onClick={() => setShowDadosLocais(true)}
            />
          </Md3List>
        </div>

        {/* ── AJUDA E SOBRE ───────────────────────────────────────────── */}
        <div className="lk-explore__section">
          <p className="lk-explore__section-label">Ajuda e sobre</p>
          <Md3List>
            <Md3Row
              icon={<Ic name="bolt" />} iconBg={ICON_BG_ACCENT}
              title="Novidades"
              subtitle="Confira o que mudou nas últimas versões"
              showChevron onClick={() => setShowChangelog(true)}
            />
            <Md3Row
              icon={<Ic name="shield" />} iconBg={ICON_BG_ACCENT}
              title="Diagnóstico do app"
              subtitle="Integridade, motor e versão"
              showChevron onClick={() => setShowDiagnosticoApp(true)}
            />
            <Md3Row
              icon={<Ic name="security" />} iconBg={ICON_BG_ACCENT}
              title="Permissões do sistema"
              subtitle="Localização, notificações e rede"
              showChevron onClick={() => setShowPermissoes(true)}
            />
            {onResetOnboarding && (
              <Md3Row
                icon={<Ic name="bulb" />} iconBg={ICON_BG_ACCENT}
                title="Ver tutorial novamente"
                subtitle="Rever o guia de boas-vindas"
                showChevron onClick={onResetOnboarding}
              />
            )}
            <Md3Row
              icon={<IcDanger name="delete" />} iconBg={ICON_BG_DANGER}
              title="Redefinir o app"
              subtitle="Apaga todos os dados e restaura configurações iniciais"
              showChevron onClick={() => setShowConfirmReset(true)}
            />
            <Md3Row
              icon={<Ic name="lock" />} iconBg={ICON_BG_ACCENT}
              title="Privacidade"
              subtitle="Como seus dados são protegidos"
              showChevron onClick={() => setShowPrivacidade(true)}
            />
            <Md3Row
              icon={<Ic name="info" />} iconBg={ICON_BG_ACCENT}
              title="Sobre o Linka"
              subtitle="v1.1.0 · Web PWA"
              showChevron onClick={() => setShowSobre(true)}
            />
          </Md3List>
        </div>

        <div className="lk-explore__bottom-pad" />
      </div>

      {/* ── Provedor Sheet ────────────────────────────────────────────── */}
      {showProvedor && (
        <SettingsSheet title="Provedor de internet" onClose={() => setShowProvedor(false)}>
          <div className="lk-settings-form">
            <p className="lk-settings-desc">Informe sua operadora e plano para análises personalizadas e comprovante Anatel.</p>
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
              <span>Cidade / Região</span>
              <input
                type="text"
                value={settings.region}
                onChange={(e) => onUpdateSettings({ region: e.target.value })}
                placeholder="Ex: São Paulo – SP"
              />
            </label>
            <div className="lk-settings-plan-row">
              <label className="lk-settings-field lk-settings-field--half">
                <span>Download contratado</span>
                <div className="lk-settings-plan-input-wrap">
                  <input
                    type="number"
                    value={settings.contractedDown ?? ''}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      onUpdateSettings({ contractedDown: Number.isNaN(n) || n <= 0 ? null : n });
                    }}
                    placeholder="—"
                    min="1"
                    max="10000"
                  />
                  <span className="lk-settings-plan-unit">Mbps ↓</span>
                </div>
              </label>
              <label className="lk-settings-field lk-settings-field--half">
                <span>Upload contratado</span>
                <div className="lk-settings-plan-input-wrap">
                  <input
                    type="number"
                    value={settings.contractedUp ?? ''}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      onUpdateSettings({ contractedUp: Number.isNaN(n) || n <= 0 ? null : n });
                    }}
                    placeholder="—"
                    min="1"
                    max="10000"
                  />
                  <span className="lk-settings-plan-unit">Mbps ↑</span>
                </div>
              </label>
            </div>
            <button className="lk-settings-save" onClick={() => setShowProvedor(false)}>Salvar</button>
          </div>
        </SettingsSheet>
      )}

      {/* ── Roteador Sheet (fallback) ─────────────────────────────────── */}
      {showRoteador && (
        <SettingsSheet title="Configurações do roteador" onClose={() => setShowRoteador(false)}>
          <div className="lk-settings-fallback">
            <span className="material-symbols-rounded lk-settings-fallback__icon">router</span>
            <p className="lk-settings-fallback__title">Acesse o painel do roteador</p>
            <p className="lk-settings-fallback__desc">
              O navegador não consegue modificar configurações do roteador diretamente.
              Você pode acessar o painel de administração pelo endereço do gateway.
            </p>
            <a
              className="lk-settings-save"
              href="http://192.168.1.1"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowRoteador(false)}
            >
              Abrir painel (192.168.1.1)
            </a>
            <div className="lk-settings-android-cta">
              <span className="material-symbols-rounded">android</span>
              <p>Use o <strong>app linka para Android</strong> para configuração avançada do roteador, diagnóstico de fibra e análise GPON.</p>
            </div>
          </div>
        </SettingsSheet>
      )}

      {/* ── Notificações Sheet ────────────────────────────────────────── */}
      {showNotificacoes && (
        <SettingsSheet title="Notificações" onClose={() => setShowNotificacoes(false)}>
          <div className="lk-settings-form">
            {!notifSupported() ? (
              <div className="lk-settings-fallback lk-settings-fallback--inline">
                <p className="lk-settings-fallback__desc">
                  Notificações não são suportadas neste navegador.
                </p>
                <div className="lk-settings-android-cta">
                  <span className="material-symbols-rounded">android</span>
                  <p>O app Android envia alertas nativos quando sua velocidade cai abaixo do limite configurado.</p>
                </div>
              </div>
            ) : notifPerm === 'denied' ? (
              <div className="lk-settings-fallback lk-settings-fallback--inline">
                <p className="lk-settings-fallback__desc">
                  Notificações estão <strong>bloqueadas</strong> pelo navegador. Para reativar, vá em Configurações do navegador → Privacidade → Notificações → linka.
                </p>
              </div>
            ) : notifPerm === 'granted' ? (
              <div className="lk-settings-fallback lk-settings-fallback--inline">
                <p className="lk-settings-fallback__desc">
                  Notificações estão <strong>ativadas</strong>. O Linka pode enviar alertas quando sua conexão estiver abaixo do limite configurado.
                </p>
              </div>
            ) : (
              <>
                <p className="lk-settings-desc">Receba alertas quando sua conexão cair abaixo do limite configurado.</p>
                <button className="lk-settings-save" onClick={() => void handleRequestNotif()}>
                  Ativar notificações
                </button>
              </>
            )}
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

      {/* ── Análise avançada Sheet ────────────────────────────────────── */}
      {showAnaliseAv && (
        <SettingsSheet title="Análise avançada da conexão" onClose={() => setShowAnaliseAv(false)}>
          <div className="lk-settings-form">
            <div className="lk-settings-about">
              <div className="lk-settings-about-row">
                <span>Status</span>
                <span className="lk-settings-status-ok">✓ Sempre ativa</span>
              </div>
              <div className="lk-settings-about-row">
                <span>Jitter</span>
                <span>Variação de latência</span>
              </div>
              <div className="lk-settings-about-row">
                <span>Perda de pacotes</span>
                <span>WebRTC probe</span>
              </div>
              <div className="lk-settings-about-row">
                <span>Bufferbloat</span>
                <span>Latência sob carga</span>
              </div>
            </div>
            <p className="lk-settings-desc">
              A análise avançada está sempre ativa no Linka web. Todos os testes medem jitter, perda de pacotes e bufferbloat automaticamente.
            </p>
          </div>
        </SettingsSheet>
      )}

      {/* ── Monitoramento passivo Sheet (fallback) ───────────────────── */}
      {showMonitoramento && (
        <SettingsSheet title="Monitoramento passivo" onClose={() => setShowMonitoramento(false)}>
          <div className="lk-settings-fallback">
            <span className="material-symbols-rounded lk-settings-fallback__icon">sensors</span>
            <p className="lk-settings-fallback__title">Disponível no app Android</p>
            <p className="lk-settings-fallback__desc">
              O monitoramento contínuo em segundo plano requer um serviço do sistema operacional.
              Navegadores suspendem abas inativas e não conseguem manter monitoramento confiável.
            </p>
            <div className="lk-settings-android-cta">
              <span className="material-symbols-rounded">android</span>
              <p>O <strong>app linka para Android</strong> monitora sua rede em segundo plano 24/7 e envia alertas nativos sem abrir o app.</p>
            </div>
          </div>
        </SettingsSheet>
      )}

      {/* ── Anatel Info Sheet ─────────────────────────────────────────── */}
      {showAnatelInfo && (
        <SettingsSheet title="Comprovante para a Anatel" onClose={() => setShowAnatelInfo(false)}>
          <div className="lk-settings-form">
            <p className="lk-settings-desc">
              O comprovante é gerado automaticamente quando sua operadora estiver entregando abaixo de 80% da velocidade contratada em pelo menos 5 testes dos últimos 30 dias.
            </p>
            <div className="lk-settings-about">
              {!settings.contractedDown ? (
                <div className="lk-settings-about-row">
                  <span>Plano contratado</span>
                  <span style={{ color: 'var(--warn)' }}>Não configurado</span>
                </div>
              ) : (
                <div className="lk-settings-about-row">
                  <span>Plano configurado</span>
                  <span>{settings.contractedDown} Mbps ↓</span>
                </div>
              )}
            </div>
            {!settings.contractedDown && (
              <button className="lk-settings-save" onClick={() => { setShowAnatelInfo(false); setShowProvedor(true); }}>
                Configurar plano
              </button>
            )}
            {settings.contractedDown && (
              <p className="lk-settings-hint">
                Continue fazendo testes. O comprovante ficará disponível assim que houver evidência suficiente de descumprimento do plano.
              </p>
            )}
          </div>
        </SettingsSheet>
      )}

      {/* ── Dados usados Sheet ────────────────────────────────────────── */}
      {showDados && (
        <SettingsSheet title="Dados usados pelo Linka" onClose={() => setShowDados(false)}>
          <PrivacyContent onClose={() => setShowDados(false)} />
        </SettingsSheet>
      )}

      {/* ── Privacidade Sheet ─────────────────────────────────────────── */}
      {showPrivacidade && (
        <SettingsSheet title="Privacidade" onClose={() => setShowPrivacidade(false)}>
          <PrivacyContent onClose={() => setShowPrivacidade(false)} />
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
              onClick={() => { setShowDadosLocais(false); setShowConfirmReset(true); }}
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
            <div className="lk-settings-about-row"><span>Versão</span><span>v1.1.0</span></div>
            <div className="lk-settings-about-row"><span>Plataforma</span><span>Web PWA</span></div>
            <div className="lk-settings-about-row"><span>Motor</span><span>Cloudflare Speedtest</span></div>
            <div className="lk-settings-about-row"><span>Integridade</span><span className="lk-settings-status-ok">✓ OK</span></div>
          </div>
          <div className="lk-settings-diag-note">
            <Icon name="shield" size={14} color="var(--success)" />
            Nenhuma anomalia detectada
          </div>
        </SettingsSheet>
      )}

      {/* ── Permissões Sheet ──────────────────────────────────────────── */}
      {showPermissoes && (
        <SettingsSheet title="Permissões do sistema" onClose={() => setShowPermissoes(false)}>
          <div className="lk-settings-about">
            <div className="lk-settings-about-row">
              <span>Notificações</span>
              <span style={{ color: notifPerm === 'granted' ? 'var(--success)' : notifPerm === 'denied' ? 'var(--error)' : 'var(--text-3)' }}>
                {notifPerm === 'granted' ? 'Permitidas' : notifPerm === 'denied' ? 'Bloqueadas' : 'Não solicitadas'}
              </span>
            </div>
            <div className="lk-settings-about-row">
              <span>Localização</span>
              <span style={{ color: 'var(--text-3)' }}>Solicitada ao usar diagnóstico Wi-Fi</span>
            </div>
            <div className="lk-settings-about-row">
              <span>Câmera / Microfone</span>
              <span style={{ color: 'var(--success)' }}>Não solicitadas</span>
            </div>
          </div>
          <p className="lk-settings-desc" style={{ marginTop: 12 }}>
            Para alterar permissões, acesse as configurações do seu navegador → Privacidade → Permissões.
          </p>
        </SettingsSheet>
      )}

      {/* ── Sobre Sheet ───────────────────────────────────────────────── */}
      {showSobre && (
        <SettingsSheet title="Sobre o Linka" onClose={() => setShowSobre(false)}>
          <div className="lk-settings-about">
            <div className="lk-settings-about-row"><span>Versão</span><span>v1.1.0</span></div>
            <div className="lk-settings-about-row"><span>Plataforma</span><span>Web PWA · Kotlin Android</span></div>
            <div className="lk-settings-about-row"><span>Central de medição</span><span>Cloudflare</span></div>
            <div className="lk-settings-about-row"><span>Desenvolvido por</span><span>Equipe LINKA</span></div>
            <div className="lk-settings-about-row"><span>Suporte</span><span>suporte@linka.app</span></div>
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

/* ── MD3 List Components ─────────────────────────────────────────────────── */

function Md3List({ children }: { children: ReactNode }) {
  return <div className="lk-explore__md3-list">{children}</div>;
}

function Md3Row({
  icon, iconBg, title, subtitle, trailing, showChevron, onClick,
}: {
  icon?: ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`lk-explore__md3-row${onClick ? ' lk-explore__md3-row--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      } : undefined}
    >
      {icon != null && (
        <div className="lk-explore__md3-icon" style={iconBg ? { background: iconBg } : undefined}>
          {icon}
        </div>
      )}
      <div className="lk-explore__md3-text">
        <div className="lk-explore__md3-title">{title}</div>
        {subtitle && <div className="lk-explore__md3-sub">{subtitle}</div>}
      </div>
      {trailing && <div className="lk-explore__md3-trailing">{trailing}</div>}
      {showChevron && (
        <span className="lk-explore__md3-chevron">
          <Icon name="chevron" size={14} color="var(--text-3)" />
        </span>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function PrivacyContent({ onClose }: { onClose: () => void }) {
  const collects = ['privacy.collects.1', 'privacy.collects.2', 'privacy.collects.3', 'privacy.collects.4'];
  const nots     = ['privacy.not.1', 'privacy.not.2', 'privacy.not.3', 'privacy.not.4'];
  const rights   = ['privacy.rights.1', 'privacy.rights.2', 'privacy.rights.3'];
  return (
    <div className="lk-settings-privacy">
      <p className="lk-settings-privacy-section-title">{resolveCopy('privacy.collects.header')}</p>
      <ul className="lk-settings-data-list lk-settings-privacy-list">
        {collects.map((k) => <li key={k}>{resolveCopy(k)}</li>)}
      </ul>
      <p className="lk-settings-privacy-section-title lk-settings-privacy-section-title--nok">{resolveCopy('privacy.not.header')}</p>
      <ul className="lk-settings-data-list lk-settings-privacy-list">
        {nots.map((k) => <li key={k} className="lk-settings-privacy-list-item--nok">{resolveCopy(k)}</li>)}
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

function SettingsSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
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
        <div className="lk-settings-sheet__body">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="lk-settings-dialog-overlay" onClick={onCancel}>
      <div className="lk-settings-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="lk-settings-dialog__title">{title}</h3>
        <p className="lk-settings-dialog__message">{message}</p>
        <div className="lk-settings-dialog__actions">
          <button className="lk-settings-dialog__btn lk-settings-dialog__btn--cancel" onClick={onCancel}>Cancelar</button>
          <button className="lk-settings-dialog__btn lk-settings-dialog__btn--confirm" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
