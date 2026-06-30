import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../services/authService';

// ── POST /api/v1/auth/signup ──────────────────────────────────────────────────
export const signup = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  // Always validate on the SERVER, never trust the client alone
  // A malicious user could bypass your frontend entirely and call this
  // endpoint directly with curl or Postman
  if (!email || !name || !password) {
    res.status(400).json({
      success: false,
      message: 'Email, name, and password are all required',
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters',
    });
    return;
  }

  try {
    // Check if this email is already registered
    // Our @unique constraint on email would also catch this at the DB level,
    // but checking here lets us return a clean error message instead of
    // a generic database constraint violation
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      res.status(409).json({
        // 409 Conflict — the request conflicts with existing server state
        success: false,
        message: 'An account with this email already exists',
      });
      return;
    }

    // Hash the password BEFORE storing — never store plain text
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    // Generate both tokens immediately so the user is logged in
    // right after signing up — no separate login step required
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        // NEVER send the password hash back to the client, even hashed
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Signup failed' });
  }
};

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // ── Security note: identical error for "no user" and "wrong password" ────
    // If we said "user not found" vs "wrong password" differently, an
    // attacker could use that to discover which emails are registered
    // (a "user enumeration" vulnerability). Always return the same
    // generic message for both failure cases.
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const passwordMatches = await comparePassword(password, user.password);

    if (!passwordMatches) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ── POST /api/v1/auth/refresh ─────────────────────────────────────────────────
// When the access token expires (every 15 min), the frontend calls this
// endpoint with the refresh token to get a brand new access token,
// without forcing the user to log in again
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token required' });
    return;
  }

  try {
    // This throws if the refresh token is expired or invalid
    const payload = verifyRefreshToken(refreshToken);

    // Issue a brand new access token using the same identity
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    // Refresh token expired or tampered with — user must log in again fully
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token — please log in again',
    });
  }
};
