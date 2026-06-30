import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';

// ── Extending Express's Request type ──────────────────────────────────────────
// By default, TypeScript doesn't know our Request objects will have a `user`
// property — we're adding it ourselves after verifying the token.
// This module augmentation tells TypeScript about the new shape globally.
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; email: string };
    }
  }
}

// This middleware runs BEFORE any protected route handler
// If the token is valid, it attaches the user info to req.user and calls next()
// If invalid, it stops the request right here with a 401 — the route
// handler never even runs
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // The frontend sends the access token in the Authorization header:
  // Authorization: Bearer eyJhbGc...
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'No access token provided',
    });
    return;
  }

  // Strip the "Bearer " prefix to get just the token string
  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    // Attach the decoded user info to the request object
    // Every route handler AFTER this middleware can now access req.user
    req.user = payload;

    next(); // proceed to the actual route handler
  } catch (error) {
    // jwt.verify() throws if the token is expired, malformed, or has
    // an invalid signature — we catch all of these as "unauthorized"
    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
  }
};
