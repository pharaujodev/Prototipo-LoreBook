export const USER_ROLES = { ADMIN: 'ADMIN', USER: 'USER' } as const;
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export const USER_STATUSES = { ACTIVE: 'ACTIVE', DISABLED: 'DISABLED' } as const;
export type UserStatus = typeof USER_STATUSES[keyof typeof USER_STATUSES];
export const statusLabels: Record<UserStatus, string> = { ACTIVE: 'Ativo', DISABLED: 'Desativado' };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface LoginInput { email: string; password: string }
export interface RegisterInput extends LoginInput {
  name: string;
  confirmPassword: string;
}

export const roleLabels: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.USER]: 'Usuário'
};

export class AuthError extends Error {}
