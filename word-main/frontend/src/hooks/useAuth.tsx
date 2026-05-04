import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api';
import type { User } from '@shared/types/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const initialized = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await apiService.getProfile();
      if (res.success) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const token = localStorage.getItem('token');
    if (token && !user) {
      setLoading(true);
      refreshUser().finally(() => setLoading(false));
    }
  }, [refreshUser, user]);

  return { user, setUser, loading, logout, refreshUser };
}
