import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
};

export function FeatureCard({ icon, title, description, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title + '. ' + description} style={({ pressed }) => [styles.card, pressed && { backgroundColor: theme.colors.primarySoft }]} onPress={onPress}>
      <View style={styles.iconBox}><Text style={styles.icon}>{icon}</Text></View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 80, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.lg, marginBottom: theme.spacing.sm },
  iconBox: { width: 44, height: 44, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22, color: theme.colors.primary },
  content: { flex: 1, marginLeft: 12 },
  title: { fontSize: 20, fontFamily: theme.font.editorial, color: theme.colors.text },
  description: { fontSize: theme.typography.label, marginTop: theme.spacing.xs, color: theme.colors.textMuted, lineHeight: 21 },
  arrow: { fontSize: 26, color: theme.colors.accent }
});
