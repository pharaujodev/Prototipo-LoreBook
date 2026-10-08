import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackState } from '../components/FeedbackState';
import appConfig from '../../app.json';
import { theme } from '../theme';

export function SettingsScreen() {
  const [preview, setPreview] = useState<'loading' | 'empty' | 'error' | 'success'>('empty');
  const examples = {
    loading: { title: 'Abrindo sua história', message: 'Reunindo os capítulos e preparando seu espaço de escrita.' },
    empty: { title: 'Sua primeira página espera', message: 'Uma cena, uma voz, uma ideia. Todo manuscrito começa com um primeiro capítulo.' },
    error: { title: 'Uma pausa inesperada', message: 'Não conseguimos carregar os capítulos. Você pode tentar novamente.' },
    success: { title: 'Mais uma página guardada', message: 'O texto e o status do capítulo foram salvos no dispositivo.' }
  };
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.card}><Text style={styles.title}>LoreBook · v2 hotfix</Text><Text style={styles.text}>Versão {appConfig.expo.version} · inspirado no Ateliê Desktop.</Text><Text style={styles.text}>Capítulos salvos neste dispositivo. Notas temporárias; fichas e bíblia demonstrativas. Backup ainda indisponível.</Text></View>
      <View style={styles.card}>
        <Text style={styles.title}>Prévia dos estados</Text>
        <Text style={styles.text}>Demonstração visual do protótipo. Os exemplos abaixo não alteram suas obras.</Text>
        <View style={styles.options}>
          {(['loading', 'empty', 'error', 'success'] as const).map((kind) => <Pressable key={kind} accessibilityRole="tab" accessibilityState={{ selected: preview === kind }} onPress={() => setPreview(kind)} style={[styles.option, preview === kind && styles.active]}>
            <Text style={[styles.optionText, preview === kind && styles.activeText]}>{ { loading: 'Carregando', empty: 'Vazio', error: 'Erro', success: 'Sucesso' }[kind]}</Text>
          </Pressable>)}
        </View>
      </View>
      <View style={styles.preview}>
        <FeedbackState kind={preview} {...examples[preview]}
          actionLabel={preview === 'error' ? 'Simular nova tentativa' : undefined}
          onAction={preview === 'error' ? () => setPreview('loading') : undefined} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, paddingBottom: 36 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  title: { fontWeight: '800', color: theme.colors.text },
  text: { color: theme.colors.textMuted, marginTop: 5, fontSize: 12, lineHeight: 19 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  option: { paddingHorizontal: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: theme.colors.surfaceMuted },
  active: { backgroundColor: theme.colors.primary },
  optionText: { color: theme.colors.text, fontSize: 12 },
  activeText: { color: theme.colors.white },
  preview: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg }
});
