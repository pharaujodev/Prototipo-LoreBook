import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { projects } from '../data/mock';
import { theme } from '../theme';

export function ProjectsScreen({ onOpenProject }: { onOpenProject: (projectId: string) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>LOREBOOK</Text>
      <Text style={styles.title}>Suas obras</Text>
      <Text style={styles.subtitle}>Continue escrevendo de onde parou.</Text>

      <Pressable
        style={styles.newButton}
        onPress={() => Alert.alert('Checkpoint inicial', 'A criação de novas obras ficará para uma próxima etapa do protótipo.')}
      >
        <Text style={styles.newButtonPlus}>＋</Text>
        <View>
          <Text style={styles.newButtonTitle}>Nova obra</Text>
          <Text style={styles.newButtonText}>Criar um novo projeto literário</Text>
        </View>
      </Pressable>

      <Text style={styles.sectionTitle}>Recentes</Text>
      {projects.map((project) => (
        <Pressable key={project.id} style={styles.card} onPress={() => onOpenProject(project.id)}>
          <View style={styles.cover}><Text style={styles.coverText}>{project.title.charAt(0)}</Text></View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{project.title}</Text>
            <Text style={styles.meta}>{project.genre}</Text>
            <Text style={styles.meta}>{project.chapters} capítulos • Atualizado {project.updatedAt}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progress, { width: `${project.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{project.progress}% planejado</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  eyebrow: { color: theme.colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginTop: 8 },
  title: { fontSize: 30, fontWeight: '800', color: theme.colors.text, marginTop: 8 },
  subtitle: { color: theme.colors.textMuted, marginTop: 6, marginBottom: 22 },
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 18 },
  newButtonPlus: { fontSize: 32, color: theme.colors.white, marginRight: 14 },
  newButtonTitle: { color: theme.colors.white, fontSize: 17, fontWeight: '800' },
  newButtonText: { color: '#EBDDD4', fontSize: 12, marginTop: 3 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text, marginTop: 26, marginBottom: 12 },
  card: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 14, marginBottom: 14 },
  cover: { width: 70, height: 92, borderRadius: 12, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  coverText: { fontSize: 28, fontWeight: '900', color: theme.colors.primary },
  cardBody: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 5 },
  progressTrack: { height: 7, borderRadius: 7, backgroundColor: theme.colors.surfaceMuted, marginTop: 12, overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: theme.colors.accent },
  progressText: { fontSize: 10, color: theme.colors.textMuted, marginTop: 5 }
});
