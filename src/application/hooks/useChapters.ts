import { useCallback, useRef, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { listChapters, createChapter, saveChapter, deleteChapter } from '../../data/repositories/contentRepository';
import { listChaptersAsAdmin } from '../../data/repositories/adminRepository';
import { ChapterDraft, draftFromChapter, hasUnsavedChanges } from '../../domain/validation/chapterDraft';
import { contentError } from '../../domain/validation/contentValidation';
import { PermissionError } from '../../domain/permissions/permissions';
import { Chapter } from '../../domain/types/content';

// Estado do manuscrito: consultas, rascunho, bloqueio de duplo envio e mutações.
export function useChapters(db: SQLiteDatabase, projectId: string | undefined, administrative: boolean, requireWrite: () => boolean) {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, ChapterDraft>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [createError, setCreateError] = useState('');
  const locked = useRef(false);
  const request = useRef(0);
  const selected = chapters.find((item) => item.id === selectedId);
  const draft = selected ? drafts[selected.id] ?? draftFromChapter(selected) : undefined;
  const dirty = !!selected && hasUnsavedChanges(selected, draft);
  const load = useCallback(async (id: string, asAdmin = administrative) => {
    const current = ++request.current;
    setLoading(true); setError(''); setChapters([]); setSelectedId('');
    try {
      const result = asAdmin ? await listChaptersAsAdmin(db, user, id) : await listChapters(db, id, user);
      if (current === request.current) setChapters(result);
    } catch (failure) { if (current === request.current) setError(contentError(failure, 'Não foi possível carregar os capítulos. Tente novamente.')); }
    finally { if (current === request.current) setLoading(false); }
  }, [db, user, administrative]);
  const select = (id: string) => {
    if (locked.current) return;
    setSelectedId(id); setSaveError('');
  };
  const change = (value: Partial<ChapterDraft>) => {
    if (!requireWrite() || !selected || !draft || locked.current) return;
    setDrafts((current) => ({ ...current, [selected.id]: { ...(current[selected.id] ?? draftFromChapter(selected)), ...value } })); setSaveError('');
  };
  const create = async (title: string) => {
    if (!projectId || !requireWrite() || locked.current) return false;
    locked.current = true; setBusy(true); setCreateError('');
    try {
      const chapter = await createChapter(db, projectId, title, user);
      setChapters((current) => [...current, chapter]); setSelectedId(chapter.id); setSaveError('');
      notify('Capítulo criado. Pronto para escrever.'); return true;
    } catch (failure) { setCreateError(contentError(failure, 'Não foi possível criar o capítulo. Tente novamente.')); return false; }
    finally { locked.current = false; setBusy(false); }
  };
  const save = async () => {
    if (!projectId || !selected || !draft || !requireWrite() || locked.current) return false;
    locked.current = true; setBusy(true); setSaveError('');
    try {
      const words = await saveChapter(db, projectId, selected.id, draft, user);
      const saved = { ...selected, ...draft, title: (draft.title ?? selected.title).trim(), words };
      setChapters((current) => current.map((item) => item.id === selected.id ? saved : item));
      setDrafts((current) => { const next = { ...current }; delete next[selected.id]; return next; });
      notify('Capítulo salvo.'); return true;
    } catch (failure) { setSaveError(contentError(failure, 'Não foi possível salvar. Seu texto continua aqui.')); return false; }
    finally { locked.current = false; setBusy(false); }
  };
  const discard = () => {
    if (!selected || locked.current) return;
    setDrafts((current) => { const next = { ...current }; delete next[selected.id]; return next; }); setSaveError('');
  };
  const remove = async () => {
    if (!projectId || !selected || !requireWrite()) throw new PermissionError('Este capítulo não está disponível para edição.');
    if (locked.current) throw new Error('Aguarde a operação em andamento.');
    locked.current = true; setBusy(true);
    try {
      await deleteChapter(db, projectId, selected.id, user);
      setChapters((current) => current.filter((item) => item.id !== selected.id));
      setDrafts((current) => { const next = { ...current }; delete next[selected.id]; return next; });
      setSelectedId(''); setSaveError(''); notify('Capítulo excluído.');
    } finally { locked.current = false; setBusy(false); }
  };
  const reset = () => { request.current++; setChapters([]); setSelectedId(''); setDrafts({}); setSaveError(''); setError(''); setLoading(false); };
  return { chapters, loading, error, load, selected, draft, dirty, select, change, create, save, remove, discard, reset, busy, saveError, createError,
    isBusy: () => locked.current, clearCreateError: () => setCreateError('') };
}
