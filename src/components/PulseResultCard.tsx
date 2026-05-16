import { useState } from 'react';
import type { AiAnalysisEntry } from '../features/pulse/types';
import './PulseResultCard.css';

interface Props {
  analysis: AiAnalysisEntry;
}

export function PulseResultCard({ analysis }: Props) {
  const [expanded, setExpanded] = useState(true);
  const preview = analysis.content.length > 120
    ? analysis.content.slice(0, 120) + '…'
    : analysis.content;

  return (
    <div className="pulse-result-card" onClick={() => setExpanded((e) => !e)}>
      <div className="pulse-result-card__header">
        <span className="pulse-result-card__label">
          ✦ Análise IA
          {analysis.isFallback && <span className="pulse-result-card__fallback">local</span>}
        </span>
        <span className="pulse-result-card__toggle">{expanded ? '▲' : '▼'}</span>
      </div>
      <div className={`pulse-result-card__body ${expanded ? 'pulse-result-card__body--open' : ''}`}>
        {expanded ? (
          <p className="pulse-result-card__text">{analysis.content}</p>
        ) : (
          <p className="pulse-result-card__preview">{preview}</p>
        )}
      </div>
    </div>
  );
}
