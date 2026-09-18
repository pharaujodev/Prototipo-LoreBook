import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Chapter } from '../types';
import { theme } from '../theme';

export function EditorScreen({ chapter, content, onChangeContent }: { chapter: Chapter; content: string; onChangeContent: (value: string) => void }) {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return (
    <View style={styles.root}>
      <View style={styles.infoRow}>
        <Text style={styles.chapterLabel}>Capítulo {chapter.number}</Text>
        <Text style={styles.words}>{words} palavras</Text>
      </View>
      <Text style={styles.title}>{chapter.title}</Text>
      <TextInput
        value={content}
        onChangeText={onChangeContent}
        multiline
        textAlignVertical="top"
        placeholder="Comece a escrever..."
        placeholderTextColor={theme.colors.textMuted}
        style={styles.editor}
      />
      <View style={styles.statusBar}>
        <View style={styles.dot} />
        <Text style={styles.status}>Alterações mantidas nesta sessão do protótipo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chapterLabel: { color: theme.colors.accent, fontSize: 12, fontWeight: '800' },
  words: { color: theme.colors.textMuted, fontSize: 11 },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginTop: 8, marginBottom: 14 },
  editor: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, fontSize: 16, lineHeight: 26, color: theme.colors.text },
  statusBar: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success, marginRight: 7 },
  status: { color: theme.colors.textMuted, fontSize: 11 }
});
