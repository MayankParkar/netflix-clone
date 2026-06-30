import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ── Password Hashing ──────────────────────────────────────────────────────────

// "Salt rounds" = how many times bcrypt runs its hashing algorithm internally
// Higher = more secure but slower. 10 is the industry-standard balance
// between security and performance for typical web apps
const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  // bcrypt.hash automatically generates a random salt and embeds it
  // in the output string — you never manage the salt separately
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // bcrypt.compare extracts the salt from the stored hash, re-hashes
  // the plain password with that same salt, and checks if they match
  // This is the ONLY correct way to verify a bcrypt password —
  // you never reverse a hash back to plain text
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ── JWT Token Generation ──────────────────────────────────────────────────────

// This is the data we embed inside every token's payload
// Keep this minimal — anyone can decode and read it (it's not encrypted)
interface TokenPayload {
  userId: number;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not set');

  // jwt.sign() creates the full token: header.payload.signature
  // expiresIn: '15m' means the token becomes invalid 15 minutes after creation
  // The expiry is embedded INSIDE the token payload as an 'exp' field
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');

  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// ── JWT Token Verification ────────────────────────────────────────────────────

export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not set');

  // jwt.verify() does THREE things automatically:
  // 1. Checks the signature is valid (wasn't tampered with)
  // 2. Checks the token hasn't expired
  // 3. Decodes and returns the payload
  // If any check fails, it THROWS an error — caller must catch it
  return jwt.verify(token, secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');

  return jwt.verify(token, secret) as TokenPayload;
}
