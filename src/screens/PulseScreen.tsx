import { useEffect, useRef } from 'react';
import { AppBorderGlow } from '../components/AppBorderGlow';
import { ContextualQuestion } from '../components/ContextualQuestion';
import { DiagnosisChips } from '../components/DiagnosisChips';
import { LinkaPulseSymbol } from '../components/LinkaPulseSymbol';
import { RotatingMessage } from '../components/RotatingMessage';
import { TopBar } from '../components/TopBar';
import type { OpcaoResposta } from '../features/pulse/types';
import type { PulsePhase, PulseResultLevel, IntelligentSession, AiAnalysisEntry } from '../features/pulse/types';
import './PulseScreen.css';

interface Props {
  phase: PulsePhase;
  mensagem: string;
  error: string | null;
  session: IntelligentSession | null;
  onIniciar: () => void;
  onSelecionarChip: (chip: OpcaoResposta) => void;
  onResponderPergunta: (opcao: OpcaoResposta) => void;
  onVoltar: () => void;
}

const FEEDBACK_CHIPS: OpcaoResposta[] = [
  { id: 'feedback_persistent', label: 'Problema persistente', contextoParaIA: 'O problema continua após as recomendações.' },
  { id: 'feedback_resolved',   label: 'Problema resolvido',   contextoParaIA: 'O problema foi resolvido com as recomendações.' },
  { id: 'feedback_not_wifi',   label: 'Não é Wi-Fi',          contextoParaIA: 'O problema não é relacionado ao Wi-Fi.' },
  { id: 'feedback_not_net',    label: 'Não é a internet',     contextoParaIA: 'O problema não parece ser da internet.' },
  { id: 'feedback_useful',     label: 'Foi útil',             contextoParaIA: 'A análise foi útil e informativa.' },
];

const WELCOME_CARDS = [
  { id: 'internet_lenta',  emoji: '🐢', label: 'Internet lenta',    sub: 'Velocidade abaixo do esperado' },
  { id: 'streaming',       emoji: '📺', label: 'Streaming ruim',    sub: 'Travamentos ou qualidade baixa' },
  { id: 'jogos',           emoji: '🎮', label: 'Jogos travando',    sub: 'Lag ou alta latência em jogos' },
  { id: 'chamadas',        emoji: '📞', label: 'Chamadas instáveis', sub: 'Quedas ou eco em videochamadas' },
];

function phaseToSymbolState(phase: PulsePhase, severity?: PulseResultLevel) {
  if (phase === 'collecting' || phase === 'thinking' || phase === 'analyzing') return 'active';
  if (phase === 'result' || phase === 'awaitingChips') {
    if (severity === 'critical') return 'critical';
    if (severity === 'warning') return 'warning';
    return 'success';
  }
  if (phase === 'error') return 'critical';
  return 'idle';
}

const isLoading = (phase: PulsePhase) =>
  phase === 'collecting' || phase === 'thinking' || phase === 'analyzing';

export function PulseScreen({
  phase,
  mensagem,
  error,
  session,
  onIniciar,
  onSelecionarChip,
  onResponderPergunta,
  onVoltar: _onVoltar,
}: Props) {
  const symbolState = phaseToSymbolState(phase, session?.diagnosticSeverity);
  const active = isLoading(phase);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ao final do chat quando novas mensagens chegam
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [session?.analyses.length, phase]);

  const hasFirstAnalysis = (session?.analyses.length ?? 0) > 0;

  return (
    <div className="orbit-screen">
      <AppBorderGlow active={active} />

      {/* TopBar */}
      <TopBar
        showTitle
        title="Diagnóstico"
        scrolled={false}
        rightSlot={<LinkaPulseSymbol state={symbolState} size={28} />}
      />

      {/* ── IDLE: Welcome state ─────────────────────────────────── */}
      {phase === 'idle' && (
        <div className="orbit-screen__welcome">
          <div className="orbit-screen__welcome-symbol">
            <LinkaPulseSymbol state="idle" size={90} />
          </div>
          <p className="orbit-screen__welcome-title">Diagnóstico Inteligente</p>
          <p className="orbit-screen__welcome-sub">O que está incomodando?</p>
          <div className="orbit-screen__welcome-cards">
            {WELCOME_CARDS.map((card) => (
              <button
                key={card.id}
                className="orbit-screen__welcome-card"
                onClick={onIniciar}
                type="button"
              >
                <span className="orbit-screen__welcome-card-emoji">{card.emoji}</span>
                <div className="orbit-screen__welcome-card-text">
                  <span className="orbit-screen__welcome-card-label">{card.label}</span>
                  <span className="orbit-screen__welcome-card-sub">{card.sub}</span>
                </div>
                <svg className="orbit-screen__welcome-card-arrow" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
          <button className="orbit-screen__general-btn" onClick={onIniciar} type="button">
            Diagnóstico geral
          </button>
        </div>
      )}

      {/* ── CHAT AREA ───────────────────────────────────────────── */}
      {phase !== 'idle' && (
        <div className="orbit-screen__chat" ref={chatScrollRef}>

          {/* Mensagens de histórico (por análise) */}
          {session?.analyses.map((analysis, i) => (
            <AiBubble key={analysis.timestamp} analysis={analysis} isLast={i === (session.analyses.length - 1) && !active} />
          ))}

          {/* Thinking bubble (loading) */}
          {active && (
            <div className="orbit-screen__thinking">
              <div className="orbit-screen__thinking-symbol">
                <LinkaPulseSymbol state="active" size={28} />
              </div>
              <div className="orbit-screen__thinking-bubble">
                <div className="orbit-screen__thinking-dots">
                  <span /><span /><span />
                </div>
                <RotatingMessage message={mensagem} />
                {phase === 'collecting' && (
                  <div className="orbit-screen__speedtest-dot" aria-label="Teste em andamento" />
                )}
              </div>
            </div>
          )}

          {/* Pergunta contextual inline */}
          {phase === 'awaitingAnswer' && session?.pendingQuestion && (
            <div className="orbit-screen__inline-question">
              <ContextualQuestion
                question={session.pendingQuestion}
                onResponder={onResponderPergunta}
              />
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="orbit-screen__error-bubble">
              <p className="orbit-screen__error-text">{error}</p>
              <button className="orbit-screen__btn-primary" onClick={onIniciar} type="button">
                Tentar novamente
              </button>
            </div>
          )}

          {/* Severidade badge */}
          {(phase === 'result' || phase === 'awaitingChips') && session && (
            <div className="orbit-screen__severity-row">
              <span className={`orbit-screen__badge orbit-screen__badge--${session.diagnosticSeverity}`}>
                {session.diagnosticSeverity === 'success' && '✓ Rede OK'}
                {session.diagnosticSeverity === 'warning' && '⚠ Atenção necessária'}
                {session.diagnosticSeverity === 'critical' && '✕ Problemas críticos'}
              </span>
            </div>
          )}

          {/* Novo diagnóstico */}
          {(phase === 'result' || phase === 'awaitingChips') && (
            <div className="orbit-screen__new-diag">
              <button className="orbit-screen__btn-secondary" onClick={onIniciar} type="button">
                Novo diagnóstico
              </button>
            </div>
          )}

          <div className="orbit-screen__chat-pad" />
        </div>
      )}

      {/* ── INPUT AREA: chips de seleção ─────────────────────────── */}
      {(phase === 'awaitingChips' || phase === 'result') && session && session.activeChips.length > 0 && (
        <div className="orbit-screen__input-area">
          {hasFirstAnalysis && (
            <>
              <p className="orbit-screen__chips-section-label">Continuar</p>
              <div className="orbit-screen__feedback-chips">
                {FEEDBACK_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    className="orbit-screen__chip orbit-screen__chip--feedback"
                    onClick={() => onSelecionarChip(chip)}
                    type="button"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <p className="orbit-screen__chips-section-label">O que está incomodando?</p>
            </>
          )}
          {!hasFirstAnalysis && (
            <p className="orbit-screen__chips-label">O que está incomodando?</p>
          )}
          <DiagnosisChips chips={session.activeChips} onSelect={onSelecionarChip} />
        </div>
      )}
    </div>
  );
}

/* ── AI Bubble ──────────────────────────────────────────────────────── */

interface AiBubbleProps {
  analysis: AiAnalysisEntry;
  isLast: boolean;
}

function AiBubble({ analysis, isLast }: AiBubbleProps) {
  const lines = analysis.content.split('\n').filter((l) => l.trim());
  const firstPara = lines.slice(0, 4).join('\n');
  const rest = lines.slice(4).join('\n');

  return (
    <div className={`orbit-screen__ai-bubble${isLast ? ' orbit-screen__ai-bubble--latest' : ''}`}>
      <div className="orbit-screen__ai-bubble-header">
        <div className="orbit-screen__ai-symbol">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="var(--orbit-accent)" strokeWidth="2" />
            <ellipse cx="12" cy="12" rx="9" ry="4" stroke="var(--orbit-accent)" strokeWidth="1.5" opacity="0.7" />
          </svg>
        </div>
        <span className="orbit-screen__ai-label">Orbit IA</span>
        {analysis.isFallback && (
          <span className="orbit-screen__ai-fallback">offline</span>
        )}
      </div>
      <p className="orbit-screen__ai-text">{firstPara}</p>
      {rest && (
        <details className="orbit-screen__ai-details">
          <summary>Ver análise completa</summary>
          <p className="orbit-screen__ai-text orbit-screen__ai-text--rest">{rest}</p>
        </details>
      )}
    </div>
  );
}
