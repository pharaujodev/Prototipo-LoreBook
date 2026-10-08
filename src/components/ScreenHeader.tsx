import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
};

export function ScreenHeader({ title, subtitle, canGoBack, onBack, rightLabel, onRightPress }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {canGoBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightLabel ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Configurações" onPress={onRightPress} style={styles.rightButton}>
            <Text style={styles.rightText}>{rightLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  backText: { fontSize: 30, lineHeight: 31, color: theme.colors.primary },
  titleWrap: { flex: 1 },
  title: { fontSize: 26, fontFamily: theme.font.editorial, color: theme.colors.text },
  subtitle: { marginTop: 3, fontSize: 13, color: theme.colors.textMuted },
  rightButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.primarySoft, borderRadius: 12 },
  rightText: { color: theme.colors.primary, fontWeight: '700' }
});
