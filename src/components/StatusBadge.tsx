import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChapterStatus } from '../types';
import { theme } from '../theme';

export function StatusBadge({ status }: { status: ChapterStatus }) {
  return <View style={[styles.badge, status === 'Concluído' ? styles.done : status === 'Revisão' ? styles.review : styles.draft]}>
    <Text style={styles.text}>{status === 'Revisão' ? 'Em revisão' : status}</Text>
  </View>;
}
const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radius.sm, marginTop: theme.spacing.sm },
  text: { fontSize: theme.typography.caption, fontWeight: '600', color: theme.colors.text },
  done: { backgroundColor: theme.colors.successSoft }, review: { backgroundColor: theme.colors.warningSoft }, draft: { backgroundColor: theme.colors.surfaceMuted }
});
