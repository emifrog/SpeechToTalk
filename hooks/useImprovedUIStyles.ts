import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

/**
 * Hook pour les styles UI améliorés avec meilleure accessibilité et espacement
 */
export const useImprovedUIStyles = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return useMemo(() => ({
    // Styles de base améliorés
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    
    // Headers et titres améliorés
    pageHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    pageTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
      textAlign: 'center' as const,
    },
    
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginVertical: 24,
      paddingHorizontal: 4,
    },
    
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      marginLeft: 12,
      color: colors.primary,
    },
    
    sectionIcon: {
      marginRight: 8,
    },
    
    // Cartes et conteneurs améliorés
    card: {
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    
    cardLarge: {
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: 20,
      padding: 24,
      marginVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    
    // Boutons améliorés avec accessibilité tactile
    primaryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      minHeight: 48, // Taille tactile minimale
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    
    secondaryButton: {
      backgroundColor: colors.secondary + '20',
      borderWidth: 2,
      borderColor: colors.secondary,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      minHeight: 48,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    
    iconButton: {
      backgroundColor: colors.primary,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    
    largeIconButton: {
      backgroundColor: colors.primary,
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    
    // Sélecteurs et inputs améliorés
    inputContainer: {
      marginVertical: 12,
    },
    
    inputLabel: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
    },
    
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.background,
      minHeight: 52,
      overflow: 'hidden' as const,
    },
    
    picker: {
      height: 52,
      width: '100%',
      color: colors.text,
    },
    
    // Listes et éléments améliorés
    listItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
      marginVertical: 4,
      minHeight: 56, // Taille tactile optimale
      borderWidth: 1,
      borderColor: colors.border,
    },
    
    listItemIcon: {
      marginRight: 16,
      width: 24,
      height: 24,
    },
    
    listItemText: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.text,
      flex: 1,
    },
    
    listItemSubtext: {
      fontSize: 14,
      color: colors.secondary,
      marginTop: 4,
    },
    
    // Zones d'action améliorées
    actionGrid: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginVertical: 16,
      gap: 12,
    },
    
    actionButton: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    
    actionButtonIcon: {
      marginBottom: 8,
    },
    
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      textAlign: 'center' as const,
    },
    
    // Espacement et séparation améliorés
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 20,
    },
    
    spacer: {
      height: 24,
    },
    
    spacerLarge: {
      height: 32,
    },
    
    // Messages et états améliorés
    emptyState: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    
    emptyStateIcon: {
      marginBottom: 16,
      opacity: 0.6,
    },
    
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    
    emptyStateText: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center' as const,
      lineHeight: 24,
    },
    
    // Styles spécifiques aux phrases d'urgence
    emergencyPhrasesContainer: {
      marginBottom: 32,
    },
    
    emergencyPhrasesScroll: {
      paddingHorizontal: 4,
    },
    
    emergencyPhraseButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginRight: 12,
      minHeight: 44,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    
    emergencyPhraseIcon: {
      marginRight: 8,
      color: colors.primary,
    },
    
    emergencyPhraseText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600' as const,
    },
    
    // Styles pour mode haute visibilité
    highVisibilityContainer: {
      backgroundColor: '#000000',
      borderRadius: 16,
      padding: 20,
      marginVertical: 16,
    },
    
    highVisibilityText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700' as const,
      textAlign: 'center' as const,
    },
    
    highVisibilityButton: {
      backgroundColor: '#FFFF00',
      color: '#000000',
      fontSize: 16,
      fontWeight: '700' as const,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      minHeight: 56,
      textAlign: 'center' as const,
    },
    
  }), [colors, colorScheme]);
};
