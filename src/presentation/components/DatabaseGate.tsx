import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { SQLiteDatabase } from 'expo-sqlite';
import { FeedbackState } from './FeedbackState';
import { theme } from '../../theme';
import { useDatabase } from '../../application/hooks/useDatabase';

// Inicialização existente, extraída para compor banco → sessão → interface sem aumentar App.tsx.
export function DatabaseGate({ children }: { children: (db: SQLiteDatabase) => React.ReactNode }) {
  const { db, error, retry } = useDatabase();
  if (db) return children(db);
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <FeedbackState kind={error ? 'error' : 'loading'}
        title={error ? 'Não conseguimos abrir sua biblioteca' : 'Preparando sua biblioteca'}
        message={error ? 'O armazenamento não respondeu. Tente abrir novamente para acessar suas obras.' : 'Preparando suas obras e deixando tudo pronto para a próxima página.'}
        actionLabel={error ? 'Tentar novamente' : undefined}
        onAction={error ? retry : undefined} />
    </ScrollView>
  </SafeAreaView>;
}
