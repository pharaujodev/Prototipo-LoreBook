import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeatureCard } from '../components/FeatureCard';
import { theme } from '../theme';
import { Chapter, Project, ScreenName } from '../types';

type Props = {
  project: Project;
  chapters: Chapter[];
  navigate: (screen: ScreenName) => void;
};

export function WorkHomeScreen({ project, chapters, navigate }: Props) {
  const totalWords = chapters.reduce((sum, chapter) => sum + chapter.words, 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>OBRA ATIVA</Text>
        <Text style={styles.heroTitle}>{project.title}</Text>
        <Text style={styles.heroText}>{project.genre}</Text>
        <View style={styles.metrics}>
          <View><Text style={styles.metricValue}>{chapters.length}</Text><Text style={styles.metricLabel}>capítulos</Text></View>
          <View><Text style={styles.metricValue}>{totalWords.toLocaleString('pt-BR')}</Text><Text style={styles.metricLabel}>palavras</Text></View>
          <View><Text style={styles.metricValue}>{project.progress}%</Text><Text style={styles.metricLabel}>planejado</Text></View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Organize sua história</Text>
      <FeatureCard icon="☰" title="Capítulos" description="Escreva, revise e acompanhe o manuscrito." onPress={() => navigate('chapters')} />
      <FeatureCard icon="♙" title="Personagens" description="Consulte objetivos, conflitos e relações." onPress={() => navigate('characters')} />
      <FeatureCard icon="◇" title="Bíblia da obra" description="Mundo, locais, regras e informações importantes." onPress={() => navigate('bible')} />
      <FeatureCard icon="✎" title="Rascunhos e notas" description="Guarde ideias sem misturar com o manuscrito." onPress={() => navigate('notes')} />

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Checkpoint inicial</Text>
        <Text style={styles.tipText}>Este protótipo usa dados fictícios e demonstra apenas a navegação e as funções centrais do aplicativo.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 },
  hero: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 20 },
  heroLabel: { color: '#DCC7BA', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: theme.colors.white, fontSize: 24, fontWeight: '800', marginTop: 8 },
  heroText: { color: '#EBDDD4', marginTop: 6 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  metricValue: { color: theme.colors.white, fontSize: 20, fontWeight: '800' },
  metricLabel: { color: '#DCC7BA', fontSize: 10, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginTop: 24, marginBottom: 12 },
  tip: { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.md, padding: 16, marginTop: 8 },
  tipTitle: { fontWeight: '800', color: theme.colors.primary },
  tipText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 }
});
