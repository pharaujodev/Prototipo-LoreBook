import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackState } from '../components/FeedbackState';
import { Chapter } from '../types';
import { theme } from '../theme';

type Props = {
  chapters: Chapter[];
  loading?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onOpenChapter: (id: string) => void;
  onCreateChapter: () => void;
};

export function ChaptersScreen({ chapters, loading, errorMessage, onRetry, onOpenChapter, onCreateChapter }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <FeedbackState kind="loading" title="Carregando capítulos" message="Lendo os capítulos salvos no dispositivo." /> : null}
      {!loading && errorMessage ? (
        <FeedbackState kind="error" title="Não foi possível carregar os capítulos" message={errorMessage} actionLabel="Tentar novamente" onAction={onRetry} />
      ) : null}
      {!loading && !errorMessage && chapters.length === 0 ? (
        <FeedbackState kind="empty" title="Sua primeira página espera" message="Uma cena, uma voz, uma ideia. Crie o primeiro capítulo e dê início à sua história." actionLabel="Criar capítulo" onAction={onCreateChapter} />
      ) : null}

      {!loading && !errorMessage
        ? chapters.map((chapter) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir capítulo ${chapter.number}, ${chapter.title}`}
              key={chapter.id}
              style={styles.card}
              onPress={() => onOpenChapter(chapter.id)}
            >
              <View style={styles.number}><Text style={styles.numberText}>{chapter.number}</Text></View>
              <View style={styles.body}>
                <Text style={styles.title}>{chapter.title}</Text>
                <Text style={styles.meta}>{chapter.words.toLocaleString('pt-BR')} palavras</Text>
                <View style={[styles.badge, chapter.status === 'Concluído' ? styles.done : chapter.status === 'Revisão' ? styles.review : styles.draft]}>
                  <Text style={styles.badgeText}>{chapter.status === 'Revisão' ? 'Em revisão' : chapter.status}</Text>
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))
        : null}

      {!loading && !errorMessage && chapters.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Criar novo capítulo" style={styles.addButton} onPress={onCreateChapter}>
          <Text style={styles.addText}>＋ Novo capítulo</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 30 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, marginBottom: 12, minHeight: 72 },
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
  addButton: { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.accent, padding: 15, minHeight: 48, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  addText: { color: theme.colors.primary, fontWeight: '800' }
});
