import { type SQLiteDatabase } from 'expo-sqlite';
import { workspaces } from '../data/mock';
import { countWords } from '../data/chapterDraft';

const DATABASE_VERSION = 2;

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error('Este banco foi criado por uma versão mais recente do aplicativo.');
  }

  await db.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          genre TEXT NOT NULL DEFAULT '',
          progress INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chapters (
          id TEXT PRIMARY KEY NOT NULL,
          project_id TEXT NOT NULL,
          number INTEGER NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Rascunho',
          words INTEGER NOT NULL DEFAULT 0,
          content TEXT NOT NULL DEFAULT '',
          updated_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          UNIQUE(project_id, number)
        );

        CREATE INDEX IF NOT EXISTS idx_chapters_project_id ON chapters(project_id);
      `);
      await seedPrototypeData(db);
    }

    if (currentVersion < 2) {
      // Corrige contagens fictícias sem substituir texto ou status salvos.
      const chapters = await db.getAllAsync<{ id: string; content: string }>('SELECT id, content FROM chapters');
      for (const chapter of chapters) {
        await db.runAsync('UPDATE chapters SET words = ? WHERE id = ?', countWords(chapter.content), chapter.id);
      }
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    }
  });
}

async function seedPrototypeData(db: SQLiteDatabase) {
  for (const workspace of workspaces) {
    const project = workspace.project;
    await db.runAsync(
      `INSERT OR IGNORE INTO projects (id, title, genre, progress, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      project.id,
      project.title,
      project.genre,
      project.progress,
      project.updatedAt
    );

    for (const chapter of workspace.chapters) {
      await db.runAsync(
        `INSERT OR IGNORE INTO chapters
         (id, project_id, number, title, status, words, content, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        chapter.id,
        project.id,
        chapter.number,
        chapter.title,
        chapter.status,
        chapter.words,
        chapter.content,
        project.updatedAt
      );
    }
  }
}
