import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackState } from '../components/FeedbackState';
import { Chapter } from '../types';
import { theme } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { canCreateChapter } from '../auth/permissions';
import { StatusBadge } from '../components/StatusBadge';
import { AppButton } from '../components/FormControls';

type Props = {
  readOnly?: boolean;
  chapters: Chapter[];
  loading?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onOpenChapter: (id: string) => void;
  onCreateChapter: () => void;
};

export function ChaptersScreen({ readOnly = false, chapters, loading, errorMessage, onRetry, onOpenChapter, onCreateChapter }: Props) {
  const { user } = useAuth();
  const canCreate = !readOnly && canCreateChapter(user);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {!loading && !errorMessage && chapters.length > 0 ? <View style={styles.heading}><Text style={styles.sectionTitle}>Seu manuscrito</Text><Text style={styles.help}>Abra um capítulo para escrever, revisar ou excluir.</Text></View> : null}
      {canCreate && !loading && !errorMessage && chapters.length > 0 ? <AppButton label="＋ Novo capítulo" onPress={onCreateChapter} /> : null}
      {loading ? <FeedbackState kind="loading" title="Carregando capítulos" message="Lendo os capítulos salvos no dispositivo." /> : null}
      {!loading && errorMessage ? (
        <FeedbackState kind="error" title="Não foi possível carregar os capítulos" message={errorMessage} actionLabel="Tentar novamente" onAction={onRetry} />
      ) : null}
      {!loading && !errorMessage && chapters.length === 0 ? (
        <FeedbackState kind="empty" title="Sua primeira página espera" message={canCreate ? 'Uma cena, uma voz, uma ideia. Crie o primeiro capítulo e dê início à sua história.' : 'Esta obra ainda não tem capítulos para leitura.'} actionLabel={canCreate ? 'Criar capítulo' : undefined} onAction={canCreate ? onCreateChapter : undefined} />
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
                <StatusBadge status={chapter.status} />
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))
        : null}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.layout.page, paddingBottom: theme.spacing.xxl, width: '100%', maxWidth: theme.layout.maxWidth, alignSelf: 'center' },
  heading: { marginBottom: theme.spacing.sm }, sectionTitle: { fontFamily: theme.font.editorial, fontSize: 24, color: theme.colors.text }, help: { color: theme.colors.textMuted, fontSize: theme.typography.label, lineHeight: 22, marginTop: theme.spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.lg, marginTop: theme.spacing.md, minHeight: 96 },
  number: { width: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 26, fontFamily: theme.font.editorial, color: theme.colors.accent },
  body: { flex: 1, marginLeft: 12 },
  title: { fontSize: 20, fontFamily: theme.font.editorial, color: theme.colors.text },
  meta: { color: theme.colors.textMuted, fontSize: theme.typography.caption, marginTop: theme.spacing.sm },
  arrow: { fontSize: 27, color: theme.colors.accent },
});
