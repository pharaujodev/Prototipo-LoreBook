import { type SQLiteDatabase } from 'expo-sqlite';
import { Chapter, Project, chapterStatuses } from '../types';
import { ChapterDraft, countWords } from '../data/chapterDraft';
import * as Crypto from 'expo-crypto';
import type { AuthUser } from '../auth/authTypes';
import { requireActiveUser } from '../auth/authRepository';
import { canAccessProject, canEditProject, PermissionError, requireAdminPermission } from '../auth/permissions';
import { inTransaction } from './transactions';

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

export async function getProjectForUser(db: SQLiteDatabase, projectId: string, actor: AuthUser | null, administrative = false): Promise<Project> {
  const user = await requireActiveUser(db, actor);
  if (administrative) requireAdminPermission(user);
  const row = await db.getFirstAsync<ProjectRow>(`${projectQuery} WHERE p.id = ? GROUP BY p.id`, projectId);
  if (!row || !(administrative ? canAccessProject(user, row.owner_user_id) : canEditProject(user, row.owner_user_id))) {
    throw new PermissionError('Você não possui acesso a esta obra.');
  }
  return toProject(row);
}

// Contrato pronto para o futuro formulário de criação; proprietário nunca vem do input.
export async function createProject(db: SQLiteDatabase, actor: AuthUser | null, input: { title: string; genre?: string }): Promise<Project> {
  if (!input.title.trim()) throw new Error('Informe um título.');
  return inTransaction(db, async () => {
    const user = await requireActiveUser(db, actor);
    const id = Crypto.randomUUID();
    await db.runAsync('INSERT INTO projects (id, owner_user_id, title, genre, updated_at) VALUES (?, ?, ?, ?, ?)',
      id, user.id, input.title.trim(), input.genre?.trim() ?? '', new Date().toISOString());
    return getProjectForUser(db, id, user);
  });
}

export async function listChapters(db: SQLiteDatabase, projectId: string, actor: AuthUser | null, administrative = false): Promise<Chapter[]> {
  await getProjectForUser(db, projectId, actor, administrative);
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

export async function createChapter(db: SQLiteDatabase, projectId: string, title: string, actor: AuthUser | null): Promise<Chapter> {
  if (!title.trim()) throw new Error('Informe um título.');
  let chapter!: Chapter;
  await inTransaction(db, async () => {
    // RN-10: capítulos herdam o proprietário da obra, inclusive em chamadas diretas.
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

export async function saveChapter(db: SQLiteDatabase, projectId: string, chapterId: string, draft: ChapterDraft, actor: AuthUser | null) {
  if (!chapterStatuses.includes(draft.status)) throw new Error('Status inválido.');
  const words = countWords(draft.content);
  await inTransaction(db, async () => {
    await getProjectForUser(db, projectId, actor);
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
