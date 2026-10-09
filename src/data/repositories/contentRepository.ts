import { type SQLiteDatabase } from 'expo-sqlite';
import { Chapter, Project, chapterStatuses } from '../../domain/types/content';
import { ChapterDraft, countWords } from '../../domain/validation/chapterDraft';
import * as Crypto from 'expo-crypto';
import type { AuthUser } from '../../domain/auth/authTypes';
import { requireActiveUser } from './authRepository';
import { canAccessProject, PermissionError } from '../../domain/permissions/permissions';
import { inTransaction } from '../../infrastructure/database/transactions';
import { ContentValidationError, normalizeProject, normalizeTitle, ProjectInput } from '../../domain/validation/contentValidation';

type ProjectRow = {
  id: string;
  owner_user_id: string;
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

const projectQuery = `
    SELECT
      p.id,
      p.owner_user_id,
      p.title,
      p.genre,
      CASE WHEN COUNT(c.id) = 0 THEN 0 ELSE
        ROUND(100.0 * SUM(CASE WHEN c.status = 'Concluído' THEN 1 ELSE 0 END) / COUNT(c.id)) END AS progress,
      p.updated_at,
      COUNT(c.id) AS chapters
    FROM projects p
    LEFT JOIN chapters c ON c.project_id = p.id
`;

function toProject(row: ProjectRow): Project {
  return { id: row.id, ownerUserId: row.owner_user_id, title: row.title, genre: row.genre,
    progress: row.progress, chapters: Number(row.chapters), updatedAt: row.updated_at };
}

// RN-04/05: mesmo ADMIN só lista as próprias obras no fluxo pessoal.
export async function listProjects(db: SQLiteDatabase, actor: AuthUser | null): Promise<Project[]> {
  const user = await requireActiveUser(db, actor);
  const rows = await db.getAllAsync<ProjectRow>(`${projectQuery} WHERE p.owner_user_id = ? GROUP BY p.id ORDER BY p.rowid`, user.id);
  return rows.map(toProject);
}
export const listProjectsForUser = listProjects;

export async function getProjectForUser(db: SQLiteDatabase, projectId: string, actor: AuthUser | null): Promise<Project> {
  const user = await requireActiveUser(db, actor);
  const row = await db.getFirstAsync<ProjectRow>(`${projectQuery} WHERE p.id = ? AND p.owner_user_id = ? GROUP BY p.id`, projectId, user.id);
  if (!row || !canAccessProject(user, row.owner_user_id)) {
    throw new PermissionError('Você não possui acesso a esta obra.');
  }
  return toProject(row);
}

// RN-11: proprietário sempre vem da conta autenticada, inclusive para ADMIN.
export async function createProject(db: SQLiteDatabase, actor: AuthUser | null, input: ProjectInput): Promise<Project> {
  const values = normalizeProject(input);
  return inTransaction(db, async () => {
    const user = await requireActiveUser(db, actor);
    const id = Crypto.randomUUID();
    await db.runAsync('INSERT INTO projects (id, owner_user_id, title, genre, updated_at) VALUES (?, ?, ?, ?, ?)',
      id, user.id, values.title, values.genre, new Date().toISOString());
    return getProjectForUser(db, id, user);
  });
}

// RN-12: o contexto administrativo nunca concede escrita em obra alheia.
export async function updateProject(db: SQLiteDatabase, actor: AuthUser | null, projectId: string, input: ProjectInput): Promise<Project> {
  const values = normalizeProject(input);
  return inTransaction(db, async () => {
    await getProjectForUser(db, projectId, actor);
    await db.runAsync('UPDATE projects SET title = ?, genre = ?, updated_at = ? WHERE id = ?', values.title, values.genre, new Date().toISOString(), projectId);
    return getProjectForUser(db, projectId, actor);
  });
}

export async function deleteProject(db: SQLiteDatabase, actor: AuthUser | null, projectId: string): Promise<void> {
  await inTransaction(db, async () => {
    await getProjectForUser(db, projectId, actor);
    // RN-14: filhos explícitos para suportar também bancos legados sem CASCADE.
    await db.runAsync('DELETE FROM chapters WHERE project_id = ?', projectId);
    await db.runAsync('DELETE FROM projects WHERE id = ?', projectId);
  });
}

export async function listChapters(db: SQLiteDatabase, projectId: string, actor: AuthUser | null): Promise<Chapter[]> {
  await getProjectForUser(db, projectId, actor);
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

export async function getChapter(db: SQLiteDatabase, projectId: string, chapterId: string, actor: AuthUser | null): Promise<Chapter> {
  await getProjectForUser(db, projectId, actor);
  const chapter = await db.getFirstAsync<ChapterRow>('SELECT id, number, title, status, words, content FROM chapters WHERE id = ? AND project_id = ?', chapterId, projectId);
  if (!chapter) throw new ContentValidationError('Este capítulo não está mais disponível.');
  return { ...chapter };
}

export async function createChapter(db: SQLiteDatabase, projectId: string, title: string, actor: AuthUser | null): Promise<Chapter> {
  const normalizedTitle = normalizeTitle(title);
  let chapter!: Chapter;
  await inTransaction(db, async () => {
    // RN-13/17: exige proprietário ativo e obra existente, inclusive em chamadas diretas.
    await getProjectForUser(db, projectId, actor);
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
      title: normalizedTitle,
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

export async function saveChapter(db: SQLiteDatabase, projectId: string, chapterId: string, draft: ChapterDraft, actor: AuthUser | null) {
  if (!chapterStatuses.includes(draft.status)) throw new ContentValidationError('Status inválido.');
  const words = countWords(draft.content);
  await inTransaction(db, async () => {
    const current = await getChapter(db, projectId, chapterId, actor);
    const title = normalizeTitle(draft.title ?? current.title);
    const result = await db.runAsync(
      `UPDATE chapters
       SET title = ?, content = ?, status = ?, words = ?, updated_at = ?
       WHERE id = ? AND project_id = ?`,
      title,
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

export async function deleteChapter(db: SQLiteDatabase, projectId: string, chapterId: string, actor: AuthUser | null): Promise<void> {
  await inTransaction(db, async () => {
    await getChapter(db, projectId, chapterId, actor);
    await db.runAsync('DELETE FROM chapters WHERE id = ? AND project_id = ?', chapterId, projectId);
    await db.runAsync('UPDATE projects SET updated_at = ? WHERE id = ?', new Date().toISOString(), projectId);
  });
}
