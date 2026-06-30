import { useRef } from 'react';
import type { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

export function MovieRow({ title, movies, onPlay }: MovieRowProps) {
  // useRef gives us a direct reference to the DOM element
  // We use it to manually control scroll position when arrow buttons are clicked
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;

    // Scroll by roughly one screen width in the chosen direction
    const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;

    rowRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth', // native smooth scroll animation
    });
  };

  if (movies.length === 0) return null;

  return (
    <div className="relative mb-8 group">
      <h2 className="text-lg md:text-xl font-semibold text-white mb-2 px-4 md:px-12">
        {title}
      </h2>

      <div className="relative">
        {/* Left scroll button — hidden until the row is hovered */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50
            opacity-0 group-hover:opacity-100 transition-opacity
            hidden md:flex items-center justify-center"
          aria-label="Scroll left"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div
          ref={rowRef}
          className="flex gap-2 overflow-x-scroll scrollbar-hide px-4 md:px-12
            scroll-smooth"
          style={{ scrollbarWidth: 'none' }} // Firefox: hide scrollbar
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onPlay={onPlay} />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50
            opacity-0 group-hover:opacity-100 transition-opacity
            hidden md:flex items-center justify-center"
          aria-label="Scroll right"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
