import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/health
// AWS, Kubernetes, and Docker all ping this endpoint to check if the
// app is alive. If it returns 200, the server is healthy.
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // seconds since server started
  });
});

export default router;
