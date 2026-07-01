import type { Movie, ApiResponse } from '../types/movie';
import { getAccessToken } from './auth';

const API_BASE = 'http://localhost:3000/api/v1';

export async function fetchMovies(): Promise<Movie[]> {
  const res = await fetch(`${API_BASE}/movies`);
  if (!res.ok) throw new Error(`Failed to fetch movies: ${res.status}`);
  const json: ApiResponse<Movie[]> = await res.json();
  return json.data;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  const res = await fetch(`${API_BASE}/movies/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const json: ApiResponse<Movie[]> = await res.json();
  return json.data;
}

export async function fetchMovieById(id: number): Promise<Movie> {
  const res = await fetch(`${API_BASE}/movies/${id}`);
  if (!res.ok) throw new Error(`Movie not found: ${res.status}`);
  const json: ApiResponse<Movie> = await res.json();
  return json.data;
}

// The <video> element cannot set custom headers — it makes requests
// directly without going through fetch(). We pass the JWT as a
// query parameter so the backend middleware can verify it.
export function getStreamUrl(movieId: number): string {
  const token = getAccessToken();
  const base = `${API_BASE}/movies/${movieId}/stream`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}
