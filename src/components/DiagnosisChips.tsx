import type { OpcaoResposta } from '../features/pulse/types';
import './DiagnosisChips.css';

interface Props {
  chips: OpcaoResposta[];
  onSelect: (chip: OpcaoResposta) => void;
}

export function DiagnosisChips({ chips, onSelect }: Props) {
  return (
    <div className="diagnosis-chips" role="list">
      {chips.map((chip, i) => (
        <button
          key={chip.id}
          className="diagnosis-chip"
          style={{ animationDelay: `${i * 80}ms` }}
          onClick={() => onSelect(chip)}
          type="button"
          role="listitem"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
