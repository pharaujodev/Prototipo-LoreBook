import { useCallback, useEffect, useRef, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useAuth } from '../auth/AuthContext';
import { createProject, deleteProject, listProjects, updateProject } from '../db/repositories';
import { contentError, ProjectInput } from '../data/contentValidation';
import { useFeedback } from '../components/FeedbackProvider';
import { Project } from '../types';

export function useProjects(db: SQLiteDatabase) {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const locked = useRef(false);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    setLoading(true); setError('');
    try { const rows = await listProjects(db, user); if (current === request.current) setProjects(rows); }
    catch (failure) { if (current === request.current) setError(contentError(failure, 'Não foi possível carregar suas obras. Tente novamente.')); }
    finally { if (current === request.current) setLoading(false); }
  }, [db, user]);
  useEffect(() => { void refresh(); return () => { request.current++; }; }, [refresh]);
  const save = async (input: ProjectInput, id?: string): Promise<Project | null> => {
    if (locked.current) return null;
    locked.current = true; setSaving(true); setFormError('');
    try {
      const result = id ? await updateProject(db, user, id, input) : await createProject(db, user, input);
      request.current++; setLoading(false); setError('');
      setProjects((current) => id ? current.map((item) => item.id === id ? result : item) : [...current, result]);
      // Recarrega o acervo completo se a criação aconteceu durante a carga inicial.
      void refresh();
      notify(id ? 'Obra atualizada.' : 'Obra criada com sucesso.');
      return result;
    } catch (failure) { setFormError(contentError(failure, 'Não foi possível salvar a obra. Seus campos foram mantidos.')); return null; }
    finally { locked.current = false; setSaving(false); }
  };
  const remove = async (id: string) => {
    if (locked.current) throw new Error('Aguarde a operação em andamento.');
    locked.current = true; setSaving(true);
    try {
      await deleteProject(db, user, id);
      request.current++; setLoading(false); setError('');
      setProjects((current) => current.filter((item) => item.id !== id));
      notify('Obra e capítulos excluídos.');
    } finally { locked.current = false; setSaving(false); }
  };
  return { projects, loading, error, refresh, save, remove, saving, formError, isBusy: () => locked.current, clearFormError: () => setFormError('') };
}
