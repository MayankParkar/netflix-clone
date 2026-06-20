import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import movieRoutes from './routes/movies';
import healthRoutes from './routes/health';
import { errorHandler } from './middleware/errorHandler';

// Load .env variables into process.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware (runs on EVERY request, in order) ──────────────────────────────

// Sets secure HTTP headers automatically (prevents common attacks)
app.use(helmet());

// Allows the React frontend origin to make requests to this server
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true,               // Allow cookies (needed for auth later)
}));

// Parses incoming JSON request bodies so we can read req.body
app.use(express.json());

// Logs every request: method, url, status, response time
// Example output: GET /api/v1/movies 200 4.231 ms
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────

// All routes are versioned under /api/v1/
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/movies', movieRoutes);

// ── Global error handler (must be LAST) ──────────────────────────────────────
app.use(errorHandler);

// ── Start the server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 HDD path: ${process.env.HDD_PATH}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
});

export default app;
