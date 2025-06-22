import { useCallback, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useDebouncedCallback } from './usePerformanceOptimization';

// Types pour les hooks d'optimisation
interface UseHomeScreenOptimizationReturn {
  colors: any;
  optimizedHandlers: {
    handleLanguageChange: (language: string, type: 'source' | 'target') => void;
    handleEmergencyPhrase: (phrase: any) => void;
    handleToggleListening: () => void;
    handleClearConversation: () => void;
    handleSpeakText: (text: string) => void;
  };
  memoizedValues: {
    sourceLanguageOptions: { code: string; name: string }[];
    targetLanguageOptions: { code: string; name: string }[];
    emergencyPhrases: { fr: string; en: string }[];
  };
}

interface UseHomeScreenOptimizationProps {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  spokenText: string;
  setSpokenText: (text: string) => void;
  translatedText: string;
  setTranslatedText: (text: string) => void;
  conversationHistory: any[];
  setConversationHistory: (history: any[]) => void;
  languages: { code: string; name: string }[];
  emergencyPhrases: { fr: string; en: string }[];
  onTranslateText: (text: string, source: string, target: string) => Promise<void>;
  onSpeakText: (text: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
}

/**
 * Hook personnalisé pour optimiser les performances de l'écran principal
 * Mémorise les valeurs coûteuses et optimise les handlers
 */
export const useHomeScreenOptimization = ({
  sourceLanguage,
  targetLanguage,
  setSourceLanguage,
  setTargetLanguage,
  isListening,
  setIsListening,
  spokenText,
  setSpokenText,
  translatedText,
  setTranslatedText,
  conversationHistory,
  setConversationHistory,
  languages,
  emergencyPhrases,
  onTranslateText,
  onSpeakText,
  onStartListening,
  onStopListening,
}: UseHomeScreenOptimizationProps): UseHomeScreenOptimizationReturn => {
  
  const colorScheme = useColorScheme();
  const lastTranslationRef = useRef<string>('');

  // Mémorisation des couleurs pour éviter les recalculs
  const colors = useMemo(() => {
    return Colors[colorScheme ?? 'light'];
  }, [colorScheme]);

  // Mémorisation des options de langue pour éviter les re-rendus
  const sourceLanguageOptions = useMemo(() => {
    return languages.filter(lang => lang.code !== targetLanguage);
  }, [languages, targetLanguage]);

  const targetLanguageOptions = useMemo(() => {
    return languages.filter(lang => lang.code !== sourceLanguage);
  }, [languages, sourceLanguage]);

  const memoizedEmergencyPhrases = useMemo(() => {
    return emergencyPhrases;
  }, [emergencyPhrases]);

  // Handler optimisé pour le changement de langue
  const handleLanguageChange = useCallback((language: string, type: 'source' | 'target') => {
    if (type === 'source') {
      setSourceLanguage(language);
    } else {
      setTargetLanguage(language);
    }
  }, [setSourceLanguage, setTargetLanguage]);

  // Handler optimisé pour les phrases d'urgence avec debounce
  const handleEmergencyPhrase = useDebouncedCallback(
    useCallback(async (phrase: any) => {
      try {
        setSpokenText(phrase.fr);
        await onTranslateText(phrase.fr, sourceLanguage, targetLanguage);
      } catch (error) {
        console.error('Erreur lors de la traduction de la phrase d\'urgence:', error);
      }
    }, [sourceLanguage, targetLanguage, setSpokenText, onTranslateText]),
    300
  );

  // Handler optimisé pour le toggle d'écoute
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      onStopListening();
      setIsListening(false);
    } else {
      onStartListening();
      setIsListening(true);
    }
  }, [isListening, onStartListening, onStopListening, setIsListening]);

  // Handler optimisé pour nettoyer la conversation
  const handleClearConversation = useCallback(() => {
    setSpokenText('');
    setTranslatedText('');
    // Optionnel: garder l'historique ou le vider selon les besoins
    // setConversationHistory([]);
  }, [setSpokenText, setTranslatedText]);

  // Handler optimisé pour la synthèse vocale avec debounce
  const handleSpeakText = useDebouncedCallback(
    useCallback((text: string) => {
      if (text && text !== lastTranslationRef.current) {
        lastTranslationRef.current = text;
        onSpeakText(text);
      }
    }, [onSpeakText]),
    500
  );

  // Mémorisation des handlers pour éviter les re-créations
  const optimizedHandlers = useMemo(() => ({
    handleLanguageChange,
    handleEmergencyPhrase,
    handleToggleListening,
    handleClearConversation,
    handleSpeakText,
  }), [
    handleLanguageChange,
    handleEmergencyPhrase,
    handleToggleListening,
    handleClearConversation,
    handleSpeakText,
  ]);

  // Mémorisation des valeurs calculées
  const memoizedValues = useMemo(() => ({
    sourceLanguageOptions,
    targetLanguageOptions,
    emergencyPhrases: memoizedEmergencyPhrases,
  }), [sourceLanguageOptions, targetLanguageOptions, memoizedEmergencyPhrases]);

  return {
    colors,
    optimizedHandlers,
    memoizedValues,
  };
};

/**
 * Hook pour optimiser les styles avec mémorisation
 */
export const useOptimizedHomeScreenStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  return useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      marginLeft: 8,
      color: colors.primary,
    },
    languageSelectors: {
      marginVertical: 10,
      marginHorizontal: 16,
    },
    languageCard: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    languageSelector: {
      flex: 1,
    },
    languageLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.text,
      marginBottom: 8,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    picker: {
      height: 50,
      width: '100%',
    },
    autoDetectButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    autoDetectText: {
      fontSize: 10,
      color: colors.primary,
      marginLeft: 4,
      fontWeight: '500' as const,
    },
    detectedLanguageText: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 4,
      fontStyle: 'italic' as const,
    },
    swapButton: {
      backgroundColor: colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginHorizontal: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    downloadButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginTop: 8,
      alignItems: 'center' as const,
    },
    phrasesContainer: {
      marginBottom: 20,
    },
    phraseButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    phraseIcon: {
      marginRight: 6,
    },
    phraseText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500' as const,
    },
    chatContainer: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    conversationContainer: {
      flex: 1,
      paddingBottom: 16,
    },
    emptyConversationContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingVertical: 40,
    },
    emptyConversationText: {
      fontSize: 16,
      color: colorScheme === 'dark' ? '#6b7280' : '#9ca3af',
      textAlign: 'center' as const,
      marginTop: 12,
    },
    loadingContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 16,
    },
    loadingText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.text,
    },
    toolbarContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    micButton: {
      backgroundColor: colors.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    clearButton: {
      position: 'absolute' as const,
      right: 0,
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recordingStatusContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 12,
    },
    recordingIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ef4444',
      marginRight: 8,
    },
    recordingText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500' as const,
    },
    historyContainer: {
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    historyItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    historyTimeContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    historyTime: {
      fontSize: 12,
      color: colors.secondary,
    },
    historyLanguages: {
      fontSize: 12,
      color: colors.secondary,
      fontWeight: '500' as const,
    },
    historySource: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    historyTranslated: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: colors.primary,
    },
    conversationModeContainer: {
      marginBottom: 16,
      alignItems: 'center' as const,
    },
    conversationModeButton: {
      backgroundColor: colors.primary,
      borderRadius: 25,
      padding: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    historyScrollView: {
      maxHeight: 300,
    },
    emptyHistoryContainer: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: 20,
    },
    emptyHistoryText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center' as const,
    },
    historyEntry: {
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? '#444' : '#e0e0e0',
    },
    historyEntryHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    historyLanguageContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    historyLanguage: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600' as const,
    },
    historyBubbleSource: {
      backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#e3f2fd',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    historyOriginal: {
      fontSize: 14,
      color: colors.text,
    },
    historyBubbleTarget: {
      backgroundColor: colorScheme === 'dark' ? '#2d4a2d' : '#e8f5e8',
      borderRadius: 8,
      padding: 12,
    },
  }), [colorScheme, colors]);
};
