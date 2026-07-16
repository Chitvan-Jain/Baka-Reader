import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import * as authService from '../services/auth';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CLIENT_ID = import.meta.env.VITE_MANGADEX_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_MANGADEX_CLIENT_SECRET || '';

// Local accounts stored in localStorage
const LOCAL_ACCOUNTS_KEY = 'baka_local_accounts';
const LOCAL_SESSION_KEY = 'baka_local_session';

interface LocalAccount {
  email: string;
  username: string;
  passwordHash: string; // simple hash, not production-grade
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getLocalAccounts(): LocalAccount[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || '[]');
  } catch { return []; }
}

function saveLocalAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getLocalSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocalSession(user: UserProfile | null) {
  if (user) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Check both MangaDex session and local session
  const [user, setUser] = useState<UserProfile | null>(() => {
    return authService.getUserProfile() || getLocalSession();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user?.isLoggedIn;

  // Auto-refresh MangaDex token on mount
  useEffect(() => {
    if (user?.isLoggedIn && authService.isTokenExpired()) {
      if (CLIENT_ID && CLIENT_SECRET) {
        authService.refreshToken(CLIENT_ID, CLIENT_SECRET).then(tokens => {
          if (!tokens) {
            // MangaDex token expired, but keep local session if it exists
            const localSession = getLocalSession();
            if (!localSession) {
              setUser(null);
            }
          }
        });
      }
    }
  }, [user]);

  // MangaDex login (existing flow)
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    // First try local account login
    const accounts = getLocalAccounts();
    const localMatch = accounts.find(
      a => a.username === username && a.passwordHash === simpleHash(password)
    );

    if (localMatch) {
      const profile: UserProfile = { username: localMatch.username, isLoggedIn: true };
      setUser(profile);
      saveLocalSession(profile);
      setIsLoading(false);
      return;
    }

    // Then try MangaDex login
    if (!CLIENT_ID || !CLIENT_SECRET) {
      setError('No account found. Create one with Sign Up, or configure MangaDex API credentials for MangaDex login.');
      setIsLoading(false);
      return;
    }

    try {
      await authService.login(username, password, CLIENT_ID, CLIENT_SECRET);
      const profile: UserProfile = { username, isLoggedIn: true };
      setUser(profile);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Local account registration
  const register = useCallback(async (email: string, username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const accounts = getLocalAccounts();

      // Check for existing username or email
      if (accounts.find(a => a.username === username)) {
        throw new Error('Username already taken');
      }
      if (accounts.find(a => a.email === email)) {
        throw new Error('Email already registered');
      }

      // Create account
      const newAccount: LocalAccount = {
        email,
        username,
        passwordHash: simpleHash(password),
      };
      accounts.push(newAccount);
      saveLocalAccounts(accounts);

      // Auto-login
      const profile: UserProfile = { username, isLoggedIn: true };
      setUser(profile);
      saveLocalSession(profile);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    saveLocalSession(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
