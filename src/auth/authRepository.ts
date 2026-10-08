import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { AuthError, AuthUser, LoginInput, RegisterInput, USER_ROLES, USER_STATUSES } from './authTypes';
import { PermissionError, requireWritePermission } from './permissions';
import { inTransaction } from '../db/transactions';
import { generateSalt, hashPassword } from './passwords';
import { assertValid, isUserRole, normalizeEmail, validateLogin, validateRegistration } from './validation';

type UserRow = Omit<AuthUser, 'role' | 'status'> & { role: string; status: string };
type CredentialRow = UserRow & { password_hash: string; password_salt: string };

function toUser(row: UserRow): AuthUser {
  if (!isUserRole(row.role)) throw new AuthError('O perfil da conta não pôde ser carregado.');
  if (row.status !== USER_STATUSES.ACTIVE && row.status !== USER_STATUSES.DISABLED) throw new AuthError('O status da conta não pôde ser carregado.');
  return { id: row.id, name: row.name, email: row.email, role: row.role, status: row.status };
}

export async function registerUser(db: SQLiteDatabase, input: RegisterInput): Promise<AuthUser> {
  assertValid(validateRegistration(input));
  const email = normalizeEmail(input.email);
  const salt = await generateSalt();
  const hash = await hashPassword(input.password, salt);
  // RN-01/02: decisão e INSERT na mesma instrução atômica. Nenhuma role vem da tela.
  // RN-03: UNIQUE + ON CONFLICT também impedem e-mails duplicados em concorrência.
  return inTransaction(db, async () => {
    const row = await db.getFirstAsync<UserRow>(
      `INSERT INTO users (id, name, email, password_hash, password_salt, role, created_at)
       VALUES (?, ?, ?, ?, ?, CASE WHEN NOT EXISTS (SELECT 1 FROM users) THEN ? ELSE ? END, ?)
       ON CONFLICT(email) DO NOTHING RETURNING id, name, email, role, status`,
      Crypto.randomUUID(), input.name.trim(), email, hash, salt, USER_ROLES.ADMIN, USER_ROLES.USER, new Date().toISOString()
    );
    if (!row) throw new AuthError('Este e-mail já está cadastrado. Entre com sua conta.');
    // RN-04: cadastro e atribuição do legado confirmam ou revertem juntos.
    if (row.role === USER_ROLES.ADMIN) {
      await db.runAsync('UPDATE projects SET owner_user_id = ? WHERE owner_user_id IS NULL', row.id);
    }
    return toUser(row);
  });
}

export async function authenticateUser(db: SQLiteDatabase, input: LoginInput): Promise<AuthUser> {
  assertValid(validateLogin(input));
  const row = await db.getFirstAsync<CredentialRow>(
    'SELECT id, name, email, role, status, password_hash, password_salt FROM users WHERE email = ?', normalizeEmail(input.email)
  );
  if (!row || await hashPassword(input.password, row.password_salt) !== row.password_hash) {
    throw new AuthError('E-mail ou senha inválidos.');
  }
  // RN-07: só informar desativação após confirmar a senha.
  if (row.status !== USER_STATUSES.ACTIVE) throw new AuthError('Esta conta está desativada.');
  return toUser(row);
}

export async function saveSession(db: SQLiteDatabase, userId: string): Promise<void> {
  await inTransaction(db, async () => {
    const account = await db.getFirstAsync<{ status: string }>('SELECT status FROM users WHERE id = ?', userId);
    if (account?.status !== USER_STATUSES.ACTIVE) throw new AuthError('Esta conta está desativada ou indisponível.');
    await db.runAsync(
      `INSERT INTO app_session (singleton_id, user_id) VALUES (1, ?)
       ON CONFLICT(singleton_id) DO UPDATE SET user_id = excluded.user_id`, userId
    );
  });
}

export async function restoreSession(db: SQLiteDatabase): Promise<AuthUser | null> {
  // RN-07: restaurar somente a sessão cujo usuário ainda existe e está ativo.
  const session = await db.getFirstAsync<{ user_id: string }>('SELECT user_id FROM app_session WHERE singleton_id = 1');
  if (!session) return null;
  const row = await db.getFirstAsync<UserRow>('SELECT id, name, email, role, status FROM users WHERE id = ?', session.user_id);
  if (!row || row.status !== USER_STATUSES.ACTIVE) { await clearSession(db); return null; }
  return toUser(row);
}

export async function clearSession(db: SQLiteDatabase): Promise<void> {
  await inTransaction(db, async () => { await db.runAsync('DELETE FROM app_session WHERE singleton_id = 1'); });
}

// Revalida a conta real: um contexto antigo não mantém acesso após desativação.
export async function requireActiveUser(db: SQLiteDatabase, actor: AuthUser | null): Promise<AuthUser> {
  requireWritePermission(actor);
  const row = await db.getFirstAsync<UserRow>('SELECT id, name, email, role, status FROM users WHERE id = ?', actor!.id);
  if (!row || row.status !== USER_STATUSES.ACTIVE) throw new PermissionError('Esta conta está desativada ou indisponível.');
  return toUser(row);
}
