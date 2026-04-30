import { useState } from 'react';
import { Icon } from '../components/icons';
import './DNSGuideScreen.css';

interface Props {
  serverId: string;
  onBack: () => void;
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

export function DNSGuideScreen({ serverId, onBack }: Props) {
  const [platform, setPlatform] = useState<Platform>('android');
  const server = SERVER_INFO[serverId] ?? SERVER_INFO['cloudflare'];
  const steps = getSteps(platform, server.primary, server.secondary, server.name);

  return (
    <div className="lk-dns-guide fade-in">
      <div className="lk-dns-guide__head">
        <button className="lk-dns-guide__back" onClick={onBack}>
          <Icon name="chevron" size={16} color="var(--accent)" />
          <span>Voltar</span>
        </button>
        <span className="lk-dns-guide__head-label">Como trocar o DNS</span>
        <span />
      </div>

      <div className="lk-dns-guide__scroll">
        <div className="lk-dns-guide__hero">
          <p className="lk-dns-guide__hero-title">{server.name}</p>
          <div className="lk-dns-guide__ips">
            <span className="lk-dns-guide__ip-badge">{server.primary}</span>
            <span className="lk-dns-guide__ip-badge">{server.secondary}</span>
          </div>
        </div>

        <div className="lk-dns-guide__tabs" role="tablist">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={platform === p}
              className={`lk-dns-guide__tab${platform === p ? ' lk-dns-guide__tab--active' : ''}`}
              onClick={() => setPlatform(p)}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        <ol className="lk-dns-guide__steps">
          {steps.map((step, i) => (
            <li key={i} className="lk-dns-guide__step">
              <span className="lk-dns-guide__step-num">{i + 1}</span>
              <span className="lk-dns-guide__step-text">{step}</span>
            </li>
          ))}
        </ol>

        <p className="lk-dns-guide__note">
          A troca de DNS não garante mais velocidade, mas pode reduzir a latência de resolução de domínios e melhorar a privacidade.
        </p>
      </div>
    </div>
  );
}
