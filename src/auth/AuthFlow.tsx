import React, { useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { useAuth } from './AuthContext';
import { AuthError, LoginInput, RegisterInput, roleLabels } from './authTypes';

export function AuthFlow() {
  const { login, register, isSubmitting } = useAuth();
  const [screen, setScreen] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const changeScreen = (next: 'login' | 'register') => {
    if (isSubmitting) return;
    setError(''); setSuccess(''); setScreen(next);
  };
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSubmitting) return true;
      if (screen === 'register') { changeScreen('login'); return true; }
      return false;
    });
    return () => listener.remove();
  });
  const handleLogin = async (input: LoginInput) => {
    setError('');
    try { await login(input); }
    catch (failure) { setError(failure instanceof AuthError ? failure.message : 'Não foi possível entrar. Tente novamente.'); }
  };
  const handleRegister = async (input: RegisterInput) => {
    setError('');
    try {
      const registered = await register(input);
      setEmail(input.email.trim());
      setSuccess(`Conta criada como ${roleLabels[registered.role]}. Entre com seu e-mail e senha para continuar.`);
      setScreen('login');
    } catch (failure) { setError(failure instanceof AuthError ? failure.message : 'Não foi possível criar sua conta. Tente novamente.'); }
  };
  return screen === 'login'
    ? <LoginScreen initialEmail={email} error={error} success={success} submitting={isSubmitting} onLogin={handleLogin} onRegister={() => changeScreen('register')} />
    : <RegisterScreen error={error} submitting={isSubmitting} onRegister={handleRegister} onLogin={() => changeScreen('login')} />;
}
