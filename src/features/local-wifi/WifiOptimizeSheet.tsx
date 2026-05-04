import { Icon } from '../../components/icons';
import { DraggableSheet } from '../../components/DraggableSheet';
import './WifiOptimizeSheet.css';

interface WifiOptimizeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OptimizeSection {
  id: string;
  iconName: string;
  title: string;
  steps: string[];
}

/**
 * Bottom-sheet com tutorial de otimização de Wi-Fi (refator 2026-05). Aberto
 * pelo CTA primary do `WifiDetailsSheet`. Conteúdo hardcoded em pt-BR — não
 * passa por `copyDictionary` porque é texto operacional fixo (não muda por
 * grade/severidade).
 *
 * As 3 categorias cobrem as ações mais frequentes para melhorar Wi-Fi caseiro:
 *   - Trocar canal: ataca interferência com vizinhos.
 *   - Trocar banda (5 GHz vs 2.4 GHz): ataca alcance vs velocidade.
 *   - Posicionamento do roteador: ataca obstáculos físicos.
 *
 * Fica acima do `WifiDetailsSheet` (ambos com z-index alto). O detalhes
 * permanece montado por baixo — fechar este sheet volta para o detalhes.
 */
const SECTIONS: OptimizeSection[] = [
  {
    id: 'channel',
    iconName: 'swap',
    title: 'Trocar o canal Wi-Fi',
    steps: [
      'Acesse o painel do roteador no navegador (geralmente 192.168.0.1 ou 192.168.1.1).',
      'Faça login (usuário e senha padrão costumam ser "admin").',
      'Procure a seção Wi-Fi → Configurações avançadas → Canal.',
      'Em 2.4 GHz prefira canais 1, 6 ou 11. Em 5 GHz prefira 36, 40, 44 ou 48.',
    ],
  },
  {
    id: 'band',
    iconName: 'wifi',
    title: 'Escolher a banda certa',
    steps: [
      '5 GHz é mais rápida e menos sujeita a interferência, mas alcança menos.',
      '2.4 GHz alcança mais e atravessa melhor paredes, mas é mais lenta.',
      'Próximo ao roteador, conecte em 5 GHz. Em cômodos distantes, 2.4 GHz.',
      'Se o roteador é dual-band, mantenha as duas redes ativas com nomes diferentes.',
    ],
  },
  {
    id: 'placement',
    iconName: 'router',
    title: 'Posicionar o roteador',
    steps: [
      'Coloque em local central da casa, longe de paredes grossas.',
      'Mantenha em altura — sobre um móvel, não no chão.',
      'Evite proximidade com microondas, monitores e bluetooth — fontes de interferência.',
      'Antenas externas ficam melhores na vertical para cobrir o pavimento.',
    ],
  },
];

export function WifiOptimizeSheet({ isOpen, onClose }: WifiOptimizeSheetProps) {
  // Body scroll lock + Esc + backdrop click são tratados pelo DraggableSheet —
  // não duplicamos aqui (refator 2026-05).
  return (
    <DraggableSheet
      open={isOpen}
      onClose={onClose}
      ariaLabelledBy="lk-wifi-opt-title"
      nested
    >
      <div className="lk-wifi-opt__inner">
        <header className="lk-wifi-opt__header">
          <div className="lk-wifi-opt__title-row">
            <h2 id="lk-wifi-opt-title" className="lk-wifi-opt__title">
              Como otimizar o Wi-Fi
            </h2>
            <button
              type="button"
              className="lk-wifi-opt__close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <Icon name="close" size={16} color="var(--text-2)" />
            </button>
          </div>
        </header>

        <div className="lk-wifi-opt__content">
          {SECTIONS.map((sec) => (
            <section key={sec.id} className="lk-wifi-opt__section">
              <header className="lk-wifi-opt__section-head">
                <span className="lk-wifi-opt__section-icon" aria-hidden="true">
                  <Icon name={sec.iconName} size={16} color="var(--accent)" />
                </span>
                <h3 className="lk-wifi-opt__section-title">{sec.title}</h3>
              </header>
              <ol className="lk-wifi-opt__steps">
                {sec.steps.map((step, i) => (
                  <li key={i} className="lk-wifi-opt__step">
                    <span className="lk-wifi-opt__step-num">{i + 1}</span>
                    <span className="lk-wifi-opt__step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <div className="lk-wifi-opt__footer">
          <button type="button" className="lk-wifi-opt__cta-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </DraggableSheet>
  );
}
