import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Collapsible } from '@/components/Collapsible';
import Tts from 'react-native-tts';
import { Picker } from '@react-native-picker/picker';
import { translateText, LANGUAGES } from '../../services/translationService';

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
          
          // D'abord configurer la langue
          Tts.setDefaultLanguage(langCode);
          
          // Lancer la synthèse vocale
          Tts.speak(phrase);
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
          highVisibilityMode && styles.highVisibilityCard,
          wasLastPlayed && !isActive && styles.lastPlayedCard
        ]}
        onPress={() => handleEmergencyPhrase(phrase)}
        activeOpacity={0.7}
      >
        <View style={styles.phraseContent}>
          <Text style={[
            styles.phraseText,
            highVisibilityMode && styles.highVisibilityText
          ]}>
            {phrase.fr}
          </Text>
          <Text style={[
            styles.translationText,
            isActive && styles.activeTranslation,
            highVisibilityMode && styles.highVisibilityTranslation
          ]}>
            {isActive ? 
              <>
                <MaterialCommunityIcons name="translate" size={16} color="#FF9800" />
                {" Traduction en cours..."}
              </> : 
              (phrase.translations[targetLanguage] || "Traduction non disponible")
            }
          </Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.speakButton,
            isActive && styles.activeSpeakButton,
            highVisibilityMode && styles.highVisibilitySpeakButton
          ]}
          onPress={() => speakPhrase(phrase.fr, 'fr')}
        >
          <MaterialCommunityIcons 
            name={isActive ? "volume-vibrate" : "volume-high"} 
            size={highVisibilityMode ? 32 : 24} 
            color={isActive ? "#FF9800" : (highVisibilityMode ? "#FFFFFF" : "#0066CC")} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, highVisibilityMode && styles.highVisibilityContainer]}>
      <View style={[styles.header, highVisibilityMode && styles.highVisibilityHeader]}>
        <View style={styles.headerGradient} />
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons 
                name="translate" 
                size={28} 
                color={highVisibilityMode ? "#FF9800" : "#FFFFFF"} 
                style={styles.titleIcon}
              />
              <Text style={[styles.headerTitle, highVisibilityMode && styles.highVisibilityTitle]}>Phrases d&apos;urgence</Text>
            </View>
            
            {/* Bouton de mode haute visibilité */}
            <TouchableOpacity 
              style={[styles.modeButton, highVisibilityMode && styles.activeModeButton]}
              onPress={() => setHighVisibilityMode(!highVisibilityMode)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={highVisibilityMode ? "eye-outline" : "eye"} 
                size={22} 
                color={highVisibilityMode ? "#FFFFFF" : "#333333"} 
              />
              <Text style={[styles.modeButtonText, highVisibilityMode && styles.activeModeButtonText]}>
                {highVisibilityMode ? "Standard" : "Contraste"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Sélecteur de langue */}
          <View style={styles.languageSelector}>
            <Text style={[styles.languageLabel, highVisibilityMode && styles.highVisibilityText]}>Langue:</Text>
            <View style={[styles.pickerContainer, highVisibilityMode && styles.highVisibilityPickerContainer]}>
              <Picker
                selectedValue={targetLanguage}
                style={styles.picker}
                onValueChange={(value) => setTargetLanguage(value)}
                dropdownIconColor="#4361ee"
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
                  color="#0066CC" 
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
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
    paddingHorizontal: 15,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    color: '#FFFFFF',
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    maxHeight: 45,
  },
  picker: {
    height: 45,
    width: '100%',
    color: '#FFFFFF',
  },
  
  // Styles pour le mode haute visibilité
  highVisibilityContainer: {
    backgroundColor: '#121212',
  },
  highVisibilityHeader: {
    backgroundColor: '#000000',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  highVisibilityTitle: {
    color: '#FF9800',
    fontSize: 24,
    fontWeight: 'bold',
    // Suppression de textShadow qui n'est pas supporté en React Native
  },
  highVisibilityText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  highVisibilityPickerContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  highVisibilityCard: {
    backgroundColor: '#1e1e1e',
    borderColor: '#FF9800',
    borderWidth: 2,
    marginVertical: 10,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  highVisibilityTranslation: {
    color: '#FFFFFF',
    fontSize: 18,
    // Suppression de textShadow qui n'est pas supporté en React Native
  },
  highVisibilitySpeakButton: {
    backgroundColor: '#FF9800',
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  
  // Style pour le titre de catégorie
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  
  // Styles pour les éléments actifs
  activeCard: {
    borderColor: '#4361ee',
    borderWidth: 2,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    transform: [{ scale: 1.02 }],
  },
  lastPlayedCard: {
    borderColor: '#4361ee',
    borderWidth: 1,
    backgroundColor: 'rgba(67, 97, 238, 0.02)',
  },
  activeTranslation: {
    color: '#4361ee',
    fontWeight: 'bold',
  },
  activeSpeakButton: {
    backgroundColor: '#3b82f6',
    transform: [{ scale: 1.1 }],
  },
  
  // Bouton de mode
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeModeButton: {
    backgroundColor: '#FF9800',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeModeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    position: 'relative',
    backgroundColor: '#4361ee',
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 10,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4361ee',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    opacity: 0.9,
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  phrasesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  phraseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f2f6',
  },
  phraseContent: {
    flex: 1,
  },
  phraseText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2d3748',
    letterSpacing: 0.3,
  },
  translationText: {
    fontSize: 16,
    color: '#718096',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  speakButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4361ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    elevation: 4,
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
});
