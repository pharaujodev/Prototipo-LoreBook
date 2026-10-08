import type { SQLiteDatabase } from 'expo-sqlite';
import { AuthUser, USER_ROLES, USER_STATUSES, UserStatus } from '../auth/authTypes';
import { requireActiveUser } from '../auth/authRepository';
import { assertStatusChange, PermissionError, requireAdminPermission } from '../auth/permissions';
import { getProjectForUser, listChapters } from '../db/repositories';
import { inTransaction } from '../db/transactions';
import type { Project } from '../types';

export type AdminUser = AuthUser & { projectCount: number };
export type AdminUserDetail = { user: AdminUser; projects: Project[] };

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
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM projects WHERE owner_user_id = ? ORDER BY rowid', userId);
  const projects = await Promise.all(rows.map((row) => getProjectForUser(db, row.id, actor, true)));
  return { user, projects };
}

export async function getProjectAsAdmin(db: SQLiteDatabase, actor: AuthUser | null, projectId: string): Promise<Project> {
  await requireActiveAdmin(db, actor);
  return getProjectForUser(db, projectId, actor, true);
}

export async function listChaptersAsAdmin(db: SQLiteDatabase, actor: AuthUser | null, projectId: string) {
  await requireActiveAdmin(db, actor);
  return listChapters(db, projectId, actor, true);
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
