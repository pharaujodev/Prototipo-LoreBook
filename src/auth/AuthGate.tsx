import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FeedbackState } from '../components/FeedbackState';
import { theme } from '../theme';
import { useAuth } from './AuthContext';
import { AuthFlow } from './AuthFlow';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isRestoringSession, restorationError, retryRestoration } = useAuth();
  if (!isRestoringSession && !restorationError && user) return <React.Fragment key={user.id}>{children}</React.Fragment>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <StatusBar style="dark" />
    {isRestoringSession || restorationError ? <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <FeedbackState kind={isRestoringSession ? 'loading' : 'error'}
        title={isRestoringSession ? 'Carregando sua sessão...' : 'Não conseguimos abrir sua sessão'}
        message={isRestoringSession ? 'Verificando sua conta neste dispositivo.' : restorationError}
        actionLabel={restorationError && !isRestoringSession ? 'Tentar novamente' : undefined} onAction={retryRestoration} />
    </ScrollView> : <AuthFlow />}
  </SafeAreaView>;
}
