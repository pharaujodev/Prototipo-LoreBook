import { AuthUser, USER_ROLES, USER_STATUSES, UserStatus } from '../auth/authTypes';

export const ADMIN_ONLY_MESSAGE = 'Seu perfil não possui acesso a esta área.';
export const SIGN_IN_REQUIRED_MESSAGE = 'Entre na sua conta para alterar conteúdo.';
type User = Pick<AuthUser, 'role' | 'status'> | null;

export function canWriteContent(user: User): boolean {
  return user?.status === USER_STATUSES.ACTIVE && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.USER);
}
export const canCreateChapter = canWriteContent;
export const canEditChapter = canWriteContent;
export const canDeleteContent = canWriteContent;

// RN-06: somente ADMIN ativo acessa funcionalidades administrativas.
export function canAccessAdminPanel(user: User): boolean { return user?.status === USER_STATUSES.ACTIVE && user.role === USER_ROLES.ADMIN; }
export const canAccessDatabaseDiagnostics = canAccessAdminPanel;
export const canViewUsers = canAccessAdminPanel;
export const canManageUsers = canAccessAdminPanel;
export const canViewProjectMetadata = canAccessAdminPanel;

// RN-05/06: conteúdo é exclusivo do proprietário, inclusive para ADMIN.
export function canAccessProject(user: AuthUser | null, ownerUserId: string | null): boolean {
  return canWriteContent(user) && user?.id === ownerUserId;
}
export function canEditProject(user: AuthUser | null, ownerUserId: string | null): boolean {
  return canAccessProject(user, ownerUserId);
}
export function canChangeUserStatus(actor: AuthUser | null, target: AuthUser): boolean {
  return canManageUsers(actor) && actor?.id !== target.id && target.role === USER_ROLES.USER;
}

// RN-08/09: política central também aplicada dentro da transação administrativa.
export function assertStatusChange(actor: AuthUser, target: AuthUser, next: UserStatus, activeAdmins: number): void {
  requireAdminPermission(actor);
  if (next !== USER_STATUSES.ACTIVE && next !== USER_STATUSES.DISABLED) throw new PermissionError('Status inválido.');
  if (next === USER_STATUSES.DISABLED) {
    if (actor.id === target.id) throw new PermissionError('Você não pode desativar a própria conta.');
    if (canAccessAdminPanel(target) && activeAdmins <= 1) throw new PermissionError('É necessário manter pelo menos um Administrador ativo.');
  }
  if (target.role !== USER_ROLES.USER) throw new PermissionError('Neste protótipo, apenas contas de Usuário podem ser ativadas ou desativadas.');
}

export class PermissionError extends Error {
  constructor(message = ADMIN_ONLY_MESSAGE) { super(message); }
}

export function requireWritePermission(user: User): void {
  if (!canWriteContent(user)) throw new PermissionError(SIGN_IN_REQUIRED_MESSAGE);
}

export function requireAdminPermission(user: User): void {
  if (!canAccessAdminPanel(user)) throw new PermissionError();
}
