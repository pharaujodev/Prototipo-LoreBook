import type { AuthUser } from '../auth/authTypes';
import type { Project } from './content';

export type AdminUser = AuthUser & { projectCount: number };
export type AdminUserDetail = { user: AdminUser; projects: Project[] };
export type DatabaseDiagnostics = { projects: number; chapters: number; users: number; unownedProjects: number };
