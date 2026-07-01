import { Router } from 'express';
import { getAllMovies, getMovieById, searchMovies, scanHDD } from '../controllers/moviesController';
import { streamVideo } from '../controllers/streamController';
import { enrichMovies } from '../controllers/tmdbController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/',           getAllMovies);
router.get('/search',     searchMovies);
router.get('/:id',        getMovieById);
router.get('/:id/stream', requireAuth, streamVideo);
router.post('/scan',      scanHDD);
router.post('/enrich',    enrichMovies);

export default router;
