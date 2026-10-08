import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../application/contexts/AuthContext';
import { roleLabels, statusLabels } from '../../domain/auth/authTypes';
import { AuthButton } from './AuthForm';
import { useFeedback } from '../../application/contexts/FeedbackContext';
import { theme } from '../../theme';

export function AccountCard() {
  const { user, logout, isSubmitting } = useAuth();
  const { confirm } = useFeedback();
  if (!user) return null;
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Conta</Text>
    <Text style={styles.text}>Nome: {user.name}</Text>
    <Text style={styles.text}>E-mail: {user.email}</Text>
    <Text style={styles.text}>Perfil: {roleLabels[user.role]}</Text>
    <Text style={styles.text}>Status: {statusLabels[user.status]}</Text>
    <AuthButton label="Sair da conta" secondary disabled={isSubmitting} onPress={() => confirm({
      title: 'Sair da conta?', message: 'Obras e capítulos salvos continuam neste dispositivo. As notas temporárias serão descartadas.', confirmLabel: 'Sair da conta', errorMessage: 'Não foi possível sair. Tente novamente.', onConfirm: logout
    })} />
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  title: { fontWeight: '800', color: theme.colors.text },
  text: { fontSize: 14, color: theme.colors.textMuted, marginTop: 8, lineHeight: 21 },
  error: { fontSize: 13, color: theme.colors.danger, marginTop: 12, lineHeight: 20 }
});
