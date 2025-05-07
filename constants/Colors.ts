/**
 * Couleurs utilisées dans l'application SpeechToTalk.
 * Les couleurs principales sont basées sur le logo de l'application :
 * - Turquoise/teal : #00838f
 * - Orange : #ff6f00
 */

// Couleurs principales du logo
const primaryTeal = '#00838f';
const primaryOrange = '#ff6f00';

// Variantes plus claires et plus foncées pour différents éléments de l'interface
const lightTeal = '#4fb3bf';
const darkTeal = '#005662';
const lightOrange = '#ffa040';
const darkOrange = '#c43e00';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: primaryTeal,
    tintSecondary: primaryOrange,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryTeal,
    primary: primaryTeal,
    secondary: primaryOrange,
    lightPrimary: lightTeal,
    darkPrimary: darkTeal,
    lightSecondary: lightOrange,
    darkSecondary: darkOrange,
    border: '#e0e0e0',
    success: '#4CAF50',
    error: '#F44336',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: lightTeal,
    tintSecondary: lightOrange,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: lightTeal,
    primary: primaryTeal,
    secondary: primaryOrange,
    lightPrimary: lightTeal,
    darkPrimary: darkTeal,
    lightSecondary: lightOrange,
    darkSecondary: darkOrange,
    border: '#333333',
    success: '#4CAF50',
    error: '#F44336',
  },
};
