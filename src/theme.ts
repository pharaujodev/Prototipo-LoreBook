import { Platform } from 'react-native';

export const theme = {
  font: { editorial: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }) },
  colors: {
    background: '#F2EADC',
    surface: '#FBF6EC',
    surfaceMuted: '#E7DCC9',
    primary: '#7B2B34',
    primarySoft: '#EDDADC',
    accent: '#8C5D20',
    gold: '#D7A862',
    text: '#2C221B',
    textMuted: '#695949',
    border: '#D5C5AE',
    successSoft: '#E1EAE0',
    dangerSoft: '#F0DDDA',
    success: '#4A7158',
    warning: '#9C6A1A',
    danger: '#934B46',
    white: '#FFFFFF'
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 18
  }
};
