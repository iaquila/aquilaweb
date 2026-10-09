import { useCallback, useRef } from 'react';
import { DEBOUNCE_DELAY_MS } from '../constants';

/**
 * Leading-edge debounced callback hook.
 * Executes on the first press immediately, and locks subsequent calls for `delayMs`.
 * Prevents double-taps on navigation, modal openers, and form submits.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delayMs: number = DEBOUNCE_DELAY_MS
): T {
  const lastCallRef = useRef<number>(0);

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delayMs) {
        lastCallRef.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delayMs]
  );
}
