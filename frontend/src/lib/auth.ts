// Auth token management
// Stores tokens in memory (not localStorage) for security

let accessToken: string | null = null;
let refreshToken: string | null = null;

const API_BASE = 'http://localhost:3000/api/v1';

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function isLoggedIn(): boolean {
  return accessToken !== null;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Login failed');
  }

  const data = await res.json();
  setTokens(data.data.accessToken, data.data.refreshToken);
  return data.data.user;
}

export async function signup(email: string, name: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Signup failed');
  }

  const data = await res.json();
  setTokens(data.data.accessToken, data.data.refreshToken);
  return data.data.user;
}

// Automatically refresh the access token before it expires
export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    accessToken = data.data.accessToken;
    return true;
  } catch {
    return false;
  }
}
