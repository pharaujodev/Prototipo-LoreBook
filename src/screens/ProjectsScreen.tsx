import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackState } from '../components/FeedbackState';
import { AppButton } from '../components/FormControls';
import { theme } from '../theme';
import { Project } from '../types';
import { useAuth } from '../auth/AuthContext';
import { canWriteContent } from '../auth/permissions';

type Props = { projects: Project[]; loading: boolean; errorMessage?: string; onRetry: () => void; onOpenProject: (id: string) => void; onSettings: () => void; onCreateProject: () => void };
export function ProjectsScreen({ projects, loading, errorMessage, onRetry, onOpenProject, onSettings, onCreateProject }: Props) {
  const { user } = useAuth();
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.masthead}>
      <View style={styles.brandBlock}><Text style={styles.brand}>LoreBook</Text><Text style={styles.eyebrow}>BIBLIOTECA PESSOAL</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir conta e configurações" onPress={onSettings} style={styles.account}><Text style={styles.accountText}>Conta</Text></Pressable>
    </View>
    <View style={styles.intro}>
      <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0]}.</Text>
      <Text accessibilityRole="header" style={styles.title}>Suas histórias, em um só lugar.</Text>
      <Text style={styles.subtitle}>Um espaço para o que você ainda vai escrever.</Text>
      {canWriteContent(user) ? <AppButton label="＋ Nova obra" onPress={onCreateProject} /> : null}
    </View>
    <View style={styles.section}><Text accessibilityRole="header" style={styles.sectionTitle}>Minhas obras</Text><Text style={styles.count}>{loading ? '…' : projects.length + ' no acervo'}</Text></View>
    {loading ? <FeedbackState kind="loading" title="Abrindo sua biblioteca" message="Buscando as obras salvas nesta conta." />
      : errorMessage ? <FeedbackState kind="error" title="Não foi possível carregar" message={errorMessage} actionLabel="Tentar novamente" onAction={onRetry} />
      : !projects.length ? <FeedbackState kind="empty" title="A primeira história é sua." message="Sua biblioteca começa com uma ideia. Crie uma obra e dê a ela a primeira página." actionLabel="Criar minha primeira obra" onAction={onCreateProject} />
      : projects.map((project, index) => <Pressable key={project.id} accessibilityRole="button" accessibilityLabel={'Abrir obra ' + project.title + ', ' + project.chapters + ' capítulos'}
          onPress={() => onOpenProject(project.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={[styles.spine, index % 2 !== 0 && styles.alternateSpine]} />
          <View style={styles.cardBody}>
            <Text style={styles.catalog}>MANUSCRITO / {String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.cardTitle}>{project.title}</Text>
            <Text style={styles.genre}>{project.genre || 'Gênero ainda não definido'}</Text>
            <View style={styles.metaRow}><Text style={styles.meta}>{project.chapters} capítulos</Text><Text style={styles.meta}>{project.progress}% concluído</Text></View>
            <View style={styles.track} accessible={false}><View style={[styles.progress, { width: `${project.progress}%` }]} /></View>
            <Text style={styles.updated}>Atualizada em {formatDate(project.updatedAt)}</Text>
          </View>
          <Text accessible={false} style={styles.arrow}>↗</Text>
        </Pressable>)}
    <Text style={styles.footer}>SEU ACERVO · SALVO NESTE DISPOSITIVO</Text>
  </ScrollView>;
}
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR'); }
const styles = StyleSheet.create({
  content: { padding: theme.layout.page, paddingBottom: theme.spacing.xxl, width: '100%', maxWidth: theme.layout.maxWidth, alignSelf: 'center' },
  masthead: { flexDirection: 'row', alignItems: 'center', paddingBottom: theme.spacing.xl, borderBottomWidth: 1, borderColor: theme.colors.border },
  brandBlock: { flex: 1 }, brand: { color: theme.colors.primary, fontFamily: theme.font.editorial, fontSize: 32, letterSpacing: -1 },
  eyebrow: { fontSize: 10, letterSpacing: 1.5, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
  account: { minHeight: theme.layout.buttonHeight, paddingHorizontal: theme.spacing.lg, justifyContent: 'center', borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  accountText: { color: theme.colors.primary, fontWeight: '600' },
  intro: { paddingVertical: theme.spacing.xl }, greeting: { color: theme.colors.accent, fontSize: theme.typography.label },
  title: { fontFamily: theme.font.editorial, fontSize: theme.typography.display, lineHeight: 44, letterSpacing: -0.8, color: theme.colors.text, marginTop: theme.spacing.md },
  subtitle: { fontSize: theme.typography.body, color: theme.colors.textMuted, lineHeight: 24, marginVertical: theme.spacing.md },
  section: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: 20, fontFamily: theme.font.editorial, color: theme.colors.text }, count: { color: theme.colors.textMuted, fontSize: theme.typography.caption },
  card: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, overflow: 'hidden', marginBottom: theme.spacing.lg },
  spine: { width: 8, backgroundColor: theme.colors.primary }, alternateSpine: { backgroundColor: theme.colors.accent },
  cardBody: { flex: 1, padding: theme.spacing.lg }, catalog: { color: theme.colors.accent, fontSize: 10, letterSpacing: 1.2, marginBottom: theme.spacing.md },
  cardTitle: { fontFamily: theme.font.editorial, fontSize: 25, lineHeight: 31, color: theme.colors.text }, genre: { fontSize: theme.typography.label, color: theme.colors.textMuted, marginTop: theme.spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'space-between', marginTop: theme.spacing.xl }, meta: { fontSize: theme.typography.caption, color: theme.colors.textMuted },
  track: { height: 4, borderRadius: 2, backgroundColor: theme.colors.surfaceMuted, marginTop: theme.spacing.sm, overflow: 'hidden' }, progress: { height: '100%', backgroundColor: theme.colors.primary },
  updated: { color: theme.colors.textMuted, fontSize: theme.typography.caption, marginTop: theme.spacing.md }, arrow: { color: theme.colors.accent, fontSize: 24, paddingTop: theme.spacing.lg, paddingRight: theme.spacing.md },
  pressed: { backgroundColor: theme.colors.primarySoft }, footer: { textAlign: 'center', color: theme.colors.textMuted, fontSize: 10, letterSpacing: 1, marginTop: theme.spacing.xl }
});
