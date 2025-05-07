import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { Audio } from 'expo-av';
import { Colors } from '@/constants/Colors';

// Importer notre service de traduction
import { translateText, downloadLanguage, LANGUAGES } from '../../services/translationService';

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
    padding: 10,
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
      // Vérifier si Tts est disponible et si la méthode speak existe
      if (!Tts || typeof Tts.speak !== 'function') {
        console.error('TTS module or speak function is not available');
        return;
      }
      
      // Dans une vraie application, nous utiliserions une API de synthèse vocale plus complète
      // Pour l'exemple, nous utilisons simplement Tts.speak sans options spécifiques
      await Tts.speak(text);
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
        
        // Attacher les gestionnaires d'événements
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;
      } catch (error) {
        console.error('Voice recognition setup error:', error);
        Alert.alert(
          'Fonctionnalité non disponible',
          'La reconnaissance vocale n&apos;est pas disponible sur cet appareil.'
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
      console.log('Requesting microphone permission with Expo...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        console.log('Microphone permission granted');
        return true;
      } else {
        console.log('Microphone permission denied');
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
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
      } else {
        setSpokenText('');
        console.log('Starting voice recognition in language:', sourceLanguage);
        await Voice.start(sourceLanguage);
        setIsListening(true);
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
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{paddingBottom: 20}}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="translate"
            size={28}
            color={colors.primary}
            style={styles.titleIcon}
          />
          <Text style={styles.headerTitle}>Traducteur d&apos;Urgence</Text>
        </View>
        <View style={styles.connectionStatus}>
          <MaterialCommunityIcons
            name={isConnected ? 'wifi' : 'wifi-off'}
            size={18}
            color={isConnected ? colors.success : colors.error}
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'En ligne' : 'Hors ligne'}
          </Text>
        </View>
      </View>

      {/* Sélecteurs de langue */}
      <View style={styles.languageSelectors}>
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
                  Tts.speak("");
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
      </View>

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
      
      {/* Texte reconnu et traduit */}
      <View style={styles.textContainer}>
        <View style={styles.recognizedTextContainer}>
          <View style={styles.textLabelContainer}>
            <MaterialCommunityIcons name="microphone" size={18} color={colors.primary} style={styles.textLabelIcon} />
            <Text style={styles.textLabel}>Texte reconnu</Text>
          </View>
          <View style={styles.textContentCard}>
            <Text style={styles.recognizedText}>{spokenText || "Appuyez sur le bouton pour parler..."}</Text>
          </View>
        </View>

        <View style={styles.translatedTextContainer}>
          <View style={styles.textLabelContainer}>
            <MaterialCommunityIcons name="translate" size={18} color={colors.primary} style={styles.textLabelIcon} />
            <Text style={styles.textLabel}>Traduction</Text>
          </View>
          <View style={styles.textContentCard}>
            {isTranslating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Traduction en cours...</Text>
              </View>
            ) : (
              <Text style={styles.translatedText}>{translatedText || "La traduction apparaîtra ici..."}</Text>
            )}
          </View>
        </View>
      </View>
      
      {/* Bouton d'enregistrement */}
      <View style={styles.recordButtonContainer}>
        <TouchableOpacity style={[styles.recordButton, isListening && styles.recordingButton]} onPress={toggleListening} disabled={isTranslating} activeOpacity={0.7}>
          <View style={styles.recordButtonInner}>
            <MaterialCommunityIcons name={isListening ? "stop" : "microphone"} size={36} color="#fff" />
          </View>
        </TouchableOpacity>
        {isListening && (
          <View style={styles.recordingStatusContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.recordingText}>Écoute en cours...</Text>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;
