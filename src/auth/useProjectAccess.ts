import { useRef, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useAuth } from './AuthContext';
import { canEditProject, PermissionError } from './permissions';
import { getProjectForUser } from '../db/repositories';
import { getProjectAsAdmin } from '../admin/adminRepository';
import type { Project } from '../types';

// Estado do contexto de obra + feedback; App apenas coordena a navegação.
export function useProjectAccess(db: SQLiteDatabase) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [administrative, setAdministrative] = useState(false);
  const [opening, setOpening] = useState(false);
  const [accessError, setAccessError] = useState('');
  const request = useRef(0);
  const open = async (id: string, asAdmin = false) => {
    const current = ++request.current;
    setOpening(true); setAccessError('');
    try {
      const result = asAdmin ? await getProjectAsAdmin(db, user, id) : await getProjectForUser(db, id, user);
      if (current !== request.current) return null;
      setProject(result); setAdministrative(asAdmin);
      return result;
    } catch (failure) {
      if (current === request.current) setAccessError(failure instanceof PermissionError ? failure.message : 'Não foi possível abrir esta obra. Tente novamente.');
      return null;
    } finally { if (current === request.current) setOpening(false); }
  };
  const requireProjectWrite = () => {
    const allowed = !administrative && !!project && canEditProject(user, project.ownerUserId);
    if (!allowed) setAccessError('Esta obra não está disponível para edição neste contexto.');
    return allowed;
  };
  const clear = () => { request.current++; setProject(null); setAdministrative(false); setAccessError(''); setOpening(false); };
  return { project, administrative, opening, accessError, open, requireProjectWrite, clear };
}
