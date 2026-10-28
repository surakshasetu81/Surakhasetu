import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'committee' | 'ombudsman' | 'user';
  department?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignored
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
