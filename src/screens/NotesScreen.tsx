import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  notes: string;
  onChangeNotes: (value: string) => void;
};

export function NotesScreen({ notes, onChangeNotes }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Espaço de planejamento</Text>
        <Text style={styles.bannerText}>Ideias fora do manuscrito. Neste protótipo, as notas ficam apenas nesta sessão.</Text>
      </View>
      <TextInput accessibilityLabel="Notas da obra" placeholder="Uma ideia, uma pergunta, uma cena… Sua próxima descoberta pode começar aqui." placeholderTextColor={theme.colors.textMuted} multiline value={notes} onChangeText={onChangeNotes} textAlignVertical="top" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  banner: { backgroundColor: theme.colors.primarySoft, padding: 14, borderRadius: theme.radius.md, marginBottom: 14 },
  bannerTitle: { fontWeight: '800', color: theme.colors.primary },
  bannerText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, color: theme.colors.text, fontSize: 15, lineHeight: 24 }
});
