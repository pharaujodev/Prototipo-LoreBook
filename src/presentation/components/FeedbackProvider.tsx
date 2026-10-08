import React, { useEffect } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FeedbackContext, useFeedbackState } from '../../application/contexts/FeedbackContext';
import { ConfirmationDialog } from './ConfirmationDialog';
import { theme } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { notice, confirmation, busy, error, notify, confirm, execute, dismissNotice, cancelConfirmation } = useFeedbackState();
  useEffect(() => {
    if (notice && Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(notice.text);
  }, [notice]);
  return <FeedbackContext.Provider value={{ notify, confirm }}>
    <View style={styles.root}>
      {children}
      {notice ? <View style={[styles.banner, { paddingBottom: insets.bottom }]} accessibilityLiveRegion="polite">
        <Text style={styles.notice}>✓ {notice.text}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar mensagem" onPress={dismissNotice} style={styles.close}><Text style={styles.closeText}>Fechar</Text></Pressable>
      </View> : null}
    </View>
    {confirmation ? <ConfirmationDialog visible title={confirmation.title} message={confirmation.message} busy={busy} error={error}
      onCancel={cancelConfirmation} actions={[
        { label: busy ? 'Aguarde...' : confirmation.confirmLabel, onPress: execute, danger: confirmation.danger },
        { label: 'Cancelar', onPress: cancelConfirmation, secondary: true }
      ]} /> : null}
  </FeedbackContext.Provider>;
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { backgroundColor: theme.colors.successSoft, borderTopWidth: 1, borderColor: theme.colors.success, paddingHorizontal: theme.layout.page, flexDirection: 'row', alignItems: 'center' },
  notice: { flex: 1, color: theme.colors.success, fontSize: theme.typography.label, lineHeight: 22, paddingVertical: theme.spacing.md },
  close: { minHeight: theme.layout.buttonHeight, minWidth: 60, justifyContent: 'center', alignItems: 'center', marginLeft: theme.spacing.sm },
  closeText: { color: theme.colors.success, fontWeight: '700' }
});
