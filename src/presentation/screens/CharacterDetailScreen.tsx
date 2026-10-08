import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Character } from '../../domain/types/content';
import { theme } from '../../theme';

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.blockText}>{text}</Text>
    </View>
  );
}

export function CharacterDetailScreen({ character }: { character: Character }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{character.name.charAt(0)}</Text></View>
        <View style={styles.identityText}>
          <Text style={styles.name}>{character.name}</Text>
          <Text style={styles.role}>{character.role} • {character.age}</Text>
        </View>
      </View>
      <InfoBlock title="Resumo" text={character.summary} />
      <InfoBlock title="Objetivo" text={character.goal} />
      <InfoBlock title="Conflito" text={character.conflict} />
      <View style={styles.relationHint}>
        <Text style={styles.relationTitle}>Relações</Text>
        <Text style={styles.relationText}>Área reservada para vínculos importantes entre personagens.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  identity: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, color: theme.colors.white, fontWeight: '900' },
  identityText: { marginLeft: 14, flex: 1 },
  name: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  role: { color: theme.colors.textMuted, marginTop: 4 },
  block: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  blockTitle: { color: theme.colors.primary, fontWeight: '800', fontSize: 13 },
  blockText: { color: theme.colors.text, lineHeight: 21, marginTop: 7, fontSize: 14 },
  relationHint: { padding: 16, borderRadius: theme.radius.md, backgroundColor: theme.colors.primarySoft },
  relationTitle: { color: theme.colors.primary, fontWeight: '800' },
  relationText: { color: theme.colors.textMuted, fontSize: 12, marginTop: 6 }
});
