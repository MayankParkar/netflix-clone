import { Router } from 'express';
import {
  getAllMovies,
  getMovieById,
  searchMovies,
  scanHDD,
} from '../controllers/moviesController';
import { streamVideo } from '../controllers/streamController';
import { enrichMovies } from '../controllers/tmdbController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public routes — browsing the catalog doesn't require login
// (this mirrors Netflix's own browse page being publicly visible)
router.get('/',           getAllMovies);
router.get('/search',     searchMovies);
router.get('/:id',        getMovieById);

// Protected route — must be logged in to actually stream/watch
router.get('/:id/stream', requireAuth, streamVideo);

// Admin-style routes — in a real app these would also be protected
// and restricted to admin users specifically
router.post('/scan',      scanHDD);
router.post('/enrich',    enrichMovies);

export default router;
