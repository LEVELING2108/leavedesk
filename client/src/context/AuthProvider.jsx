import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, refreshSession, setAccessToken, setSessionExpiredHandler } from '../api/client';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the refresh cookie on first load
  useEffect(() => {
    refreshSession()
      .then((session) => setUser(session.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    setSessionExpiredHandler(() => setUser(null));
  }, []);

  const startSession = useCallback(({ user: u, accessToken }) => {
    setAccessToken(accessToken);
    setUser(u);
    return u;
  }, []);

  const login = useCallback(
    async (credentials) => startSession((await api.post('/auth/login', credentials)).data.data),
    [startSession],
  );

  const register = useCallback(
    async (details) => startSession((await api.post('/auth/register', details)).data.data),
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
