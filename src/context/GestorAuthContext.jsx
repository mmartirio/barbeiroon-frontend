import React, { createContext, useContext, useState, useCallback } from 'react';

const GestorAuthContext = createContext(null);
const TOKEN_KEY   = 'gestor_token';
const SETUP_KEY   = 'gestor_must_setup';

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

export function GestorAuthProvider({ children }) {
  const [token,     setToken]     = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user,      setUser]      = useState(() => { const t = sessionStorage.getItem(TOKEN_KEY); return t ? parseJwt(t) : null; });
  const [mustSetup, setMustSetup] = useState(() => sessionStorage.getItem(SETUP_KEY) === 'true');

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/gestor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Credenciais inválidas');
    }
    const data = await res.json();
    const tk = data.token;
    sessionStorage.setItem(TOKEN_KEY, tk);
    setToken(tk);
    setUser(parseJwt(tk));
    if (data.mustSetup) {
      sessionStorage.setItem(SETUP_KEY, 'true');
      setMustSetup(true);
    }
    return { mustSetup: !!data.mustSetup };
  }, []);

  const clearSetup = useCallback(() => {
    sessionStorage.removeItem(SETUP_KEY);
    setMustSetup(false);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SETUP_KEY);
    setToken(null);
    setUser(null);
    setMustSetup(false);
  }, []);

  const authFetch = useCallback((url, opts = {}) => {
    return fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    });
  }, [token]);

  return (
    <GestorAuthContext.Provider value={{ token, user, mustSetup, login, logout, clearSetup, authFetch }}>
      {children}
    </GestorAuthContext.Provider>
  );
}

export function useGestorAuth() { return useContext(GestorAuthContext); }
