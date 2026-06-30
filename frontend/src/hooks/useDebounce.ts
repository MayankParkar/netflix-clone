import { useState, useEffect } from 'react';

// Generic hook — works for any type T (string, number, object, etc.)
// Returns a "delayed" version of the value that only updates after
// the value has stopped changing for `delay` milliseconds

export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Every time `value` changes, we start a fresh timer
    // setTimeout schedules debouncedValue to update after `delay` ms
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // CLEANUP FUNCTION — runs before the NEXT effect, or on unmount
    // If `value` changes again before the timer fires, we cancel the
    // old timer here. This is what makes debouncing work:
    // every keystroke cancels the previous pending update
    return () => clearTimeout(timer);
  }, [value, delay]); // re-run this effect whenever value or delay changes

  return debouncedValue;
}
