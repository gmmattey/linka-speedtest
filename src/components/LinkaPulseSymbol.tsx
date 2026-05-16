import './LinkaPulseSymbol.css';

type SymbolState = 'idle' | 'active' | 'success' | 'warning' | 'critical';

interface Props {
  state: SymbolState;
  size?: number;
}

export function LinkaPulseSymbol({ state, size = 120 }: Props) {
  return (
    <div
      className={`pulse-symbol pulse-symbol--${state}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="pulse-symbol__outer" />
      <div className="pulse-symbol__mid" />
      <div className="pulse-symbol__core" />
      <div className="pulse-symbol__dot" />
    </div>
  );
}
