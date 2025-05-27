import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GOOGLE_CLOUD_API_KEY } from '../config';
import { Theme } from '../constants/Theme';
import { LANGUAGES, translateText } from '../services/translationService';
import { Collapsible } from './Collapsible';

// Service de reconnaissance de texte utilisant l'API Google Cloud Vision
const recognizeTextFromImage = async (imageUri: string): Promise<string> => {
  try {
    // Vérifier la connexion Internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('Pas de connexion Internet. Veuillez vous connecter et réessayer.');
    }

    // Pour les images locales, nous devons d'abord les convertir en base64
    let base64Image: string;
    
    if (Platform.OS === 'web') {
      // Simuler la reconnaissance de texte sur le web
      return 'Texte simulé pour l\'environnement web. La reconnaissance de texte n\'est pas disponible sur le web.';
    } else {
      // Lire l'image en base64
      base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    // Préparer la requête pour l'API Google Cloud Vision
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_API_KEY}`;
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    // Envoyer la requête à l'API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Vérifier si la requête a réussi
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur API Vision: ${errorData.error?.message || 'Erreur inconnue'}`);
    }

    // Analyser la réponse
    const data = await response.json();
    
    // Extraire le texte de la réponse
    const textAnnotations = data.responses[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      return '';
    }
    
    // Le premier élément contient le texte complet
    return textAnnotations[0].description || '';
  } catch (error) {
    console.error('Error recognizing text:', error);
    throw error;
  }
};

// Types de médias supportés
type MediaType = 'image' | 'document' | null;

// Interface pour les résultats de la reconnaissance de texte
interface RecognitionResult {
  text: string;
  translation?: string;
  sourceLang: string;
  targetLang: string;
}

const MediaTranslator: React.FC = () => {
  // États
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sourceLang, setSourceLang] = useState<string>('fr');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [recognitionHistory, setRecognitionHistory] = useState<RecognitionResult[]>([]);

  // Demander les permissions pour accéder à la galerie et à l'appareil photo
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          Alert.alert(
            'Permissions requises',
            'Nous avons besoin d\'accéder à votre appareil photo et à votre galerie pour cette fonctionnalité.',
            [{ text: 'OK' }]
          );
        }
      }
    })();
  }, []);

  // Fonction pour prendre une photo avec l'appareil photo
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setMediaUri(selectedAsset.uri);
        setMediaType('image');
        processImage(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo.');
    }
  };

  // Fonction pour sélectionner une image depuis la galerie
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setMediaUri(selectedAsset.uri);
        setMediaType('image');
        processImage(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image.');
    }
  };

  // Fonction pour sélectionner un document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setMediaUri(selectedAsset.uri);
        setMediaType('document');
        processDocument(selectedAsset.uri, selectedAsset.mimeType || '');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner un document.');
    }
  };

  // Fonction pour traiter une image et extraire le texte
  const processImage = async (uri: string) => {
    setIsProcessing(true);
    setRecognizedText('');
    setTranslatedText('');

    try {
      // Utiliser l'API Google Cloud Vision pour extraire le texte de l'image
      const extractedText = await recognizeTextFromImage(uri);
      
      if (extractedText) {
        setRecognizedText(extractedText);
        
        // Traduire le texte extrait
        const translated = await translateText(extractedText, sourceLang, targetLang);
        setTranslatedText(translated);
        
        // Ajouter au historique
        addToHistory(extractedText, translated);
      } else {
        Alert.alert('Information', 'Aucun texte n\'a été détecté dans cette image.');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Erreur', 'Impossible de traiter l\'image: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour traiter un document et extraire le texte
  const processDocument = async (uri: string, mimeType: string) => {
    setIsProcessing(true);
    setRecognizedText('');
    setTranslatedText('');

    try {
      let text = '';
      
      // Traitement différent selon le type de document
      if (mimeType === 'text/plain') {
        // Lire le contenu du fichier texte
        text = await FileSystem.readAsStringAsync(uri);
      } else if (mimeType === 'application/pdf') {
        // Pour les PDF, nous informons l'utilisateur de la limitation
        Alert.alert(
          'Limitation',
          'La lecture directe du contenu des PDF n\'est pas encore prise en charge. Essayez de prendre une capture d\'écran du PDF et d\'utiliser l\'option d\'image à la place.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }
      
      if (text) {
        setRecognizedText(text);
        
        // Traduire le texte extrait
        const translated = await translateText(text, sourceLang, targetLang);
        setTranslatedText(translated);
        
        // Ajouter au historique
        addToHistory(text, translated);
      } else {
        Alert.alert('Information', 'Aucun texte n\'a été détecté dans ce document.');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      Alert.alert('Erreur', 'Impossible de traiter le document.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour ajouter un résultat à l'historique
  const addToHistory = (text: string, translation: string) => {
    const newResult: RecognitionResult = {
      text,
      translation,
      sourceLang,
      targetLang,
    };
    
    // Limiter l'historique à 10 éléments
    setRecognitionHistory(prev => [newResult, ...prev.slice(0, 9)]);
  };

  // Fonction pour effacer les résultats actuels
  const clearResults = () => {
    setMediaUri(null);
    setMediaType(null);
    setRecognizedText('');
    setTranslatedText('');
  };

  // Fonction pour traduire à nouveau avec une langue cible différente
  const retranslate = React.useCallback(async () => {
    if (!recognizedText) return;
    
    setIsProcessing(true);
    try {
      const translated = await translateText(recognizedText, sourceLang, targetLang);
      setTranslatedText(translated);
      
      // Mettre à jour l'historique
      const updatedHistory = [...recognitionHistory];
      if (updatedHistory.length > 0) {
        updatedHistory[0] = {
          ...updatedHistory[0],
          translation: translated,
          targetLang,
        };
        setRecognitionHistory(updatedHistory);
      }
    } catch (error) {
      console.error('Error retranslating:', error);
      Alert.alert('Erreur', 'Impossible de traduire le texte.');
    } finally {
      setIsProcessing(false);
    }
  }, [recognizedText, sourceLang, targetLang, recognitionHistory]);

  // Effet pour retraduire lorsque la langue cible change
  useEffect(() => {
    if (recognizedText) {
      retranslate();
    }
  }, [targetLang, recognizedText, retranslate]);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      
      {/* Sélection des langues */}
      <View style={styles.languageCard}>
        <View style={styles.languageSelectionContainerVertical}>
          {/* Sélecteur de langue source */}
          <View style={styles.languagePickerContainerVertical}>
            <Text style={styles.languageLabel}>De :</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sourceLang}
                style={styles.languagePicker}
                onValueChange={(itemValue) => setSourceLang(itemValue)}
              >
                {LANGUAGES.map((lang) => (
                  <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Bouton d'échange de langues */}
          <View style={styles.swapButtonContainer}>
            <TouchableOpacity 
              style={styles.swapLanguageButtonVertical}
              onPress={() => {
                // Échanger les langues source et cible
                const temp = sourceLang;
                setSourceLang(targetLang);
                setTargetLang(temp);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="swap-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Sélecteur de langue cible */}
          <View style={styles.languagePickerContainerVertical}>
            <Text style={styles.languageLabel}>Vers :</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={targetLang}
                style={styles.languagePicker}
                onValueChange={(itemValue) => setTargetLang(itemValue)}
              >
                {LANGUAGES.map((lang) => (
                  <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>
      
      {/* Boutons d'action */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={takePhoto}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="camera" size={28} color="#fff" />
          <Text style={styles.actionButtonText}>Prendre une photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={pickImage}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="image" size={28} color="#fff" />
          <Text style={styles.actionButtonText}>Choisir une image</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={pickDocument}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="file-document" size={28} color="#fff" />
          <Text style={styles.actionButtonText}>Choisir un document</Text>
        </TouchableOpacity>
      </View>
      
      {/* Affichage de l'image sélectionnée */}
      {mediaUri && mediaType === 'image' && (
        <View style={styles.mediaPreviewContainer}>
          <Image
            source={{ uri: mediaUri }}
            style={styles.mediaPreview}
            contentFit="cover"
          />
          <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
            <MaterialCommunityIcons name="close-circle" size={24} color="#ff4d4d" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Affichage du nom du document sélectionné */}
      {mediaUri && mediaType === 'document' && (
        <View style={styles.documentPreviewContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color="#4a6fa5" />
          <Text style={styles.documentName} numberOfLines={1} ellipsizeMode="middle">
            {mediaUri.split('/').pop()}
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
            <MaterialCommunityIcons name="close-circle" size={24} color="#ff4d4d" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Indicateur de chargement */}
      {isProcessing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6fa5" />
          <Text style={styles.loadingText}>Traitement en cours...</Text>
        </View>
      )}
      
      {/* Résultats de la reconnaissance et de la traduction */}
      {recognizedText && !isProcessing && (
        <View style={styles.resultsContainer}>
          <Collapsible 
            title="Texte détecté" 
            titleStyle={styles.collapsibleTitle}
            containerStyle={styles.collapsibleContainer}
          >
            <View style={styles.textContainer}>
              <ScrollView style={styles.textScrollView}>
                <Text style={styles.recognizedText}>{recognizedText}</Text>
              </ScrollView>
              {recognizedText.length > 0 && (
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      // Pour le web
                      navigator.clipboard?.writeText?.(recognizedText);
                    } else {
                      // Pour les plateformes mobiles
                      Alert.alert('Copié', 'Le texte a été copié dans le presse-papiers');
                    }
                  }}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color="#5b7fc0" />
                </TouchableOpacity>
              )}
            </View>
          </Collapsible>
          
          <Collapsible 
            title="Traduction" 
            titleStyle={styles.collapsibleTitle}
            containerStyle={styles.collapsibleContainer}
          >
            <View style={styles.textContainer}>
              <ScrollView style={styles.textScrollView}>
                <Text style={styles.translatedText}>{translatedText}</Text>
              </ScrollView>
              {translatedText.length > 0 && (
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      // Pour le web
                      navigator.clipboard?.writeText?.(translatedText);
                    } else {
                      // Pour les plateformes mobiles
                      Alert.alert('Copié', 'La traduction a été copiée dans le presse-papiers');
                    }
                  }}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color="#5b7fc0" />
                </TouchableOpacity>
              )}
            </View>
          </Collapsible>
        </View>
      )}
      
      {/* Historique des traductions */}
      {recognitionHistory.length > 0 && (
        <Collapsible title="Historique des traductions">
          {recognitionHistory.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyItemTitle}>
                {LANGUAGES.find(lang => lang.code === item.sourceLang)?.name} → {LANGUAGES.find(lang => lang.code === item.targetLang)?.name}
              </Text>
              <Text style={styles.historyItemText} numberOfLines={2}>{item.text}</Text>
              <Text style={styles.historyItemTranslation} numberOfLines={2}>{item.translation}</Text>
            </View>
          ))}
        </Collapsible>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
  },
  languageCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.medium,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  languageSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 20,
  },
  languageSelectionContainerVertical: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  languagePickerContainer: {
    flex: 1,
    marginHorizontal: 6,
  },
  languagePickerContainerVertical: {
    width: '100%',
    marginBottom: 10,
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Theme.colors.background,
  },
  languageLabel: {
    fontSize: Theme.typography.fontSize.md,
    marginBottom: Theme.spacing.xs,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semiBold as '600',
  },
  languagePicker: {
    height: 45,
    width: '100%',
  },
  swapLanguageButton: {
    position: 'absolute',
    bottom: -15,
    left: '50%',
    marginLeft: -20,
    backgroundColor: Theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...Theme.shadows.medium,
    elevation: 4,
  },
  swapLanguageButtonVertical: {
    backgroundColor: Theme.colors.secondary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.medium,
    elevation: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md - 2,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: Theme.spacing.xs,
    flexDirection: 'column',
    ...Theme.shadows.medium,
    transform: [{ scale: 1 }],
  },
  actionButtonText: {
    color: Theme.colors.text.onPrimary,
    fontSize: Theme.typography.fontSize.sm - 1,
    fontWeight: Theme.typography.fontWeight.semiBold as '600',
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  mediaPreviewContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  mediaPreview: {
    width: '100%',
    height: 220,
  },
  documentPreviewContainer: {
    position: 'relative',
    marginBottom: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  documentName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginVertical: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#144291',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  collapsibleContainer: {
    marginBottom: 12,
  },
  textContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  textScrollView: {
    maxHeight: 150,
    backgroundColor: '#fff',
    padding: 16,
    paddingRight: 40, // Espace pour le bouton de copie
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  copyButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f8f9fa',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#144291',
  },
  recognizedText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  translatedText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 26,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#144291',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  historyItemText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    lineHeight: 20,
  },
  historyItemTranslation: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    lineHeight: 20,
  },
});

export default MediaTranslator;
