import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppField } from '../components/FormControls';
import { FeedbackState } from '../components/FeedbackState';
import { TITLE_MAX_LENGTH, validateTitle } from '../data/contentValidation';
import { theme } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { canCreateChapter, SIGN_IN_REQUIRED_MESSAGE } from '../auth/permissions';

type Props = { nextNumber: number; onCancel: () => void; onCreate: (title: string) => void; creating?: boolean; errorMessage?: string; onDirtyChange: (dirty: boolean) => void };
export function NewChapterScreen({ nextNumber, onCancel, onCreate, creating, errorMessage, onDirtyChange }: Props) {
  const [title, setTitle] = useState('');
  const [validation, setValidation] = useState('');
  const { user } = useAuth();
  useEffect(() => onDirtyChange(title.length > 0), [title, onDirtyChange]);
  if (!canCreateChapter(user)) return <FeedbackState kind="error" title="Acesso indisponível" message={SIGN_IN_REQUIRED_MESSAGE} actionLabel="Voltar" onAction={onCancel} />;
  const submit = () => { if (creating) return; const error = validateTitle(title); setValidation(error ?? ''); if (!error) onCreate(title); };
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}><View style={styles.card}>
      <Text style={styles.eyebrow}>MANUSCRITO / CAPÍTULO {nextNumber}</Text>
      <Text style={styles.title}>Uma nova página.</Text>
      <Text style={styles.help}>Dê um título ao capítulo. Você poderá mudar o nome enquanto escreve.</Text>
      <AppField label="Título do capítulo" value={title} onChangeText={setTitle} maxLength={TITLE_MAX_LENGTH} editable={!creating} placeholder="Ex.: A estrada para o norte" hint={title.length + '/' + TITLE_MAX_LENGTH + ' caracteres'} onSubmitEditing={submit} returnKeyType="done" />
      {validation || errorMessage ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{validation || errorMessage}</Text> : null}
      <AppButton label={creating ? 'Criando capítulo...' : 'Criar e começar a escrever'} busy={creating} onPress={submit} />
      <AppButton label="Cancelar" secondary disabled={creating} onPress={onCancel} />
    </View></ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: theme.layout.page }, card: { padding: theme.spacing.xl, width: '100%', maxWidth: theme.layout.formWidth, alignSelf: 'center', borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  eyebrow: { color: theme.colors.accent, fontSize: theme.typography.caption, letterSpacing: 1 }, title: { fontFamily: theme.font.editorial, fontSize: theme.typography.heading, color: theme.colors.text, marginTop: theme.spacing.lg },
  help: { color: theme.colors.textMuted, fontSize: theme.typography.label, lineHeight: 22, marginTop: theme.spacing.md }, error: { color: theme.colors.danger, fontSize: theme.typography.label, lineHeight: 22, marginTop: theme.spacing.lg }
});
