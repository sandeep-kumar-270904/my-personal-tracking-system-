import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.get('/auth/me');
          setUser(res.data);
        }
      } catch (error) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
  };

  const register = async (userData) => {
    await api.post('/auth/register', userData);
    // Removed auto-login. The component should redirect to login page.
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const googleLogin = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
  };

  const socialLogin = async (provider, code) => {
    const res = await api.post(`/auth/${provider}`, { code });
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, googleLogin, socialLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
