import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthError } from '../auth/authTypes';
import { contentError } from '../data/contentValidation';
import { ConfirmationDialog } from './ConfirmationDialog';
import { theme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Confirmation = { title: string; message: string; confirmLabel: string; danger?: boolean; errorMessage: string; onConfirm: () => void | Promise<void> };
type Feedback = { notify: (message: string) => void; confirm: (request: Confirmation) => void };
const Context = createContext<Feedback | null>(null);
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState<{ text: string; id: number } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const notify = useCallback((text: string) => setNotice({ text, id: Date.now() }), []);
  const confirm = useCallback((request: Confirmation) => { if (!lock.current) { setNotice(null); setError(''); setConfirmation(request); } }, []);
  useEffect(() => {
    if (!notice) return;
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(notice.text);
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
  return <Context.Provider value={{ notify, confirm }}>
    <View style={styles.root}>
      {children}
      {notice ? <View style={[styles.banner, { paddingBottom: insets.bottom }]} accessibilityLiveRegion="polite">
        <Text style={styles.notice}>✓ {notice.text}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar mensagem" onPress={() => setNotice(null)} style={styles.close}><Text style={styles.closeText}>Fechar</Text></Pressable>
      </View> : null}
    </View>
    {confirmation ? <ConfirmationDialog visible title={confirmation.title} message={confirmation.message} busy={busy} error={error}
      onCancel={() => setConfirmation(null)} actions={[
        { label: busy ? 'Aguarde...' : confirmation.confirmLabel, onPress: execute, danger: confirmation.danger },
        { label: 'Cancelar', onPress: () => setConfirmation(null), secondary: true }
      ]} /> : null}
  </Context.Provider>;
}
export function useFeedback(): Feedback {
  const value = useContext(Context);
  if (!value) throw new Error('useFeedback requer FeedbackProvider.');
  return value;
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { backgroundColor: theme.colors.successSoft, borderTopWidth: 1, borderColor: theme.colors.success, paddingHorizontal: theme.layout.page, flexDirection: 'row', alignItems: 'center' },
  notice: { flex: 1, color: theme.colors.success, fontSize: theme.typography.label, lineHeight: 22, paddingVertical: theme.spacing.md },
  close: { minHeight: theme.layout.buttonHeight, minWidth: 60, justifyContent: 'center', alignItems: 'center', marginLeft: theme.spacing.sm },
  closeText: { color: theme.colors.success, fontWeight: '700' }
});
