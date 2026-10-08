import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import type { SQLiteDatabase } from 'expo-sqlite';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from './src/presentation/components/BottomNav';
import { FeedbackState } from './src/presentation/components/FeedbackState';
import { ScreenHeader } from './src/presentation/components/ScreenHeader';
import { UnsavedChangesModal } from './src/presentation/components/UnsavedChangesModal';
import { DatabaseGate } from './src/presentation/components/DatabaseGate';
import { useProjects } from './src/application/hooks/useProjects';
import { useChapters } from './src/application/hooks/useChapters';
import { FeedbackProvider } from './src/presentation/components/FeedbackProvider';
import { useFeedback } from './src/application/contexts/FeedbackContext';
import { ProjectFormScreen } from './src/presentation/screens/ProjectFormScreen';
import { useProjectAccess } from './src/application/hooks/useProjectAccess';
import { AdminUserDetailScreen } from './src/presentation/screens/AdminUserDetailScreen';
import { AuthProvider } from './src/application/contexts/AuthContext';
import { AuthGate } from './src/presentation/components/AuthGate';
import { useAuthorization } from './src/application/hooks/useAuthorization';
import { workspaces } from './src/data/mock';
import { BibleScreen } from './src/presentation/screens/BibleScreen';
import { ChaptersScreen } from './src/presentation/screens/ChaptersScreen';
import { CharacterDetailScreen } from './src/presentation/screens/CharacterDetailScreen';
import { CharactersScreen } from './src/presentation/screens/CharactersScreen';
import { EditorScreen } from './src/presentation/screens/EditorScreen';
import { NewChapterScreen } from './src/presentation/screens/NewChapterScreen';
import { NotesScreen } from './src/presentation/screens/NotesScreen';
import { ProjectsScreen } from './src/presentation/screens/ProjectsScreen';
import { SettingsScreen } from './src/presentation/screens/SettingsScreen';
import { AdminScreen } from './src/presentation/screens/AdminScreen';
import { WorkHomeScreen } from './src/presentation/screens/WorkHomeScreen';
import { theme } from './src/theme';
import { ScreenName } from './src/domain/types/content';

type WorkTab = 'home' | 'chapters' | 'characters' | 'bible' | 'notes';

const workScreens = new Set<ScreenName>(['workHome', 'editProject', 'chapters', 'newChapter', 'editor', 'characters', 'characterDetail', 'bible', 'notes']);

function PrototypeApp({ db }: { db: SQLiteDatabase }) {
  const { requireAdmin, permissionMessage } = useAuthorization();
  const { project: openedProject, administrative, opening, accessError, open: openProject, requireProjectWrite: requireWrite, clear: clearProject } = useProjectAccess(db);
  const library = useProjects(db);
  const manuscript = useChapters(db, openedProject?.id, administrative, requireWrite);
  const { confirm } = useFeedback();
  const [formDirty, setFormDirty] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');
  const [screen, setScreen] = useState<ScreenName>('projects');
  const [settingsOrigin, setSettingsOrigin] = useState<'projects' | 'workHome'>('projects');
  const selectedProjectId = openedProject?.id;
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [pendingScreen, setPendingScreen] = useState<ScreenName | null>(null);
  const [notesByProject, setNotesByProject] = useState<Record<string, string>>(
    Object.fromEntries(workspaces.map((workspace) => [workspace.project.id, workspace.notes]))
  );

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.project.id === selectedProjectId),
    [selectedProjectId]
  );
  const selectedProject = useMemo(
    () => library.projects.find((project) => project.id === selectedProjectId) ?? openedProject,
    [library.projects, selectedProjectId, openedProject]
  );
  const selectedCharacter = useMemo(
    () => selectedWorkspace?.characters.find((character) => character.id === selectedCharacterId) ?? selectedWorkspace?.characters[0],
    [selectedCharacterId, selectedWorkspace]
  );

  const openWork = async (projectId: string, asAdmin = false) => {
    const project = await openProject(projectId, asAdmin);
    if (!project) return;
    const workspace = workspaces.find((item) => item.project.id === projectId);
    setSelectedCharacterId(workspace?.characters[0]?.id ?? '');
    setScreen('workHome');
    await manuscript.load(projectId, asAdmin);
  };

  const navigate = (next: ScreenName) => {
    if (manuscript.isBusy() || library.isBusy()) return;
    if ((next === 'newChapter' || next === 'editProject') && !requireWrite()) return;
    if ((next === 'admin' || next === 'adminUserDetail') && !requireAdmin()) return;
    if (workScreens.has(next) && !selectedProject) return;
    if (formDirty && (screen === 'newProject' || screen === 'editProject' || screen === 'newChapter')) {
      confirm({ title: 'Descartar alterações?', message: 'Os campos deste formulário ainda não foram salvos.', confirmLabel: 'Descartar e sair', danger: true, errorMessage: 'Não foi possível sair.', onConfirm: () => { setFormDirty(false); setScreen(next); } });
      return;
    }
    if (screen === 'editor' && manuscript.dirty) {
      setPendingScreen(next);
    } else setScreen(next);
  };
  const goBackToWork = () => navigate('workHome');

  const handleTab = (tab: WorkTab) => {
    const map: Record<WorkTab, ScreenName> = {
      home: 'workHome',
      chapters: 'chapters',
      characters: 'characters',
      bible: 'bible',
      notes: 'notes'
    };
    navigate(map[tab]);
  };

  const handleBack = () => {
    if (manuscript.isBusy() || library.isBusy()) return true;
    if (pendingScreen) { setPendingScreen(null); return true; }
    if (screen === 'projects') return false;
    if (screen === 'newProject') navigate('projects');
    else if (screen === 'editProject') navigate('workHome');
    else if (screen === 'editor' || screen === 'newChapter') navigate('chapters');
    else if (screen === 'characterDetail') navigate('characters');
    else if (screen === 'workHome') navigate(administrative ? 'adminUserDetail' : 'projects');
    else if (screen === 'settings') navigate(settingsOrigin);
    else if (screen === 'admin') navigate('settings');
    else if (screen === 'adminUserDetail') navigate('admin');
    else navigate('workHome');
    return true;
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  });

  const removeProject = () => {
    if (!selectedProject || !requireWrite()) return;
    confirm({ title: 'Excluir “' + selectedProject.title + '”?', message: 'Os capítulos desta obra também serão removidos deste dispositivo. Esta ação não pode ser desfeita.', confirmLabel: 'Excluir obra', danger: true, errorMessage: 'Não foi possível excluir a obra. Tente novamente.', onConfirm: async () => {
      await library.remove(selectedProject.id); manuscript.reset(); clearProject(); setScreen('projects');
      setNotesByProject((current) => { const next = { ...current }; delete next[selectedProject.id]; return next; });
    } });
  };
  const removeChapter = () => {
    if (!manuscript.selected || !requireWrite()) return;
    confirm({ title: 'Excluir capítulo?', message: '“' + manuscript.selected.title + '” será removido deste dispositivo, incluindo alterações não salvas.', confirmLabel: 'Excluir capítulo', danger: true, errorMessage: 'Não foi possível excluir o capítulo. Tente novamente.', onConfirm: async () => {
      await manuscript.remove(); setScreen('chapters'); await library.refresh();
    } });
  };
  const saveSelectedChapter = async () => {
    const saved = await manuscript.save();
    if (saved) void library.refresh();
    return saved;
  };

  const activeTab: WorkTab | null =
    screen === 'workHome' ? 'home' :
    screen === 'chapters' || screen === 'newChapter' || screen === 'editor' ? 'chapters' :
    screen === 'characters' || screen === 'characterDetail' ? 'characters' :
    screen === 'bible' ? 'bible' :
    screen === 'notes' ? 'notes' : null;

  const editorSaveState = manuscript.busy ? 'saving' : manuscript.saveError ? 'error' : manuscript.dirty ? 'dirty' : 'saved';

  useEffect(() => {
    if (Platform.OS !== 'web' || !(manuscript.dirty || formDirty)) return;
    const warnBeforeClosing = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warnBeforeClosing);
    return () => window.removeEventListener('beforeunload', warnBeforeClosing);
  }, [manuscript.dirty, formDirty]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ExpoStatusBar style="dark" />
      <View style={styles.app}>
        {opening ? <Text accessibilityLiveRegion="polite" style={styles.permission}>Abrindo obra...</Text> : null}
        {accessError ? <Text accessibilityRole="alert" style={styles.permission}>{accessError}</Text> : null}
        {administrative && workScreens.has(screen) ? <Text style={styles.context}>Visualizando como administrador · somente consulta</Text> : null}
        {permissionMessage ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.permission}>{permissionMessage}</Text> : null}
        {screen === 'projects' ? (
          <ProjectsScreen projects={library.projects} loading={library.loading} errorMessage={library.error} onRetry={library.refresh} onCreateProject={() => { library.clearFormError(); setFormDirty(false); navigate('newProject'); }} onOpenProject={(id) => { void openWork(id); }} onSettings={() => { setSettingsOrigin('projects'); navigate('settings'); }} />
        ) : !workScreens.has(screen) || selectedProject ? (
          <>
            {screen === 'newProject' ? <ScreenHeader title="Nova obra" subtitle="Biblioteca pessoal" canGoBack onBack={() => navigate('projects')} /> : null}
            {screen === 'editProject' ? <ScreenHeader title="Editar obra" canGoBack onBack={goBackToWork} /> : null}
            {screen === 'workHome' ? (
              <ScreenHeader
                title="Minha obra"
                subtitle={selectedProject?.title}
                canGoBack
                onBack={() => navigate(administrative ? 'adminUserDetail' : 'projects')}
                rightLabel="⚙"
                onRightPress={() => { setSettingsOrigin('workHome'); navigate('settings'); }}
              />
            ) : null}
            {screen === 'chapters' ? <ScreenHeader title="Capítulos" subtitle={selectedProject?.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'newChapter' ? <ScreenHeader title="Novo capítulo" subtitle={selectedProject?.title} canGoBack onBack={() => navigate('chapters')} /> : null}
            {screen === 'editor' ? <ScreenHeader title="Editor" subtitle={selectedProject?.title} canGoBack onBack={() => navigate('chapters')} /> : null}
            {screen === 'characters' ? <ScreenHeader title="Personagens" subtitle={selectedProject?.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'characterDetail' && selectedCharacter ? <ScreenHeader title="Ficha" subtitle={selectedProject?.title} canGoBack onBack={() => setScreen('characters')} /> : null}
            {screen === 'bible' ? <ScreenHeader title="Bíblia da obra" subtitle={selectedProject?.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'notes' ? <ScreenHeader title="Rascunhos e notas" subtitle={selectedProject?.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'settings' ? <ScreenHeader title="Configurações" subtitle="Protótipo" canGoBack onBack={() => navigate(settingsOrigin)} /> : null}
            {screen === 'adminUserDetail' ? <ScreenHeader title="Usuário e obras" subtitle="Administração" canGoBack onBack={() => navigate('admin')} /> : null}
            {screen === 'admin' ? <ScreenHeader title="Administração" subtitle="Contas e banco local" canGoBack onBack={() => navigate('settings')} /> : null}

            <View style={styles.content}>
              {screen === 'newProject' || (screen === 'editProject' && selectedProject) ? <ProjectFormScreen key={screen === 'newProject' ? 'new' : selectedProject!.id}
                project={screen === 'editProject' ? selectedProject! : undefined} saving={library.saving} error={library.formError} onDirtyChange={setFormDirty}
                onCancel={() => navigate(screen === 'newProject' ? 'projects' : 'workHome')}
                onSave={async (input) => {
                  if (screen === 'editProject' && !requireWrite()) return;
                  const result = await library.save(input, screen === 'editProject' ? selectedProject?.id : undefined);
                  if (result) { setFormDirty(false); setScreen('projects'); await openWork(result.id); }
                }} /> : null}
              {screen === 'workHome' && selectedProject ? <WorkHomeScreen readOnly={administrative} project={selectedProject} chapters={manuscript.chapters} loading={manuscript.loading} errorMessage={manuscript.error} onRetry={() => manuscript.load(selectedProject.id)} navigate={navigate} onEdit={() => { library.clearFormError(); setFormDirty(false); navigate('editProject'); }} onDelete={removeProject} /> : null}
              {screen === 'chapters' && selectedProject ? (
                <ChaptersScreen
                  readOnly={administrative}
                  chapters={manuscript.chapters}
                  loading={manuscript.loading}
                  errorMessage={manuscript.error}
                  onRetry={() => manuscript.load(selectedProject.id)}
                  onOpenChapter={(id) => { manuscript.select(id); setScreen('editor'); }}
                  onCreateChapter={() => { manuscript.clearCreateError(); setFormDirty(false); navigate('newChapter'); }}
                />
              ) : null}
              {screen === 'newChapter' ? (
                <NewChapterScreen
                  nextNumber={Math.max(0, ...manuscript.chapters.map((chapter) => chapter.number)) + 1}
                  onCancel={() => navigate('chapters')}
                  onDirtyChange={setFormDirty}
                  onCreate={async (title) => { if (await manuscript.create(title)) { setFormDirty(false); setScreen('editor'); await library.refresh(); } }}
                  creating={manuscript.busy}
                  errorMessage={manuscript.createError}
                />
              ) : null}
              {screen === 'editor' && manuscript.selected && manuscript.draft ? (
                <EditorScreen
                  readOnly={administrative}
                  chapter={manuscript.selected}
                  content={manuscript.draft.content}
                  status={manuscript.draft.status}
                  saveState={editorSaveState}
                  onSave={async () => { await saveSelectedChapter(); }}
                  title={manuscript.draft.title ?? manuscript.selected.title}
                  errorMessage={manuscript.saveError}
                  onChangeTitle={(title) => manuscript.change({ title })}
                  onChangeStatus={(status) => manuscript.change({ status })}
                  onChangeContent={(content) => manuscript.change({ content })}
                  onDelete={removeChapter}
                />
              ) : null}
              {screen === 'editor' && !manuscript.selected ? <FeedbackState kind="empty" title="Capítulo indisponível" message="Volte ao manuscrito e selecione um capítulo para continuar." actionLabel="Ver capítulos" onAction={() => navigate('chapters')} /> : null}
              {screen === 'characters' ? (
                <CharactersScreen
                  characters={selectedWorkspace?.characters ?? []}
                  onOpenCharacter={(id) => {
                    setSelectedCharacterId(id);
                    setScreen('characterDetail');
                  }}
                />
              ) : null}
              {screen === 'characterDetail' && selectedCharacter ? <CharacterDetailScreen character={selectedCharacter} /> : null}
              {screen === 'bible' ? <BibleScreen entries={selectedWorkspace?.bibleEntries ?? []} /> : null}
              {screen === 'notes' && selectedProject ? (
                <NotesScreen
                  readOnly={administrative}
                  notes={notesByProject[selectedProject.id] ?? ''}
                  onChangeNotes={(value) => { if (requireWrite()) setNotesByProject((current) => ({ ...current, [selectedProject.id]: value })); }}
                />
              ) : null}
              {screen === 'settings' ? <SettingsScreen onOpenAdmin={() => navigate('admin')} /> : null}
              {screen === 'admin' ? <AdminScreen db={db} onBack={() => navigate('settings')} onOpenUser={(id) => { if (!requireAdmin()) return; setAdminUserId(id); navigate('adminUserDetail'); }} /> : null}
              {screen === 'adminUserDetail' ? <AdminUserDetailScreen db={db} userId={adminUserId} onBack={() => navigate('admin')} onOpenProject={(id) => { if (requireAdmin()) void openWork(id, true); }} /> : null}
            </View>

            {activeTab && screen !== 'settings' && screen !== 'editor' && screen !== 'newChapter' && screen !== 'editProject' ? <BottomNav active={activeTab} onChange={handleTab} /> : null}
          </>
        ) : <FeedbackState kind="error" title="Obra indisponível" message="Selecione uma obra da sua conta para continuar." actionLabel="Ver obras" onAction={() => setScreen('projects')} />}
      </View>
      <UnsavedChangesModal visible={pendingScreen !== null} saving={manuscript.busy} error={manuscript.saveError}
        onStay={() => setPendingScreen(null)}
        onDiscard={() => { if (pendingScreen) { manuscript.discard(); setScreen(pendingScreen); setPendingScreen(null); } }}
        onSave={async () => { if (await saveSelectedChapter()) { setScreen(pendingScreen!); setPendingScreen(null); } }} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseGate>{(db) => <AuthProvider db={db}><AuthGate><FeedbackProvider><PrototypeApp db={db} /></FeedbackProvider></AuthGate></AuthProvider>}</DatabaseGate>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  app: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  context: { padding: 12, color: theme.colors.primary, backgroundColor: theme.colors.primarySoft, fontSize: 13 },
  permission: { padding: 12, color: theme.colors.danger, backgroundColor: theme.colors.dangerSoft, fontSize: 13 }
});
