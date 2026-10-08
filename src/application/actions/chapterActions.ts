import type { SQLiteDatabase } from 'expo-sqlite';
import type { ChapterDraft } from '../../domain/validation/chapterDraft';
import { createChapter, saveChapter } from '../../data/repositories/contentRepository';
import type { AuthUser } from '../../domain/auth/authTypes';
import { requireWritePermission } from '../../domain/permissions/permissions';

// Fronteira de aplicação: também bloqueia chamadas indiretas, antes do repository.
export function createChapterForUser(db: SQLiteDatabase, user: AuthUser | null, projectId: string, title: string) {
  requireWritePermission(user);
  return createChapter(db, projectId, title, user);
}

export function saveChapterForUser(db: SQLiteDatabase, user: AuthUser | null, projectId: string, chapterId: string, draft: ChapterDraft) {
  requireWritePermission(user);
  return saveChapter(db, projectId, chapterId, draft, user);
}
