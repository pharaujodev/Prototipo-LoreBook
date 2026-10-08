import { type SQLiteDatabase } from 'expo-sqlite';
import { Chapter, Project, chapterStatuses } from '../types';
import { ChapterDraft, countWords } from '../data/chapterDraft';

type ProjectRow = {
  id: string;
  title: string;
  genre: string;
  progress: number;
  updated_at: string;
  chapters: number;
};

type ChapterRow = {
  id: string;
  number: number;
  title: string;
  status: Chapter['status'];
  words: number;
  content: string;
};

export async function listProjects(db: SQLiteDatabase): Promise<Project[]> {
  const rows = await db.getAllAsync<ProjectRow>(`
    SELECT
      p.id,
      p.title,
      p.genre,
      CASE WHEN COUNT(c.id) = 0 THEN 0 ELSE
        ROUND(100.0 * SUM(CASE WHEN c.status = 'Concluído' THEN 1 ELSE 0 END) / COUNT(c.id)) END AS progress,
      p.updated_at,
      COUNT(c.id) AS chapters
    FROM projects p
    LEFT JOIN chapters c ON c.project_id = p.id
    GROUP BY p.id
    ORDER BY p.rowid ASC
  `);

  return rows.map((row: ProjectRow) => ({
    id: row.id,
    title: row.title,
    genre: row.genre,
    progress: row.progress,
    chapters: Number(row.chapters),
    updatedAt: row.updated_at
  }));
}

export async function listChapters(db: SQLiteDatabase, projectId: string): Promise<Chapter[]> {
  const rows = await db.getAllAsync<ChapterRow>(
    `SELECT id, number, title, status, words, content
     FROM chapters
     WHERE project_id = ?
     ORDER BY number ASC`,
    projectId
  );

  return rows.map((row: ChapterRow) => ({
    id: row.id,
    number: row.number,
    title: row.title,
    status: row.status,
    words: row.words,
    content: row.content
  }));
}

export async function createChapter(db: SQLiteDatabase, projectId: string, title: string): Promise<Chapter> {
  if (!title.trim()) throw new Error('Informe um título.');
  let chapter!: Chapter;
  await db.withTransactionAsync(async () => {
    const nextRow = await db.getFirstAsync<{ next_number: number }>(
      `SELECT COALESCE(MAX(number), 0) + 1 AS next_number
       FROM chapters
       WHERE project_id = ?`,
      projectId
    );

    const number = Number(nextRow?.next_number ?? 1);
    const id = `${projectId}-c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    chapter = {
      id,
      number,
      title: title.trim(),
      status: 'Rascunho',
      words: 0,
      content: ''
    };

    await db.runAsync(
      `INSERT INTO chapters
       (id, project_id, number, title, status, words, content, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      chapter.id,
      projectId,
      chapter.number,
      chapter.title,
      chapter.status,
      chapter.words,
      chapter.content,
      new Date().toISOString()
    );
    await db.runAsync('UPDATE projects SET updated_at = ? WHERE id = ?', new Date().toISOString(), projectId);
  });

  return chapter;
}

export async function saveChapter(db: SQLiteDatabase, projectId: string, chapterId: string, draft: ChapterDraft) {
  if (!chapterStatuses.includes(draft.status)) throw new Error('Status inválido.');
  const words = countWords(draft.content);
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `UPDATE chapters
       SET content = ?, status = ?, words = ?, updated_at = ?
       WHERE id = ? AND project_id = ?`,
      draft.content,
      draft.status,
      words,
      new Date().toISOString(),
      chapterId,
      projectId
    );

    if (result.changes !== 1) {
      throw new Error('Capítulo não encontrado para salvar.');
    }

    await db.runAsync('UPDATE projects SET updated_at = ? WHERE id = ?', new Date().toISOString(), projectId);
  });
  return words;
}
