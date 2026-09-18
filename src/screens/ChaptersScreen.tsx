import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chapter } from '../types';
import { theme } from '../theme';

type Props = {
  chapters: Chapter[];
  onOpenChapter: (id: string) => void;
  onCreateChapter: () => void;
};

export function ChaptersScreen({ chapters, onOpenChapter, onCreateChapter }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {chapters.map((chapter) => (
        <Pressable key={chapter.id} style={styles.card} onPress={() => onOpenChapter(chapter.id)}>
          <View style={styles.number}><Text style={styles.numberText}>{chapter.number}</Text></View>
          <View style={styles.body}>
            <Text style={styles.title}>{chapter.title}</Text>
            <Text style={styles.meta}>{chapter.words.toLocaleString('pt-BR')} palavras</Text>
            <View style={[styles.badge, chapter.status === 'Concluído' ? styles.done : chapter.status === 'Revisão' ? styles.review : styles.draft]}>
              <Text style={styles.badgeText}>{chapter.status}</Text>
            </View>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
      <Pressable style={styles.addButton} onPress={onCreateChapter}>
        <Text style={styles.addText}>＋ Novo capítulo</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 30 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, marginBottom: 12 },
  number: { width: 44, height: 44, borderRadius: 13, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
  body: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  meta: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  badge: { alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4, marginTop: 7 },
  done: { backgroundColor: '#DDE9E0' },
  review: { backgroundColor: '#F4E7C9' },
  draft: { backgroundColor: theme.colors.surfaceMuted },
  badgeText: { fontSize: 10, color: theme.colors.text, fontWeight: '700' },
  arrow: { fontSize: 27, color: theme.colors.accent },
  addButton: { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.accent, padding: 15, borderRadius: theme.radius.md, alignItems: 'center', marginTop: 4 },
  addText: { color: theme.colors.primary, fontWeight: '800' }
});
