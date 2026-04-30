import type { ReactNode } from 'react';
import './Chip.css';

export type ChipVariant = 'good' | 'maybe' | 'bad' | 'accent' | 'neutral';

interface Props {
  variant: ChipVariant;
  children: ReactNode;
}

export function Chip({ variant, children }: Props) {
  return (
    <span className={`lk-chip lk-chip--${variant}`}>{children}</span>
  );
}
