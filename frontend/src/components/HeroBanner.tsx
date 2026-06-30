import type { Movie } from '../types/movie';

interface HeroBannerProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
}

export function HeroBanner({ movie, onPlay }: HeroBannerProps) {
  const backdropUrl = movie.backdropPath
    ? `https://image.tmdb.org/t/p/original${movie.backdropPath}`
    : null;

  return (
    <div className="relative h-[70vh] md:h-[85vh] w-full">
      {/* Backdrop image with gradient fade to black at the bottom — Netflix's signature look */}
      <div className="absolute inset-0">
        {backdropUrl ? (
          <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-black" />
        )}
        {/* Bottom fade so the row below blends seamlessly into the hero */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/40" />
        {/* Left fade for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      </div>

      <div className="absolute bottom-[20%] left-4 md:left-12 max-w-xl">
        <h1 className="text-3xl md:text-6xl font-black text-white drop-shadow-lg mb-4">
          {movie.title}
        </h1>

        {movie.overview && (
          <p className="text-white text-sm md:text-base drop-shadow-md line-clamp-3 mb-6">
            {movie.overview}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onPlay(movie)}
            className="flex items-center gap-2 bg-white text-black font-semibold
              px-6 py-2.5 rounded hover:bg-neutral-200 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
          <button
            className="flex items-center gap-2 bg-neutral-500/40 text-white font-semibold
              px-6 py-2.5 rounded hover:bg-neutral-500/60 transition-colors backdrop-blur-sm"
          >
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}
