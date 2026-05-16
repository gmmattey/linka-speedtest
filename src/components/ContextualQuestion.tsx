import type { OpcaoResposta, QuestionNode } from '../features/pulse/types';
import './ContextualQuestion.css';

interface Props {
  question: QuestionNode;
  onResponder: (opcao: OpcaoResposta) => void;
}

export function ContextualQuestion({ question, onResponder }: Props) {
  return (
    <div className="contextual-question" key={question.id}>
      <p className="contextual-question__text">{question.texto}</p>
      <div className="contextual-question__options">
        {question.opcoes.map((opcao) => (
          <button
            key={opcao.id}
            className="contextual-question__option"
            onClick={() => onResponder(opcao)}
            type="button"
          >
            {opcao.label}
          </button>
        ))}
      </div>
    </div>
  );
}
