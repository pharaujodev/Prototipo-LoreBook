import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthError } from '../../domain/auth/authTypes';
import { contentError } from '../../domain/validation/contentValidation';

type Confirmation = { title: string; message: string; confirmLabel: string; danger?: boolean; errorMessage: string; onConfirm: () => void | Promise<void> };
type Feedback = { notify: (message: string) => void; confirm: (request: Confirmation) => void };
export const FeedbackContext = createContext<Feedback | null>(null);

export function useFeedbackState() {
  const [notice, setNotice] = useState<{ text: string; id: number } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const notify = useCallback((text: string) => setNotice({ text, id: Date.now() }), []);
  const confirm = useCallback((request: Confirmation) => { if (!lock.current) { setNotice(null); setError(''); setConfirmation(request); } }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  const execute = async () => {
    if (!confirmation || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await confirmation.onConfirm(); setConfirmation(null); }
    catch (failure) { setError(failure instanceof AuthError ? failure.message : contentError(failure, confirmation.errorMessage)); }
    finally { lock.current = false; setBusy(false); }
  };
  return { notice, confirmation, busy, error, notify, confirm, execute,
    dismissNotice: () => setNotice(null), cancelConfirmation: () => setConfirmation(null) };
}

export function useFeedback(): Feedback {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback requer FeedbackProvider.');
  return value;
}
