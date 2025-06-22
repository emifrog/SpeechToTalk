import { getGoogleCloudApiKey } from '../config';
import NetInfo from '@react-native-community/netinfo';
import { LANGUAGES } from './translationService';

/**
 * Service de détection automatique de langue utilisant l'API Google Cloud Speech-to-Text
 * Ce service permet de détecter automatiquement la langue parlée lors de la reconnaissance vocale
 */

// Interface pour les résultats de détection de langue
export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
  isReliable: boolean;
  detectedText?: string; // Texte détecté lors de la reconnaissance vocale
}

/**
 * Détecte la langue d'un fichier audio en utilisant l'API Google Cloud Speech-to-Text
 * @param audioBase64 - Contenu audio encodé en base64
 * @returns Une promesse contenant le résultat de la détection de langue
 */
export const detectLanguageFromAudio = async (audioBase64: string): Promise<LanguageDetectionResult> => {
  try {
    // Vérifier la connexion Internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('Pas de connexion Internet. Veuillez vous connecter et réessayer.');
    }

    // Préparer la requête pour l'API Google Cloud Speech-to-Text
    const apiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${getGoogleCloudApiKey()}`;
    
    // Configurer la requête pour détecter la langue
    const requestBody = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'fr-FR', // Langue par défaut pour aider l'API
        model: 'default',
        alternativeLanguageCodes: LANGUAGES.map(lang => `${lang.code}-${lang.code.toUpperCase()}`).slice(0, 4), // Limité aux 4 premières langues
        enableAutomaticPunctuation: true,
        enableLanguageIdentification: true, // Activer la détection de langue
      },
      audio: {
        content: audioBase64
      }
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
      console.error('Google Speech API error:', errorData);
      throw new Error(`Erreur API Google Speech: ${errorData.error?.message || 'Erreur inconnue'}`);
    }

    // Analyser la réponse
    const data = await response.json();
    
    // Extraire les informations de détection de langue
    if (data.results && data.results.length > 0 && data.results[0].languageCode) {
      // Récupérer le code de langue (format: 'fr-FR' -> 'fr')
      const detectedLangCode = data.results[0].languageCode.split('-')[0].toLowerCase();
      
      // Récupérer le texte transcrit
      const detectedText = data.results[0].alternatives && data.results[0].alternatives[0] ? 
        data.results[0].alternatives[0].transcript : undefined;
      
      // Vérifier si la langue détectée est supportée par notre application
      const isSupported = LANGUAGES.some(lang => lang.code === detectedLangCode);
      
      return {
        detectedLanguage: isSupported ? detectedLangCode : 'fr', // Par défaut 'fr' si non supportée
        confidence: data.results[0].languageDetectionConfidence || 0.5,
        isReliable: (data.results[0].languageDetectionConfidence || 0) > 0.7,
        detectedText
      };
    }
    
    // Si aucune langue n'est détectée, retourner la langue par défaut
    return {
      detectedLanguage: 'fr',
      confidence: 0,
      isReliable: false
    };
  } catch (error) {
    console.error('Language detection error:', error);
    // En cas d'erreur, retourner la langue par défaut
    return {
      detectedLanguage: 'fr',
      confidence: 0,
      isReliable: false
    };
  }
};

/**
 * Détecte la langue d'un texte en utilisant l'API Google Cloud Translation
 * Méthode alternative si la détection audio n'est pas disponible
 * @param text - Texte à analyser
 * @returns Une promesse contenant le résultat de la détection de langue
 */
export const detectLanguageFromText = async (text: string): Promise<LanguageDetectionResult> => {
  try {
    // Vérifier la connexion Internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('Pas de connexion Internet. Veuillez vous connecter et réessayer.');
    }

    // Préparer la requête pour l'API Google Cloud Translation
    const apiUrl = `https://translation.googleapis.com/language/translate/v2/detect?key=${getGoogleCloudApiKey()}`;
    
    // Configurer la requête
    const requestBody = {
      q: text
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
      console.error('Google Translation API error:', errorData);
      throw new Error(`Erreur API Google Translation: ${errorData.error?.message || 'Erreur inconnue'}`);
    }

    // Analyser la réponse
    const data = await response.json();
    
    // Extraire les informations de détection de langue
    if (data.data && data.data.detections && data.data.detections.length > 0) {
      const detection = data.data.detections[0][0];
      const detectedLangCode = detection.language.toLowerCase();
      
      // Vérifier si la langue détectée est supportée par notre application
      const isSupported = LANGUAGES.some(lang => lang.code === detectedLangCode);
      
      return {
        detectedLanguage: isSupported ? detectedLangCode : 'fr', // Par défaut 'fr' si non supportée
        confidence: detection.confidence || 0.5,
        isReliable: (detection.confidence || 0) > 0.7 && detection.isReliable,
        detectedText: text
      };
    }
    
    // Si aucune langue n'est détectée, retourner la langue par défaut
    return {
      detectedLanguage: 'fr',
      confidence: 0,
      isReliable: false
    };
  } catch (error) {
    console.error('Language detection error:', error);
    // En cas d'erreur, retourner la langue par défaut
    return {
      detectedLanguage: 'fr',
      confidence: 0,
      isReliable: false
    };
  }
};
