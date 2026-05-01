import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import { HamburgerMenu } from '../components/HamburgerMenu';
import './ExploreScreen.css';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  contractedDown: number | null;
  contractedUp: number | null;
  onUpdateContracted: (down: number | null, up: number | null) => void;
  hasResult: boolean;
  onBack: () => void;
  onDiagnostic?: () => void;
  onRecommend?: () => void;
  onGamer?: () => void;
  onStartProvaReal?: () => void;
  onStartRoomTest?: () => void;
  onStartComparison?: () => void;
  onStartBeforeAfter?: () => void;
  onShowDNSBenchmark?: () => void;
  onShowDNSGuide?: () => void;
}

export function ExploreScreen({
  theme,
  onToggleTheme,
  contractedDown,
  contractedUp,
  onUpdateContracted,
  hasResult,
  onBack,
  onDiagnostic,
  onRecommend,
  onGamer,
  onStartProvaReal,
  onStartRoomTest,
  onStartComparison,
  onStartBeforeAfter,
  onShowDNSBenchmark,
  onShowDNSGuide,
}: Props) {
  const showResultSection = hasResult && (onDiagnostic || onRecommend || onGamer);
  const showAdvancedSection = onStartProvaReal || onStartRoomTest || onStartComparison || onStartBeforeAfter;
  const dnsHandler = onShowDNSBenchmark ?? onShowDNSGuide;
  const dnsLabel = onShowDNSBenchmark ? 'Verificar DNS' : 'Guia de DNS';
  const dnsSubtitle = onShowDNSBenchmark
    ? 'Teste os servidores DNS disponíveis'
    : 'Veja como trocar o DNS do dispositivo';

  return (
    <div className="lk-explore fade-in" data-theme={theme}>
      <div className="lk-explore__head">
        <button className="lk-explore__back" onClick={onBack}>
          ‹ Voltar
        </button>
        <span className="lk-explore__title">Explorar</span>
        <HamburgerMenu
          theme={theme}
          onToggleTheme={onToggleTheme}
          contractedDown={contractedDown}
          contractedUp={contractedUp}
          onUpdateContracted={onUpdateContracted}
          showContracted={false}
        />
      </div>

      <div className="lk-explore__scroll">
        {showResultSection && (
          <div className="lk-explore__section">
            <p className="lk-explore__section-label">Entender meu resultado</p>
            <IOSList
              items={[
                ...(onDiagnostic ? [{
                  icon: <Icon name="shield" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Diagnóstico completo',
                  subtitle: 'Análise de cada métrica da sua conexão',
                  showChevron: true,
                  onClick: onDiagnostic,
                }] : []),
                ...(onRecommend ? [{
                  icon: <Icon name="bulb" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Recomendações',
                  subtitle: 'Como melhorar sua internet',
                  showChevron: true,
                  onClick: onRecommend,
                }] : []),
                ...(onGamer ? [{
                  icon: <Icon name="game" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Modo Gamer',
                  subtitle: 'Avaliação para jogos online e cloud gaming',
                  showChevron: true,
                  onClick: onGamer,
                }] : []),
              ]}
            />
          </div>
        )}

        {showAdvancedSection && (
          <div className="lk-explore__section">
            <p className="lk-explore__section-label">Testes avançados</p>
            <IOSList
              items={[
                ...(onStartProvaReal ? [{
                  icon: <Icon name="refresh" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Prova Real',
                  subtitle: 'Média de 3 testes consecutivos',
                  showChevron: true,
                  onClick: onStartProvaReal,
                }] : []),
                ...(onStartComparison ? [{
                  icon: <Icon name="cmp" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Comparar locais',
                  subtitle: 'Perto vs longe do roteador',
                  showChevron: true,
                  onClick: onStartComparison,
                }] : []),
                ...(onStartBeforeAfter ? [{
                  icon: <Icon name="cmp" size={14} color="#fff" />,
                  iconBg: 'var(--surface-3)',
                  title: 'Antes e Depois',
                  subtitle: 'Compare o impacto de uma mudança',
                  showChevron: true,
                  onClick: onStartBeforeAfter,
                }] : []),
                ...(onStartRoomTest ? [{
                  icon: <Icon name="pin" size={14} color="#fff" />,
                  iconBg: 'var(--surface-3)',
                  title: 'Teste por local',
                  subtitle: 'Meça o sinal em cada cômodo',
                  showChevron: true,
                  onClick: onStartRoomTest,
                }] : []),
              ]}
            />
          </div>
        )}

        {dnsHandler && (
          <div className="lk-explore__section">
            <p className="lk-explore__section-label">Ferramentas de rede</p>
            <IOSList
              items={[{
                icon: <Icon name="bolt" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: dnsLabel,
                subtitle: dnsSubtitle,
                showChevron: true,
                onClick: dnsHandler,
              }]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
