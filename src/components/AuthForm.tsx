import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
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
        <Text style={styles.brand}>LOREBOOK</Text>
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

export function AuthField({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={theme.colors.textMuted} {...props}
      style={[styles.input, props.editable === false && styles.disabled, props.style]} />
  </View>;
}

export function AuthButton({ label, onPress, disabled, busy, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled, busy: !!busy }}
    disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]}>
    {busy ? <ActivityIndicator size="small" color={theme.colors.white} /> : null}
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', padding: 22, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg },
  brand: { fontSize: 12, color: theme.colors.accent, letterSpacing: 2, fontWeight: '800' },
  title: { fontFamily: theme.font.editorial, fontSize: 32, color: theme.colors.text, marginTop: 12 },
  description: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 8 },
  field: { marginTop: 12 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.background, color: theme.colors.text, fontSize: 16 },
  button: { minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 12, marginTop: 16, backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
  buttonText: { color: theme.colors.white, fontWeight: '700', fontSize: 14 },
  secondary: { backgroundColor: theme.colors.surfaceMuted, marginTop: 10 },
  secondaryText: { color: theme.colors.primary },
  disabled: { opacity: 0.55 },
  error: { color: theme.colors.danger, backgroundColor: theme.colors.dangerSoft, padding: 12, borderRadius: theme.radius.sm, lineHeight: 20, marginTop: 12 },
  success: { color: theme.colors.success, backgroundColor: theme.colors.successSoft, padding: 12, borderRadius: theme.radius.sm, lineHeight: 20, marginTop: 12 },
  localNote: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 20 }
});
