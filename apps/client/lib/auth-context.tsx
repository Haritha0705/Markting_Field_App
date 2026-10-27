'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SESSION_EXPIRED_EVENT } from './api';
import type { SessionUser } from './types';

interface AuthContextType {
  user: SessionUser | null;
  token: string | null;
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
  updateUser: (patch: Partial<SessionUser>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  ready: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  isAuthenticated: false,
  isAdmin: false,
  ready: false,
});

export const ADMIN_ROLES = ['admin', 'superAdmin'];

const TOKEN_KEY = 'pgg_token';
const USER_KEY = 'pgg_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // storage unavailable: start signed out
    }
    setReady(true);
  }, []);

  const login = (newToken: string, newUser: SessionUser) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  }, []);

  const updateUser = (patch: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // An expired or revoked token logs the user out everywhere
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token,
        isAdmin: !!user && ADMIN_ROLES.includes(user.role),
        ready,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
