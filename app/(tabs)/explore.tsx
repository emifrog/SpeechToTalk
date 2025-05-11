import { Collapsible } from '@/components/Collapsible';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LANGUAGES, translateText } from '../../services/translationService';

// Import conditionnels pour éviter les erreurs dans les environnements non compatibles
let Tts: any = null;

// Vérifier si nous sommes dans un environnement web
const isWeb = Platform.OS === 'web';

// Créer une implémentation factice pour les environnements non compatibles
const createMockTts = () => ({
  speak: (text: string) => {
    console.log('Mock TTS would speak:', text);
    // Utiliser l'API Web Speech si disponible dans l'environnement web
    if (isWeb && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Web Speech API error:', error);
      }
    }
    return Promise.resolve();
  },
  setDefaultLanguage: (lang: string) => {
    console.log('Mock TTS would set language to:', lang);
    return Promise.resolve();
  },
  addEventListener: () => {},
  removeEventListener: () => {},
});

// Importer le module réel seulement si nous ne sommes pas sur le web
if (!isWeb) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Tts = require('react-native-tts').default;
  } catch (error) {
    console.warn('Could not load TTS module:', error);
  }
}

// Si le module n'a pas pu être chargé, utiliser l'implémentation factice
if (!Tts) Tts = createMockTts();

// Type pour les phrases d&apos;urgence
interface EmergencyPhrase {
  fr: string;
  translations: Record<string, string>;
}

// Phrases d&apos;urgence par catégorie
const EMERGENCY_PHRASES: Record<string, EmergencyPhrase[]> = {
  medical: [
    { fr: "Où avez-vous mal ?", translations: { en: "Where does it hurt?" } },
    { fr: "Avez-vous des difficultés à respirer ?", translations: { en: "Do you have trouble breathing?" } },
    { fr: "Êtes-vous allergique à des médicaments ?", translations: { en: "Are you allergic to any medications?" } },
    { fr: "Prenez-vous des médicaments ?", translations: { en: "Are you taking any medications?" } },
    { fr: "Avez-vous des antécédents médicaux ?", translations: { en: "Do you have any medical history?" } },
    { fr: "Depuis quand ressentez-vous cette douleur ?", translations: { en: "How long have you been feeling this pain?" } },
    { fr: "Avez-vous perdu connaissance ?", translations: { en: "Did you lose consciousness?" } },
  ],
  fire: [
    { fr: "Y a-t-il d&apos;autres personnes à l&apos;intérieur ?", translations: { en: "Are there other people inside?" } },
    { fr: "Combien de personnes sont à l&apos;intérieur ?", translations: { en: "How many people are inside?" } },
    { fr: "Où se trouvent-elles ?", translations: { en: "Where are they?" } },
    { fr: "Y a-t-il des produits dangereux à l&apos;intérieur ?", translations: { en: "Are there any hazardous materials inside?" } },
    { fr: "Depuis combien de temps l&apos;incendie a-t-il commencé ?", translations: { en: "How long has the fire been burning?" } },
  ],
  reassurance: [
    { fr: "Nous sommes là pour vous aider.", translations: { en: "We are here to help you." } },
    { fr: "Restez calme, les secours sont là.", translations: { en: "Stay calm, help is here." } },
    { fr: "Tout va bien se passer.", translations: { en: "Everything will be fine." } },
    { fr: "Nous allons prendre soin de vous.", translations: { en: "We will take care of you." } },
    { fr: "Les secours sont en route.", translations: { en: "Help is on the way." } },
  ],
  evacuation: [
    { fr: "Nous devons évacuer le bâtiment.", translations: { en: "We need to evacuate the building." } },
    { fr: "Suivez-moi, s&apos;il vous plaît.", translations: { en: "Please follow me." } },
    { fr: "Ne prenez pas l&apos;ascenseur.", translations: { en: "Do not use the elevator." } },
    { fr: "Utilisez les escaliers.", translations: { en: "Use the stairs." } },
    { fr: "Restez baissé pour éviter la fumée.", translations: { en: "Stay low to avoid the smoke." } },
  ],
  general: [
    { fr: "Comment vous appelez-vous ?", translations: { en: "What is your name?" } },
    { fr: "Comprenez-vous ce que je dis ?", translations: { en: "Do you understand what I'm saying?" } },
    { fr: "Pouvez-vous parler plus lentement ?", translations: { en: "Can you speak more slowly?" } },
    { fr: "Avez-vous besoin d'un interprète ?", translations: { en: "Do you need an interpreter?" } },
    { fr: "Avez-vous un téléphone ?", translations: { en: "Do you have a phone?" } },
    { fr: "Pouvez-vous appeler quelqu'un qui parle français ?", translations: { en: "Can you call someone who speaks French?" } },
  ],
};

// Type pour les icônes Material Community
type MaterialCommunityIconName = 'medical-bag' | 'fire' | 'hand-heart' | 'exit-run' | 'comment-question';

// Type pour les catégories
interface Category {
  id: string;
  name: string;
  icon: MaterialCommunityIconName;
}

// Catégories avec icônes
const CATEGORIES: Category[] = [
  { id: 'medical', name: 'Médical', icon: 'medical-bag' },
  { id: 'fire', name: 'Incendie', icon: 'fire' },
  { id: 'reassurance', name: 'Réconfort', icon: 'hand-heart' },
  { id: 'evacuation', name: 'Évacuation', icon: 'exit-run' },
  { id: 'general', name: 'Général', icon: 'comment-question' },
];

export default function EmergencyPhrasesScreen() {
  const [translatingPhrase, setTranslatingPhrase] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [highVisibilityMode, setHighVisibilityMode] = useState(false);
  const [lastPlayedPhrase, setLastPlayedPhrase] = useState<string | null>(null);
  
  // Fonction pour prononcer une phrase
  const speakPhrase = async (phrase: string, langCode: string) => {
    try {
      // Pour react-native-tts, nous devons utiliser speak directement
      // car setLanguage n'est pas disponible sur tous les appareils
      
      // Prononcer la phrase avec la langue spécifiée
      const speakPromise = new Promise<void>((resolve, reject) => {
        try {
          // Configurer l'écouteur d'événement avant de parler
          const finishHandler = () => {
            Tts.removeEventListener('tts-finish', finishHandler);
            resolve();
          };
          
          const errorHandler = (err: any) => {
            Tts.removeEventListener('tts-error', errorHandler);
            reject(err);
          };
          
          // Attendre la fin de la synthèse vocale
          Tts.addEventListener('tts-finish', finishHandler);
          Tts.addEventListener('tts-error', errorHandler);
          
          // Vérifier si Tts est disponible
          if (!Tts) {
            console.error('TTS module is not available');
            reject(new Error('TTS module is not available'));
            return;
          }
          
          // D'abord configurer la langue si la méthode existe
          if (typeof Tts.setDefaultLanguage === 'function') {
            try {
              Tts.setDefaultLanguage(langCode);
            } catch (langError) {
              console.warn('Error setting TTS language:', langError);
            }
          }
          
          // Lancer la synthèse vocale si la méthode existe
          if (typeof Tts.speak === 'function') {
            Tts.speak(phrase);
          } else {
            console.error('TTS speak function is not available');
            reject(new Error('TTS speak function is not available'));
          }
        } catch (innerError) {
          reject(innerError);
        }
      });
      
      // Attendre que la promesse soit résolue
      await speakPromise;
      return;
    } catch (error) {
      console.error('TTS error:', error);
      Alert.alert('Erreur', 'Impossible de prononcer la phrase.');
    }
  };

  // Fonction pour gérer la lecture d'une phrase d'urgence
  const handleEmergencyPhrase = async (phrase: EmergencyPhrase) => {
    // Ne rien faire si déjà en train de traduire/parler
    if (isTranslating || lastPlayedPhrase === phrase.fr) return;
    
    setTranslatingPhrase(phrase.fr);
    setLastPlayedPhrase(phrase.fr);
    
    // Ajouter un retour haptique si disponible
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        // Import dynamique pour expo-haptics
        import('expo-haptics').then(Haptics => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }).catch(() => {
          console.log('Haptics not available');
        });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
    
    // D'abord en français
    await speakPhrase(phrase.fr, 'fr');
    
    // Puis dans la langue cible
    try {
      // Vérifier si nous avons déjà une traduction pour cette phrase
      let translatedPhrase = phrase.translations[targetLanguage];
      
      // Si pas de traduction prédéfinie, utiliser l'API de traduction
      if (!translatedPhrase) {
        setIsTranslating(true);
        translatedPhrase = await translateText(phrase.fr, 'fr', targetLanguage);
        
        // Vérifier si la traduction est une erreur
        if (translatedPhrase.startsWith('[') && translatedPhrase.endsWith(']')) {
          // L'erreur a déjà été gérée par le service de traduction
          // Ne pas prononcer les messages d'erreur
          setIsTranslating(false);
          setTranslatingPhrase('');
          return;
        }
        
        setIsTranslating(false);
      }
      
      // Prononcer la phrase traduite
      await speakPhrase(translatedPhrase, targetLanguage);
    } catch (error) {
      console.error('Translation or TTS error:', error);
      Alert.alert('Erreur', 'Impossible de traduire ou prononcer la phrase.');
    } finally {
      setTranslatingPhrase(null);
    }
  };

  // Rendu d'une phrase
  const renderPhrase = (phrase: EmergencyPhrase, index: number) => {
    const isActive = translatingPhrase === phrase.fr;
    const wasLastPlayed = lastPlayedPhrase === phrase.fr;
    
    return (
      <TouchableOpacity 
        key={index} 
        style={[
          styles.phraseCard,
          isActive && styles.activeCard,
          wasLastPlayed && !isActive && styles.lastPlayedCard
        ]}
        onPress={() => handleEmergencyPhrase(phrase)}
        activeOpacity={0.7}
      >
        <View style={styles.phraseContent}>
          <Text style={styles.phraseText}>
            {phrase.fr}
          </Text>
          <Text style={[
            styles.translationText,
            isActive && styles.activeTranslation
          ]}>
            {isActive ? 
              <>
                <MaterialCommunityIcons name="translate" size={16} color="#00838f" />
                {" Traduction en cours..."}
              </> : 
              (phrase.translations[targetLanguage] || "Traduction non disponible")
            }
          </Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.speakButton,
            isActive && styles.activeSpeakButton
          ]}
          onPress={() => speakPhrase(phrase.fr, 'fr')}
        >
          <MaterialCommunityIcons 
            name={isActive ? "volume-vibrate" : "volume-high"} 
            size={24} 
            color={isActive ? "#FF9800" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, highVisibilityMode && styles.highVisibilityContainer]}>
      <View style={[styles.header, highVisibilityMode && styles.highVisibilityHeader]}>
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons 
                name="message-text" 
                size={30} 
                color="#00838f" 
                style={styles.titleIcon}
              />
              <Text style={styles.headerTitle}>Phrases d&apos;urgence</Text>
            </View>
          </View>
          
          {/* Sélecteur de langue */}
          <View style={styles.languageSelector}>
            <Text style={styles.languageLabel}>Langue:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={targetLanguage}
                style={styles.picker}
                onValueChange={(value) => setTargetLanguage(value)}
                dropdownIconColor="#00838f"
              >
                {LANGUAGES.filter(lang => lang.code !== 'fr').map((lang) => (
                  <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {CATEGORIES.map((category) => (
          <Collapsible 
            key={category.id} 
            title={
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons 
                  name={category.icon} 
                  size={24} 
                  color="#00838f" 
                />
                <Text style={styles.categoryTitle}>{category.name}</Text>
              </View>
            }
          >
            <View style={styles.phrasesContainer}>
              {EMERGENCY_PHRASES[category.id].map((phrase, index) => 
                renderPhrase(phrase, index)
              )}
            </View>
          </Collapsible>
        ))}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Appuyez sur une phrase pour l&apos;écouter en français puis dans la langue sélectionnée.
          </Text>
          <Text style={styles.infoText}>
            Ces phrases sont conçues pour aider les sapeurs-pompiers à communiquer avec des personnes ne parlant pas français lors d&apos;interventions d&apos;urgence.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Styles de base
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00838f',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    color: '#00838f',
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f4f8',
    maxHeight: 45,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    height: 45,
    width: '100%',
    color: '#333333',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  phrasesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  phraseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  phraseContent: {
    flex: 1,
    marginRight: 10,
  },
  phraseText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  translationText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  speakButton: {
    backgroundColor: '#00838f',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  activeCard: {
    borderColor: '#00838f',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 131, 143, 0.05)',
  },
  lastPlayedCard: {
    borderColor: '#00838f',
    borderWidth: 1,
    backgroundColor: 'rgba(0, 131, 143, 0.02)',
  },
  activeTranslation: {
    color: '#00838f',
    fontWeight: 'bold',
  },
  activeSpeakButton: {
    backgroundColor: '#FF9800',
    transform: [{ scale: 1.1 }],
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
    lineHeight: 20,
  },
  // Styles pour le mode haute visibilité (conservés pour compatibilité)
  highVisibilityContainer: {
    backgroundColor: '#121212',
  },
  highVisibilityHeader: {
    backgroundColor: '#000000',
  },
  highVisibilityTitle: {
    color: '#FF9800',
  },
  highVisibilityText: {
    color: '#FFFFFF',
  },
  highVisibilityPickerContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  highVisibilityCard: {
    backgroundColor: '#1e1e1e',
  },
  highVisibilityTranslation: {
    color: '#FFFFFF',
  },
  highVisibilitySpeakButton: {
    backgroundColor: '#FF9800',
  },
  // Styles pour les boutons de mode (conservés pour compatibilité)
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
  },
  modeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FFFFFF',
  },
  activeModeButton: {
    backgroundColor: '#FF9800',
  },
  activeModeButtonText: {
    color: '#FFFFFF',
  }
});
