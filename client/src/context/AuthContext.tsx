import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, getStoredUser, clearToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, pass: string, expectedRole?: string) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    return localStorage.getItem('campusos_reduce_motion') === 'true';
  });

  const setReduceMotion = (val: boolean) => {
    setReduceMotionState(val);
    localStorage.setItem('campusos_reduce_motion', val ? 'true' : 'false');
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      // If invalid, don't crash, keep cached or clear
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('campusos_token')) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, pass: string, expectedRole?: string) => {
    const res = await api.login(identifier, pass, expectedRole);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile, reduceMotion, setReduceMotion }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
