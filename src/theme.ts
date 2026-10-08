import { Platform } from 'react-native';

export const theme = {
  font: { editorial: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }) },
  colors: {
    background: '#F5F2EC',
    surface: '#FFFDFA',
    surfaceMuted: '#EAE5DD',
    primary: '#492D40',
    primarySoft: '#EEE4EB',
    accent: '#775B32',
    gold: '#BDA57C',
    text: '#272329',
    textMuted: '#625B63',
    border: '#D7D0C7',
    successSoft: '#E5EDE6',
    warningSoft: '#F3EBD7',
    dangerSoft: '#F5E6E0',
    success: '#385E46',
    warning: '#775716',
    danger: '#943F32',
    onPrimary: '#F0E8ED',
    scrim: 'rgba(25, 19, 25, 0.55)',
    white: '#FFFFFF'
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  typography: { caption: 12, body: 16, label: 14, heading: 28, display: 38, reading: 18, lineHeight: 26 },
  layout: { page: 20, maxWidth: 760, formWidth: 480, buttonHeight: 48, borderWidth: 1 },
  // Presença editorial por bordas e espaço, sem sombras pesadas.
  elevation: { flat: 0, raised: 2 }
};
