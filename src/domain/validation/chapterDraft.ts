import { Chapter, ChapterStatus } from '../types/content';

// title opcional mantém compatibilidade com chamadas do HF1/HF2 que salvam só texto/status.
export type ChapterDraft = { title?: string; content: string; status: ChapterStatus };

export function draftFromChapter(chapter: Chapter): ChapterDraft {
  return { title: chapter.title, content: chapter.content, status: chapter.status };
}

export function hasUnsavedChanges(chapter: Chapter, draft?: ChapterDraft) {
  return !!draft && (draft.content !== chapter.content || draft.status !== chapter.status || (draft.title !== undefined && draft.title !== chapter.title));
}

export function countWords(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}
