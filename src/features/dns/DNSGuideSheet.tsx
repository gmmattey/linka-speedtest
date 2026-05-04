import { useEffect, useState } from 'react';
import { Icon } from '../../components/icons';
import './DNSGuideSheet.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** ID do servidor DNS para o qual o guia será exibido (default cloudflare). */
  serverId?: string;
}

type Platform = 'android' | 'ios' | 'windows' | 'router';

const SERVER_INFO: Record<string, { name: string; primary: string; secondary: string }> = {
  cloudflare: { name: 'Cloudflare',  primary: '1.1.1.1',        secondary: '1.0.0.1'      },
  google:     { name: 'Google',      primary: '8.8.8.8',        secondary: '8.8.4.4'      },
  adguard:    { name: 'AdGuard',     primary: '94.140.14.14',   secondary: '94.140.15.15' },
  quad9:      { name: 'Quad9',       primary: '9.9.9.9',        secondary: '149.112.112.112' },
  opendns:    { name: 'OpenDNS',     primary: '208.67.222.222', secondary: '208.67.220.220' },
};

const PLATFORM_LABELS: Record<Platform, string> = {
  android: 'Android',
  ios:     'iPhone / iPad',
  windows: 'Windows',
  router:  'Roteador',
};

function getSteps(platform: Platform, primary: string, secondary: string, serverName: string): string[] {
  switch (platform) {
    case 'android':
      return [
        'Abra Configurações → Rede e internet.',
        'Toque em DNS privado.',
        'Escolha "Hostname do provedor DNS privado".',
        `Digite o hostname DoH do ${serverName} (ex: dns.google para Google) ou use DNS-over-TLS se disponível.`,
        `Alternativa via Wi-Fi: Configurações → Wi-Fi → toque na rede → Avançado → configurar IP → inserir DNS ${primary} e ${secondary}.`,
      ];
    case 'ios':
      return [
        'Abra Ajustes → Wi-Fi.',
        'Toque no ícone ⓘ ao lado da rede conectada.',
        'Role até DNS e toque em "Configurar DNS".',
        'Selecione "Manual" e remova os servidores existentes.',
        `Toque em "Adicionar servidor" e insira ${primary}.`,
        `Adicione um segundo servidor: ${secondary}.`,
        'Toque em Salvar.',
      ];
    case 'windows':
      return [
        'Abra Configurações → Rede e Internet.',
        'Clique em "Propriedades" da conexão ativa (Wi-Fi ou Ethernet).',
        'Em "Atribuição de servidor DNS", clique em Editar.',
        'Selecione "Manual" e ative IPv4.',
        `Preencha DNS preferencial: ${primary}`,
        `Preencha DNS alternativo: ${secondary}`,
        'Clique em Salvar.',
      ];
    case 'router':
      return [
        'Acesse o painel do roteador pelo navegador (geralmente 192.168.0.1 ou 192.168.1.1).',
        'Faça login com usuário e senha (padrão geralmente "admin" / "admin").',
        'Procure a seção WAN, Internet ou DNS.',
        `Substitua o DNS primário por ${primary}.`,
        `Substitua o DNS secundário por ${secondary}.`,
        'Salve as alterações e reinicie o roteador se necessário.',
        'Todos os dispositivos da rede passarão a usar o novo DNS automaticamente.',
      ];
  }
}

/**
 * DNSGuideSheet — bottom sheet com o guia de troca de DNS por plataforma.
 *
 * Substitui a antiga `DNSGuideScreen` (rota dedicada) — refator 2026-05.
 * Acionado pelo botão "Como alterar" do accordion DNS na ResultScreen.
 *
 * Implementação como sheet (não rota): conteúdo é overlay em cima do Result
 * sem trocar a tela ativa, encurta o caminho de volta.
 */
export function DNSGuideSheet({ open, onClose, serverId = 'cloudflare' }: Props) {
  const [platform, setPlatform] = useState<Platform>('android');
  const server = SERVER_INFO[serverId] ?? SERVER_INFO['cloudflare'];
  const steps = getSteps(platform, server.primary, server.secondary, server.name);

  // Esc fecha; trava scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="lk-dns-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="lk-dns-sheet" role="dialog" aria-modal="true" aria-label="Guia DNS">
        <div className="lk-dns-sheet__handle" aria-hidden="true" />
        <button
          type="button"
          className="lk-dns-sheet__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <Icon name="close" size={18} color="var(--text-2)" />
        </button>

        <div className="lk-dns-sheet__scroll">
          <header className="lk-dns-sheet__header">
            <p className="lk-dns-sheet__title">Guia DNS</p>
            <p className="lk-dns-sheet__subtitle">Como trocar o DNS para {server.name}</p>
          </header>

          <div className="lk-dns-sheet__hero">
            <p className="lk-dns-sheet__hero-title">{server.name}</p>
            <div className="lk-dns-sheet__ips">
              <span className="lk-dns-sheet__ip-badge">{server.primary}</span>
              <span className="lk-dns-sheet__ip-badge">{server.secondary}</span>
            </div>
          </div>

          <div className="lk-dns-sheet__tabs" role="tablist">
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={platform === p}
                className={`lk-dns-sheet__tab${platform === p ? ' lk-dns-sheet__tab--active' : ''}`}
                onClick={() => setPlatform(p)}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>

          <ol className="lk-dns-sheet__steps">
            {steps.map((step, i) => (
              <li key={i} className="lk-dns-sheet__step">
                <span className="lk-dns-sheet__step-num">{i + 1}</span>
                <span className="lk-dns-sheet__step-text">{step}</span>
              </li>
            ))}
          </ol>

          <p className="lk-dns-sheet__note">
            A troca de DNS não garante mais velocidade, mas pode reduzir a latência
            de resolução de domínios e melhorar a privacidade.
          </p>
        </div>
      </div>
    </>
  );
}
