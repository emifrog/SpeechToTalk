/**
 * Couleurs utilisées dans l'application SpeechToTalk.
 * Les couleurs principales sont basées sur le logo de l'application :
 * - Bleu : #144291
 * - Rouge : #d20b12
 */

// Couleurs principales du logo
const primaryBlue = '#144291';
const primaryRed = '#d20b12';

// Variantes plus claires et plus foncées pour différents éléments de l'interface
const lightBlue = '#3a67b5';
const darkBlue = '#0c2a5e';
const lightRed = '#e63e44';
const darkRed = '#9e0000';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: primaryBlue,
    tintSecondary: primaryRed,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryBlue,
    primary: primaryBlue,
    secondary: primaryRed,
    lightPrimary: lightBlue,
    darkPrimary: darkBlue,
    lightSecondary: lightRed,
    darkSecondary: darkRed,
    border: '#e0e0e0',
    success: '#4CAF50',
    error: '#F44336',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: lightBlue,
    tintSecondary: lightRed,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: lightBlue,
    primary: primaryBlue,
    secondary: primaryRed,
    lightPrimary: lightBlue,
    darkPrimary: darkBlue,
    lightSecondary: lightRed,
    darkSecondary: darkRed,
    border: '#333333',
    success: '#4CAF50',
    error: '#F44336',
  },
};
