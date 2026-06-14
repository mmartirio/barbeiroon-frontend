import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const IDLE_MS = 30 * 60 * 1000; // 30 min

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const idleTimer = useRef(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setUser(null);
  }, []);

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(logout, IDLE_MS);
  }, [logout]);

  const refreshPlanFeatures = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me/features', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { planFeatures } = await res.json();
        setUser(prev => prev ? { ...prev, planFeatures } : prev);
      }
    } catch {}
  }, []);

  const login = useCallback((token) => {
    sessionStorage.setItem('token', token);
    const decoded = parseJwt(token);
    setUser(decoded);
    resetIdle();
    refreshPlanFeatures();
  }, [resetIdle, refreshPlanFeatures]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
        resetIdle();
        refreshPlanFeatures();
      } else {
        sessionStorage.removeItem('token');
      }
    }
    setAuthReady(true);
  }, [resetIdle, refreshPlanFeatures]);

  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (...args) => {
      const res = await original(...args);
      if (res.status === 401 && sessionStorage.getItem('token')) {
        sessionStorage.removeItem('token');
        setUser(null);
      }
      return res;
    };
    return () => { window.fetch = original; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdle));
    return () => events.forEach(e => window.removeEventListener(e, resetIdle));
  }, [user, resetIdle]);

  return (
    <AuthContext.Provider value={{ user, authReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
