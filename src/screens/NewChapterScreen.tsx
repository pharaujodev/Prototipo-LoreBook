import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FeedbackState } from '../components/FeedbackState';
import { theme } from '../theme';

type Props = {
  nextNumber: number;
  onCancel: () => void;
  onCreate: (title: string) => void | Promise<void>;
  creating?: boolean;
  errorMessage?: string;
};

export function NewChapterScreen({ nextNumber, onCancel, onCreate, creating, errorMessage }: Props) {
  const [title, setTitle] = useState('');
  const canCreate = title.trim().length > 0 && !creating;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      {creating ? <FeedbackState kind="loading" title="Abrindo uma nova página" message="Criando seu capítulo e preparando o editor para você escrever." /> :
      <View style={styles.card}>
        <Text style={styles.label}>CAPÍTULO {nextNumber}</Text>
        <Text style={styles.heading}>Novo capítulo</Text>
        <Text style={styles.help}>Dê um título ao capítulo. Ele será salvo no dispositivo e aberto no editor.</Text>

        <Text style={styles.inputLabel}>Título</Text>
        <TextInput
          accessibilityLabel="Título do novo capítulo"
          autoFocus
          value={title}
          onChangeText={setTitle}
          placeholder="Ex.: A estrada para o norte"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          returnKeyType="done"
          editable={!creating}
          onSubmitEditing={() => canCreate && onCreate(title.trim())}
        />

        {errorMessage ? <Text style={styles.error} accessibilityLiveRegion="polite">{errorMessage}</Text> : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={onCancel} disabled={creating}>
            <Text style={styles.secondaryText}>Cancelar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Criar capítulo"
            style={[styles.primaryButton, !canCreate && styles.primaryDisabled]}
            disabled={!canCreate}
            onPress={() => onCreate(title.trim())}
          >
            <Text style={styles.primaryText}>{creating ? 'Criando...' : 'Criar capítulo'}</Text>
          </Pressable>
        </View>
      </View>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: 'flex-start' },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18 },
  label: { color: theme.colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  heading: { color: theme.colors.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  help: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  inputLabel: { color: theme.colors.text, fontSize: 12, fontWeight: '800', marginTop: 20, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: theme.radius.md, paddingHorizontal: 14, paddingVertical: 13, color: theme.colors.text, fontSize: 15 },
  error: { color: theme.colors.danger, fontSize: 12, lineHeight: 17, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  secondaryButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: 13, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  secondaryText: { color: theme.colors.text, fontWeight: '800' },
  primaryButton: { flex: 1.4, alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: 13, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { color: theme.colors.white, fontWeight: '800' }
});
