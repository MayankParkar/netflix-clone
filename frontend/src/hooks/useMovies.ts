import { useState, useEffect } from 'react';
import type { Movie } from '../types/movie';
import { fetchMovies, searchMovies } from '../lib/api';
import { useDebounce } from './useDebounce';

export function useMovies(searchQuery: string) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search query — only fires the API call 400ms after
  // the user stops typing (see useDebounce.ts for the full explanation)
  const debouncedQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    // AbortController lets us cancel an in-flight fetch request
    // This solves the "race condition" problem: if the user types fast,
    // an older slow request could resolve AFTER a newer fast request,
    // overwriting fresh results with stale ones
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = debouncedQuery.trim().length >= 2
          ? await searchMovies(debouncedQuery)
          : await fetchMovies();

        // Only update state if this effect hasn't been cancelled
        // (i.e. the component is still mounted and this is still the latest request)
        if (!cancelled) {
          setMovies(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load movies');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    // Cleanup: mark this effect as cancelled when the query changes again
    // or the component unmounts
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return { movies, loading, error };
}
