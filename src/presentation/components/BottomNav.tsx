import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

type Tab = 'home' | 'chapters' | 'characters' | 'bible' | 'notes';

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

const items: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'home', label: 'Obra', icon: '⌂' },
  { key: 'chapters', label: 'Capítulos', icon: '☰' },
  { key: 'characters', label: 'Fichas', icon: '♙' },
  { key: 'bible', label: 'Bíblia', icon: '◇' },
  { key: 'notes', label: 'Notas', icon: '✎' }
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <View style={styles.root}>
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Pressable accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={item.label} key={item.key} style={[styles.item, selected && styles.activeItem]} onPress={() => onChange(item.key)}>
            <Text style={[styles.icon, selected && styles.selected]}>{item.icon}</Text>
            <Text style={[styles.label, selected && styles.selected]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    gap: theme.spacing.xs
  },
  item: { flex: 1, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  icon: { fontSize: 19, color: theme.colors.textMuted },
  label: { fontSize: 11, marginTop: 3, color: theme.colors.textMuted, fontWeight: '600' },
  activeItem: { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.sm, borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  selected: { color: theme.colors.primary }
});
