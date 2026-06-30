import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { searchTmdbMovie, getTmdbMovieDetails } from '../services/tmdbService';

// POST /api/v1/movies/enrich
// Loops through every movie in our database that doesn't have TMDB data yet,
// searches TMDB for a match, and saves poster/backdrop/overview/rating/genres
export const enrichMovies = async (req: Request, res: Response) => {
  try {
    // Only process movies that haven't been enriched yet (tmdbId is null)
    // This makes the endpoint safe to re-run — already-enriched movies are skipped
    const movies = await prisma.movie.findMany({
      where: { tmdbId: null },
    });

    const results = {
      total: movies.length,
      matched: 0,
      notFound: 0,
      errors: 0,
    };

    for (const movie of movies) {
      try {
        // ── Step 1: Search TMDB using our parsed title and year ────────────
        const searchResult = await searchTmdbMovie(movie.title, movie.year);

        if (!searchResult) {
          console.log(`[TMDB] No match found for: "${movie.title}" (${movie.year})`);
          results.notFound++;
          continue; // skip to the next movie
        }

        // ── Step 2: Fetch full details (runtime, genre names) ──────────────
        const details = await getTmdbMovieDetails(searchResult.id);

        // ── Step 3: Save everything back to our database ────────────────────
        await prisma.movie.update({
          where: { id: movie.id },
          data: {
            tmdbId: searchResult.id,
            posterPath: searchResult.poster_path,
            backdropPath: searchResult.backdrop_path,
            overview: searchResult.overview,
            rating: searchResult.vote_average,
            runtime: details.runtime,
            // genres comes back as [{id, name}, ...] — we flatten to a
            // comma-separated string since SQLite has no array column type
            genres: details.genres.map((g) => g.name).join(','),
          },
        });

        console.log(`[TMDB] Matched: "${movie.title}" → TMDB #${searchResult.id}`);
        results.matched++;

        // ── Rate limiting courtesy delay ────────────────────────────────────
        // TMDB allows ~50 requests/second, but we add a small delay anyway
        // to be a respectful API consumer and avoid hitting limits as your
        // library grows to hundreds of movies
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (err) {
        console.error(`[TMDB] Error processing "${movie.title}":`, err);
        results.errors++;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Enrichment complete',
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Enrichment failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
