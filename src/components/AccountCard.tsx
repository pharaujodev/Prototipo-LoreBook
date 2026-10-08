import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AuthError, roleLabels, statusLabels } from '../auth/authTypes';
import { AuthButton } from './AuthForm';
import { theme } from '../theme';

export function AccountCard() {
  const { user, logout, isSubmitting } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const confirmLogout = async () => {
    setError('');
    try { await logout(); }
    catch (failure) { setError(failure instanceof AuthError ? failure.message : 'Não foi possível sair da conta. Tente novamente.'); }
  };
  if (!user) return null;
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Conta</Text>
    <Text style={styles.text}>Nome: {user.name}</Text>
    <Text style={styles.text}>E-mail: {user.email}</Text>
    <Text style={styles.text}>Perfil: {roleLabels[user.role]}</Text>
    <Text style={styles.text}>Status: {statusLabels[user.status]}</Text>
    {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {confirming ? <>
      <Text style={styles.text}>Sair da conta? Os capítulos salvos continuam no dispositivo. As notas temporárias desta sessão serão descartadas.</Text>
      <AuthButton label={isSubmitting ? 'Saindo...' : 'Confirmar saída'} busy={isSubmitting} disabled={isSubmitting} onPress={confirmLogout} />
      <AuthButton label="Continuar na conta" secondary disabled={isSubmitting} onPress={() => { setConfirming(false); setError(''); }} />
    </> : <AuthButton label="Sair da conta" secondary onPress={() => setConfirming(true)} />}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  title: { fontWeight: '800', color: theme.colors.text },
  text: { fontSize: 14, color: theme.colors.textMuted, marginTop: 8, lineHeight: 21 },
  error: { fontSize: 13, color: theme.colors.danger, marginTop: 12, lineHeight: 20 }
});
