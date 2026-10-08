export type ScreenName =
  | 'projects'
  | 'workHome'
  | 'chapters'
  | 'newChapter'
  | 'editor'
  | 'characters'
  | 'characterDetail'
  | 'bible'
  | 'notes'
  | 'settings';

export type Project = {
  id: string;
  title: string;
  genre: string;
  progress: number;
  chapters: number;
  updatedAt: string;
};

export const chapterStatuses = ['Rascunho', 'Revisão', 'Concluído'] as const;
export type ChapterStatus = typeof chapterStatuses[number];

export type Chapter = {
  id: string;
  number: number;
  title: string;
  status: ChapterStatus;
  words: number;
  content: string;
};

export type Character = {
  id: string;
  name: string;
  role: string;
  age: string;
  summary: string;
  goal: string;
  conflict: string;
};

export type BibleEntry = {
  id: string;
  category: 'Mundo' | 'Local' | 'Regra';
  title: string;
  text: string;
};

export type ProjectWorkspace = {
  project: Project;
  chapters: Chapter[];
  characters: Character[];
  bibleEntries: BibleEntry[];
  notes: string;
};
