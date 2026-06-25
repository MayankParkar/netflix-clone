import { Router } from 'express';
import {
  getAllMovies,
  getMovieById,
  searchMovies,
  scanHDD,
} from '../controllers/moviesController';

const router = Router();

// ORDER MATTERS — Express matches top to bottom, first match wins
// /search must come before /:id
// otherwise GET /search would match /:id with id="search"

router.get('/',        getAllMovies);   // GET /api/v1/movies
router.get('/search',  searchMovies);  // GET /api/v1/movies/search?q=godfather
router.get('/:id',     getMovieById);  // GET /api/v1/movies/1
router.post('/scan',   scanHDD);       // POST /api/v1/movies/scan

export default router;
