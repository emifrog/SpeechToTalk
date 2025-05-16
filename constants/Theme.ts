/**
 * Thème unifié pour l'application SpeechToTalk
 * Ce fichier centralise toutes les définitions de style pour assurer la cohérence visuelle
 */

import { Platform } from 'react-native';
import { Colors } from './Colors';

// Extraction des couleurs principales pour faciliter l'accès
const primaryBlue = Colors.light.primary; // #144291
const primaryRed = Colors.light.secondary; // #d20b12

// Définition du thème pour l'application
export const Theme = {
  // Couleurs principales
  colors: {
    primary: primaryBlue,
    secondary: primaryRed,
    background: '#f8f9fa',
    surface: '#ffffff',
    error: '#F44336',
    text: {
      primary: '#11181C',
      secondary: '#687076',
      tertiary: '#9BA1A6',
      onPrimary: '#ffffff',
      onSecondary: '#ffffff',
    },
    border: {
      light: '#e0e0e0',
      medium: '#d0d0d0',
      dark: '#a0a0a0',
    },
  },
  
  // Espacement
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Rayons des coins
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999, // Pour les cercles parfaits
  },
  
  // Ombres
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
    },
  },
  
  // Typographie
  typography: {
    fontFamily: {
      regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
      bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semiBold: '600' as const,
      bold: '700' as const,
    },
  },
  
  // Styles de bouton
  buttons: {
    primary: {
      backgroundColor: primaryBlue,
      textColor: '#ffffff',
      borderRadius: 12,
      padding: 14,
    },
    secondary: {
      backgroundColor: primaryRed,
      textColor: '#ffffff',
      borderRadius: 12,
      padding: 14,
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: primaryBlue,
      borderColor: primaryBlue,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
    },
    icon: {
      small: {
        size: 36,
        iconSize: 18,
        borderRadius: 18,
      },
      medium: {
        size: 44,
        iconSize: 22,
        borderRadius: 22,
      },
      large: {
        size: 56,
        iconSize: 28,
        borderRadius: 28,
      },
    },
  },
  
  // Dégradés
  gradients: {
    primary: ['#0c2a5e', '#144291', '#3a67b5'] as const,
    secondary: ['#9e0000', '#d20b12', '#e63e44'] as const,
    blended: ['#0c2a5e', '#144291', '#d20b12'] as const,
  },
};

// Exporter une fonction pour obtenir le thème adapté au mode sombre/clair
export function getTheme(colorScheme: 'light' | 'dark' = 'light') {
  // Pour l'instant, nous retournons le même thème, mais cela pourrait être étendu
  // pour supporter un thème sombre dans le futur
  return Theme;
}
