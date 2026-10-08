import { AuthError, LoginInput, RegisterInput, USER_ROLES, UserRole } from '../auth/authTypes';

export function isUserRole(value: unknown): value is UserRole {
  return value === USER_ROLES.ADMIN || value === USER_ROLES.USER;
}

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export function validateLogin(input: LoginInput): string | null {
  if (!input.email.trim() || !input.password) return 'E-mail e senha são obrigatórios.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(input.email))) return 'Informe um e-mail válido.';
  return null;
}

export function validateRegistration(input: RegisterInput): string | null {
  if (!input.name.trim()) return 'Informe seu nome.';
  const loginError = validateLogin(input);
  if (loginError) return loginError;
  if (input.password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
  if (input.password !== input.confirmPassword) return 'As senhas não coincidem.';
  return null;
}

export function assertValid(message: string | null): void {
  if (message) throw new AuthError(message);
}
