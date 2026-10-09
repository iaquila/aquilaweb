import React from 'react';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { DEBOUNCE_DELAY_MS } from '../constants';

interface DebouncedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  debounceMs?: number;
}

export const DebouncedButton: React.FC<DebouncedButtonProps> = ({
  onClick,
  debounceMs = DEBOUNCE_DELAY_MS,
  children,
  ...props
}) => {
  const debouncedClick = useDebouncedCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
  }, debounceMs);

  return (
    <button onClick={debouncedClick} {...props}>
      {children}
    </button>
  );
};
