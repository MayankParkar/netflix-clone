import { useState } from 'react';
import type { Movie } from '../types/movie';

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
}

export function MovieCard({ movie, onPlay }: MovieCardProps) {
  const [hovered, setHovered] = useState(false);

  // TMDB poster URLs need the base CDN path prefixed — we'll wire this
  // up properly in Step 6 when we integrate the TMDB API
  // For now, fall back to a styled placeholder card with the title
  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : null;

  return (
    <div
      className="relative flex-shrink-0 w-[160px] md:w-[200px] cursor-pointer
        transition-transform duration-300 ease-out
        hover:scale-110 hover:z-20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(movie)}
    >
      <div className="aspect-[2/3] rounded-md overflow-hidden bg-neutral-800 shadow-lg">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          // Placeholder for movies without TMDB metadata yet
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-neutral-800 to-neutral-900">
            <span className="text-sm font-semibold text-neutral-200 line-clamp-3">
              {movie.title}
            </span>
            {movie.year && (
              <span className="text-xs text-neutral-500 mt-1">{movie.year}</span>
            )}
          </div>
        )}
      </div>

      {/* Hover overlay — shows extra info, Netflix-style */}
      {hovered && (
        <div className="absolute top-0 left-0 right-0 bg-neutral-900 rounded-md
          shadow-2xl p-2 text-xs">
          <p className="font-semibold text-white truncate">{movie.title}</p>
          <div className="flex gap-2 mt-1 text-neutral-400">
            {movie.year && <span>{movie.year}</span>}
            {movie.quality && <span className="uppercase">{movie.quality}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
