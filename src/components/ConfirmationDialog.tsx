import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from './FormControls';
import { theme } from '../theme';

type Action = { label: string; onPress: () => void; danger?: boolean; secondary?: boolean };
export function ConfirmationDialog({ visible, title, message, busy = false, error, actions, onCancel }: {
  visible: boolean; title: string; message: string; busy?: boolean; error?: string; actions: Action[]; onCancel: () => void;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
    <SafeAreaView style={styles.scrim}>
      <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.eyebrow}>LOREBOOK / CONFIRMAÇÃO</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
          {actions.map((action, index) => <AppButton key={action.label} {...action} disabled={busy} busy={busy && index === 0} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: theme.colors.scrim },
  center: { flexGrow: 1, justifyContent: 'center', padding: theme.layout.page },
  card: { width: '100%', maxWidth: theme.layout.formWidth, alignSelf: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg },
  eyebrow: { fontSize: theme.typography.caption, color: theme.colors.accent, letterSpacing: 1, fontWeight: '700' },
  title: { fontSize: theme.typography.heading, fontFamily: theme.font.editorial, color: theme.colors.text, marginTop: theme.spacing.lg },
  message: { fontSize: theme.typography.body, color: theme.colors.textMuted, lineHeight: theme.typography.lineHeight, marginVertical: theme.spacing.lg },
  error: { color: theme.colors.danger, fontSize: theme.typography.label, lineHeight: 22 }
});
