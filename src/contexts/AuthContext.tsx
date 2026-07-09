import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import * as authService from '../services/auth';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const CLIENT_ID = import.meta.env.VITE_MANGADEX_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_MANGADEX_CLIENT_SECRET || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(authService.getUserProfile());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user?.isLoggedIn && authService.isAuthenticated();

  // Auto-refresh token on mount
  useEffect(() => {
    if (user?.isLoggedIn && authService.isTokenExpired()) {
      if (CLIENT_ID && CLIENT_SECRET) {
        authService.refreshToken(CLIENT_ID, CLIENT_SECRET).then(tokens => {
          if (!tokens) {
            setUser(null);
          }
        });
      }
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string) => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      setError('MangaDex API client credentials not configured. Set VITE_MANGADEX_CLIENT_ID and VITE_MANGADEX_CLIENT_SECRET in .env');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(username, password, CLIENT_ID, CLIENT_SECRET);
      setUser({ username, isLoggedIn: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
