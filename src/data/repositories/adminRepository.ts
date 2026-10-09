import type { SQLiteDatabase } from 'expo-sqlite';
import { AuthUser, USER_ROLES, USER_STATUSES, UserStatus } from '../../domain/auth/authTypes';
import { requireActiveUser } from './authRepository';
import { assertStatusChange, PermissionError, requireAdminPermission } from '../../domain/permissions/permissions';
import { inTransaction } from '../../infrastructure/database/transactions';

import type { AdminProjectMetadata, AdminUser, AdminUserDetail } from '../../domain/types/admin';

export async function requireActiveAdmin(db: SQLiteDatabase, actor: AuthUser | null): Promise<AuthUser> {
  requireAdminPermission(actor);
  const current = await requireActiveUser(db, actor);
  requireAdminPermission(current);
  return current;
}

const userQuery = `SELECT u.id, u.name, u.email, u.role, u.status,
  (SELECT COUNT(*) FROM projects p WHERE p.owner_user_id = u.id) AS projectCount FROM users u`;

// RN-06: projeção explícita; nunca retorna hashes ou salts à apresentação.
export async function listUsers(db: SQLiteDatabase, actor: AuthUser | null): Promise<AdminUser[]> {
  await requireActiveAdmin(db, actor);
  return db.getAllAsync<AdminUser>(`${userQuery} ORDER BY u.created_at, u.rowid`);
}

export async function getUserDetail(db: SQLiteDatabase, actor: AuthUser | null, userId: string): Promise<AdminUserDetail> {
  await requireActiveAdmin(db, actor);
  const user = await db.getFirstAsync<AdminUser>(`${userQuery} WHERE u.id = ?`, userId);
  if (!user) throw new PermissionError('Usuário indisponível.');
  // RN-06: apenas metadados e agregados; não seleciona título/texto de capítulos.
  const projects = await db.getAllAsync<AdminProjectMetadata>(`
    SELECT p.id, p.title, p.genre, COUNT(c.id) AS chapters,
      CASE WHEN COUNT(c.id) = 0 THEN 0 ELSE
        ROUND(100.0 * SUM(CASE WHEN c.status = 'Concluído' THEN 1 ELSE 0 END) / COUNT(c.id)) END AS progress,
      p.updated_at AS updatedAt
    FROM projects p
    LEFT JOIN chapters c ON c.project_id = p.id
    WHERE p.owner_user_id = ?
    GROUP BY p.id ORDER BY p.rowid`, userId);
  return { user, projects };
}

export async function updateUserStatus(db: SQLiteDatabase, actor: AuthUser | null, userId: string, status: UserStatus): Promise<void> {
  requireAdminPermission(actor);
  await inTransaction(db, async () => {
    const admin = await requireActiveAdmin(db, actor);
    const target = await db.getFirstAsync<AdminUser>(`${userQuery} WHERE u.id = ?`, userId);
    if (!target) throw new PermissionError('Usuário indisponível.');
    const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM users WHERE role = ? AND status = ?', USER_ROLES.ADMIN, USER_STATUSES.ACTIVE);
    assertStatusChange(admin, target, status, count?.count ?? 0);
    await db.runAsync('UPDATE users SET status = ? WHERE id = ?', status, userId);
    if (status === USER_STATUSES.DISABLED) await db.runAsync('DELETE FROM app_session WHERE user_id = ?', userId);
  });
}
