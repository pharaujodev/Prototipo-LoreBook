import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chapter, ChapterStatus, chapterStatuses } from '../types';
import { countWords } from '../data/chapterDraft';
import { theme } from '../theme';

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

type Props = {
  chapter: Chapter;
  content: string;
  status: ChapterStatus;
  onChangeStatus: (status: ChapterStatus) => void;
  onChangeContent: (value: string) => void;
  onSave: () => void | Promise<void>;
  saveState: SaveState;
};

export function EditorScreen({ chapter, content, status, onChangeStatus, onChangeContent, onSave, saveState }: Props) {
  const words = countWords(content);
  const statusText =
    saveState === 'saving' ? 'Salvando no dispositivo...' :
    saveState === 'error' ? 'Não foi possível salvar. Seu texto continua aqui.' :
    saveState === 'dirty' ? 'Texto ou status com alterações não salvas.' :
    'Texto e status salvos neste dispositivo.';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.infoRow}>
        <Text style={styles.chapterLabel}>Capítulo {chapter.number}</Text>
        <Text style={styles.words}>{words} palavras</Text>
      </View>
      <Text style={styles.title}>{chapter.title}</Text>
      <View style={styles.statusOptions} accessibilityLabel="Status do capítulo">
        {chapterStatuses.map((option) => <Pressable key={option} accessibilityRole="radio"
          accessibilityLabel={option === 'Revisão' ? 'Em revisão' : option}
          accessibilityState={{ checked: option === status, disabled: saveState === 'saving' }}
          disabled={saveState === 'saving'} onPress={() => onChangeStatus(option)}
          style={[styles.statusOption, option === status && styles.statusOptionActive]}>
          <Text style={[styles.optionText, option === status && styles.optionTextActive]}>{option === 'Revisão' ? 'Em revisão' : option}</Text>
        </Pressable>)}
      </View>
      <TextInput
        accessibilityLabel={`Conteúdo do capítulo ${chapter.number}`}
        value={content}
        onChangeText={onChangeContent}
        editable={saveState !== 'saving'}
        multiline
        textAlignVertical="top"
        placeholder="Comece a escrever..."
        placeholderTextColor={theme.colors.textMuted}
        style={styles.editor}
      />
      <View style={styles.footer}>
        <View style={styles.statusBar} accessibilityLiveRegion="polite">
          {saveState === 'saving' ? <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} /> : <View style={[styles.dot, saveState === 'error' && styles.dotError, saveState === 'dirty' && styles.dotDirty]} />}
          <Text style={[styles.status, saveState === 'error' && styles.statusError]}>{statusText}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Salvar capítulo no dispositivo"
          style={[styles.saveButton, (saveState === 'saving' || saveState === 'saved') && styles.saveDisabled]}
          disabled={saveState === 'saving' || saveState === 'saved'}
          onPress={onSave}
        >
          <Text style={styles.saveText}>{saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? '✓ Tudo salvo' : saveState === 'error' ? 'Tentar salvar novamente' : 'Salvar capítulo'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chapterLabel: { color: theme.colors.accent, fontSize: 12, fontWeight: '800' },
  words: { color: theme.colors.textMuted, fontSize: 11 },
  title: { fontSize: 26, fontFamily: theme.font.editorial, color: theme.colors.text, marginTop: 8, marginBottom: 14 },
  statusOptions: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  statusOption: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  statusOptionActive: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  optionText: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' },
  optionTextActive: { color: theme.colors.primary, fontWeight: '800' },
  editor: { flex: 1, minHeight: 100, fontFamily: theme.font.editorial, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 18, fontSize: 18, lineHeight: 29, color: theme.colors.text },
  footer: { marginTop: 10 },
  statusBar: { flexDirection: 'row', alignItems: 'center', minHeight: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success, marginRight: 7 },
  dotDirty: { backgroundColor: theme.colors.warning },
  dotError: { backgroundColor: theme.colors.danger },
  status: { flex: 1, color: theme.colors.textMuted, fontSize: 11 },
  statusError: { color: theme.colors.danger },
  saveButton: { marginTop: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: theme.colors.white, fontWeight: '800' }
});
