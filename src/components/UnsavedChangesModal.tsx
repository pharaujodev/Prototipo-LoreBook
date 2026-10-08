import React from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';

type Props = { visible: boolean; saving: boolean; error: string; onStay: () => void; onDiscard: () => void; onSave: () => void };
export function UnsavedChangesModal({ visible, saving, error, onStay, onDiscard, onSave }: Props) {
  return <ConfirmationDialog visible={visible} title="Salvar antes de sair?" message="O título, o texto ou o status deste capítulo têm alterações não salvas."
    busy={saving} error={error} onCancel={onStay} actions={[
      { label: saving ? 'Salvando...' : 'Salvar e sair', onPress: onSave },
      { label: 'Continuar escrevendo', onPress: onStay, secondary: true },
      { label: 'Descartar alterações e sair', onPress: onDiscard, danger: true }
    ]} />;
}
