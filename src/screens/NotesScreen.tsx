import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { canWriteContent } from '../auth/permissions';

type Props = {
  readOnly?: boolean;
  notes: string;
  onChangeNotes: (value: string) => void;
};

export function NotesScreen({ readOnly = false, notes, onChangeNotes }: Props) {
  const { user } = useAuth();
  const canEdit = !readOnly && canWriteContent(user);
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Espaço de planejamento</Text>
        <Text style={styles.bannerText}>Ideias fora do manuscrito. Neste protótipo, as notas ficam apenas nesta sessão.</Text>
        {!canEdit ? <Text style={styles.bannerText}>Modo somente leitura</Text> : null}
      </View>
      <Text style={styles.label}>Notas da obra</Text>
      {!notes.trim() ? <Text style={styles.empty}>Nenhuma nota por enquanto. {canEdit ? 'Registre uma ideia abaixo.' : 'Esta obra ainda não tem notas demonstrativas.'}</Text> : null}
      <TextInput accessibilityLabel="Notas da obra" editable={canEdit} placeholder="Uma ideia, uma pergunta, uma cena… Sua próxima descoberta pode começar aqui." placeholderTextColor={theme.colors.textMuted} multiline value={notes} onChangeText={onChangeNotes} textAlignVertical="top" style={styles.input} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: theme.layout.page, flexGrow: 1, width: '100%', maxWidth: theme.layout.maxWidth, alignSelf: 'center' },
  label: { fontSize: theme.typography.label, color: theme.colors.text, fontWeight: '700', marginBottom: theme.spacing.sm },
  empty: { color: theme.colors.textMuted, lineHeight: 22, marginBottom: theme.spacing.md },
  banner: { backgroundColor: theme.colors.primarySoft, padding: 14, borderRadius: theme.radius.md, marginBottom: 14 },
  bannerTitle: { fontWeight: '800', color: theme.colors.primary },
  bannerText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  input: { flex: 1, minHeight: 250, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.lg, color: theme.colors.text, fontSize: theme.typography.body, lineHeight: theme.typography.lineHeight }
});
