import { useRef, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useAuth } from '../contexts/AuthContext';
import { canEditProject, PermissionError } from '../../domain/permissions/permissions';
import { getProjectForUser } from '../../data/repositories/contentRepository';
import type { Project } from '../../domain/types/content';

// Estado do contexto de obra + feedback; App apenas coordena a navegação.
export function useProjectAccess(db: SQLiteDatabase) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [opening, setOpening] = useState(false);
  const [accessError, setAccessError] = useState('');
  const request = useRef(0);
  const open = async (id: string) => {
    const current = ++request.current;
    setOpening(true); setAccessError('');
    try {
      const result = await getProjectForUser(db, id, user);
      if (current !== request.current) return null;
      setProject(result);
      return result;
    } catch (failure) {
      if (current === request.current) setAccessError(failure instanceof PermissionError ? failure.message : 'Não foi possível abrir esta obra. Tente novamente.');
      return null;
    } finally { if (current === request.current) setOpening(false); }
  };
  const requireProjectWrite = () => {
    const allowed = !!project && canEditProject(user, project.ownerUserId);
    if (!allowed) setAccessError('Esta obra não está disponível para edição neste contexto.');
    return allowed;
  };
  const clear = () => { request.current++; setProject(null); setAccessError(''); setOpening(false); };
  return { project, opening, accessError, open, requireProjectWrite, clear };
}
