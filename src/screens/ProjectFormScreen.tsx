import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppField } from '../components/FormControls';
import { GENRE_MAX_LENGTH, ProjectInput, TITLE_MAX_LENGTH, validateTitle } from '../data/contentValidation';
import { Project } from '../types';
import { theme } from '../theme';

type Props = { project?: Project; saving: boolean; error: string; onSave: (input: ProjectInput) => void; onCancel: () => void; onDirtyChange: (dirty: boolean) => void };
export function ProjectFormScreen({ project, saving, error, onSave, onCancel, onDirtyChange }: Props) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [genre, setGenre] = useState(project?.genre ?? '');
  const [validation, setValidation] = useState('');
  useEffect(() => { onDirtyChange(title !== (project?.title ?? '') || genre !== (project?.genre ?? '')); }, [title, genre, project, onDirtyChange]);
  const submit = () => {
    if (saving) return;
    const message = validateTitle(title);
    setValidation(message ?? '');
    if (!message) onSave({ title, genre });
  };
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.sheet}>
        <Text style={styles.eyebrow}>{project ? 'DADOS DA OBRA' : 'UMA HISTÓRIA PARA CHAMAR DE SUA'}</Text>
        <Text style={styles.title}>{project ? 'Ajuste a capa.' : 'Tudo começa com um título.'}</Text>
        <Text style={styles.help}>{project ? 'Título e gênero podem mudar conforme sua história cresce.' : 'Sua obra será guardada na sua biblioteca pessoal, neste dispositivo.'}</Text>
        <AppField label="Título da obra" value={title} onChangeText={setTitle} maxLength={TITLE_MAX_LENGTH} editable={!saving} placeholder="Ex.: Um mapa para o amanhã" hint={`${title.length}/${TITLE_MAX_LENGTH} caracteres · obrigatório`} />
        <AppField label="Gênero (opcional)" value={genre} onChangeText={setGenre} maxLength={GENRE_MAX_LENGTH} editable={!saving} placeholder="Ex.: Fantasia, conto, romance" returnKeyType="done" onSubmitEditing={submit} />
        {validation || error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{validation || error}</Text> : null}
        <AppButton label={saving ? 'Salvando obra...' : project ? 'Salvar alterações' : 'Criar obra'} busy={saving} onPress={submit} />
        <AppButton label="Cancelar" secondary disabled={saving} onPress={onCancel} />
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: theme.layout.page, paddingBottom: theme.spacing.xxl },
  sheet: { width: '100%', maxWidth: theme.layout.formWidth, alignSelf: 'center', padding: theme.spacing.xl, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  eyebrow: { color: theme.colors.accent, fontSize: theme.typography.caption, letterSpacing: 1, fontWeight: '700' },
  title: { color: theme.colors.text, fontSize: theme.typography.heading, fontFamily: theme.font.editorial, marginTop: theme.spacing.lg },
  help: { color: theme.colors.textMuted, fontSize: theme.typography.label, lineHeight: 22, marginTop: theme.spacing.md },
  error: { color: theme.colors.danger, fontSize: theme.typography.label, lineHeight: 22, marginTop: theme.spacing.lg }
});
