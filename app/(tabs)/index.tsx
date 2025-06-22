import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// Composants optimisés
import {
  MemoizedLanguagePicker,
  MemoizedMessageBubble,
} from '../../components/optimized/MemoizedComponents';

// Hooks d'optimisation
import { useOptimizedHomeScreenStyles } from '../../hooks/useHomeScreenOptimization';

// Services et utilitaires
import { Colors } from '../../constants/Colors';
import { detectLanguageFromText } from '../../services/languageDetectionService';
import { LANGUAGES, translateText, downloadLanguage } from '../../services/translationService';

// Phrases d'urgence locales
const emergencyPhrases = [
  { fr: "J'ai besoin d'aide", en: "I need help" },
  { fr: "Appelez un médecin", en: "Call a doctor" },
  { fr: "Où est l'hôpital ?", en: "Where is the hospital?" },
  { fr: "Je ne me sens pas bien", en: "I don't feel well" },
  { fr: "Au secours !", en: "Help!" }
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
  en: string;
}

// Services factices pour éviter les erreurs
const conversationModeService = {
  isActive: () => false,
  getCurrentParticipant: () => null,
  nextParticipant: () => {},
  getParticipants: () => [],
  setActive: (active: boolean) => {},
  processTextInput: (text: string) => text
};

function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const styles = useOptimizedHomeScreenStyles(colorScheme);

  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('fr');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [downloadedLanguages, setDownloadedLanguages] = useState<string[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [conversationModeActive, setConversationModeActive] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);

  // Lire le texte traduit (avec useCallback pour éviter les dépendances cycliques)
  const speakText = useCallback(async (text: string) => {
    try {
      // Dans une vraie application, nous utiliserions une API de synthèse vocale plus complète
      // Pour l'exemple, nous utilisons simplement console.log sans options spécifiques
      console.log(text);
    } catch (error) {
      console.error('TTS error:', error);
    }
  }, []);

  // Gérer le changement de mode conversation
  const handleConversationModeToggle = useCallback(() => {
    const newState = !conversationModeActive;
    setConversationModeActive(newState);
    conversationModeService.setActive(newState);
    
    // Si on active le mode conversation, activer aussi la détection automatique de langue
    if (newState && !autoDetectLanguage) {
      setAutoDetectLanguage(true);
    }
  }, [conversationModeActive, autoDetectLanguage]);

  // Utiliser useCallback pour éviter les dépendances cycliques
  const translateTextCallback = useCallback(async (text: string) => {
    if (!text) return;
    
    setIsTranslating(true);
    
    try {
      // Si la détection automatique est activée, détecter la langue du texte
      let sourceLang = sourceLanguage;
      
      if (autoDetectLanguage) {
        try {
          const detectionResult = await detectLanguageFromText(text);
          if (detectionResult.isReliable) {
            sourceLang = detectionResult.detectedLanguage;
            setDetectedLanguage(sourceLang);
            // Mettre à jour l'état de la langue source pour l'interface utilisateur
            setSourceLanguage(sourceLang);
            
            // Si le mode conversation est actif, traiter le texte avec le service de conversation
            if (conversationModeActive) {
              await conversationModeService.processTextInput(text);
            }
          } else {
            // Si la détection n'est pas fiable, utiliser la langue source définie
            setDetectedLanguage(null);
          }
        } catch (detectionError) {
          console.error('Language detection error:', detectionError);
          setDetectedLanguage(null);
        }
      } else {
        setDetectedLanguage(null);
      }
      
      // Utiliser notre service de traduction amélioré avec l'API Google Cloud Translation
      const translatedResult = await translateText(text, sourceLang, targetLanguage);
      
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
          sourceLanguage: autoDetectLanguage && detectedLanguage ? detectedLanguage : sourceLanguage,
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
  }, [sourceLanguage, targetLanguage, speakText, autoDetectLanguage, detectedLanguage, conversationModeActive]);

  // Initialisation
  useEffect(() => {
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

    loadDownloadedLanguages();
  }, []);

  // Démarrer/arrêter la reconnaissance vocale
  const toggleListening = async () => {
    try {
      if (isListening) {
        // Arrêter la reconnaissance vocale
        setIsListening(false);
      } else {
        // Démarrer la reconnaissance vocale
        setSpokenText('');
        console.log('Starting voice recognition in language:', sourceLanguage);
        setIsListening(true);
      }
    } catch (error) {
      console.error('Toggle listening error:', error);
    }
  };

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
  const handleLanguageDownload = async (langCode: string) => {
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

  // Echanger les langues source et cible
  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollContainer} contentContainerStyle={{paddingBottom: 20}}>
      {/* Mode conversation */}
      <View style={styles.conversationModeContainer}>
        <TouchableOpacity 
          style={styles.conversationModeButton}
          onPress={handleConversationModeToggle}
        >
          <Ionicons name="chatbubbles" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Sélecteurs de langue */}
      <View style={styles.languageSelectors}>
        <View style={styles.languageCard}>
          <View style={styles.languageSelector}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MemoizedLanguagePicker
                selectedLanguage={sourceLanguage}
                onLanguageChange={(value: string) => {
                  setSourceLanguage(value);
                  setDetectedLanguage(null);
                }}
                languages={LANGUAGES}
                style={[styles.picker, autoDetectLanguage ? {opacity: 0.7} : {}]}
                colors={colors}
              />
              <TouchableOpacity
                style={styles.autoDetectButton}
                onPress={() => setAutoDetectLanguage(!autoDetectLanguage)}
              >
                <Ionicons name="scan" size={12} color={colors.primary} />
                <Text style={styles.autoDetectText}>Auto</Text>
              </TouchableOpacity>
            </View>
            {detectedLanguage && (
              <Text style={styles.detectedLanguageText}>
                Langue détectée: {LANGUAGES.find(l => l.code === detectedLanguage)?.name}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.swapButton}
          onPress={swapLanguages}
        >
          <Ionicons name="swap-vertical" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.languageCard}>
          <View style={styles.languageSelector}>
            <Text style={styles.languageLabel}>À:</Text>
            <View style={styles.pickerContainer}>
              <MemoizedLanguagePicker
                selectedLanguage={targetLanguage}
                onLanguageChange={(value: string) => {
                  setTargetLanguage(value);
                  if (spokenText) {
                    translateText(spokenText, sourceLanguage, value).then(result => {
                      setTranslatedText(result);
                    });
                  }
                }}
                languages={LANGUAGES}
                style={styles.picker}
                colors={colors}
              />
            </View>
            {!downloadedLanguages.includes(targetLanguage) && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleLanguageDownload(targetLanguage)}
              >
                <Ionicons name="download" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Phrases d'urgence */}
      <View style={styles.phrasesContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medical" size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Phrases d&apos;urgence</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {emergencyPhrases.map((phrase, index) => (
            <TouchableOpacity
              key={index}
              style={styles.phraseButton}
              onPress={() => handleEmergencyPhrase(phrase)}
            >
              <Ionicons name="warning" size={16} color={colors.secondary} style={styles.phraseIcon} />
              <Text style={styles.phraseText}>{phrase.fr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Zone de discussion */}
      <View style={styles.chatContainer}>
        <View style={styles.conversationContainer}>
          {spokenText ? (
            <MemoizedMessageBubble
              text={spokenText}
              isSource={true}
              language={sourceLanguage}
              colors={colors}
            />
          ) : (
            <View style={styles.emptyConversationContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={colorScheme === 'dark' ? '#4a5568' : '#d1d5db'} />
              <Text style={styles.emptyConversationText}>
                Appuyez sur le microphone pour commencer à parler
              </Text>
            </View>
          )}

          {isTranslating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Traduction en cours...</Text>
            </View>
          ) : translatedText ? (
            <MemoizedMessageBubble
              text={translatedText}
              isSource={false}
              language={targetLanguage}
              onSpeak={() => speakText(translatedText)}
              colors={colors}
            />
          ) : null}
        </View>

        <View style={styles.toolbarContainer}>
          <TouchableOpacity 
            style={styles.micButton}
            onPress={toggleListening}
          >
            <Ionicons name={isListening ? 'mic-off' : 'mic'} size={28} color="#fff" />
          </TouchableOpacity>
          
          {(spokenText || translatedText) && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSpokenText('');
                setTranslatedText('');
              }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {isListening && (
          <View style={styles.recordingStatusContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.recordingText}>Écoute en cours...</Text>
          </View>
        )}
      </View>

      {/* Historique de conversation */}
      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>Historique de conversation</Text>
      </View>
      <View style={styles.historyContainer}>
        <ScrollView 
          style={styles.historyScrollView} 
          showsVerticalScrollIndicator={false}
        >
          {conversationHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Ionicons name="chatbubbles-outline" size={40} color={colorScheme === 'dark' ? '#4a5568' : '#d1d5db'} />
              <Text style={[styles.emptyHistoryText, {fontWeight: '400'}]}>
                Aucune traduction dans l&apos;historique
              </Text>
            </View>
          ) : (
            conversationHistory.map((entry, index) => (
              <View key={index} style={styles.historyEntry}>
                <View style={styles.historyEntryHeader}>
                  <View style={styles.historyTimeContainer}>
                    <Ionicons name="time-outline" size={14} color={colorScheme === 'dark' ? '#a0aec0' : '#718096'} />
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

export default React.memo(HomeScreen);
