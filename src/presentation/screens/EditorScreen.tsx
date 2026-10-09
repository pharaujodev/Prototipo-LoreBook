import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chapter, ChapterStatus, chapterStatuses } from '../../domain/types/content';
import { countWords } from '../../domain/validation/chapterDraft';
import { TITLE_MAX_LENGTH } from '../../domain/validation/contentValidation';
import { theme } from '../../theme';
import { useAuth } from '../../application/contexts/AuthContext';
import { canEditChapter } from '../../domain/permissions/permissions';
import { AppButton } from '../components/FormControls';

type Props = { readOnly?: boolean; chapter: Chapter; title: string; content: string; status: ChapterStatus; onChangeTitle: (title: string) => void; onChangeStatus: (status: ChapterStatus) => void; onChangeContent: (text: string) => void; onSave: () => void; onDelete: () => void; saveState: 'saved' | 'dirty' | 'saving' | 'error'; errorMessage: string };
export function EditorScreen({ readOnly = false, chapter, title, content, status, onChangeTitle, onChangeStatus, onChangeContent, onSave, onDelete, saveState, errorMessage }: Props) {
  const { user } = useAuth();
  const editable = !readOnly && canEditChapter(user);
  const busy = saveState === 'saving';
  const stateLabel = busy ? 'Salvando...' : saveState === 'dirty' ? 'Alterações pendentes' : saveState === 'error' ? errorMessage : 'Salvo neste dispositivo';
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
      <View style={styles.metaRow}><Text style={styles.meta}>CAPÍTULO {String(chapter.number).padStart(2, '0')}</Text><Text style={styles.meta}>{countWords(content)} palavras</Text></View>
      <Text style={styles.label}>Título do capítulo</Text>
      <TextInput accessibilityLabel="Título do capítulo" value={title} onChangeText={onChangeTitle} editable={editable && !busy} maxLength={TITLE_MAX_LENGTH} multiline style={styles.title} placeholder="Um título para esta página" placeholderTextColor={theme.colors.textMuted} />
      <Text style={styles.label}>Status</Text>
      <View style={styles.statusOptions}>
        {chapterStatuses.map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityLabel={option === 'Revisão' ? 'Em revisão' : option}
          accessibilityState={{ checked: option === status, disabled: !editable || busy }} disabled={!editable || busy} onPress={() => onChangeStatus(option)}
          style={[styles.statusOption, option === status && styles.active]}><Text style={[styles.optionText, option === status && styles.activeText]}>{option === status ? '• ' : ''}{option === 'Revisão' ? 'Em revisão' : option}</Text></Pressable>)}
      </View>
      <Text style={styles.label}>Manuscrito</Text>
      <TextInput accessibilityLabel="Conteúdo do capítulo" value={content} onChangeText={onChangeContent} editable={editable && !busy} multiline textAlignVertical="top" scrollEnabled={false}
        placeholder="Escreva a primeira frase. O resto pode vir depois." placeholderTextColor={theme.colors.textMuted} style={styles.editor} />
      {editable ? <AppButton label="Excluir capítulo" secondary disabled={busy} onPress={onDelete} /> : null}
    </ScrollView>
    <View style={styles.footer}>
      <Text accessibilityLiveRegion="polite" accessibilityRole={saveState === 'error' ? 'alert' : undefined} style={[styles.saveState, saveState === 'error' && styles.error]}>{editable ? stateLabel : 'Edição indisponível'}</Text>
      {editable ? <AppButton label={busy ? 'Salvando...' : 'Salvar capítulo'} busy={busy} disabled={saveState === 'saved'} onPress={onSave} /> : null}
    </View>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  sheet: { padding: theme.layout.page, width: '100%', maxWidth: theme.layout.maxWidth, alignSelf: 'center', paddingBottom: theme.spacing.xl },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  meta: { color: theme.colors.accent, fontSize: theme.typography.caption, letterSpacing: 0.8 },
  label: { color: theme.colors.textMuted, fontSize: theme.typography.caption, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  title: { color: theme.colors.text, fontSize: 30, lineHeight: 38, fontFamily: theme.font.editorial, minHeight: theme.layout.buttonHeight, padding: 0 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  statusOption: { minHeight: theme.layout.buttonHeight, justifyContent: 'center', paddingHorizontal: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm },
  active: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }, optionText: { color: theme.colors.textMuted, fontSize: theme.typography.caption }, activeText: { color: theme.colors.primary, fontWeight: '700' },
  editor: { minHeight: 260, color: theme.colors.text, fontSize: theme.typography.reading, lineHeight: 30, padding: 0, paddingVertical: theme.spacing.md },
  footer: { paddingHorizontal: theme.layout.page, paddingBottom: theme.spacing.md, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  saveState: { color: theme.colors.textMuted, fontSize: theme.typography.caption, lineHeight: 18 }, error: { color: theme.colors.danger }
});
