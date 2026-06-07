import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const GestorAuthContext = createContext(null);
const TOKEN_KEY   = 'gestor_token';
const SETUP_KEY   = 'gestor_must_setup';

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function isTokenExpired(token) {
  if (!token) return true;
  const decoded = parseJwt(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

export function GestorAuthProvider({ children }) {
  const [token,     setToken]     = useState(() => {
    const t = sessionStorage.getItem(TOKEN_KEY);
    return t && !isTokenExpired(t) ? t : null;
  });
  const [user,      setUser]      = useState(() => {
    const t = sessionStorage.getItem(TOKEN_KEY);
    if (!t || isTokenExpired(t)) { sessionStorage.removeItem(TOKEN_KEY); return null; }
    return parseJwt(t);
  });
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

  // Verifica expiração periodicamente (a cada minuto)
  useEffect(() => {
    if (!token) return;
    const check = () => {
      if (isTokenExpired(token)) logout();
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [token, logout]);

  const authFetch = useCallback(async (url, opts = {}) => {
    // Rejeita imediatamente se token expirado
    if (!token || isTokenExpired(token)) {
      logout();
      return new Response(JSON.stringify({ message: 'Sessão expirada. Faça login novamente.' }), { status: 401 });
    }

    const isFormData = opts.body instanceof FormData;
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    });

    // Token inválido ou usuário desabilitado → deslogar
    if (res.status === 401 || res.status === 403) {
      logout();
    }

    return res;
  }, [token, logout]);

  return (
    <GestorAuthContext.Provider value={{ token, user, mustSetup, login, logout, clearSetup, authFetch }}>
      {children}
    </GestorAuthContext.Provider>
  );
}

export function useGestorAuth() { return useContext(GestorAuthContext); }
