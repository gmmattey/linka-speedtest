import { useCallback, useEffect, useRef, useState } from 'react';
import './OnboardingScreen.css';

/**
 * OnboardingScreen — carousel de 3 cards exibido APENAS na primeira
 * execução do app (gate via flag `linka.onboarding.done` em localStorage,
 * controlada pelo App.tsx). O componente em si é puramente apresentacional:
 * recebe `onComplete` e dispara quando o usuário avança após o último card
 * ou clica "Pular" no topo direito.
 *
 * Estrutura:
 *   - 3 cards full-screen com slide horizontal entre eles (translateX 320ms)
 *   - Bottom: dots indicators (3) + botão Avançar/Começar
 *   - Top-right: botão "Pular" (text-only)
 *
 * SVGs inline mantêm o padrão dos icons já presentes em `components/icons.tsx`
 * (stroke currentColor, strokeWidth 1.6, sem dependência externa).
 */

interface Props {
  onComplete: () => void;
}

const TOTAL_CARDS = 3;

/* ── Ilustrações inline (SVG) ─────────────────────────────── */

function GaugeArt() {
  // Speedometer/gauge minimalista: arco + agulha + ponto central.
  return (
    <svg
      viewBox="0 0 160 120"
      width="160"
      height="120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 100 A60 60 0 0 1 140 100" stroke="var(--border-strong)" />
      <path d="M20 100 A60 60 0 0 1 80 40" stroke="var(--accent)" />
      <line x1="80" y1="100" x2="118" y2="58" stroke="var(--accent)" />
      <circle cx="80" cy="100" r="5" fill="var(--accent)" stroke="none" />
      <line x1="34" y1="100" x2="40" y2="94" stroke="var(--text-3)" strokeWidth="1.6" />
      <line x1="80" y1="40" x2="80" y2="48" stroke="var(--text-3)" strokeWidth="1.6" />
      <line x1="126" y1="100" x2="120" y2="94" stroke="var(--text-3)" strokeWidth="1.6" />
    </svg>
  );
}

function UseCasesArt() {
  // Trio: gamepad + tv + briefcase em row, mesma linguagem dos icons.tsx.
  return (
    <svg
      viewBox="0 0 200 96"
      width="200"
      height="96"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* gamepad */}
      <g transform="translate(8 24)" stroke="var(--accent)">
        <rect x="0" y="6" width="48" height="32" rx="10" />
        <path d="M11 22h8m-4-4v8" />
        <circle cx="36" cy="20" r="1.6" fill="var(--accent)" stroke="none" />
        <circle cx="40" cy="26" r="1.6" fill="var(--accent)" stroke="none" />
      </g>
      {/* tv / 4k display */}
      <g transform="translate(74 18)" stroke="var(--text)">
        <rect x="0" y="0" width="52" height="36" rx="4" />
        <path d="M8 16l10 6-10 6V16z" fill="var(--accent-tint-strong)" stroke="none" />
        <path d="M8 16l10 6-10 6V16z" />
        <path d="M14 44h24" />
      </g>
      {/* briefcase */}
      <g transform="translate(144 22)" stroke="var(--text)">
        <rect x="0" y="6" width="44" height="32" rx="4" />
        <path d="M14 6V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <path d="M22 18v8m-4-4h8" />
      </g>
    </svg>
  );
}

function PermissionsArt() {
  // Cadeado central simples + halo sutil.
  return (
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="46" stroke="var(--border-strong)" strokeWidth="1.4" />
      <rect x="36" y="54" width="48" height="38" rx="6" stroke="var(--accent)" />
      <path d="M44 54v-8a16 16 0 0 1 32 0v8" stroke="var(--accent)" />
      <circle cx="60" cy="72" r="3.2" fill="var(--accent)" stroke="none" />
      <line x1="60" y1="74" x2="60" y2="82" stroke="var(--accent)" />
    </svg>
  );
}

/* ── Conteúdo dos cards (texto) ───────────────────────────── */

const CARDS = [
  {
    art: <GaugeArt />,
    title: 'Mede sua internet com precisão',
    sub: 'Download, upload, latência e oscilação em poucos segundos.',
  },
  {
    art: <UseCasesArt />,
    title: 'Descubra se serve pra Jogos, 4K, Trabalho',
    sub: 'A linka traduz os números em respostas práticas para o seu dia a dia.',
  },
  {
    art: <PermissionsArt />,
    title: 'Permissões necessárias',
    sub: null,
    bullets: [
      {
        label: 'Localização',
        body: 'necessária pra ver detalhes do seu Wi-Fi (banda, canal, sinal). Android exige isso por privacidade.',
      },
      {
        label: 'Notificações',
        body: 'opcional, pra avisar se sua conexão piorar.',
      },
    ],
  },
] as const;

/* ── Componente ───────────────────────────────────────────── */

export function OnboardingScreen({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const isLast = index === TOTAL_CARDS - 1;

  const advance = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((i) => Math.min(i + 1, TOTAL_CARDS - 1));
  }, [isLast, onComplete]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // ── Suporte a swipe horizontal entre cards (não interfere no swipe lateral
  // global porque o overlay fica em z-index alto e captura o touch primeiro).
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0) advance();
    else if (dx > 0 && index > 0) setIndex((i) => Math.max(0, i - 1));
  };

  // Trava scroll do body enquanto o overlay está montado.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="lk-onb"
      role="dialog"
      aria-modal="true"
      aria-label="Bem-vindo à linka"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button className="lk-onb__skip" onClick={skip} type="button">
        Pular
      </button>

      <div className="lk-onb__viewport">
        <div
          ref={trackRef}
          className="lk-onb__track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {CARDS.map((card, i) => (
            <section className="lk-onb__card" key={i} aria-hidden={i !== index}>
              <div className="lk-onb__art">{card.art}</div>
              <h1 className="lk-onb__title">{card.title}</h1>
              {card.sub && <p className="lk-onb__sub">{card.sub}</p>}
              {'bullets' in card && card.bullets && (
                <ul className="lk-onb__bullets">
                  {card.bullets.map((b, bi) => (
                    <li key={bi} className="lk-onb__bullet">
                      <strong className="lk-onb__bullet-label">{b.label}</strong>
                      <span className="lk-onb__bullet-sep"> — </span>
                      <span className="lk-onb__bullet-body">{b.body}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>

      <div className="lk-onb__footer">
        <div className="lk-onb__dots" role="tablist" aria-label="Progresso do tutorial">
          {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir para o card ${i + 1}`}
              className={`lk-onb__dot${i === index ? ' lk-onb__dot--active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <button className="lk-onb__cta" onClick={advance} type="button">
          {isLast ? 'Começar' : 'Avançar'}
        </button>
      </div>
    </div>
  );
}

export default OnboardingScreen;
