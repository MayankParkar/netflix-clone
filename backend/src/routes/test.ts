import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// GET /test — renders a simple HTML page with a video player
// This is ONLY for testing during development — we'll remove it in production
router.get('/', async (req: Request, res: Response) => {
  // Get all movies from the database
  const movies = await prisma.movie.findMany({ orderBy: { title: 'asc' } });

  // Build a simple HTML page — no React needed, just raw HTML
  const movieLinks = movies.map(m =>
    `<li>
      <strong>${m.title}</strong> (${m.year}) — ${m.quality} — ${m.sizeGB}GB<br/>
      <video width="854" height="480" controls style="margin:10px 0;">
        <source src="/api/v1/movies/${m.id}/stream" type="${
          m.extension === '.mkv' ? 'video/x-matroska' : 'video/mp4'
        }">
        Your browser does not support this video format.
      </video>
    </li>`
  ).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Netflix Clone — Dev Test Player</title>
  <style>
    body { background: #141414; color: white; font-family: sans-serif; padding: 20px; }
    li { margin-bottom: 30px; list-style: none; border-bottom: 1px solid #333; padding-bottom: 20px; }
    video { border-radius: 8px; }
  </style>
</head>
<body>
  <h1>🎬 Netflix Clone Dev Player</h1>
  <p>Testing HTTP Range Request streaming. Open DevTools → Network to see Range headers.</p>
  <ul>${movieLinks}</ul>
</body>
</html>`;

  res.status(200).send(html);
});

export default router;
