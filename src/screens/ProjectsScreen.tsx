import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackState } from '../components/FeedbackState';
import { theme } from '../theme';
import { Project } from '../types';
import { useAuth } from '../auth/AuthContext';
import { roleLabels } from '../auth/authTypes';
import { canWriteContent } from '../auth/permissions';

type Props = {
  projects: Project[];
  loading: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onOpenProject: (projectId: string) => void;
  onSettings: () => void;
};

export function ProjectsScreen({ projects, loading, errorMessage, onRetry, onOpenProject, onSettings }: Props) {
  const { user } = useAuth();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>LOREBOOK / ATELIÊ DE HISTÓRIAS</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Conta e configurações" onPress={onSettings} style={styles.account}>
        <Text style={styles.accountText}>{user?.name} · {user ? roleLabels[user.role] : ''} · Configurações</Text>
      </Pressable>
      <Text style={styles.title}>Histórias em suas mãos.</Text>
      <Text style={styles.subtitle}>Continue escrevendo de onde parou.</Text>

      {canWriteContent(user) ? <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nova obra, disponível em breve"
        accessibilityState={{ disabled: true }}
        disabled
        style={styles.newButton}
      >
        <Text style={styles.newButtonPlus}>＋</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.newButtonTitle}>Nova obra</Text>
          <Text style={styles.newButtonText}>Em breve · criação de obras</Text>
        </View>
      </Pressable> : <Text style={styles.subtitle}>Modo somente leitura</Text>}

      <Text style={styles.sectionTitle}>Recentes</Text>

      {loading ? <FeedbackState kind="loading" title="Carregando obras" message="Buscando seus projetos salvos neste dispositivo." /> : null}
      {!loading && errorMessage ? (
        <FeedbackState kind="error" title="Não foi possível carregar as obras" message={errorMessage} actionLabel="Tentar novamente" onAction={onRetry} />
      ) : null}
      {!loading && !errorMessage && projects.length === 0 ? (
        <FeedbackState kind="empty" title="Uma estante de possibilidades" message="Sua conta ainda não possui obras. A criação de novas obras estará disponível em uma próxima etapa." />
      ) : null}

      {!loading && !errorMessage
        ? projects.map((project) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir obra ${project.title}`}
              key={project.id}
              style={styles.card}
              onPress={() => onOpenProject(project.id)}
            >
              <View style={styles.cover}><Text style={styles.coverText}>{project.title.charAt(0)}</Text></View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{project.title}</Text>
                <Text style={styles.meta}>{project.genre}</Text>
                <Text style={styles.meta}>{project.chapters} capítulos • Atualizado {formatUpdatedAt(project.updatedAt)}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progress, { width: `${project.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{project.progress}% concluído</Text>
              </View>
            </Pressable>
          ))
        : null}
    </ScrollView>
  );
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  account: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  accountText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
  eyebrow: { color: theme.colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginTop: 8 },
  title: { fontSize: 36, fontFamily: theme.font.editorial, color: theme.colors.text, marginTop: 8 },
  subtitle: { color: theme.colors.textMuted, marginTop: 6, marginBottom: 22 },
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 18, minHeight: 64 },
  newButtonPlus: { fontSize: 32, color: theme.colors.white, marginRight: 14 },
  newButtonTitle: { color: theme.colors.white, fontSize: 17, fontWeight: '800' },
  newButtonText: { color: '#EBDDD4', fontSize: 12, marginTop: 3 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text, marginTop: 26, marginBottom: 12 },
  card: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 14, marginBottom: 14, minHeight: 112 },
  cover: { width: 64, height: 96, borderRadius: 4, borderLeftWidth: 5, borderLeftColor: theme.colors.gold, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  coverText: { fontSize: 34, fontFamily: theme.font.editorial, color: theme.colors.white },
  cardBody: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 5 },
  progressTrack: { height: 7, borderRadius: 7, backgroundColor: theme.colors.surfaceMuted, marginTop: 12, overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: theme.colors.accent },
  progressText: { fontSize: 10, color: theme.colors.textMuted, marginTop: 5 }
});
