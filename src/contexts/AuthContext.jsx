import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authenticate as authenticateUser, normalizeRole } from '../services/auth';

const AuthContext = createContext(null);

function readStoredUser() {
  if (!globalThis.localStorage?.getItem('accessToken')) return null;

  try {
    const storedUser = globalThis.localStorage.getItem('toolshare:user');
    if (!storedUser) return null;
    const user = JSON.parse(storedUser);
    if (!user || typeof user !== 'object' || Array.isArray(user)) return null;
    return { ...user, role: normalizeRole(user.role || user.type) };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [accessDenied, setAccessDenied] = useState(false);

  const clearSession = useCallback(() => {
    globalThis.localStorage?.removeItem('accessToken');
    globalThis.localStorage?.removeItem('toolshare:user');
    globalThis.sessionStorage?.removeItem('toolshare:redirect');
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const session = await authenticateUser(credentials);
    setUser(session.user);
    return { user: session.user, role: session.role, destination: session.destination };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    globalThis.location.assign('/');
  }, [clearSession]);

  useEffect(() => {
    const handleSessionExpired = () => clearSession();
    const handleAccessDenied = () => setAccessDenied(true);
    globalThis.addEventListener('toolshare:session-expired', handleSessionExpired);
    globalThis.addEventListener('toolshare:access-forbidden', handleAccessDenied);
    return () => {
      globalThis.removeEventListener('toolshare:session-expired', handleSessionExpired);
      globalThis.removeEventListener('toolshare:access-forbidden', handleAccessDenied);
    };
  }, [clearSession]);

  const clearAccessDenied = useCallback(() => setAccessDenied(false), []);

  const value = useMemo(
    () => ({ user, role: user?.role || null, login, logout, clearSession, accessDenied, clearAccessDenied }),
    [user, login, logout, clearSession, accessDenied, clearAccessDenied],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Keep the hook export here to preserve the existing public API.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
