import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { AppCard } from '../../components/ui/AppCard';
import { StandardHeader } from '../../components/ui/AppHeader';

// Importer notre service de traduction
import { downloadLanguage, LANGUAGES, translateText } from '../../services/translationService';

// Import conditionnels pour éviter les erreurs dans les environnements non compatibles
let Voice: any = null;
let Tts: any = null;

// Vérifier si nous sommes dans un environnement web
const isWeb = Platform.OS === 'web';

// Type pour les callbacks de Voice
type VoiceCallbacks = {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechResults?: (result: { value: string[] }) => void;
  onSpeechError?: (error: any) => void;
  onSpeechPartialResults?: (result: any) => void;
  onSpeechVolumeChanged?: (volume: any) => void;
  onSpeechRecognized?: (recognized: any) => void;
};

// Créer une référence pour pouvoir accéder aux callbacks depuis l'intérieur des méthodes
let mockVoiceCallbacks: VoiceCallbacks = {};

// Créer des implémentations factices pour les environnements non compatibles
const createMockVoice = () => {
  const mockVoice = {
    // Méthodes de vérification de disponibilité
    isAvailable: () => Promise.resolve(true),
    isSpeechAvailable: () => Promise.resolve(true),
    getSpeechRecognitionServices: () => Promise.resolve(['mock_service']),
    
    // Méthodes de contrôle
    start: (locale: string) => {
      console.log('Mock Voice would start with locale:', locale);
      // Simuler un résultat après un court délai
      setTimeout(() => {
        if (mockVoiceCallbacks.onSpeechResults) {
          mockVoiceCallbacks.onSpeechResults({ value: ['Texte simulé de reconnaissance vocale'] });
        }
        if (mockVoiceCallbacks.onSpeechEnd) {
          mockVoiceCallbacks.onSpeechEnd();
        }
      }, 2000);
      return Promise.resolve();
    },

    
    // Gestion des événements
    removeAllListeners: () => {},
    
    // Propriétés pour les callbacks
    set onSpeechStart(callback: (() => void) | null) {
      mockVoiceCallbacks.onSpeechStart = callback || undefined;
    },
    set onSpeechEnd(callback: (() => void) | null) {
      mockVoiceCallbacks.onSpeechEnd = callback || undefined;
    },
    set onSpeechResults(callback: ((result: { value: string[] }) => void) | null) {
      mockVoiceCallbacks.onSpeechResults = callback || undefined;
    },
    set onSpeechError(callback: ((error: any) => void) | null) {
      mockVoiceCallbacks.onSpeechError = callback || undefined;
    },
    set onSpeechPartialResults(callback: ((result: any) => void) | null) {
      mockVoiceCallbacks.onSpeechPartialResults = callback || undefined;
    },
    set onSpeechVolumeChanged(callback: ((volume: any) => void) | null) {
      mockVoiceCallbacks.onSpeechVolumeChanged = callback || undefined;
    },
    set onSpeechRecognized(callback: ((recognized: any) => void) | null) {
      mockVoiceCallbacks.onSpeechRecognized = callback || undefined;
    }
  };
  
  return mockVoice;
};

const createMockTts = () => ({
  speak: (text: string) => {
    console.log('Mock TTS would speak:', text);
    return Promise.resolve();
  },
  setDefaultLanguage: () => Promise.resolve(),
  addEventListener: () => {},
  removeEventListener: () => {},
});

// Importer les modules réels seulement si nous ne sommes pas sur le web
if (!isWeb) {
  try {
    // Utilisation de dynamic import pour éviter les erreurs de lint
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Voice = require('@react-native-voice/voice').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Tts = require('react-native-tts').default;
  } catch (error) {
    console.warn('Could not load native modules:', error);
  }
}

// Si les modules n'ont pas pu être chargés, utiliser les implémentations factices
if (!Voice) Voice = createMockVoice();
if (!Tts) Tts = createMockTts();

// Utilisation des langues définies dans le service de traduction

// Messages d'urgence prédéfinis pour accès rapide
const EMERGENCY_PHRASES = [
  { fr: "Où avez-vous mal ?", translations: {} },
  { fr: "Avez-vous des difficultés à respirer ?", translations: {} },
  { fr: "Y a-t-il d'autres personnes à l'intérieur ?", translations: {} },
  { fr: "Avez-vous des allergies ou prenez-vous des médicaments ?", translations: {} },
  { fr: "Nous sommes là pour vous aider.", translations: {} },
  { fr: "Restez calme, les secours sont là.", translations: {} },
];

// Types pour notre application
interface ConversationEntry {
  original: string;
  translated: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: string;
}

interface EmergencyPhrase {
  fr: string;
  translations: Record<string, string>;
}

// Définition des styles à l'extérieur du composant pour éviter de les recréer à chaque rendu
const createStyles = (colorScheme: string | null | undefined, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? '#151718' : '#f8f9fa',
    padding: 16,
  },
  // Nouveaux styles pour le design amélioré de la partie discussion
  chatContainer: {
    marginBottom: 16,
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#333333' : '#f1f2f6',
  },
  conversationContainer: {
    marginBottom: 16,
    minHeight: 200,
  },
  messageBubbleSource: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.15)' : 'rgba(0, 131, 143, 0.08)',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.3)' : 'rgba(0, 131, 143, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    maxWidth: '90%',
    alignSelf: 'flex-start',
  },
  messageBubbleTarget: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(255, 111, 0, 0.15)' : 'rgba(255, 111, 0, 0.08)',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? 'rgba(255, 111, 0, 0.3)' : 'rgba(255, 111, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    maxWidth: '90%',
    alignSelf: 'flex-end',
    position: 'relative',
    paddingRight: 40, // Espace pour le bouton de lecture
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bubbleHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: colorScheme === 'dark' ? '#e2e8f0' : '#4a5568',
    marginLeft: 6,
  },
  messageText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? '#e2e8f0' : '#2d3748',
    lineHeight: 22,
  },
  speakButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: colors.secondary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyConversationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    height: 200,
  },
  emptyConversationText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? '#a0aec0' : '#a0aec0',
    marginTop: 16,
    textAlign: 'center',
  },
  toolbarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colorScheme === 'dark' ? '#333333' : '#f1f2f6',
  },
  micButton: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  micButtonActive: {
    backgroundColor: colors.secondary,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: colorScheme === 'dark' ? '#333333' : '#f1f2f6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    marginBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  headerLogo: {
    width: 50,
    height: 50,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.2)' : 'rgba(0, 131, 143, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  connectionText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  languageSelectors: {
    marginVertical: 10,
    marginHorizontal: 16,
  },
  languageCard: {
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
    borderRadius: 16,
    padding: 15,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 10,
  },
  languageSelector: {
    marginVertical: 8,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
    alignSelf: 'center',
    color: colors.primary,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#333333' : '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colorScheme === 'dark' ? '#252525' : '#f8f9fa',
  },
  picker: {
    height: 45,
    width: '100%',
  },
  swapButton: {
    backgroundColor: colors.secondary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
    elevation: 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  downloadButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  phrasesContainer: {
    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phraseButton: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.2)' : 'rgba(0, 131, 143, 0.1)',
    padding: 10,
    borderRadius: 12,
    marginRight: 10,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.3)' : 'rgba(0, 131, 143, 0.2)',
  },
  phraseText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  historyContainer: {
    marginBottom: 16,
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#333333' : '#f1f2f6',
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyIcon: {
    marginRight: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  historyScrollView: {
    maxHeight: 200,
  },
  emptyHistoryContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 150,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#a0aec0',
    marginTop: 10,
    textAlign: 'center',
  },
  historyEntry: {
    marginBottom: 16,
  },
  historyTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLanguageContainer: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.2)' : 'rgba(0, 131, 143, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyLanguage: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  historyBubbleSource: {
    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    marginRight: 40,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyBubbleTarget: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.2)' : 'rgba(0, 131, 143, 0.1)',
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
    marginLeft: 40,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.3)' : 'rgba(0, 131, 143, 0.2)',
  },
  historyTime: {
    fontSize: 12,
    color: '#a0aec0',
  },
  historyOriginal: {
    fontSize: 14,
    marginBottom: 4,
    color: '#4a5568',
  },
  historyTranslated: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d3748',
  },
  textContainer: {
    marginBottom: 16,
  },
  recognizedTextContainer: {
    marginBottom: 16,
  },
  translatedTextContainer: {
    marginBottom: 16,
  },
  textLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  textLabelIcon: {
    marginRight: 8,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  textContentCard: {
    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },

  recognizedText: {
    fontSize: 17,
    color: colorScheme === 'dark' ? '#e2e8f0' : '#2d3748',
    minHeight: 50,
    lineHeight: 24,
  },
  translatedText: {
    fontSize: 17,
    color: colorScheme === 'dark' ? '#e2e8f0' : '#2d3748',
    minHeight: 50,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.primary, // Turquoise/teal: #00838f
    fontStyle: 'italic',
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  recordButton: {
    backgroundColor: colors.primary, // Turquoise/teal: #00838f
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  recordingButton: {
    backgroundColor: colors.secondary, // Orange: #ff6f00
  },
  recordButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary, // Orange: #ff6f00
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: colors.secondary, // Orange: #ff6f00
    fontWeight: '500',
  },
  emergencyPhraseButton: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(255, 111, 0, 0.15)' : 'rgba(255, 111, 0, 0.08)', // Orange avec transparence
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? 'rgba(255, 111, 0, 0.3)' : 'rgba(255, 111, 0, 0.2)', // Orange avec transparence
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    marginBottom: 8,
    minWidth: 150,
    elevation: 2,
    shadowColor: colors.secondary, // Orange: #ff6f00
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phraseIcon: {
    marginRight: 8,
  },
  emergencyPhraseText: {
    fontSize: 15,
    color: colorScheme === 'dark' ? '#e2e8f0' : '#2d3748',
    fontWeight: '500',
  },
  historyItemLanguages: {
    fontSize: 12,
    color: colorScheme === 'dark' ? '#a0aec0' : '#718096',
  },
  historyItemOriginal: {
    fontSize: 15,
    color: colorScheme === 'dark' ? '#e2e8f0' : '#2d3748',
    marginBottom: 4,
  },
  historyItemTranslated: {
    fontSize: 15,
    color: colorScheme === 'dark' ? '#cbd5e0' : '#4a5568',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButtonSpacing: {
    flex: 1,
    marginHorizontal: 4,
  },
  cardContainer: {
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 10,
  },
});

function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const styles = createStyles(colorScheme, colors);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('fr');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  // Mode hors ligne utilisé quand pas de connexion mais langues téléchargées disponibles
  const [downloadedLanguages, setDownloadedLanguages] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Lire le texte traduit (avec useCallback pour éviter les dépendances cycliques)
  const speakText = useCallback(async (text: string) => {
    try {
      // Vérification plus stricte pour s'assurer que Tts et la méthode speak existent
      try {
        if (!Tts) {
          console.error('TTS module is not available');
          return;
        }
        
        if (typeof Tts.speak !== 'function') {
          console.error('TTS speak function is not available');
          return;
        }
        
        // Dans une vraie application, nous utiliserions une API de synthèse vocale plus complète
        // Pour l'exemple, nous utilisons simplement Tts.speak sans options spécifiques
        await Tts.speak(text);
      } catch (speakError) {
        console.error('Error calling Tts.speak:', speakError);
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  }, []);
  
  // Utiliser useCallback pour éviter les dépendances cycliques
  const translateTextCallback = useCallback(async (text: string) => {
    if (!text) return;
    
    setIsTranslating(true);
    
    try {
      // Utiliser notre service de traduction amélioré avec l'API Google Cloud Translation
      const translatedResult = await translateText(text, sourceLanguage, targetLanguage);
      
      // Vérifier si la traduction est une erreur (format [message d'erreur])
      if (translatedResult.startsWith('[') && translatedResult.endsWith(']')) {
        // L'erreur a déjà été gérée par le service de traduction
        // Nous n'ajoutons pas les erreurs à l'historique de conversation
        setTranslatedText(translatedResult);
      } else {
        // Traduction réussie
        setTranslatedText(translatedResult);
        
        // Ajouter à l'historique de conversation
        const newEntry: ConversationEntry = {
          original: text,
          translated: translatedResult,
          sourceLanguage,
          targetLanguage,
          timestamp: new Date().toISOString(),
        };
        
        setConversationHistory(prevHistory => [...prevHistory, newEntry]);
        
        // Lire la traduction à haute voix
        speakText(translatedResult);
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Cette partie ne devrait pas être atteinte car les erreurs sont gérées dans le service de traduction
      setTranslatedText(`[Erreur de traduction]`);
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLanguage, targetLanguage, speakText]);

  // Initialisation
  useEffect(() => {
    // Définir les fonctions à l'intérieur du useEffect pour éviter les dépendances cycliques
    const setupVoiceRecognitionInternal = async () => {
      try {
        // Vérifier si le module Voice est disponible
        if (!Voice) {
          console.error('Voice module is not available');
          Alert.alert(
            'Fonctionnalité non disponible',
            'Le module de reconnaissance vocale n\'est pas disponible sur cet appareil.'
          );
          return;
        }

        // Vérifier la disponibilité de la reconnaissance vocale de manière sécurisée
        let isVoiceAvailable = false;
        try {
          // Essayer d'abord isSpeechAvailable si disponible
          if (typeof Voice.isSpeechAvailable === 'function') {
            isVoiceAvailable = await Voice.isSpeechAvailable();
          } 
          // Sinon essayer isAvailable
          else if (typeof Voice.isAvailable === 'function') {
            isVoiceAvailable = await Voice.isAvailable();
          }
          // Si aucune méthode n'est disponible, supposer que la reconnaissance vocale n'est pas disponible
          else {
            console.warn('Neither Voice.isSpeechAvailable nor Voice.isAvailable are available');
            isVoiceAvailable = false;
          }
        } catch (availabilityError) {
          console.error('Error checking voice availability:', availabilityError);
          isVoiceAvailable = false;
        }
        
        if (!isVoiceAvailable) {
          console.log('Voice recognition is not available on this device');
          // Ne pas afficher d'alerte ici pour éviter de perturber l'expérience utilisateur
          // L'application fonctionnera toujours, mais sans reconnaissance vocale
          return;
        }
        
        // Définir les gestionnaires d'événements selon la documentation officielle
        const onSpeechStart = () => {
          console.log('Speech started');
        };
        
        const onSpeechEnd = () => {
          console.log('Speech ended');
          setIsListening(false);
        };
        
        const onSpeechResults = (event: any) => {
          if (event.value && event.value.length > 0) {
            const recognizedText = event.value[0];
            setSpokenText(recognizedText);
            translateTextCallback(recognizedText);
          }
        };
        
        const onSpeechError = (error: any) => {
          console.error('Speech error:', error);
          setIsListening(false);
          Alert.alert('Erreur de reconnaissance vocale', 'Veuillez réessayer.');
        };
        
        // Détacher les anciens gestionnaires d'événements s'ils existent
        try {
          if (typeof Voice.removeAllListeners === 'function') {
            Voice.removeAllListeners();
          }
        } catch (removeError) {
          console.warn('Error removing Voice listeners:', removeError);
        }
        
        // Attacher les gestionnaires d'événements
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

      } catch (error) {
        console.error('Voice recognition setup error:', error);
        Alert.alert(
          'Fonctionnalité non disponible',
          'La reconnaissance vocale n\'est pas disponible sur cet appareil.'
        );
      }
    };

    const setupTextToSpeechInternal = async () => {
      try {
        // Vérifier si le module TTS est disponible
        if (typeof Tts === 'undefined') {
          console.error('Module TTS non disponible');
          return;
        }
        
        // Initialiser TTS avec une promesse pour s'assurer qu'il est prêt
        await new Promise<void>((resolve) => {
          // Attendre un court délai pour s'assurer que le module est chargé
          setTimeout(() => {
            try {
              // Vérifier si Tts est correctement initialisé
              if (!Tts) {
                console.error('TTS module is undefined after timeout');
                resolve();
                return;
              }
              
              // Configurer les événements pour la synthèse vocale
              if (typeof Tts.addEventListener === 'function') {
                Tts.addEventListener('tts-finish', () => console.log('TTS finished'));
                Tts.addEventListener('tts-error', (err: any) => console.error('TTS error:', err));
              } else {
                console.warn('TTS addEventListener function is not available');
              }
              
              // Définir la langue par défaut
              try {
                // Vérification plus stricte pour s'assurer que la méthode existe
                if (Tts && Tts.setDefaultLanguage && typeof Tts.setDefaultLanguage === 'function') {
                  Tts.setDefaultLanguage('fr-FR');
                } else {
                  console.warn('TTS setDefaultLanguage function is not available');
                }
              } catch (ttsMethodError) {
                console.warn('Error accessing TTS.setDefaultLanguage:', ttsMethodError);
              }
              
              resolve();
            } catch (setupError) {
              console.error('TTS setup error in timeout:', setupError);
              resolve(); // Résoudre quand même pour continuer l'exécution
            }
          }, 1000); // Augmenter le délai à 1000ms pour s'assurer que le module est chargé
        });
      } catch (error) {
        console.error('TTS setup error:', error);
      }
    };
    
    const checkConnectivityInternal = () => {
      // S'abonner aux changements de connectivité
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsConnected(!!state.isConnected);
        if (!state.isConnected && downloadedLanguages.includes(targetLanguage)) {
          Alert.alert(
            "Mode hors ligne activé",
            "Vous êtes maintenant en mode hors ligne. Seules les langues téléchargées sont disponibles."
          );
        }
      });

      return unsubscribe;
    };

    const initializeApp = async () => {
      try {
        // Initialiser les services dans un ordre spécifique
        await setupTextToSpeechInternal();
        const unsubscribe = checkConnectivityInternal();
        loadDownloadedLanguages();
        requestMicrophonePermission();
        
        // Initialiser Voice en dernier pour éviter les problèmes
        await setupVoiceRecognitionInternal();

        // Nettoyage lors du démontage
        return () => {
          unsubscribe();
          // Nettoyer Voice lors du démontage
          try {
            // Vérifier si les méthodes existent avant de les appeler
            if (typeof Voice.destroy === 'function') {
              Voice.destroy();
            }
            // Réinitialiser les gestionnaires d'événements avec des fonctions vides
            Voice.onSpeechStart = () => {};
            Voice.onSpeechEnd = () => {};
            Voice.onSpeechResults = () => {};
            Voice.onSpeechError = () => {};
          } catch (error) {
            console.error('Error cleaning up Voice:', error);
          }
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        return () => {}; // Retourner une fonction de nettoyage vide en cas d'erreur
      }
    };

    const cleanup = initializeApp();
    return () => {
      if (cleanup) {
        cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
      }
    };
  }, [downloadedLanguages, targetLanguage, translateTextCallback]);

  // Ces fonctions sont maintenant définies à l'intérieur du useEffect

  // Demande de permission pour le microphone en utilisant expo-av
  const requestMicrophonePermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      } else {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin d\'accéder au microphone pour la reconnaissance vocale.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  // Démarrer/arrêter la reconnaissance vocale
  const toggleListening = async () => {
    try {
      // Vérifier d'abord les permissions du microphone
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) {
        console.log('Microphone permission not granted');
        return;
      }

      if (isListening) {
        // Arrêter la reconnaissance vocale
        if (!Voice) {
          console.error('Voice module is not available');
          setIsListening(false);
          return;
        }
        
        if (typeof Voice.stop !== 'function') {
          console.error('Voice stop function is not available');
          setIsListening(false);
          return;
        }
        
        try {
          await Voice.stop();
          console.log('Voice recognition stopped successfully');
        } catch (stopError) {
          console.error('Error stopping voice recognition:', stopError);
        } finally {
          setIsListening(false);
        }
      } else {
        // Démarrer la reconnaissance vocale
        setSpokenText('');
        console.log('Starting voice recognition in language:', sourceLanguage);
        
        // Vérifier si Voice est disponible et si la méthode start existe
        if (!Voice) {
          console.error('Voice recognition module is not available');
          Alert.alert('Erreur', 'Le module de reconnaissance vocale n\'est pas disponible.');
          return;
        }
        
        if (typeof Voice.start !== 'function') {
          console.error('Voice start function is not available');
          Alert.alert('Erreur', 'La fonction de démarrage de la reconnaissance vocale n\'est pas disponible.');
          return;
        }
        
        try {
          // Vérifier si la reconnaissance vocale est disponible
          if (typeof Voice.isAvailable === 'function') {
            const isAvailable = await Voice.isAvailable();
            if (!isAvailable) {
              console.error('Voice recognition is not available on this device');
              Alert.alert('Erreur', 'La reconnaissance vocale n\'est pas disponible sur cet appareil.');
              return;
            }
          }
          
          // Réinitialiser les écouteurs d'événements pour éviter les problèmes
          try {
            if (typeof Voice.removeAllListeners === 'function') {
              Voice.removeAllListeners();
              
              // Réattacher les gestionnaires d'événements
              Voice.onSpeechStart = () => console.log('Speech started');
              Voice.onSpeechEnd = () => {
                console.log('Speech ended');
                setIsListening(false);
              };
              Voice.onSpeechResults = (event: any) => {
                if (event.value && event.value.length > 0) {
                  const recognizedText = event.value[0];
                  setSpokenText(recognizedText);
                  translateTextCallback(recognizedText);
                }
              };
              Voice.onSpeechError = (error: any) => {
                console.error('Speech error:', error);
                setIsListening(false);
                Alert.alert('Erreur de reconnaissance vocale', 'Veuillez réessayer.');
              };
            }
          } catch (resetError) {
            console.warn('Error resetting Voice listeners:', resetError);
          }
          
          // Démarrer la reconnaissance vocale avec un délai pour s'assurer que tout est prêt
          setTimeout(async () => {
            try {
              await Voice.start(sourceLanguage);
              console.log('Voice recognition started successfully');
              setIsListening(true);
            } catch (delayedStartError) {
              console.error('Error starting voice recognition after delay:', delayedStartError);
              Alert.alert('Erreur', 'Impossible de démarrer la reconnaissance vocale. Veuillez réessayer.');
            }
          }, 500);
        } catch (startError) {
          console.error('Error starting voice recognition:', startError);
          Alert.alert('Erreur', 'Impossible de démarrer la reconnaissance vocale. Vérifiez que vous avez accordé les permissions nécessaires.');
        }
      }
    } catch (error) {
      console.error('Toggle listening error:', error);
      Alert.alert('Erreur', 'Impossible de démarrer ou arrêter la reconnaissance vocale.');
    }
  };

  // Nous utilisons translateTextCallback défini plus haut au lieu de cette fonction

  // Charger les langues téléchargées
  const loadDownloadedLanguages = async () => {
    try {
      const languages = await AsyncStorage.getItem('downloadedLanguages');
      if (languages) {
        setDownloadedLanguages(JSON.parse(languages));
      }
    } catch (error) {
      console.error('Error loading downloaded languages:', error);
    }
  };

  // Télécharger une langue pour l'utilisation hors ligne
  const handleDownloadLanguage = async (langCode: string) => {
    if (isConnected) {
      try {
        // Utiliser le service de téléchargement de langue amélioré
        const success = await downloadLanguage(langCode);
        
        // Mettre à jour la liste des langues téléchargées si le téléchargement a réussi
        if (success) {
          loadDownloadedLanguages();
        }
      } catch (error) {
        console.error('Error downloading language:', error);
        Alert.alert(
          "Erreur",
          "Impossible de télécharger la langue. Veuillez réessayer plus tard."
        );
      }
    } else {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté à Internet pour télécharger une langue."
      );
    }
  };

  // Utiliser une phrase d'urgence prédéfinie
  const handleEmergencyPhrase = (phrase: EmergencyPhrase) => {
    setSpokenText(phrase.fr);
    translateTextCallback(phrase.fr);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StandardHeader 
        title="Traduction"
      />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{paddingBottom: 20}}>
      {/* Sélecteurs de langue */}
      <AppCard
        title="Langues"
        icon="translate"
        style={styles.languageSelectors}
      >
        <View style={styles.languageCard}>
          <View style={styles.languageSelector}>
            <Text style={styles.languageLabel}>De:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sourceLanguage}
                style={styles.picker}
                onValueChange={(value) => setSourceLanguage(value)}
                dropdownIconColor="#00838f"
              >
                {LANGUAGES.map((lang) => (
                  <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => {
              setSourceLanguage(targetLanguage);
              setTargetLanguage(sourceLanguage);
            } }
          >
            <MaterialCommunityIcons name="swap-vertical" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.languageSelector}>
            <Text style={styles.languageLabel}>À:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={targetLanguage}
                style={styles.picker}
                onValueChange={(value) => {
                  setTargetLanguage(value);
                  // Configurer la langue pour TTS (utiliser speak pour réinitialiser)
                  try {
                    if (Tts && typeof Tts.speak === 'function') {
                      Tts.speak("");
                    }
                  } catch (error) {
                    console.warn('Error resetting TTS:', error);
                  }
                } }
                dropdownIconColor="#00838f"
              >
                {LANGUAGES.map((lang) => (
                  <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
                ))}
              </Picker>
            </View>
            {!downloadedLanguages.includes(targetLanguage) && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownloadLanguage(targetLanguage)}
              >
                <MaterialCommunityIcons name="download" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </AppCard>

      {/* Phrases d'urgence prédéfinies */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.secondary} />
        <Text style={[styles.sectionTitle, {color: colors.secondary}]}>Phrases d&apos;urgence:</Text>
      </View>
      <ScrollView horizontal style={styles.phrasesContainer} showsHorizontalScrollIndicator={false}>
        {EMERGENCY_PHRASES.map((phrase, index) => {
          // Choisir une icône appropriée pour chaque phrase d'urgence
          let iconName: any = "message-alert-outline";
          if (index === 0) iconName = "medical-bag";
          if (index === 1) iconName = "lungs";
          if (index === 2) iconName = "account-search";
          if (index === 3) iconName = "pill";
          if (index === 4) iconName = "hand-heart";
          if (index === 5) iconName = "shield-check";
          
          return (
            <TouchableOpacity 
              key={index}
              style={styles.emergencyPhraseButton}
              onPress={() => handleEmergencyPhrase(phrase)}
            >
              <MaterialCommunityIcons name={iconName} size={24} color={colors.secondary} style={styles.phraseIcon} />
              <Text style={styles.emergencyPhraseText}>{phrase.fr}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Texte reconnu et traduit - Design amélioré */}
      <View style={styles.chatContainer}>
        {/* Zone de discussion */}
        <View style={styles.conversationContainer}>
          {spokenText ? (
            <View style={styles.messageBubbleSource}>
              <View style={styles.bubbleHeader}>
                <MaterialCommunityIcons name="account" size={16} color={colors.primary} />
                <Text style={styles.bubbleHeaderText}>Vous ({LANGUAGES.find(l => l.code === sourceLanguage)?.name})</Text>
              </View>
              <Text style={styles.messageText}>{spokenText}</Text>
            </View>
          ) : (
            <View style={styles.emptyConversationContainer}>
              <MaterialCommunityIcons name="message-text-outline" size={40} color={colorScheme === 'dark' ? '#4a5568' : '#d1d5db'} />
              <Text style={styles.emptyConversationText}>Appuyez sur le bouton microphone pour commencer</Text>
            </View>
          )}
          
          {isTranslating ? (
            <View style={styles.messageBubbleTarget}>
              <View style={styles.bubbleHeader}>
                <MaterialCommunityIcons name="translate" size={16} color={colors.secondary} />
                <Text style={styles.bubbleHeaderText}>Traduction ({LANGUAGES.find(l => l.code === targetLanguage)?.name})</Text>
              </View>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text style={styles.loadingText}>Traduction en cours...</Text>
              </View>
            </View>
          ) : translatedText ? (
            <View style={styles.messageBubbleTarget}>
              <View style={styles.bubbleHeader}>
                <MaterialCommunityIcons name="translate" size={16} color={colors.secondary} />
                <Text style={styles.bubbleHeaderText}>Traduction ({LANGUAGES.find(l => l.code === targetLanguage)?.name})</Text>
              </View>
              <Text style={styles.messageText}>{translatedText}</Text>
              <TouchableOpacity 
                style={styles.speakButton}
                onPress={() => speakText(translatedText)}
              >
                <MaterialCommunityIcons name="volume-high" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

                {/* Barre d'outils */}
                <View style={styles.toolbarContainer}>
          <TouchableOpacity 
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={toggleListening}
          >
            <MaterialCommunityIcons 
              name={isListening ? 'microphone-off' : 'microphone'} 
              size={28} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          {(spokenText || translatedText) && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSpokenText('');
                setTranslatedText('');
              }}
            >
              <MaterialCommunityIcons name="eraser" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {isListening && (
        <View style={styles.recordingStatusContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.recordingText}>Écoute en cours...</Text>
        </View>
      )}

        {/* Historique de conversation */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>Historique de conversation</Text>
      </View>
      <View style={styles.historyContainer}>
        <ScrollView 
          style={styles.historyScrollView} 
          ref={scrollViewRef} 
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {conversationHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <MaterialCommunityIcons name="chat-outline" size={40} color={colorScheme === 'dark' ? '#4a5568' : '#d1d5db'} />
              <Text style={styles.emptyHistoryText}>Votre historique de conversation apparaîtra ici</Text>
            </View>
          ) : (
            conversationHistory.map((entry, index) => (
              <View key={index} style={styles.historyEntry}>
                <View style={styles.historyEntryHeader}>
                  <View style={styles.historyTimeContainer}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
                    <Text style={styles.historyTime}>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <View style={styles.historyLanguageContainer}>
                    <Text style={styles.historyLanguage}>{entry.sourceLanguage} → {entry.targetLanguage}</Text>
                  </View>
                </View>
                <View style={styles.historyBubbleSource}>
                  <Text style={styles.historyOriginal}>{entry.original}</Text>
                </View>
                <View style={styles.historyBubbleTarget}>
                  <Text style={styles.historyTranslated}>{entry.translated}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
        

      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;
