import { Router } from 'express';
import {
  getAllMovies,
  getMovieById,
  searchMovies,
  scanHDD,
} from '../controllers/moviesController';
import { streamVideo } from '../controllers/streamController';
import { enrichMovies } from '../controllers/tmdbController';

const router = Router();

router.get('/',           getAllMovies);
router.get('/search',     searchMovies);
router.get('/:id/stream', streamVideo);
router.get('/:id',        getMovieById);
router.post('/scan',      scanHDD);
router.post('/enrich',    enrichMovies);   // NEW — TMDB metadata enrichment

export default router;
