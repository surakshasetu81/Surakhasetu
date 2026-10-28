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
    const token = typeof window !== 'undefined' ? localStorage.getItem('suraksha_staff_token') : null;

    api.get('/api/auth/me')
      .then(res => {
        if (res.data?.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
          if (token) localStorage.removeItem('suraksha_staff_token');
        }
      })
      .catch(() => {
        setUser(null);
        if (token) localStorage.removeItem('suraksha_staff_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', {
      email: email.trim(),
      password,
    });
    if (res.data?.token) {
      localStorage.setItem('suraksha_staff_token', res.data.token);
    }
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignored
    }
    localStorage.removeItem('suraksha_staff_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
