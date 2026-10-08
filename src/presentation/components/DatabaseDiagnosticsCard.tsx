import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { DatabaseDiagnostics } from '../../domain/types/admin';
import { getDatabaseDiagnostics } from '../../data/repositories/diagnosticsRepository';
import { AuthButton } from './AuthForm';
import { theme } from '../../theme';
import { useAuth } from '../../application/contexts/AuthContext';
import { canAccessDatabaseDiagnostics, PermissionError, ADMIN_ONLY_MESSAGE } from '../../domain/permissions/permissions';

export function DatabaseDiagnosticsCard({ db }: { db: SQLiteDatabase }) {
  const { user } = useAuth();
  const [result, setResult] = useState<DatabaseDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const verify = async () => {
    if (!canAccessDatabaseDiagnostics(user)) { setResult(null); setError(ADMIN_ONLY_MESSAGE); return; }
    if (busy.current) return;
    busy.current = true;
    setLoading(true); setError(''); setResult(null);
    try { setResult(await getDatabaseDiagnostics(db, user)); }
    catch (failure) { setError(failure instanceof PermissionError ? failure.message : 'Não foi possível verificar o banco local. Tente novamente.'); }
    finally { busy.current = false; setLoading(false); }
  };
  if (!canAccessDatabaseDiagnostics(user)) return <Text accessibilityRole="alert" style={styles.error}>{ADMIN_ONLY_MESSAGE}</Text>;
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Banco local</Text>
    <View accessibilityLiveRegion="polite">
      <Text style={styles.text}>Status: {loading ? 'Verificando...' : error ? 'Falha na consulta' : result ? 'Conectado' : 'Não verificado'}</Text>
      {result ? <>
        <Text style={styles.text}>Obras: {result.projects}</Text>
        <Text style={styles.text}>Capítulos: {result.chapters}</Text>
        <Text style={styles.text}>Usuários: {result.users}</Text>
        <Text style={styles.text}>Obras sem proprietário: {result.unownedProjects}</Text>
      </> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
    <AuthButton label={loading ? 'Verificando...' : error ? 'Tentar verificar novamente' : 'Verificar banco'} busy={loading} disabled={loading} onPress={verify} />
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  title: { fontWeight: '800', color: theme.colors.text },
  text: { fontSize: 14, color: theme.colors.textMuted, marginTop: 8 },
  error: { fontSize: 13, color: theme.colors.danger, marginTop: 10, lineHeight: 20 }
});
