import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { BibleEntry } from '../types';

export function BibleScreen({ entries }: { entries: BibleEntry[] }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <Text style={styles.category}>{entry.category.toUpperCase()}</Text>
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={styles.text}>{entry.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 30 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  category: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: theme.colors.accent },
  title: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginTop: 6 },
  text: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 19, marginTop: 8 }
});
