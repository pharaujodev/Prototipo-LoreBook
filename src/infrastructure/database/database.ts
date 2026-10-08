import { type SQLiteDatabase } from 'expo-sqlite';
import { workspaces } from '../../data/mock';
import { countWords } from '../../domain/validation/chapterDraft';
import { USER_ROLES } from '../../domain/auth/authTypes';

const DATABASE_VERSION = 5;

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
    }
    if (currentVersion < 3) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('${USER_ROLES.ADMIN}', '${USER_ROLES.USER}')),
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS app_session (
          singleton_id INTEGER PRIMARY KEY NOT NULL CHECK(singleton_id = 1),
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
        );
      `);
    }
    if (currentVersion === 3) {
      // O schema 3 usava CHECK AUTHOR/READER. Mantemos as tabelas originais como
      // arquivo de compatibilidade; nenhuma tabela é apagada ou resetada.
      await db.execAsync(`
        ALTER TABLE app_session RENAME TO app_session_legacy_v3;
        ALTER TABLE users RENAME TO users_legacy_v3;
        CREATE TABLE users (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('${USER_ROLES.ADMIN}', '${USER_ROLES.USER}')),
          created_at TEXT NOT NULL
        );
        INSERT INTO users (id, name, email, password_hash, password_salt, role, created_at)
          SELECT id, name, email, password_hash, password_salt,
            CASE WHEN id = (SELECT id FROM users_legacy_v3 ORDER BY created_at ASC, rowid ASC LIMIT 1)
              THEN '${USER_ROLES.ADMIN}' ELSE '${USER_ROLES.USER}' END, created_at
          FROM users_legacy_v3 ORDER BY created_at ASC, rowid ASC;
        CREATE TABLE app_session (
          singleton_id INTEGER PRIMARY KEY NOT NULL CHECK(singleton_id = 1),
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
        );
        INSERT INTO app_session SELECT singleton_id, user_id FROM app_session_legacy_v3;
      `);
    }
    if (currentVersion < 5) {
      const userColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(users)');
      if (!userColumns.some((column) => column.name === 'status')) {
        await db.execAsync("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED'));");
      }
      const projectColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(projects)');
      if (!projectColumns.some((column) => column.name === 'owner_user_id')) {
        // Nullable só para o acervo legado anterior ao primeiro cadastro.
        await db.execAsync('ALTER TABLE projects ADD COLUMN owner_user_id TEXT REFERENCES users(id);');
      }
      await db.runAsync(`UPDATE projects SET owner_user_id =
        (SELECT id FROM users WHERE role = ? ORDER BY created_at, rowid LIMIT 1)
        WHERE owner_user_id IS NULL AND EXISTS (SELECT 1 FROM users WHERE role = ?)`, USER_ROLES.ADMIN, USER_ROLES.ADMIN);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_user_id);
        CREATE TRIGGER IF NOT EXISTS projects_require_owner_insert BEFORE INSERT ON projects
          WHEN NEW.owner_user_id IS NULL BEGIN SELECT RAISE(ABORT, 'Obra requer proprietário'); END;
        CREATE TRIGGER IF NOT EXISTS projects_require_owner_update BEFORE UPDATE OF owner_user_id ON projects
          WHEN NEW.owner_user_id IS NULL BEGIN SELECT RAISE(ABORT, 'Obra requer proprietário'); END;
      `);
    }
    if (currentVersion < DATABASE_VERSION) {
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
