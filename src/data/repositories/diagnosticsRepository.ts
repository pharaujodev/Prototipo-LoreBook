import type { SQLiteDatabase } from 'expo-sqlite';
import type { AuthUser } from '../../domain/auth/authTypes';
import { requireActiveAdmin } from './adminRepository';

import type { DatabaseDiagnostics } from '../../domain/types/admin';

export async function getDatabaseDiagnostics(db: SQLiteDatabase, actor: AuthUser | null): Promise<DatabaseDiagnostics> {
  await requireActiveAdmin(db, actor);
  const result = await db.getFirstAsync<DatabaseDiagnostics>(`
    SELECT (SELECT COUNT(*) FROM projects) AS projects,
           (SELECT COUNT(*) FROM chapters) AS chapters,
           (SELECT COUNT(*) FROM users) AS users,
           (SELECT COUNT(*) FROM projects WHERE owner_user_id IS NULL) AS unownedProjects
  `);
  if (!result) throw new Error('Não foi possível consultar o banco local.');
  return result;
}
