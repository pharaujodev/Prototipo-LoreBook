import type { SQLiteDatabase } from 'expo-sqlite';
import type { ChapterDraft } from '../data/chapterDraft';
import { createChapter, saveChapter } from '../db/repositories';
import type { AuthUser } from './authTypes';
import { requireWritePermission } from './permissions';

// Fronteira de aplicação: também bloqueia chamadas indiretas, antes do repository.
export function createChapterForUser(db: SQLiteDatabase, user: AuthUser | null, projectId: string, title: string) {
  requireWritePermission(user);
  return createChapter(db, projectId, title, user);
}

export function saveChapterForUser(db: SQLiteDatabase, user: AuthUser | null, projectId: string, chapterId: string, draft: ChapterDraft) {
  requireWritePermission(user);
  return saveChapter(db, projectId, chapterId, draft, user);
}
