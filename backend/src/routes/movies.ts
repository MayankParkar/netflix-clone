import { Router } from 'express';
import {
  getAllMovies,
  getMovieById,
  searchMovies,
  scanHDD,
} from '../controllers/moviesController';
import { streamVideo } from '../controllers/streamController';

const router = Router();

// ORDER MATTERS — specific routes before wildcard /:id
router.get('/',           getAllMovies);    // GET /api/v1/movies
router.get('/search',     searchMovies);   // GET /api/v1/movies/search?q=godfather
router.get('/:id/stream', streamVideo);    // GET /api/v1/movies/1/stream
router.get('/:id',        getMovieById);   // GET /api/v1/movies/1
router.post('/scan',      scanHDD);        // POST /api/v1/movies/scan

export default router;
