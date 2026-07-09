import type { AuthTokens, UserProfile } from '../types';

const AUTH_BASE = '/auth/realms/mangadex/protocol/openid-connect';
const TOKEN_KEY = 'baka_reader_tokens';
const USER_KEY = 'baka_reader_user';

function getStoredTokens(): AuthTokens | null {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    ...tokens,
    storedAt: Date.now(),
  }));
}

function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isTokenExpired(): boolean {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored) return true;
  try {
    const parsed = JSON.parse(stored);
    const storedAt = parsed.storedAt || 0;
    const expiresIn = parsed.expires_in || 900; // default 15 min
    return Date.now() > storedAt + (expiresIn - 60) * 1000; // refresh 60s early
  } catch {
    return true;
  }
}

export async function login(
  username: string,
  password: string,
  clientId: string,
  clientSecret: string
): Promise<AuthTokens> {
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error_description || 'Authentication failed');
  }

  const tokens: AuthTokens = await res.json();
  storeTokens(tokens);

  // Store user info
  localStorage.setItem(USER_KEY, JSON.stringify({
    username,
    isLoggedIn: true,
  }));

  return tokens;
}

export async function refreshToken(clientId: string, clientSecret: string): Promise<AuthTokens | null> {
  const stored = getStoredTokens();
  if (!stored?.refresh_token) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: stored.refresh_token,
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const res = await fetch(`${AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const tokens: AuthTokens = await res.json();
    storeTokens(tokens);
    return tokens;
  } catch {
    clearTokens();
    return null;
  }
}

export function logout(): void {
  clearTokens();
}

export function getAccessToken(): string | null {
  const stored = getStoredTokens();
  if (!stored) return null;
  if (isTokenExpired()) return null;
  return stored.access_token;
}

export function getUserProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export { isTokenExpired, getStoredTokens };
