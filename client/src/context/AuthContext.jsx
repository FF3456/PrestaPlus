import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth as authApi } from '../api/services.js';
import { setUnauthorizedHandler, tokenStore } from '../api/http.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/** Estado global de sesión: JWT en localStorage + usuario hidratado con GET /auth/me. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      setUser(null);
      setSessionExpired(true);
    });
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then((r) => setUser(r.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  /** Guarda token y usuario devueltos por login / verify-otp. */
  const startSession = useCallback((payload) => {
    tokenStore.set(payload.data.token);
    setUser(payload.data.user);
    setSessionExpired(false);
    return payload.data.user;
  }, []);

  const login = useCallback(async (email, password) => startSession(await authApi.login({ email, password })), [startSession]);

  const value = useMemo(
    () => ({ user, setUser, loading, login, logout, startSession, sessionExpired, clearExpired: () => setSessionExpired(false), isStaff: user?.role === 'empleado' || user?.role === 'admin' }),
    [user, loading, login, logout, startSession, sessionExpired],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
