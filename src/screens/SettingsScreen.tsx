import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function SettingsScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.card}><Text style={styles.title}>Aparência</Text><Text style={styles.text}>Tema claro • configuração simulada</Text></View>
      <View style={styles.card}><Text style={styles.title}>Backup</Text><Text style={styles.text}>Checkpoint local • configuração simulada</Text></View>
      <View style={styles.card}><Text style={styles.title}>Sobre</Text><Text style={styles.text}>LoreBook • protótipo mobile 0.1</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  title: { fontWeight: '800', color: theme.colors.text },
  text: { color: theme.colors.textMuted, marginTop: 5, fontSize: 12 }
});
