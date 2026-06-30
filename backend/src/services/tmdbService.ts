const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

interface TmdbSearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[];
}

interface TmdbMovieDetails extends TmdbSearchResult {
  runtime: number | null;
  genres: { id: number; name: string }[];
}

export async function searchTmdbMovie(
  title: string,
  year: number | null
): Promise<TmdbSearchResult | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set in .env');
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    query: title,
    include_adult: 'false',
  });

  if (year) {
    params.append('year', String(year));
  }

  const url = `${TMDB_BASE_URL}/search/movie?${params.toString()}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`TMDB search failed: ${res.status} ${res.statusText}`);
  }

  // fetch()'s res.json() returns Promise<unknown> in modern TypeScript —
  // we must explicitly assert the shape since TypeScript can't infer
  // the structure of arbitrary JSON from an external API
  const data = (await res.json()) as TmdbSearchResponse;

  if (data.results.length === 0) {
    return null;
  }

  if (year) {
    const yearMatch = data.results.find((r) =>
      r.release_date?.startsWith(String(year))
    );
    if (yearMatch) return yearMatch;
  }

  return data.results[0];
}

export async function getTmdbMovieDetails(
  tmdbId: number
): Promise<TmdbMovieDetails> {
  const apiKey = process.env.TMDB_API_KEY;

  const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`TMDB details fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as TmdbMovieDetails;
  return data;
}

export function buildImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
