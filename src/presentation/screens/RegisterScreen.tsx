import React, { useState } from 'react';
import { AuthButton, AuthField, AuthForm } from '../components/AuthForm';
import { RegisterInput } from '../../domain/auth/authTypes';

type Props = { error: string; submitting: boolean; onRegister: (input: RegisterInput) => void; onLogin: () => void };

export function RegisterScreen({ error, submitting, onRegister, onLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const submit = () => { if (!submitting) onRegister({ name, email, password, confirmPassword }); };
  return <AuthForm title="Crie sua conta" description="A primeira conta deste dispositivo será Administrador. As próximas serão Usuário. Todos podem escrever e organizar histórias." error={error}>
    <AuthField label="Nome" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" editable={!submitting} />
    <AuthField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
      autoCorrect={false} autoComplete="email" editable={!submitting} />
    <AuthField label="Senha" value={password} onChangeText={setPassword} placeholder="Pelo menos 6 caracteres" secureTextEntry
      autoCapitalize="none" autoCorrect={false} autoComplete="new-password" editable={!submitting} />
    <AuthField label="Confirmar senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry
      autoCapitalize="none" autoCorrect={false} autoComplete="new-password" editable={!submitting} />
    <AuthButton label={submitting ? 'Criando conta...' : 'Cadastrar'} onPress={submit} busy={submitting} disabled={submitting} />
    <AuthButton label="Já tenho conta · Entrar" onPress={onLogin} disabled={submitting} secondary />
  </AuthForm>;
}
