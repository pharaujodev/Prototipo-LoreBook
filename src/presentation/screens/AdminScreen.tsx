import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useAuth } from '../../application/contexts/AuthContext';
import { roleLabels, statusLabels } from '../../domain/auth/authTypes';
import type { AdminUser } from '../../domain/types/admin';
import { listUsers } from '../../data/repositories/adminRepository';
import { canViewUsers, PermissionError, ADMIN_ONLY_MESSAGE } from '../../domain/permissions/permissions';
import { DatabaseDiagnosticsCard } from '../components/DatabaseDiagnosticsCard';
import { FeedbackState } from '../components/FeedbackState';
import { AuthButton } from '../components/AuthForm';
import { theme } from '../../theme';

export function AdminScreen({ db, onBack, onOpenUser }: { db: SQLiteDatabase; onBack: () => void; onOpenUser: (id: string) => void }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const loadUsers = useCallback(async () => {
    const request = ++requestId.current;
    if (!canViewUsers(user)) { setUsers([]); setError(ADMIN_ONLY_MESSAGE); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const result = await listUsers(db, user);
      if (request === requestId.current) setUsers(result);
    } catch (failure) {
      if (request === requestId.current) {
        setUsers([]);
        setError(failure instanceof PermissionError ? failure.message : 'Não foi possível carregar os usuários do banco local. Tente novamente.');
      }
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [db, user]);

  useEffect(() => {
    void loadUsers();
    return () => { requestId.current += 1; };
  }, [loadUsers]);

  if (!canViewUsers(user)) return <ScrollView contentContainerStyle={styles.content}>
    <FeedbackState kind="error" title="Área restrita" message={ADMIN_ONLY_MESSAGE} actionLabel="Voltar às configurações" onAction={onBack} />
  </ScrollView>;

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title} accessibilityRole="header">Usuários cadastrados</Text>
    <Text style={styles.help}>Consulta das contas deste dispositivo. Todos os perfis podem escrever; apenas Administrador acessa esta área.</Text>
    {loading ? <FeedbackState kind="loading" title="Carregando usuários" message="Consultando as contas salvas neste dispositivo." />
      : error ? <FeedbackState kind="error" title="Não foi possível abrir a lista" message={error} actionLabel="Tentar novamente" onAction={loadUsers} />
      : users.length === 0 ? <FeedbackState kind="empty" title="Nenhum usuário cadastrado" message="As contas locais aparecerão aqui após o cadastro." />
      : users.map((account) => <View key={account.id} style={styles.card}>
        <Text style={styles.name}>{account.name}</Text>
        <Text style={styles.text}>{account.email}</Text>
        <Text style={styles.role}>{roleLabels[account.role]}</Text>
        <Text style={styles.text}>{statusLabels[account.status]} · {account.projectCount} obras</Text>
        <AuthButton label={`Ver detalhes de ${account.name}`} secondary onPress={() => {
          if (!canViewUsers(user)) { setError(ADMIN_ONLY_MESSAGE); return; }
          onOpenUser(account.id);
        }} />
      </View>)}
    {!loading && !error ? <AuthButton label="Atualizar usuários" secondary onPress={loadUsers} /> : null}
    <View style={styles.diagnostics}><DatabaseDiagnosticsCard db={db} /></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: theme.layout.page, paddingBottom: theme.spacing.xxl, width: '100%', maxWidth: theme.layout.maxWidth, alignSelf: 'center' },
  title: { color: theme.colors.text, fontSize: theme.typography.heading, fontFamily: theme.font.editorial },
  help: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 18 },
  card: { padding: theme.spacing.lg, marginBottom: theme.spacing.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderLeftWidth: 3, borderLeftColor: theme.colors.primary, borderRadius: theme.radius.md },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  text: { color: theme.colors.textMuted, fontSize: 14, marginTop: 6 },
  role: { color: theme.colors.primary, fontSize: 13, fontWeight: '700', marginTop: 8 },
  diagnostics: { marginTop: 24 }
});
