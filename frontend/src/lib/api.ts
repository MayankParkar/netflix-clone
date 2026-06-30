import type { Movie, ApiResponse } from '../types/movie';

// Base URL of our Express backend
// In production this would be an environment variable pointing to your AWS API
const API_BASE = 'http://localhost:3000/api/v1';

// ── Fetch all movies ──────────────────────────────────────────────────────────
export async function fetchMovies(): Promise<Movie[]> {
  const res = await fetch(`${API_BASE}/movies`);

  // fetch() does NOT throw on 404/500 — only on network failure
  // We must check res.ok manually
  if (!res.ok) {
    throw new Error(`Failed to fetch movies: ${res.status}`);
  }

  const json: ApiResponse<Movie[]> = await res.json();
  return json.data;
}

// ── Search movies ──────────────────────────────────────────────────────────────
export async function searchMovies(query: string): Promise<Movie[]> {
  // encodeURIComponent prevents special characters (&, #, spaces) from
  // breaking the URL structure — e.g. "lord & rings" becomes "lord%20%26%20rings"
  const res = await fetch(`${API_BASE}/movies/search?q=${encodeURIComponent(query)}`);

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const json: ApiResponse<Movie[]> = await res.json();
  return json.data;
}

// ── Get one movie by id ──────────────────────────────────────────────────────
export async function fetchMovieById(id: number): Promise<Movie> {
  const res = await fetch(`${API_BASE}/movies/${id}`);

  if (!res.ok) {
    throw new Error(`Movie not found: ${res.status}`);
  }

  const json: ApiResponse<Movie> = await res.json();
  return json.data;
}

// ── Build the streaming URL for a movie ──────────────────────────────────────
// This doesn't fetch anything — it just builds the URL the <video> tag uses
// The browser's video element handles the actual Range Request streaming
export function getStreamUrl(movieId: number): string {
  return `${API_BASE}/movies/${movieId}/stream`;
}
