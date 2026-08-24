/* ================================================================
   AUTH.JSX — سياق جلسة الأدمن
   ================================================================ */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // فحص الجلسة مرة واحدة عند الإقلاع — الكوكي httpOnly فمش قادرين
  // نقراها من الجافاسكريبت، لازم نسأل السيرفر
  useEffect(() => {
    let cancelled = false;
    api.get('/auth/admin/me')
      .then(data => { if (!cancelled) setAdmin(data); })
      .catch(() => { if (!cancelled) setAdmin(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/admin/login', { email, password });
    setAdmin(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/admin/logout');
    } finally {
      setAdmin(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth لازم يكون جوه AuthProvider');
  return ctx;
}
