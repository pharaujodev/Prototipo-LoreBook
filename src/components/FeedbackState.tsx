import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  kind: 'loading' | 'empty' | 'error' | 'success';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function FeedbackState({ kind, title, message, actionLabel, onAction, compact = false }: Props) {
  const label = { loading: 'UM INSTANTE', empty: 'UM NOVO COMEÇO', error: 'UMA PAUSA NO CAMINHO', success: 'TUDO GUARDADO' }[kind];
  return (
    <View style={[styles.root, compact && styles.compact]} accessibilityLiveRegion="polite" accessibilityState={{ busy: kind === 'loading' }}>
      {!compact ? <View style={styles.illustration} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.orbit} />
        <View style={styles.backPage} />
        <View style={styles.page}>
          <View style={styles.bookmark} />
          <Text style={styles.monogram}>L</Text>
          <View style={styles.line} /><View style={styles.line} /><View style={[styles.line, styles.shortLine]} />
        </View>
        <View style={[styles.seal, kind === 'error' && styles.errorSeal, kind === 'success' && styles.successSeal]}>
          {kind === 'loading' ? <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Carregando" /> :
            <Text style={[styles.sealText, kind === 'error' && styles.errorText, kind === 'success' && styles.successText]}>{kind === 'error' ? '!' : kind === 'success' ? '✓' : '+'}</Text>}
        </View>
      </View> : kind === 'loading' ? <ActivityIndicator color={theme.colors.primary} /> : null}
      <Text style={styles.eyebrow}>{label}</Text>
      <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
      <Text accessibilityRole={kind === 'error' ? 'alert' : undefined} style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {!compact ? <><View style={styles.divider} /><Text style={styles.signature}>LOREBOOK · BIBLIOTECA DE HISTÓRIAS</Text></> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { paddingVertical: theme.spacing.xl, paddingHorizontal: theme.spacing.lg },
  compactTitle: { fontSize: 23, lineHeight: 29 },
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center'
  },
  illustration: { width: 180, height: 156, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  orbit: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: theme.colors.surfaceMuted },
  backPage: { position: 'absolute', width: 92, height: 114, backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, transform: [{ rotate: '-12deg' }], left: 35, top: 22 },
  page: { width: 92, height: 116, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 6, padding: 16, transform: [{ rotate: '6deg' }] },
  bookmark: { position: 'absolute', right: 12, top: -1, width: 12, height: 24, backgroundColor: theme.colors.primary, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  monogram: { fontFamily: theme.font.editorial, color: theme.colors.primary, fontSize: 32, marginBottom: 8 },
  line: { height: 2, backgroundColor: theme.colors.border, marginBottom: 7, width: '100%' },
  shortLine: { width: '65%' },
  seal: { position: 'absolute', right: 16, bottom: 8, width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: theme.colors.background, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  errorSeal: { backgroundColor: theme.colors.dangerSoft },
  successSeal: { backgroundColor: theme.colors.successSoft },
  sealText: { fontSize: 25, color: theme.colors.primary },
  errorText: { color: theme.colors.danger, fontWeight: '800' },
  successText: { color: theme.colors.success },
  eyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.8, textAlign: 'center' },
  title: { color: theme.colors.text, fontFamily: theme.font.editorial, fontSize: 27, lineHeight: 33, marginTop: 12, textAlign: 'center' },
  message: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 12, textAlign: 'center', maxWidth: 310 },
  divider: { width: 32, height: 1, backgroundColor: theme.colors.border, marginTop: 26, marginBottom: 14 },
  signature: { fontSize: 9, letterSpacing: 1.2, color: theme.colors.textMuted, textAlign: 'center' },
  action: {
    marginTop: 18,
    minHeight: 46,
    minWidth: 150,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionText: { color: theme.colors.white, fontWeight: '800' }
});
