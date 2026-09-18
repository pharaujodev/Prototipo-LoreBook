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

export type Chapter = {
  id: string;
  number: number;
  title: string;
  status: 'Rascunho' | 'Revisão' | 'Concluído';
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
