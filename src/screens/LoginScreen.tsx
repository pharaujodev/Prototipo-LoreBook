import React, { useState } from 'react';
import { AuthButton, AuthField, AuthForm } from '../components/AuthForm';
import type { LoginInput } from '../auth/authTypes';

type Props = {
  initialEmail: string;
  error: string;
  success: string;
  submitting: boolean;
  onLogin: (input: LoginInput) => void;
  onRegister: () => void;
};

export function LoginScreen({ initialEmail, error, success, submitting, onLogin, onRegister }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const submit = () => { if (!submitting) onLogin({ email, password }); };
  return <AuthForm title="Entre no seu ateliê" description="Acesse sua conta local para escrever ou acompanhar as histórias." error={error} success={success}>
    <AuthField label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
      keyboardType="email-address" autoComplete="email" editable={!submitting} />
    <AuthField label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"
      autoCorrect={false} autoComplete="current-password" editable={!submitting} returnKeyType="go" onSubmitEditing={submit} />
    <AuthButton label={submitting ? 'Entrando...' : 'Entrar'} onPress={submit} busy={submitting} disabled={submitting} />
    <AuthButton label="Criar conta" onPress={onRegister} disabled={submitting} secondary />
  </AuthForm>;
}
