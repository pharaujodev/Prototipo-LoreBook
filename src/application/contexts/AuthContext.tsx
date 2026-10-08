import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { AuthError, AuthUser, LoginInput, RegisterInput } from '../../domain/auth/authTypes';
import { authenticateUser, clearSession, registerUser, restoreSession, saveSession } from '../../data/repositories/authRepository';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  isSubmitting: boolean;
  restorationError: string;
  retryRestoration: () => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ db, children }: { db: SQLiteDatabase; children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [restorationError, setRestorationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    busy.current = true;
    setIsRestoringSession(true);
    setRestorationError('');
    restoreSession(db).then((restored) => {
      if (active) setUser(restored);
    }).catch(() => {
      if (active) setRestorationError('Não foi possível carregar sua conta e sessão do banco local. Tente novamente.');
    }).finally(() => {
      if (active) { busy.current = false; setIsRestoringSession(false); }
    });
    return () => { active = false; };
  }, [db, attempt]);

  const run = useCallback(async <T,>(action: () => Promise<T>, fallback: string): Promise<T> => {
    if (busy.current) throw new AuthError('Aguarde a operação em andamento.');
    busy.current = true;
    setIsSubmitting(true);
    try { return await action(); }
    catch (error) { throw error instanceof AuthError ? error : new AuthError(fallback); }
    finally { busy.current = false; setIsSubmitting(false); }
  }, []);

  const login = useCallback((input: LoginInput) => run(async () => {
    const authenticated = await authenticateUser(db, input);
    await saveSession(db, authenticated.id);
    setUser(authenticated);
  }, 'Não foi possível entrar. Tente novamente.'), [db, run]);

  const register = useCallback((input: RegisterInput) => run(async () => {
    return registerUser(db, input);
  }, 'Não foi possível criar sua conta. Tente novamente.'), [db, run]);

  const logout = useCallback(() => run(async () => {
    await clearSession(db);
    setUser(null);
  }, 'Não foi possível sair da conta. Tente novamente.'), [db, run]);

  return <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isRestoringSession, isSubmitting,
    restorationError, retryRestoration: () => setAttempt((value) => value + 1), login, register, logout }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requer AuthProvider.');
  return value;
}
