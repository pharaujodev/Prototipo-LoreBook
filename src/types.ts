export type ScreenName =
  | 'projects'
  | 'newProject'
  | 'editProject'
  | 'workHome'
  | 'chapters'
  | 'newChapter'
  | 'editor'
  | 'characters'
  | 'characterDetail'
  | 'bible'
  | 'notes'
  | 'settings'
  | 'admin'
  | 'adminUserDetail';

export type Project = {
  id: string;
  ownerUserId: string;
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
  project: Omit<Project, 'ownerUserId'>;
  chapters: Chapter[];
  characters: Character[];
  bibleEntries: BibleEntry[];
  notes: string;
};
