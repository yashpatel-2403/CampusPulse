import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        setUser(null);
        localStorage.removeItem('cp_token');
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('cp_token');
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);



  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('cp_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await api.post('/auth/signup', payload);
    localStorage.setItem('cp_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('cp_token');
    setUser(null);
  };

  const updateUser = (u) => setUser(u);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
