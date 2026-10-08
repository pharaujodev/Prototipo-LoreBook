import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  visible: boolean;
  saving: boolean;
  error: string;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function UnsavedChangesModal({ visible, saving, error, onStay, onDiscard, onSave }: Props) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!saving) onStay(); }}>
    <View style={styles.scrim}>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.eyebrow}>ANTES DE VIRAR A PÁGINA</Text>
          <Text style={styles.title} accessibilityRole="header">Guardar suas alterações?</Text>
          <Text style={styles.message}>O texto e o status deste capítulo ainda têm alterações não salvas.</Text>
          {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={saving} onPress={onSave} style={styles.primary}>
            {saving ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.primaryText}>Salvar e sair</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" disabled={saving} onPress={onStay} style={styles.secondary}><Text style={styles.secondaryText}>Continuar escrevendo</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={saving} onPress={onDiscard} style={styles.secondary}><Text style={styles.error}>Descartar alterações e sair</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(44, 34, 27, 0.55)' },
  center: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { padding: 24, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, width: '100%', maxWidth: 420, alignSelf: 'center' },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, color: theme.colors.accent, fontWeight: '800' },
  title: { fontFamily: theme.font.editorial, fontSize: 28, color: theme.colors.text, marginTop: 12 },
  message: { fontSize: 14, lineHeight: 22, color: theme.colors.textMuted, marginVertical: 16 },
  error: { color: theme.colors.danger, fontSize: 13, textAlign: 'center' },
  primary: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  primaryText: { color: theme.colors.white, fontWeight: '700' },
  secondary: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  secondaryText: { color: theme.colors.primary, fontWeight: '700' }
});
