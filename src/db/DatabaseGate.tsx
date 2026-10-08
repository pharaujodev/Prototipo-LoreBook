import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { FeedbackState } from '../components/FeedbackState';
import { theme } from '../theme';
import { initializeDatabase } from './database';

// Inicialização existente, extraída para compor banco → sessão → interface sem aumentar App.tsx.
export function DatabaseGate({ children }: { children: (db: SQLiteDatabase) => React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let settled = false;
    let database: SQLiteDatabase | undefined;
    async function prepare() {
      try {
        database = await openDatabaseAsync('lorebook.db');
        await initializeDatabase(database);
        if (!cancelled) setDb(database);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        settled = true;
        if (cancelled) void database?.closeAsync().catch(() => {});
      }
    }
    void prepare();
    return () => { cancelled = true; if (settled) void database?.closeAsync().catch(() => {}); };
  }, [attempt]);
  if (db) return children(db);
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <FeedbackState kind={error ? 'error' : 'loading'}
        title={error ? 'Não conseguimos abrir seu ateliê' : 'Abrindo seu ateliê'}
        message={error ? 'O armazenamento não respondeu. Tente abrir novamente para acessar suas obras.' : 'Preparando suas obras e deixando tudo pronto para a próxima página.'}
        actionLabel={error ? 'Tentar novamente' : undefined}
        onAction={error ? () => { setError(false); setAttempt((value) => value + 1); } : undefined} />
    </ScrollView>
  </SafeAreaView>;
}
