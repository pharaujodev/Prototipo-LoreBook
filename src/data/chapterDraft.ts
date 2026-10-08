import { Chapter, ChapterStatus } from '../types';

export type ChapterDraft = { content: string; status: ChapterStatus };

export function hasUnsavedChanges(chapter: Chapter, draft?: ChapterDraft) {
  return !!draft && (draft.content !== chapter.content || draft.status !== chapter.status);
}

export function countWords(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}
