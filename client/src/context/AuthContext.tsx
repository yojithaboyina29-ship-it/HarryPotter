import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hogwarts_token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await auth.me();
      setUser(response.data.user || response.data);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('hogwarts_token');
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await auth.login(email, password);
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('hogwarts_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await auth.register(username, email, password);
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('hogwarts_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('hogwarts_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
