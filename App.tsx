import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from './src/components/BottomNav';
import { FeedbackState } from './src/components/FeedbackState';
import { ScreenHeader } from './src/components/ScreenHeader';
import { UnsavedChangesModal } from './src/components/UnsavedChangesModal';
import { initializeDatabase } from './src/db/database';
import { createChapter as insertChapter, listChapters, listProjects, saveChapter } from './src/db/repositories';
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
import { WorkHomeScreen } from './src/screens/WorkHomeScreen';
import { theme } from './src/theme';
import { Chapter, Project, ScreenName } from './src/types';

type WorkTab = 'home' | 'chapters' | 'characters' | 'bible' | 'notes';

const DEFAULT_WORKSPACE = workspaces[0]!;

function PrototypeApp({ db }: { db: SQLiteDatabase }) {
  const [screen, setScreen] = useState<ScreenName>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(DEFAULT_WORKSPACE.project.id);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState(DEFAULT_WORKSPACE.characters[0]?.id ?? '');
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
    () => workspaces.find((workspace) => workspace.project.id === selectedProjectId) ?? DEFAULT_WORKSPACE,
    [selectedProjectId]
  );
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? selectedWorkspace.project,
    [projects, selectedProjectId, selectedWorkspace.project]
  );
  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === selectedChapterId),
    [chapters, selectedChapterId]
  );
  const selectedCharacter = useMemo(
    () => selectedWorkspace.characters.find((character) => character.id === selectedCharacterId) ?? selectedWorkspace.characters[0],
    [selectedCharacterId, selectedWorkspace]
  );

  const loadProjectsFromDatabase = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError('');
    try {
      const result = await listProjects(db);
      setProjects(result);
    } catch {
      setProjectsError('Os projetos salvos não puderam ser lidos do banco local.');
    } finally {
      setProjectsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void loadProjectsFromDatabase();
  }, [loadProjectsFromDatabase]);

  const loadProjectChapters = useCallback(async (projectId: string) => {
    const request = ++chaptersRequest.current;
    setChaptersLoading(true);
    setChaptersError('');
    setChapters([]);
    try {
      const result = await listChapters(db, projectId);
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
  }, [db]);

  const openWork = async (projectId: string) => {
    const workspace = workspaces.find((item) => item.project.id === projectId) ?? DEFAULT_WORKSPACE;
    setSelectedProjectId(projectId);
    setSelectedCharacterId(workspace.characters[0]?.id ?? '');
    setScreen('workHome');
    await loadProjectChapters(projectId);
  };

  const navigate = (next: ScreenName) => {
    if (mutationInFlight.current) return;
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
    else if (screen === 'workHome') navigate('projects');
    else navigate('workHome');
    return true;
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  });

  const createChapter = async (title: string) => {
    if (mutationInFlight.current) return;
    mutationInFlight.current = true;
    setCreatingChapter(true);
    setCreateChapterError('');
    try {
      const chapter = await insertChapter(db, selectedProject.id, title);
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
    if (!selectedChapter || mutationInFlight.current) return false;
    mutationInFlight.current = true;
    setSaving(true);
    setSaveError('');
    const draft = chapterDrafts[selectedChapter.id] ?? { content: selectedChapter.content, status: selectedChapter.status };
    try {
      const words = await saveChapter(db, selectedProject.id, selectedChapter.id, draft);
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
        {screen === 'projects' ? (
          <ProjectsScreen projects={projects} loading={projectsLoading} errorMessage={projectsError} onRetry={loadProjectsFromDatabase} onOpenProject={openWork} />
        ) : (
          <>
            {screen === 'workHome' ? (
              <ScreenHeader
                title="Minha obra"
                subtitle={selectedProject.title}
                canGoBack
                onBack={() => setScreen('projects')}
                rightLabel="⚙"
                onRightPress={() => setScreen('settings')}
              />
            ) : null}
            {screen === 'chapters' ? <ScreenHeader title="Capítulos" subtitle={selectedProject.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'newChapter' ? <ScreenHeader title="Novo capítulo" subtitle={selectedProject.title} canGoBack onBack={() => navigate('chapters')} /> : null}
            {screen === 'editor' ? <ScreenHeader title="Editor" subtitle={selectedProject.title} canGoBack onBack={() => navigate('chapters')} /> : null}
            {screen === 'characters' ? <ScreenHeader title="Personagens" subtitle={selectedProject.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'characterDetail' && selectedCharacter ? <ScreenHeader title="Ficha" subtitle={selectedProject.title} canGoBack onBack={() => setScreen('characters')} /> : null}
            {screen === 'bible' ? <ScreenHeader title="Bíblia da obra" subtitle={selectedProject.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'notes' ? <ScreenHeader title="Rascunhos e notas" subtitle={selectedProject.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'settings' ? <ScreenHeader title="Configurações" subtitle="Protótipo" canGoBack onBack={goBackToWork} /> : null}

            <View style={styles.content}>
              {screen === 'workHome' ? <WorkHomeScreen project={selectedProject} chapters={chapters} loading={chaptersLoading} errorMessage={chaptersError} onRetry={() => loadProjectChapters(selectedProject.id)} navigate={navigate} /> : null}
              {screen === 'chapters' ? (
                <ChaptersScreen
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
                    setScreen('newChapter');
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
                  chapter={selectedChapter}
                  content={selectedDraft.content}
                  status={selectedDraft.status}
                  saveState={editorSaveState}
                  onSave={async () => { await saveSelectedChapter(); }}
                  onChangeStatus={(status) => {
                    setChapterDrafts((current) => ({ ...current, [selectedChapter.id]: { ...selectedDraft, status } }));
                    setSaveError('');
                  }}
                  onChangeContent={(value) => {
                    setChapterDrafts((current) => ({ ...current, [selectedChapter.id]: { ...selectedDraft, content: value } }));
                    setSaveError('');
                  }}
                />
              ) : null}
              {screen === 'editor' && !selectedChapter ? <FeedbackState kind="empty" title="Capítulo indisponível" message="Volte ao manuscrito e selecione um capítulo para continuar." actionLabel="Ver capítulos" onAction={() => navigate('chapters')} /> : null}
              {screen === 'characters' ? (
                <CharactersScreen
                  characters={selectedWorkspace.characters}
                  onOpenCharacter={(id) => {
                    setSelectedCharacterId(id);
                    setScreen('characterDetail');
                  }}
                />
              ) : null}
              {screen === 'characterDetail' && selectedCharacter ? <CharacterDetailScreen character={selectedCharacter} /> : null}
              {screen === 'bible' ? <BibleScreen entries={selectedWorkspace.bibleEntries} /> : null}
              {screen === 'notes' ? (
                <NotesScreen
                  notes={notesByProject[selectedProject.id] ?? ''}
                  onChangeNotes={(value) => setNotesByProject((current) => ({ ...current, [selectedProject.id]: value }))}
                />
              ) : null}
              {screen === 'settings' ? <SettingsScreen /> : null}
            </View>

            {activeTab && screen !== 'settings' && screen !== 'editor' && screen !== 'newChapter' ? <BottomNav active={activeTab} onChange={handleTab} /> : null}
          </>
        )}
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
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let settled = false;
    let database: SQLiteDatabase | undefined;
    async function prepare() {
      try {
        database = await openDatabaseAsync('lorebook.db');
        await initializeDatabase(database);
        if (!cancelled) setDb(database);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        settled = true;
        if (cancelled) void database?.closeAsync().catch(() => {});
      }
    }
    void prepare();
    return () => { cancelled = true; if (settled) void database?.closeAsync().catch(() => {}); };
  }, [attempt]);
  return (
    <SafeAreaProvider>
      {db ? <PrototypeApp db={db} /> : (
        <SafeAreaView style={styles.feedbackRoot}>
          <ExpoStatusBar style="dark" />
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <FeedbackState kind={error ? 'error' : 'loading'}
            title={error ? 'Não conseguimos abrir seu ateliê' : 'Abrindo seu ateliê'}
            message={error ? 'O armazenamento não respondeu. Tente abrir novamente para acessar suas obras.' : 'Preparando suas obras e deixando tudo pronto para a próxima página.'}
            actionLabel={error ? 'Tentar novamente' : undefined}
            onAction={error ? () => { setError(false); setAttempt((value) => value + 1); } : undefined} />
          </ScrollView>
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  app: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 },
  feedbackRoot: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background }
});
