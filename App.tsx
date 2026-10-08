import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import type { SQLiteDatabase } from 'expo-sqlite';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from './src/components/BottomNav';
import { FeedbackState } from './src/components/FeedbackState';
import { ScreenHeader } from './src/components/ScreenHeader';
import { UnsavedChangesModal } from './src/components/UnsavedChangesModal';
import { DatabaseGate } from './src/db/DatabaseGate';
import { listChapters, listProjects } from './src/db/repositories';
import { useProjectAccess } from './src/auth/useProjectAccess';
import { listChaptersAsAdmin } from './src/admin/adminRepository';
import { AdminUserDetailScreen } from './src/screens/AdminUserDetailScreen';
import { AuthProvider } from './src/auth/AuthContext';
import { AuthGate } from './src/auth/AuthGate';
import { useAuthorization } from './src/auth/useAuthorization';
import { createChapterForUser, saveChapterForUser } from './src/auth/chapterActions';
import { ChapterDraft, hasUnsavedChanges } from './src/data/chapterDraft';
import { workspaces } from './src/data/mock';
import { BibleScreen } from './src/screens/BibleScreen';
import { ChaptersScreen } from './src/screens/ChaptersScreen';
import { CharacterDetailScreen } from './src/screens/CharacterDetailScreen';
import { CharactersScreen } from './src/screens/CharactersScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { NewChapterScreen } from './src/screens/NewChapterScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { WorkHomeScreen } from './src/screens/WorkHomeScreen';
import { theme } from './src/theme';
import { Chapter, Project, ScreenName } from './src/types';

type WorkTab = 'home' | 'chapters' | 'characters' | 'bible' | 'notes';

const workScreens = new Set<ScreenName>(['workHome', 'chapters', 'newChapter', 'editor', 'characters', 'characterDetail', 'bible', 'notes']);

function PrototypeApp({ db }: { db: SQLiteDatabase }) {
  const { user, requireAdmin, permissionMessage } = useAuthorization();
  const { project: openedProject, administrative, opening, accessError, open: openProject, requireProjectWrite: requireWrite } = useProjectAccess(db);
  const [adminUserId, setAdminUserId] = useState('');
  const [screen, setScreen] = useState<ScreenName>('projects');
  const [settingsOrigin, setSettingsOrigin] = useState<'projects' | 'workHome'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const selectedProjectId = openedProject?.id;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [chapterDrafts, setChapterDrafts] = useState<Record<string, ChapterDraft>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const mutationInFlight = useRef(false);
  const chaptersRequest = useRef(0);
  const [pendingScreen, setPendingScreen] = useState<ScreenName | null>(null);
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [createChapterError, setCreateChapterError] = useState('');
  const [notesByProject, setNotesByProject] = useState<Record<string, string>>(
    Object.fromEntries(workspaces.map((workspace) => [workspace.project.id, workspace.notes]))
  );

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.project.id === selectedProjectId),
    [selectedProjectId]
  );
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? openedProject,
    [projects, selectedProjectId, openedProject]
  );
  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === selectedChapterId),
    [chapters, selectedChapterId]
  );
  const selectedCharacter = useMemo(
    () => selectedWorkspace?.characters.find((character) => character.id === selectedCharacterId) ?? selectedWorkspace?.characters[0],
    [selectedCharacterId, selectedWorkspace]
  );

  const loadProjectsFromDatabase = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError('');
    try {
      const result = await listProjects(db, user);
      setProjects(result);
    } catch {
      setProjectsError('Os projetos salvos não puderam ser lidos do banco local.');
    } finally {
      setProjectsLoading(false);
    }
  }, [db, user]);

  useEffect(() => {
    void loadProjectsFromDatabase();
  }, [loadProjectsFromDatabase]);

  const loadProjectChapters = useCallback(async (projectId: string, asAdmin = administrative) => {
    const request = ++chaptersRequest.current;
    setChaptersLoading(true);
    setChaptersError('');
    setChapters([]);
    try {
      const result = asAdmin ? await listChaptersAsAdmin(db, user, projectId) : await listChapters(db, projectId, user);
      if (request !== chaptersRequest.current) return;
      setChapters(result);
      setSelectedChapterId(result[0]?.id ?? '');
    } catch {
      if (request !== chaptersRequest.current) return;
      setChapters([]);
      setChaptersError('Os capítulos desta obra não puderam ser lidos do banco local.');
    } finally {
      if (request === chaptersRequest.current) setChaptersLoading(false);
    }
  }, [db, user, administrative]);

  const openWork = async (projectId: string, asAdmin = false) => {
    const project = await openProject(projectId, asAdmin);
    if (!project) return;
    const workspace = workspaces.find((item) => item.project.id === projectId);
    setSelectedCharacterId(workspace?.characters[0]?.id ?? '');
    setScreen('workHome');
    await loadProjectChapters(projectId, asAdmin);
  };

  const navigate = (next: ScreenName) => {
    if (mutationInFlight.current) return;
    if (next === 'newChapter' && !requireWrite()) return;
    if ((next === 'admin' || next === 'adminUserDetail') && !requireAdmin()) return;
    if (workScreens.has(next) && !selectedProject) return;
    if (screen === 'editor' && selectedChapter && hasUnsavedChanges(selectedChapter, chapterDrafts[selectedChapter.id])) {
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
    if (mutationInFlight.current) return true;
    if (pendingScreen) { setPendingScreen(null); return true; }
    if (screen === 'projects') return false;
    if (screen === 'editor' || screen === 'newChapter') navigate('chapters');
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

  const createChapter = async (title: string) => {
    if (!selectedProject || !requireWrite()) return;
    if (mutationInFlight.current) return;
    mutationInFlight.current = true;
    setCreatingChapter(true);
    setCreateChapterError('');
    try {
      const chapter = await createChapterForUser(db, user, selectedProject.id, title);
      setChapters((current) => [...current, chapter]);
      setChapterDrafts((current) => ({ ...current, [chapter.id]: { content: chapter.content, status: chapter.status } }));
      setSelectedChapterId(chapter.id);
      setSaveError('');
      await loadProjectsFromDatabase();
      setScreen('editor');
    } catch {
      setCreateChapterError('Não foi possível criar o capítulo. Tente novamente.');
    } finally {
      mutationInFlight.current = false;
      setCreatingChapter(false);
    }
  };

  const saveSelectedChapter = async (): Promise<boolean> => {
    if (!selectedProject || !requireWrite()) return false;
    if (!selectedChapter || mutationInFlight.current) return false;
    mutationInFlight.current = true;
    setSaving(true);
    setSaveError('');
    const draft = chapterDrafts[selectedChapter.id] ?? { content: selectedChapter.content, status: selectedChapter.status };
    try {
      const words = await saveChapterForUser(db, user, selectedProject.id, selectedChapter.id, draft);
      setChapters((current) => current.map((chapter) => chapter.id === selectedChapter.id ? { ...chapter, ...draft, words } : chapter));
      await loadProjectsFromDatabase();
      return true;
    } catch {
      setSaveError('Não foi possível salvar. Seu texto continua aqui para tentar novamente.');
      return false;
    } finally {
      mutationInFlight.current = false;
      setSaving(false);
    }
  };

  const activeTab: WorkTab | null =
    screen === 'workHome' ? 'home' :
    screen === 'chapters' || screen === 'newChapter' || screen === 'editor' ? 'chapters' :
    screen === 'characters' || screen === 'characterDetail' ? 'characters' :
    screen === 'bible' ? 'bible' :
    screen === 'notes' ? 'notes' : null;

  const selectedDraft = selectedChapter ? chapterDrafts[selectedChapter.id] ?? { content: selectedChapter.content, status: selectedChapter.status } : undefined;
  const editorSaveState = saving ? 'saving' : saveError ? 'error' : selectedChapter && hasUnsavedChanges(selectedChapter, selectedDraft) ? 'dirty' : 'saved';

  useEffect(() => {
    if (Platform.OS !== 'web' || !selectedChapter || !hasUnsavedChanges(selectedChapter, selectedDraft)) return;
    const warnBeforeClosing = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warnBeforeClosing);
    return () => window.removeEventListener('beforeunload', warnBeforeClosing);
  }, [selectedChapter, selectedDraft]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ExpoStatusBar style="dark" />
      <View style={styles.app}>
        {opening ? <Text accessibilityLiveRegion="polite" style={styles.permission}>Abrindo obra...</Text> : null}
        {accessError ? <Text accessibilityRole="alert" style={styles.permission}>{accessError}</Text> : null}
        {administrative && workScreens.has(screen) ? <Text style={styles.context}>Visualizando como administrador · somente consulta</Text> : null}
        {permissionMessage ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.permission}>{permissionMessage}</Text> : null}
        {screen === 'projects' ? (
          <ProjectsScreen projects={projects} loading={projectsLoading} errorMessage={projectsError} onRetry={loadProjectsFromDatabase} onOpenProject={(id) => { void openWork(id); }} onSettings={() => { setSettingsOrigin('projects'); navigate('settings'); }} />
        ) : !workScreens.has(screen) || selectedProject ? (
          <>
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
              {screen === 'workHome' && selectedProject ? <WorkHomeScreen readOnly={administrative} project={selectedProject} chapters={chapters} loading={chaptersLoading} errorMessage={chaptersError} onRetry={() => loadProjectChapters(selectedProject.id)} navigate={navigate} /> : null}
              {screen === 'chapters' && selectedProject ? (
                <ChaptersScreen
                  readOnly={administrative}
                  chapters={chapters}
                  loading={chaptersLoading}
                  errorMessage={chaptersError}
                  onRetry={() => loadProjectChapters(selectedProject.id)}
                  onOpenChapter={(id) => {
                    setSelectedChapterId(id);
                    const chapter = chapters.find((item) => item.id === id);
                    if (chapter) setChapterDrafts((current) => ({ ...current, [id]: current[id] ?? { content: chapter.content, status: chapter.status } }));
                    setSaveError('');
                    setScreen('editor');
                  }}
                  onCreateChapter={() => {
                    setCreateChapterError('');
                    navigate('newChapter');
                  }}
                />
              ) : null}
              {screen === 'newChapter' ? (
                <NewChapterScreen
                  nextNumber={Math.max(0, ...chapters.map((chapter) => chapter.number)) + 1}
                  onCancel={() => navigate('chapters')}
                  onCreate={createChapter}
                  creating={creatingChapter}
                  errorMessage={createChapterError}
                />
              ) : null}
              {screen === 'editor' && selectedChapter && selectedDraft ? (
                <EditorScreen
                  readOnly={administrative}
                  chapter={selectedChapter}
                  content={selectedDraft.content}
                  status={selectedDraft.status}
                  saveState={editorSaveState}
                  onSave={async () => { await saveSelectedChapter(); }}
                  onChangeStatus={(status) => {
                    if (!requireWrite()) return;
                    setChapterDrafts((current) => ({ ...current, [selectedChapter.id]: { ...selectedDraft, status } }));
                    setSaveError('');
                  }}
                  onChangeContent={(value) => {
                    if (!requireWrite()) return;
                    setChapterDrafts((current) => ({ ...current, [selectedChapter.id]: { ...selectedDraft, content: value } }));
                    setSaveError('');
                  }}
                />
              ) : null}
              {screen === 'editor' && !selectedChapter ? <FeedbackState kind="empty" title="Capítulo indisponível" message="Volte ao manuscrito e selecione um capítulo para continuar." actionLabel="Ver capítulos" onAction={() => navigate('chapters')} /> : null}
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

            {activeTab && screen !== 'settings' && screen !== 'editor' && screen !== 'newChapter' ? <BottomNav active={activeTab} onChange={handleTab} /> : null}
          </>
        ) : <FeedbackState kind="error" title="Obra indisponível" message="Selecione uma obra da sua conta para continuar." actionLabel="Ver obras" onAction={() => setScreen('projects')} />}
      </View>
      <UnsavedChangesModal visible={pendingScreen !== null} saving={saving} error={saveError}
        onStay={() => setPendingScreen(null)}
        onDiscard={() => {
          if (!selectedChapter || !pendingScreen) return;
          setChapterDrafts((current) => { const next = { ...current }; delete next[selectedChapter.id]; return next; });
          setSaveError(''); setScreen(pendingScreen); setPendingScreen(null);
        }}
        onSave={async () => { if (await saveSelectedChapter()) { setScreen(pendingScreen!); setPendingScreen(null); } }} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseGate>{(db) => <AuthProvider db={db}><AuthGate><PrototypeApp db={db} /></AuthGate></AuthProvider>}</DatabaseGate>
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
