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
    <Pressable style={styles.card} onPress={onPress}>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, marginBottom: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22, color: theme.colors.primary },
  content: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  description: { fontSize: 12, marginTop: 3, color: theme.colors.textMuted, lineHeight: 17 },
  arrow: { fontSize: 26, color: theme.colors.accent }
});
