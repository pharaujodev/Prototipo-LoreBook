import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from './src/components/BottomNav';
import { ScreenHeader } from './src/components/ScreenHeader';
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
import { Chapter, ScreenName } from './src/types';

type WorkTab = 'home' | 'chapters' | 'characters' | 'bible' | 'notes';

const DEFAULT_WORKSPACE = workspaces[0]!;

function PrototypeApp() {
  const [screen, setScreen] = useState<ScreenName>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState(DEFAULT_WORKSPACE.project.id);
  const [selectedChapterId, setSelectedChapterId] = useState(DEFAULT_WORKSPACE.chapters[0]?.id ?? '');
  const [selectedCharacterId, setSelectedCharacterId] = useState(DEFAULT_WORKSPACE.characters[0]?.id ?? '');
  const [chaptersByProject, setChaptersByProject] = useState<Record<string, Chapter[]>>(
    Object.fromEntries(workspaces.map((workspace) => [workspace.project.id, workspace.chapters]))
  );
  const [chapterDrafts, setChapterDrafts] = useState<Record<string, string>>(
    Object.fromEntries(workspaces.flatMap((workspace) => workspace.chapters.map((chapter) => [`${workspace.project.id}:${chapter.id}`, chapter.content])))
  );
  const [notesByProject, setNotesByProject] = useState<Record<string, string>>(
    Object.fromEntries(workspaces.map((workspace) => [workspace.project.id, workspace.notes]))
  );

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.project.id === selectedProjectId) ?? DEFAULT_WORKSPACE,
    [selectedProjectId]
  );
  const currentChapters = chaptersByProject[selectedWorkspace.project.id] ?? selectedWorkspace.chapters;
  const selectedChapter = useMemo(
    () => currentChapters.find((chapter) => chapter.id === selectedChapterId) ?? currentChapters[0],
    [currentChapters, selectedChapterId]
  );
  const selectedCharacter = useMemo(
    () => selectedWorkspace.characters.find((character) => character.id === selectedCharacterId) ?? selectedWorkspace.characters[0],
    [selectedCharacterId, selectedWorkspace]
  );

  const openWork = (projectId: string) => {
    const workspace = workspaces.find((item) => item.project.id === projectId) ?? DEFAULT_WORKSPACE;
    const chapters = chaptersByProject[workspace.project.id] ?? workspace.chapters;
    setSelectedProjectId(workspace.project.id);
    setSelectedChapterId(chapters[0]?.id ?? '');
    setSelectedCharacterId(workspace.characters[0]?.id ?? '');
    setScreen('workHome');
  };

  const goBackToWork = () => setScreen('workHome');

  const handleTab = (tab: WorkTab) => {
    const map: Record<WorkTab, ScreenName> = {
      home: 'workHome',
      chapters: 'chapters',
      characters: 'characters',
      bible: 'bible',
      notes: 'notes'
    };
    setScreen(map[tab]);
  };

  const handleBack = () => {
    if (screen === 'projects') return false;
    if (screen === 'editor' || screen === 'newChapter') setScreen('chapters');
    else if (screen === 'characterDetail') setScreen('characters');
    else if (screen === 'workHome') setScreen('projects');
    else setScreen('workHome');
    return true;
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [screen]);

  const createChapter = (title: string) => {
    const projectId = selectedWorkspace.project.id;
    const existing = chaptersByProject[projectId] ?? [];
    const number = existing.length + 1;
    const id = `${projectId}-c-${Date.now()}`;
    const chapter: Chapter = {
      id,
      number,
      title,
      status: 'Rascunho',
      words: 0,
      content: ''
    };

    setChaptersByProject((current) => ({ ...current, [projectId]: [...(current[projectId] ?? []), chapter] }));
    setChapterDrafts((current) => ({ ...current, [`${projectId}:${id}`]: '' }));
    setSelectedChapterId(id);
    setScreen('editor');
  };

  const activeTab: WorkTab | null =
    screen === 'workHome' ? 'home' :
    screen === 'chapters' || screen === 'newChapter' || screen === 'editor' ? 'chapters' :
    screen === 'characters' || screen === 'characterDetail' ? 'characters' :
    screen === 'bible' ? 'bible' :
    screen === 'notes' ? 'notes' : null;

  const draftKey = selectedChapter ? `${selectedWorkspace.project.id}:${selectedChapter.id}` : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ExpoStatusBar style="dark" />
      <View style={styles.app}>
        {screen === 'projects' ? (
          <ProjectsScreen onOpenProject={openWork} />
        ) : (
          <>
            {screen === 'workHome' ? (
              <ScreenHeader
                title="Minha obra"
                subtitle={selectedWorkspace.project.title}
                canGoBack
                onBack={() => setScreen('projects')}
                rightLabel="⚙"
                onRightPress={() => setScreen('settings')}
              />
            ) : null}
            {screen === 'chapters' ? <ScreenHeader title="Capítulos" subtitle={selectedWorkspace.project.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'newChapter' ? <ScreenHeader title="Novo capítulo" subtitle={selectedWorkspace.project.title} canGoBack onBack={() => setScreen('chapters')} /> : null}
            {screen === 'editor' && selectedChapter ? <ScreenHeader title="Editor" subtitle={selectedWorkspace.project.title} canGoBack onBack={() => setScreen('chapters')} /> : null}
            {screen === 'characters' ? <ScreenHeader title="Personagens" subtitle={selectedWorkspace.project.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'characterDetail' && selectedCharacter ? <ScreenHeader title="Ficha" subtitle={selectedWorkspace.project.title} canGoBack onBack={() => setScreen('characters')} /> : null}
            {screen === 'bible' ? <ScreenHeader title="Bíblia da obra" subtitle={selectedWorkspace.project.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'notes' ? <ScreenHeader title="Rascunhos e notas" subtitle={selectedWorkspace.project.title} canGoBack onBack={goBackToWork} /> : null}
            {screen === 'settings' ? <ScreenHeader title="Configurações" subtitle="Protótipo" canGoBack onBack={goBackToWork} /> : null}

            <View style={styles.content}>
              {screen === 'workHome' ? <WorkHomeScreen project={selectedWorkspace.project} chapters={currentChapters} navigate={setScreen} /> : null}
              {screen === 'chapters' ? (
                <ChaptersScreen
                  chapters={currentChapters}
                  onOpenChapter={(id) => {
                    setSelectedChapterId(id);
                    setScreen('editor');
                  }}
                  onCreateChapter={() => setScreen('newChapter')}
                />
              ) : null}
              {screen === 'newChapter' ? (
                <NewChapterScreen
                  nextNumber={currentChapters.length + 1}
                  onCancel={() => setScreen('chapters')}
                  onCreate={createChapter}
                />
              ) : null}
              {screen === 'editor' && selectedChapter ? (
                <EditorScreen
                  chapter={selectedChapter}
                  content={chapterDrafts[draftKey] ?? selectedChapter.content}
                  onChangeContent={(value) => setChapterDrafts((current) => ({ ...current, [draftKey]: value }))}
                />
              ) : null}
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
                  notes={notesByProject[selectedWorkspace.project.id] ?? ''}
                  onChangeNotes={(value) => setNotesByProject((current) => ({ ...current, [selectedWorkspace.project.id]: value }))}
                />
              ) : null}
              {screen === 'settings' ? <SettingsScreen /> : null}
            </View>

            {activeTab && screen !== 'settings' ? <BottomNav active={activeTab} onChange={handleTab} /> : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PrototypeApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  app: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1 }
});
