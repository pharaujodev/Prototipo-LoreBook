import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../../theme';

export function AppButton({ label, onPress, disabled, busy, secondary = false, danger = false }: {
  label: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; danger?: boolean;
}) {
  const blocked = !!disabled || !!busy;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: blocked, busy: !!busy }}
    disabled={blocked} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, danger && styles.danger, (blocked || pressed) && styles.disabled]}>
    {busy ? <ActivityIndicator color={secondary && !danger ? theme.colors.primary : theme.colors.white} /> : null}
    <Text style={[styles.buttonText, secondary && !danger && styles.secondaryText]}>{label}</Text>
  </Pressable>;
}
export function AppField({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} accessibilityHint={hint} placeholderTextColor={theme.colors.textMuted} {...props}
      style={[styles.input, props.editable === false && styles.disabled, props.style]} />
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  field: { marginTop: theme.spacing.lg },
  label: { color: theme.colors.text, fontSize: theme.typography.label, fontWeight: '700', marginBottom: theme.spacing.sm },
  input: { minHeight: theme.layout.buttonHeight, borderWidth: theme.layout.borderWidth, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, color: theme.colors.text, fontSize: theme.typography.body },
  hint: { color: theme.colors.textMuted, fontSize: theme.typography.caption, marginTop: theme.spacing.xs, lineHeight: 18 },
  button: { minHeight: theme.layout.buttonHeight, padding: theme.spacing.md, gap: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, marginTop: theme.spacing.md },
  buttonText: { fontSize: theme.typography.label, color: theme.colors.white, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondary: { backgroundColor: theme.colors.surfaceMuted },
  secondaryText: { color: theme.colors.primary },
  danger: { backgroundColor: theme.colors.danger },
  disabled: { opacity: 0.55 }
});
