import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Video file extensions we'll support
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

// Temporary in-memory store — we'll replace this with a real database in Step 3
// Think of this as a "fake database" just so we can test the API right now
let moviesCache: Movie[] = [];

// Define the shape of a Movie object using TypeScript
// This is the power of TypeScript — if you try to access movie.titlee (typo),
// it will show a red underline immediately instead of failing silently at runtime
interface Movie {
  id: number;
  title: string;
  filename: string;
  extension: string;
  sizeGB: number;
  path: string;
}

// GET /api/v1/movies
export const getAllMovies = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    count: moviesCache.length,
    data: moviesCache,
  });
};

// GET /api/v1/movies/:id
export const getMovieById = (req: Request, res: Response) => {
  // req.params.id is always a string, so we convert to number with parseInt
  const id = parseInt(req.params.id as string, 10);
  const movie = moviesCache.find((m) => m.id === id);

  if (!movie) {
    // Return 404 — do NOT return 200 with an error message inside
    // Status codes must accurately reflect what happened
    res.status(404).json({
      success: false,
      message: `Movie with id ${id} not found`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: movie,
  });
};
// POST /api/v1/movies/scan
// Reads the HDD directory recursively and builds a list of all video files found
export const scanHDD = (req: Request, res: Response) => {
  const hddPath = process.env.HDD_PATH;

  if (!hddPath) {
    res.status(500).json({
      success: false,
      message: 'HDD_PATH is not configured in .env',
    });
    return;
  }

  if (!fs.existsSync(hddPath)) {
    res.status(404).json({
      success: false,
      message: `HDD not found at path: ${hddPath}. Is the drive plugged in?`,
    });
    return;
  }

  try {
    // Note: This requires Node v20.1+ or v18.17+
    // Cast as string[] because readdirSync can return Buffer[] depending on encoding
    const files = fs.readdirSync(hddPath, { recursive: true }) as string[];

    moviesCache = files
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();

      // 1. Check if it has a valid video extension
      if (!VIDEO_EXTENSIONS.includes(ext)) return false;

      // 2. Ensure it is actually a file, not a directory named "movie.mp4"
      const filePath = path.join(hddPath, file);
      return fs.statSync(filePath).isFile();
    })
    .map((file, index) => {
      const filePath = path.join(hddPath, file);
      const stats = fs.statSync(filePath);

      // path.basename ensures we get 'movie.mp4' even if 'file' is 'subfolder/movie.mp4'
      const actualFilename = path.basename(file);

      return {
        id: index + 1,
        title: path.basename(file, path.extname(file)),
         filename: actualFilename,
         extension: path.extname(file).toLowerCase(),
         sizeGB: parseFloat((stats.size / (1024 ** 3)).toFixed(2)),
         path: filePath,
      };
    });

    res.status(200).json({
      success: true,
      message: `Scan complete. Found ${moviesCache.length} video files.`,
      count: moviesCache.length,
      data: moviesCache,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to scan HDD',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
