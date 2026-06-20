import { Router } from 'express';
import {
  getAllMovies,
  getMovieById,
  scanHDD,
} from '../controllers/moviesController';

const router = Router();

// GET /api/v1/movies        — list all movies
router.get('/', getAllMovies);

// GET /api/v1/movies/:id    — get one movie by id
// The :id is a URL parameter — Express puts it in req.params.id
router.get('/:id', getMovieById);

// POST /api/v1/movies/scan  — scan the HDD for new video files
router.post('/scan', scanHDD);

export default router;
