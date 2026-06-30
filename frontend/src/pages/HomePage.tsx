import { useState } from 'react';
import type { Movie } from '../types/movie';
import { useMovies } from '../hooks/useMovies';
import { Navbar } from '../components/Navbar';
import { HeroBanner } from '../components/HeroBanner';
import { MovieRow } from '../components/MovieRow';
import { VideoPlayer } from '../components/VideoPlayer';

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const { movies, loading, error } = useMovies(searchQuery);

  // Group movies by quality as a simple "genre row" stand-in
  // We'll replace this with real TMDB genres in Step 6
  const movies4K = movies.filter((m) => m.quality.includes('4K'));
  const movies1080p = movies.filter((m) => m.quality === '1080p');

  // Pick the first movie as the hero banner feature
  const heroMovie = movies[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <p className="text-white text-lg">Loading your library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <p className="text-red-500 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar onSearch={setSearchQuery} />

      {searchQuery.trim().length >= 2 ? (
        // Search results view — no hero banner, just a results grid
        <div className="pt-24">
          <h2 className="text-xl font-semibold text-white px-4 md:px-12 mb-4">
            Results for "{searchQuery}"
          </h2>
          <MovieRow title="" movies={movies} onPlay={setPlayingMovie} />
        </div>
      ) : (
        // Default browse view — hero banner + categorized rows
        <>
          {heroMovie && <HeroBanner movie={heroMovie} onPlay={setPlayingMovie} />}

          <div className="relative -mt-24 z-10 pb-12">
            <MovieRow title="All Movies" movies={movies} onPlay={setPlayingMovie} />
            {movies4K.length > 0 && (
              <MovieRow title="4K Ultra HD" movies={movies4K} onPlay={setPlayingMovie} />
            )}
            {movies1080p.length > 0 && (
              <MovieRow title="Full HD" movies={movies1080p} onPlay={setPlayingMovie} />
            )}
          </div>
        </>
      )}

      {playingMovie && (
        <VideoPlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />
      )}
    </div>
  );
}
