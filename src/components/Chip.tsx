import type { ReactNode } from 'react';
import './chip.css';

interface Props {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel?: string;
  tone?: 'default' | 'positive' | 'negative' | 'ban';
  small?: boolean;
}

export function Chip({ selected, onClick, children, ariaLabel, tone = 'default', small }: Props) {
  return (
    <button type="button" className={`chip${selected ? ' chip--on' : ''} chip--${tone}${small ? ' chip--small' : ''}`} aria-pressed={onClick ? !!selected : undefined} aria-label={ariaLabel} onClick={onClick} disabled={!onClick}>
      {children}
    </button>
  );
}
