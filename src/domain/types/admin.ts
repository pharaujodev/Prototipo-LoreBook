import type { AuthUser } from '../auth/authTypes';

export type AdminUser = AuthUser & { projectCount: number };
// Contrato administrativo independente do manuscrito e de seus capítulos.
export type AdminProjectMetadata = {
  id: string;
  title: string;
  genre: string;
  chapters: number;
  progress: number;
  updatedAt: string;
};
export type AdminUserDetail = { user: AdminUser; projects: AdminProjectMetadata[] };
export type DatabaseDiagnostics = { projects: number; chapters: number; users: number; unownedProjects: number };
