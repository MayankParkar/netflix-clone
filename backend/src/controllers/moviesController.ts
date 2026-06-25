import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma';

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

// ── Filename Parser ───────────────────────────────────────────────────────────
// Extracts clean metadata from a raw YTS-style filename
// Input:  "The.Godfather.Part.II.1974.2160p.4K.WEB.x265.10bit.AAC5.1-[YTS.MX].mkv"
// Output: { title: "The Godfather Part II", year: 1974, quality: "4K 2160p", codec: "x265" }

function parseFilename(filename: string) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const spaced = nameWithoutExt.replace(/\./g, ' ');

  // Match a 4-digit year between 1900-2099
  const yearMatch = spaced.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;

  // Detect 4K and 2160p separately then combine
  const has4K = /\b4K\b/i.test(spaced);
  const has2160 = /\b2160p\b/i.test(spaced);
  const qualityMatch = spaced.match(/\b(720p|1080p|2160p|4K)\b/i);
  const quality = has4K && has2160
  ? '4K 2160p'
  : qualityMatch ? qualityMatch[0].toLowerCase() : 'unknown';

  // Match codec identifier
  const codecMatch = spaced.match(/\b(x265|x264|HEVC|AVC)\b/i);
  const codec = codecMatch ? codecMatch[0].toLowerCase() : 'unknown';

  // Everything before the year = the title
  let rawTitle = year
  ? spaced.substring(0, spaced.indexOf(String(year))).trim()
  : spaced.split(/\b(720p|1080p|2160p|4K)\b/i)[0].trim();

  // Clean up stray punctuation from the title
  rawTitle = rawTitle.replace(/[-_.[\]()]/g, ' ').replace(/\s+/g, ' ').trim();

  return { title: rawTitle || nameWithoutExt, year, quality, codec };
}

// ── Recursive Directory Walker ────────────────────────────────────────────────
// Depth-first search through the HDD directory tree
// Returns the absolute path of every video file found at any nesting level

function findVideoFiles(dirPath: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dirPath)) return results;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectory — depth-first traversal
      results.push(...findVideoFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VIDEO_EXTENSIONS.includes(ext)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

// ── GET /api/v1/movies ────────────────────────────────────────────────────────
// Returns all movies from the database, sorted alphabetically
// Note: now async because all Prisma operations are asynchronous
// (they involve I/O — reading from disk — which takes time)
export const getAllMovies = async (req: Request, res: Response) => {
  try {
    // prisma.movie.findMany() generates:
    // SELECT * FROM "movies" ORDER BY "title" ASC
    const movies = await prisma.movie.findMany({
      orderBy: { title: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    // If the database is unavailable, locked, or corrupt — return 500
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movies from database',
    });
  }
};

// ── GET /api/v1/movies/search?q=godfather ────────────────────────────────────
// Case-insensitive substring search across movie titles
// The ?q= query parameter is how the frontend will send search terms
export const searchMovies = async (req: Request, res: Response) => {
  const query = req.query.q as string;

  // Validate input — never pass raw unvalidated user input to a database query
  // Prisma protects against SQL injection, but we still want sensible limits
  if (!query || query.trim().length < 2) {
    res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters',
    });
    return;
  }

  try {
    // Prisma generates:
    // SELECT * FROM "movies" WHERE "title" LIKE '%godfather%' ORDER BY "title" ASC
    // The 'contains' filter automatically wraps the query in % wildcards
    const movies = await prisma.movie.findMany({
      where: {
        title: {
          contains: query,
          // SQLite is case-insensitive by default for ASCII characters
          // In PostgreSQL we'd add: mode: 'insensitive'
        },
      },
      orderBy: { title: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// ── GET /api/v1/movies/:id ────────────────────────────────────────────────────
export const getMovieById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  // parseInt returns NaN for non-numeric strings — check for this
  if (isNaN(id)) {
    res.status(400).json({ success: false, message: 'Invalid movie id' });
    return;
  }

  try {
    // findUnique is used when querying by a unique field (primary key or @unique column)
    // It returns one object or null — never an array
    // Generates: SELECT * FROM "movies" WHERE "id" = ? LIMIT 1
    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      res.status(404).json({
        success: false,
        message: `Movie with id ${id} not found`,
      });
      return;
    }

    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch movie' });
  }
};

// ── POST /api/v1/movies/scan ──────────────────────────────────────────────────
// Walks the HDD, parses every video filename, and persists results to the database
// Uses UPSERT: insert if new, update if already exists
// Safe to run multiple times — idempotent

export const scanHDD = async (req: Request, res: Response) => {
  const hddPath = process.env.HDD_PATH;

  if (!hddPath) {
    res.status(500).json({ success: false, message: 'HDD_PATH not set in .env' });
    return;
  }

  if (!fs.existsSync(hddPath)) {
    res.status(404).json({
      success: false,
      message: `Drive not found at: ${hddPath} — is the drive plugged in?`,
    });
    return;
  }

  try {
    const videoPaths = findVideoFiles(hddPath);
    let newCount = 0;
    let updatedCount = 0;

    for (const filePath of videoPaths) {
      const filename = path.basename(filePath);
      const stats = fs.statSync(filePath);
      const parsed = parseFilename(filename);
      const sizeGB = parseFloat((stats.size / (1024 ** 3)).toFixed(2));

      // ── UPSERT explained ────────────────────────────────────────────────────
      // upsert = UPDATE or INSERT (merged into one atomic operation)
      //
      // The database checks: does a row with filename = ? already exist?
      //
      // YES → run the UPDATE block (refresh file size and path in case it changed)
      // NO  → run the CREATE block (insert a brand new row)
      //
      // Why not just INSERT every time?
      // Because running /scan twice would create duplicate rows.
      // Upsert makes the scan operation IDEMPOTENT — running it multiple times
      // produces the same result as running it once.
      //
      // 🎯 Idempotency is a core concept in distributed systems design.
      // HTTP GET requests should always be idempotent.
      // POST requests are not idempotent by default — upsert makes ours idempotent.
      //
      // Generates SQL like:
      // INSERT INTO "movies" (filename, title, ...) VALUES (?, ?, ...)
      // ON CONFLICT (filename) DO UPDATE SET filePath = ?, sizeGB = ?, ...

      const result = await prisma.movie.upsert({
        where: { filename },   // the unique field to "find by"
        update: {              // if found: update these fields
          filePath,
          sizeGB,
          ...parsed,           // spread: title, year, quality, codec
        },
        create: {              // if not found: create with all these fields
          filename,
          filePath,
          extension: path.extname(filename),
                                               sizeGB,
                                               ...parsed,
        },
      });

      // Detect if this was an insert or update
      // If createdAt and updatedAt are identical (within 1 second), it was just created
      const timeDiff = Math.abs(
        result.updatedAt.getTime() - result.createdAt.getTime()
      );
      timeDiff < 1000 ? newCount++ : updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: 'Scan complete — database updated',
      stats: {
        total: videoPaths.length,
        newMovies: newCount,
        updated: updatedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Scan failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
