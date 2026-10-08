import { PermissionError } from '../permissions/permissions';

export const TITLE_MAX_LENGTH = 80;
export const GENRE_MAX_LENGTH = 40;
export type ProjectInput = { title: string; genre?: string };
export class ContentValidationError extends Error {}

// RN-15/16: título curto também pode ser literário; de 1 a 80 caracteres após trim.
export function validateTitle(value: string): string | null {
  if (!value.trim()) return 'Informe um título.';
  if (value.trim().length > TITLE_MAX_LENGTH) return `Use até ${TITLE_MAX_LENGTH} caracteres no título.`;
  return null;
}
export function normalizeTitle(value: string): string {
  const error = validateTitle(value);
  if (error) throw new ContentValidationError(error);
  return value.trim();
}
export function normalizeProject(input: ProjectInput): Required<ProjectInput> {
  const title = normalizeTitle(input.title);
  const genre = input.genre?.trim() ?? '';
  if (genre.length > GENRE_MAX_LENGTH) throw new ContentValidationError(`Use até ${GENRE_MAX_LENGTH} caracteres no gênero.`);
  return { title, genre };
}
export function contentError(error: unknown, fallback: string): string {
  return error instanceof ContentValidationError || error instanceof PermissionError ? error.message : fallback;
}
