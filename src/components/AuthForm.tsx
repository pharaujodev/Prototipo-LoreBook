import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type FormProps = {
  title: string;
  description: string;
  error: string;
  success?: string;
  children: React.ReactNode;
};

export function AuthForm({ title, description, error, success, children }: FormProps) {
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.root}>
      <View style={styles.card}>
        <Text style={styles.brand}>LoreBook</Text>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {success ? <Text style={styles.success} accessibilityLiveRegion="polite">{success}</Text> : null}
        {error ? <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text> : null}
        {children}
        <Text style={styles.localNote}>Conta local neste dispositivo. Sem sincronização com a nuvem.</Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

export { AppButton as AuthButton, AppField as AuthField } from './FormControls';

const styles = StyleSheet.create({
  root: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', padding: theme.spacing.xl, borderTopWidth: 4, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg },
  brand: { fontSize: 38, fontFamily: theme.font.editorial, color: theme.colors.primary, letterSpacing: -1 },
  title: { fontFamily: theme.font.editorial, fontSize: 26, color: theme.colors.text, marginTop: 12 },
  description: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 8 },
  error: { color: theme.colors.danger, backgroundColor: theme.colors.dangerSoft, padding: 12, borderRadius: theme.radius.sm, lineHeight: 20, marginTop: 12 },
  success: { color: theme.colors.success, backgroundColor: theme.colors.successSoft, padding: 12, borderRadius: theme.radius.sm, lineHeight: 20, marginTop: 12 },
  localNote: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 20 }
});
