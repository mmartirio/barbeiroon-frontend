import React, { createContext, useState, useEffect, useRef } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || '');
  const [authReady, setAuthReady] = useState(false);
  const idleTimerRef = useRef(null);
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  const LAST_ACTIVITY_KEY = 'lastActivity';

  const decodeToken = (jwtToken) => {
    const payloadPart = jwtToken.split('.')[1];
    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  };

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const scheduleIdleTimer = () => {
    clearIdleTimer();
    const lastActivity = parseInt(sessionStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
    const timeSinceLast = Date.now() - lastActivity;
    const timeLeft = IDLE_TIMEOUT_MS - timeSinceLast;

    if (timeLeft <= 0) {
      logout();
      return;
    }

    idleTimerRef.current = setTimeout(() => {
      logout();
    }, timeLeft);
  };

  const updateLastActivity = () => {
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    scheduleIdleTimer();
  };

  useEffect(() => {
    if (token) {
      try {
        const payload = decodeToken(token);
        if (!payload) {
          logout();
          return;
        }
        const expiresAt = payload.exp ? payload.exp * 1000 : 0;

        if (expiresAt && Date.now() >= expiresAt) {
          logout();
          return;
        }

        console.log('[AuthContext] Payload JWT decodificado:', payload);
        setUser({
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          tenantId: payload.tenantId,
          permissions: payload.permissions || {},
        });
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setAuthReady(true);
      return;
    }

    setAuthReady(Boolean(user));
  }, [token, user]);

  useEffect(() => {
    if (!token) {
      clearIdleTimer();
      return;
    }

    if (!sessionStorage.getItem(LAST_ACTIVITY_KEY)) {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    scheduleIdleTimer();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, updateLastActivity, { passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateLastActivity));
      clearIdleTimer();
    };
  }, [token]);

  function login(token) {
    setToken(token);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  function logout() {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    clearIdleTimer();
    window.location.assign('/admin');
  }

  return (
    <AuthContext.Provider value={{ user, token, authReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
