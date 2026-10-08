import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';
import { Character } from '../../domain/types/content';
import { FeedbackState } from '../components/FeedbackState';

export function CharactersScreen({ characters, onOpenCharacter }: { characters: Character[]; onOpenCharacter: (id: string) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {characters.length === 0 ? <FeedbackState kind="empty" title="Quem habita sua história?" message="Ainda não há fichas nesta obra. A criação de personagens estará disponível em uma próxima etapa." /> : null}
      {characters.map((character) => (
        <Pressable key={character.id} accessibilityRole="button" accessibilityLabel={'Abrir ficha de ' + character.name} style={styles.card} onPress={() => onOpenCharacter(character.id)}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{character.name.charAt(0)}</Text></View>
          <View style={styles.body}>
            <Text style={styles.name}>{character.name}</Text>
            <Text style={styles.role}>{character.role}</Text>
            <Text style={styles.summary} numberOfLines={2}>{character.summary}</Text>
          </View>
        </Pressable>
      ))}
      <View style={styles.addButton}><Text style={styles.addText}>Novas fichas · em breve</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 30 },
  card: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 21, fontWeight: '900', color: theme.colors.primary },
  body: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  role: { fontSize: 11, fontWeight: '700', color: theme.colors.accent, marginTop: 2 },
  summary: { fontSize: 12, color: theme.colors.textMuted, lineHeight: 17, marginTop: 6 },
  addButton: { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.accent, padding: 15, borderRadius: theme.radius.md, alignItems: 'center' },
  addText: { color: theme.colors.primary, fontWeight: '800' }
});
