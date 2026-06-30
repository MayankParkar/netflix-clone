import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import movieRoutes from './routes/movies';
import healthRoutes from './routes/health';
import testRoutes from './routes/test';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  // helmet blocks inline scripts and cross-origin resources by default
  // We need to relax this for the test page's video player
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/movies', movieRoutes);
app.use('/test', testRoutes);  // dev test page only

// Global error handler — must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`🎬 Test player: http://localhost:${PORT}/test`);
  console.log(`📁 HDD path: ${process.env.HDD_PATH}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
});

export default app;
