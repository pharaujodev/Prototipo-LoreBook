import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeatureCard } from '../components/FeatureCard';
import { FeedbackState } from '../components/FeedbackState';
import { theme } from '../../theme';
import { Chapter, Project, ScreenName } from '../../domain/types/content';
import { useAuth } from '../../application/contexts/AuthContext';
import { canCreateChapter } from '../../domain/permissions/permissions';
import { AppButton } from '../components/FormControls';

type Props = {
  readOnly?: boolean;
  project: Project;
  chapters: Chapter[];
  loading: boolean;
  errorMessage: string;
  onRetry: () => void;
  navigate: (screen: ScreenName) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function WorkHomeScreen({ readOnly = false, project, chapters, loading, errorMessage, onRetry, navigate, onEdit, onDelete }: Props) {
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
        <Text style={styles.heroLabel}>LOREBOOK / CADERNO DE OBRA</Text>
        <Text style={styles.heroTitle}>{project.title}</Text>
        <Text style={styles.heroText}>{project.genre || 'Gênero ainda não definido'}</Text>
        <View style={styles.metrics}>
          <View><Text style={styles.metricValue}>{chapters.length}</Text><Text style={styles.metricLabel}>capítulos</Text></View>
          <View><Text style={styles.metricValue}>{totalWords.toLocaleString('pt-BR')}</Text><Text style={styles.metricLabel}>palavras</Text></View>
          <View><Text style={styles.metricValue}>{project.progress}%</Text><Text style={styles.metricLabel}>concluído</Text></View>
        </View>
      </View>
      {canCreate ? <AppButton label="Editar título e gênero" secondary onPress={onEdit} /> : null}
      {chapters.length === 0 ? <FeedbackState compact kind="empty" title="Toda história começa com uma página" message={canCreate ? 'Sua obra já tem um lugar. Agora, dê espaço ao primeiro capítulo.' : 'Ainda não há capítulos disponíveis para leitura.'} actionLabel={canCreate ? 'Criar primeiro capítulo' : undefined} onAction={canCreate ? () => navigate('newChapter') : undefined} /> : null}

      <Text style={styles.sectionTitle}>Organize sua história</Text>
      <FeatureCard icon="☰" title="Capítulos" description="Escreva, revise e acompanhe o manuscrito." onPress={() => navigate('chapters')} />
      <FeatureCard icon="♙" title="Personagens" description="Consulte objetivos, conflitos e relações." onPress={() => navigate('characters')} />
      <FeatureCard icon="◇" title="Bíblia da obra" description="Mundo, locais, regras e informações importantes." onPress={() => navigate('bible')} />
      <FeatureCard icon="✎" title="Rascunhos e notas" description="Guarde ideias sem misturar com o manuscrito." onPress={() => navigate('notes')} />

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Um capítulo de cada vez</Text>
        <Text style={styles.tipText}>Rascunhe, coloque em revisão e marque como concluído. O progresso acompanha os capítulos que você finaliza.</Text>
      </View>
      {canCreate ? <View style={styles.management}>
        <Text style={styles.tipTitle}>Gerenciar esta obra</Text>
        <Text style={styles.tipText}>A exclusão remove também os capítulos. Você poderá revisar a confirmação antes de continuar.</Text>
        <AppButton label="Excluir obra" secondary onPress={onDelete} />
      </View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.layout.page, paddingBottom: theme.spacing.xxl, maxWidth: theme.layout.maxWidth, width: '100%', alignSelf: 'center' },
  feedback: { flexGrow: 1, justifyContent: 'center' },
  hero: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border, borderTopWidth: 5, borderTopColor: theme.colors.primary },
  heroLabel: { color: theme.colors.accent, fontSize: theme.typography.caption, letterSpacing: 1 },
  heroTitle: { color: theme.colors.text, fontSize: 34, lineHeight: 41, fontFamily: theme.font.editorial, marginTop: theme.spacing.xl },
  heroText: { color: theme.colors.textMuted, fontSize: theme.typography.body, marginTop: theme.spacing.md },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg, justifyContent: 'space-between', marginTop: theme.spacing.xl, paddingTop: theme.spacing.lg, borderTopWidth: 1, borderColor: theme.colors.border },
  metricValue: { color: theme.colors.primary, fontFamily: theme.font.editorial, fontSize: 28 },
  metricLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption, marginTop: theme.spacing.xs },
  sectionTitle: { fontSize: 22, fontFamily: theme.font.editorial, color: theme.colors.text, marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg },
  tip: { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.md, padding: 16, marginTop: 8 },
  tipTitle: { fontWeight: '800', color: theme.colors.primary },
  tipText: { color: theme.colors.textMuted, fontSize: theme.typography.label, lineHeight: 22, marginTop: theme.spacing.sm },
  management: { marginTop: theme.spacing.xxl, paddingTop: theme.spacing.xl, borderTopWidth: 1, borderColor: theme.colors.border }
});
