import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, type User, getToken, setStoredUser, clearToken, SESSION_EXPIRED_EVENT } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, pass: string, expectedRole?: string) => Promise<{ token: string; user: User; roleMismatchWarning?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cached profiles are presentation data, never proof of authorization. Wait
  // for the API before mounting a protected workspace after a page reload.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));
  const sessionVersion = useRef(0);
  const [reduceMotion, setReduceMotionState] = useState(() => {
    try {
      const preference = localStorage.getItem('campusos_reduce_motion');
      if (preference !== null) return preference === 'true';
    } catch { /* Use the operating system preference. */ }
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const setReduceMotion = useCallback((value: boolean) => {
    setReduceMotionState(value);
    try { localStorage.setItem('campusos_reduce_motion', String(value)); } catch { /* Memory preference still applies. */ }
  }, []);

  const logout = useCallback(() => {
    sessionVersion.current += 1;
    clearToken();
    setUser(null);
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const version = sessionVersion.current;
    try {
      const profile = await api.getMe();
      if (version !== sessionVersion.current) return;
      setStoredUser(profile);
      setUser(profile);
    } catch {
      if (version === sessionVersion.current) setUser(null);
    } finally {
      if (version === sessionVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) void refreshProfile();
    else clearToken();
    const syncSession = (event: StorageEvent) => {
      if (event.key !== 'campusos_token' && event.key !== null) return;
      sessionVersion.current += 1;
      setUser(null);
      if (getToken()) {
        setLoading(true);
        void refreshProfile();
      } else logout();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, logout);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, logout);
      window.removeEventListener('storage', syncSession);
    };
  }, [logout, refreshProfile]);

  const login = useCallback(async (identifier: string, pass: string, expectedRole?: string) => {
    sessionVersion.current += 1;
    const result = await api.login(identifier, pass, expectedRole);
    setUser(result.user);
    setLoading(false);
    return result;
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile, reduceMotion, setReduceMotion }}>
    {children}
  </AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
