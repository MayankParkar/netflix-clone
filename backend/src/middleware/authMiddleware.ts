import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; email: string };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check Authorization header first (standard API calls)
  const authHeader = req.headers.authorization;
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Also check query param (used by <video> element which can't set headers)
  // e.g. /movies/1/stream?token=eyJhbGc...
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'No access token provided' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
};
