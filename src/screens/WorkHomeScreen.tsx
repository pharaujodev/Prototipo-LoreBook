import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeatureCard } from '../components/FeatureCard';
import { FeedbackState } from '../components/FeedbackState';
import { theme } from '../theme';
import { Chapter, Project, ScreenName } from '../types';
import { useAuth } from '../auth/AuthContext';
import { canCreateChapter } from '../auth/permissions';

type Props = {
  readOnly?: boolean;
  project: Project;
  chapters: Chapter[];
  loading: boolean;
  errorMessage: string;
  onRetry: () => void;
  navigate: (screen: ScreenName) => void;
};

export function WorkHomeScreen({ readOnly = false, project, chapters, loading, errorMessage, onRetry, navigate }: Props) {
  const { user } = useAuth();
  const canCreate = !readOnly && canCreateChapter(user);
  const totalWords = chapters.reduce((sum, chapter) => sum + chapter.words, 0);
  if (loading || errorMessage) return <ScrollView contentContainerStyle={styles.feedback}>
    <FeedbackState kind={loading ? 'loading' : 'error'} title={loading ? 'Abrindo sua história' : 'Sua obra precisa de mais um instante'}
      message={loading ? 'Reunindo os capítulos e preparando seu espaço de escrita.' : errorMessage}
      actionLabel={loading ? undefined : 'Tentar novamente'} onAction={loading ? undefined : onRetry} />
  </ScrollView>;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>OBRA ATIVA</Text>
        <Text style={styles.heroTitle}>{project.title}</Text>
        <Text style={styles.heroText}>{project.genre}</Text>
        <View style={styles.metrics}>
          <View><Text style={styles.metricValue}>{chapters.length}</Text><Text style={styles.metricLabel}>capítulos</Text></View>
          <View><Text style={styles.metricValue}>{totalWords.toLocaleString('pt-BR')}</Text><Text style={styles.metricLabel}>palavras</Text></View>
          <View><Text style={styles.metricValue}>{project.progress}%</Text><Text style={styles.metricLabel}>concluído</Text></View>
        </View>
      </View>
      {chapters.length === 0 ? <FeedbackState kind="empty" title="Toda história começa com uma página" message={canCreate ? 'Sua obra já tem um lugar. Agora, dê espaço ao primeiro capítulo.' : 'Ainda não há capítulos disponíveis para leitura.'} actionLabel={canCreate ? 'Criar primeiro capítulo' : undefined} onAction={canCreate ? () => navigate('newChapter') : undefined} /> : null}

      <Text style={styles.sectionTitle}>Organize sua história</Text>
      <FeatureCard icon="☰" title="Capítulos" description="Escreva, revise e acompanhe o manuscrito." onPress={() => navigate('chapters')} />
      <FeatureCard icon="♙" title="Personagens" description="Consulte objetivos, conflitos e relações." onPress={() => navigate('characters')} />
      <FeatureCard icon="◇" title="Bíblia da obra" description="Mundo, locais, regras e informações importantes." onPress={() => navigate('bible')} />
      <FeatureCard icon="✎" title="Rascunhos e notas" description="Guarde ideias sem misturar com o manuscrito." onPress={() => navigate('notes')} />

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Um capítulo de cada vez</Text>
        <Text style={styles.tipText}>Rascunhe, coloque em revisão e marque como concluído. O progresso acompanha os capítulos que você finaliza.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 },
  feedback: { flexGrow: 1, justifyContent: 'center' },
  hero: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 20 },
  heroLabel: { color: '#DCC7BA', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: theme.colors.white, fontSize: 28, fontFamily: theme.font.editorial, marginTop: 8 },
  heroText: { color: '#EBDDD4', marginTop: 6 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  metricValue: { color: theme.colors.white, fontSize: 20, fontWeight: '800' },
  metricLabel: { color: '#DCC7BA', fontSize: 10, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginTop: 24, marginBottom: 12 },
  tip: { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.md, padding: 16, marginTop: 8 },
  tipTitle: { fontWeight: '800', color: theme.colors.primary },
  tipText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 }
});
