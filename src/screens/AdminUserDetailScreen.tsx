import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useAuth } from '../auth/AuthContext';
import { roleLabels, statusLabels, USER_STATUSES, UserStatus } from '../auth/authTypes';
import { canChangeUserStatus, canViewUsers, PermissionError, ADMIN_ONLY_MESSAGE } from '../auth/permissions';
import { AdminUserDetail, getUserDetail, updateUserStatus } from '../admin/adminRepository';
import { FeedbackState } from '../components/FeedbackState';
import { AuthButton } from '../components/AuthForm';
import { theme } from '../theme';

type Props = { db: SQLiteDatabase; userId: string; onOpenProject: (id: string) => void; onBack: () => void };
export function AdminUserDetailScreen({ db, userId, onOpenProject, onBack }: Props) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const busy = useRef(false);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true); setError(''); setDetail(null);
    try {
      const result = await getUserDetail(db, user, userId);
      if (request === requestId.current) setDetail(result);
    } catch (failure) {
      if (request === requestId.current) setError(failure instanceof PermissionError ? failure.message : 'Não foi possível carregar o usuário e suas obras.');
    } finally { if (request === requestId.current) setLoading(false); }
  }, [db, user, userId]);
  useEffect(() => { void load(); return () => { requestId.current++; }; }, [load]);

  const changeStatus = async (next: UserStatus) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError(''); setSuccess('');
    try {
      await updateUserStatus(db, user, userId, next);
      setDetail((current) => current ? { ...current, user: { ...current.user, status: next } } : null);
      setSuccess(next === USER_STATUSES.ACTIVE ? 'Conta ativada.' : 'Conta desativada. O acesso foi revogado.');
    } catch (failure) { setError(failure instanceof PermissionError ? failure.message : 'Não foi possível atualizar a conta. Tente novamente.'); }
    finally { busy.current = false; setSaving(false); }
  };

  if (!canViewUsers(user)) return <FeedbackState kind="error" title="Área restrita" message={ADMIN_ONLY_MESSAGE} actionLabel="Voltar" onAction={onBack} />;
  const nextStatus = detail?.user.status === USER_STATUSES.ACTIVE ? USER_STATUSES.DISABLED : USER_STATUSES.ACTIVE;
  const canChange = !!detail && canChangeUserStatus(user, detail.user);
  return <ScrollView contentContainerStyle={styles.content}>
    {loading ? <FeedbackState kind="loading" title="Carregando usuário e obras" message="Consultando os dados deste dispositivo." /> : null}
    {error ? <FeedbackState kind="error" title="Não foi possível concluir" message={error} actionLabel={!detail ? 'Tentar novamente' : undefined} onAction={!detail ? load : undefined} /> : null}
    {success ? <FeedbackState kind="success" title={success} message="A alteração foi salva no banco local." /> : null}
    {detail ? <>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>{detail.user.name}</Text>
        <Text style={styles.text}>E-mail: {detail.user.email}</Text>
        <Text style={styles.text}>Perfil: {roleLabels[detail.user.role]}</Text>
        <Text style={styles.text}>Status: {statusLabels[detail.user.status]}</Text>
        {canChange ? <AuthButton label={saving ? 'Salvando...' : nextStatus === USER_STATUSES.ACTIVE ? 'Ativar conta' : 'Desativar conta'} disabled={saving} busy={saving} onPress={() => changeStatus(nextStatus)} /> : <Text style={styles.text}>Contas administrativas são preservadas neste protótipo.</Text>}
      </View>
      <Text accessibilityRole="header" style={styles.title}>Obras do usuário</Text>
      {detail.projects.length === 0 ? <FeedbackState kind="empty" title="Nenhuma obra" message="Este usuário ainda não possui obras." /> : detail.projects.map((project) => <View key={project.id} style={styles.card}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.text}>{project.chapters} capítulos · {project.genre}</Text>
        <AuthButton label={`Consultar ${project.title}`} secondary disabled={saving} onPress={() => {
          if (!canViewUsers(user)) { setError(ADMIN_ONLY_MESSAGE); return; }
          onOpenProject(project.id);
        }} />
      </View>)}
    </> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginVertical: 10 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  text: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 8 }
});
