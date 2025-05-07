import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { GOOGLE_CLOUD_API_KEY } from '../config/keys';

// API Google Cloud Translation
// La clé API est stockée de manière sécurisée dans ../config/keys.ts
// et ce fichier est ajouté au .gitignore pour éviter de partager la clé

// Dictionnaire de traductions prédéfinies pour la démonstration
const DEMO_TRANSLATIONS: Record<string, Record<string, string>> = {
  'fr': {
    'en': 'English',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'ar': 'العربية',
    'zh': '中文',
    'ru': 'Русский'
  },
  'Où avez-vous mal ?': {
    'en': 'Where does it hurt?',
    'es': '¿Dónde le duele?',
    'de': 'Wo haben Sie Schmerzen?',
    'it': 'Dove le fa male?',
    'ar': 'أين يؤلمك؟',
    'zh': '哪里疼？',
    'ru': 'Где у вас болит?'
  },
  'Avez-vous des difficultés à respirer ?': {
    'en': 'Do you have trouble breathing?',
    'es': '¿Tiene dificultad para respirar?',
    'de': 'Haben Sie Schwierigkeiten beim Atmen?',
    'it': 'Ha difficoltà a respirare?',
    'ar': 'هل تجد صعوبة في التنفس؟',
    'zh': '您呼吸困难吗？',
    'ru': 'У вас есть проблемы с дыханием?'
  }
};

// Liste des phrases d'urgence pour les pompiers
export const EMERGENCY_PHRASES = [
  { fr: "Où avez-vous mal ?", translations: {} },
  { fr: "Avez-vous des difficultés à respirer ?", translations: {} },
  { fr: "Y a-t-il d'autres personnes à l'intérieur ?", translations: {} },
  { fr: "Avez-vous des allergies ou prenez-vous des médicaments ?", translations: {} },
  { fr: "Nous sommes là pour vous aider.", translations: {} },
  { fr: "Restez calme, les secours sont là.", translations: {} },
];

// Interface améliorée pour le cache de traduction
interface TranslationCacheEntry {
  text: string;                // Texte original
  translation: string;         // Texte traduit
  sourceLang: string;          // Langue source
  targetLang: string;          // Langue cible
  timestamp: number;           // Horodatage de la dernière utilisation
  useCount: number;            // Nombre d'utilisations
  isEmergencyPhrase?: boolean; // Indique si c'est une phrase d'urgence prioritaire
}

// Structure du cache de traduction
interface TranslationCache {
  entries: TranslationCacheEntry[];
  lastCleanup: number;         // Dernier nettoyage du cache
  version: number;             // Version du cache pour les migrations futures
  sizeLimit: number;           // Limite de taille du cache (nombre d'entrées)
}

// Configuration du cache
const CACHE_CONFIG = {
  DEFAULT_SIZE_LIMIT: 500,     // Nombre maximum d'entrées par défaut
  CLEANUP_INTERVAL: 86400000,  // Intervalle de nettoyage (24 heures en ms)
  CACHE_VERSION: 1,            // Version actuelle du cache
  EMERGENCY_PHRASE_RETENTION: 30, // Nombre de jours de rétention pour les phrases d'urgence
  NORMAL_PHRASE_RETENTION: 7,  // Nombre de jours de rétention pour les phrases normales
};

// Clé pour stocker le cache dans AsyncStorage
const TRANSLATION_CACHE_KEY = 'translationCache_v1';

// Initialiser ou récupérer le cache de traduction
const getTranslationCache = async (): Promise<TranslationCache> => {
  try {
    const cacheJson = await AsyncStorage.getItem(TRANSLATION_CACHE_KEY);
    if (!cacheJson) {
      // Initialiser un nouveau cache si aucun n'existe
      const newCache: TranslationCache = {
        entries: [],
        lastCleanup: Date.now(),
        version: CACHE_CONFIG.CACHE_VERSION,
        sizeLimit: CACHE_CONFIG.DEFAULT_SIZE_LIMIT
      };
      return newCache;
    }
    
    const cache: TranslationCache = JSON.parse(cacheJson);
    
    // Vérifier si le cache a besoin d'être nettoyé
    if (Date.now() - cache.lastCleanup > CACHE_CONFIG.CLEANUP_INTERVAL) {
      return await cleanupCache(cache);
    }
    
    return cache;
  } catch (error) {
    console.error('Error retrieving translation cache:', error);
    // Retourner un cache vide en cas d'erreur
    return {
      entries: [],
      lastCleanup: Date.now(),
      version: CACHE_CONFIG.CACHE_VERSION,
      sizeLimit: CACHE_CONFIG.DEFAULT_SIZE_LIMIT
    };
  }
};

// Sauvegarder le cache de traduction
const saveTranslationCache = async (cache: TranslationCache): Promise<void> => {
  try {
    await AsyncStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving translation cache:', error);
  }
};

// Nettoyer le cache en supprimant les entrées expirées ou moins utilisées
const cleanupCache = async (cache: TranslationCache): Promise<TranslationCache> => {
  const now = Date.now();
  
  // Calculer la date d'expiration pour les phrases normales et d'urgence
  const normalExpirationTime = now - (CACHE_CONFIG.NORMAL_PHRASE_RETENTION * 24 * 60 * 60 * 1000);
  const emergencyExpirationTime = now - (CACHE_CONFIG.EMERGENCY_PHRASE_RETENTION * 24 * 60 * 60 * 1000);
  
  // Filtrer les entrées expirées
  let entries = cache.entries.filter(entry => {
    // Garder les phrases d'urgence plus longtemps
    const expirationTime = entry.isEmergencyPhrase ? emergencyExpirationTime : normalExpirationTime;
    return entry.timestamp > expirationTime;
  });
  
  // Si le cache dépasse toujours la limite après avoir supprimé les entrées expirées
  if (entries.length > cache.sizeLimit) {
    // Trier par utilité (priorité aux phrases d'urgence, puis par nombre d'utilisations et récence)
    entries.sort((a, b) => {
      // Priorité aux phrases d'urgence
      if (a.isEmergencyPhrase && !b.isEmergencyPhrase) return -1;
      if (!a.isEmergencyPhrase && b.isEmergencyPhrase) return 1;
      
      // Puis par nombre d'utilisations
      if (a.useCount !== b.useCount) return b.useCount - a.useCount;
      
      // Enfin par récence
      return b.timestamp - a.timestamp;
    });
    
    // Conserver uniquement les entrées les plus utiles jusqu'à la limite
    entries = entries.slice(0, cache.sizeLimit);
  }
  
  // Mettre à jour le cache
  const updatedCache: TranslationCache = {
    ...cache,
    entries,
    lastCleanup: now
  };
  
  // Sauvegarder le cache nettoyé
  await saveTranslationCache(updatedCache);
  
  return updatedCache;
};

// Stocker une traduction dans le cache
const storeTranslationInCache = async (
  text: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  isEmergencyPhrase: boolean = false
): Promise<void> => {
  try {
    // Récupérer le cache existant
    const cache = await getTranslationCache();
    
    // Vérifier si cette traduction existe déjà
    const existingEntryIndex = cache.entries.findIndex(
      entry => entry.text === text && 
              entry.sourceLang === sourceLang && 
              entry.targetLang === targetLang
    );
    
    const now = Date.now();
    
    if (existingEntryIndex >= 0) {
      // Mettre à jour l'entrée existante
      const entry = cache.entries[existingEntryIndex];
      cache.entries[existingEntryIndex] = {
        ...entry,
        translation: translatedText,
        timestamp: now,
        useCount: entry.useCount + 1,
        isEmergencyPhrase: entry.isEmergencyPhrase || isEmergencyPhrase
      };
    } else {
      // Ajouter une nouvelle entrée
      cache.entries.push({
        text,
        translation: translatedText,
        sourceLang,
        targetLang,
        timestamp: now,
        useCount: 1,
        isEmergencyPhrase
      });
      
      // Si le cache dépasse la limite, le nettoyer
      if (cache.entries.length > cache.sizeLimit) {
        await cleanupCache(cache);
        return;
      }
    }
    
    // Sauvegarder le cache mis à jour
    await saveTranslationCache(cache);
  } catch (error) {
    console.error('Error storing translation in cache:', error);
  }
};

// Récupérer une traduction du cache
const getTranslationFromCache = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> => {
  try {
    // Récupérer le cache
    const cache = await getTranslationCache();
    
    // Rechercher la traduction
    const entry = cache.entries.find(
      e => e.text === text && 
           e.sourceLang === sourceLang && 
           e.targetLang === targetLang
    );
    
    if (entry) {
      // Mettre à jour les statistiques d'utilisation
      entry.useCount += 1;
      entry.timestamp = Date.now();
      
      // Sauvegarder le cache mis à jour (de manière asynchrone)
      saveTranslationCache(cache).catch(err => 
        console.error('Error updating cache statistics:', err)
      );
      
      return entry.translation;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving translation from cache:', error);
    return null;
  }
};

// Obtenir des statistiques sur le cache de traduction
export const getTranslationCacheStats = async (): Promise<{
  totalEntries: number;
  languageStats: Record<string, number>;
  emergencyPhraseCount: number;
  cacheSize: number;
  lastCleanup: Date;
}> => {
  try {
    const cache = await getTranslationCache();
    
    // Calculer les statistiques par langue
    const languageStats: Record<string, number> = {};
    cache.entries.forEach(entry => {
      const lang = entry.targetLang;
      languageStats[lang] = (languageStats[lang] || 0) + 1;
    });
    
    // Compter les phrases d'urgence
    const emergencyPhraseCount = cache.entries.filter(e => e.isEmergencyPhrase).length;
    
    return {
      totalEntries: cache.entries.length,
      languageStats,
      emergencyPhraseCount,
      cacheSize: cache.sizeLimit,
      lastCleanup: new Date(cache.lastCleanup)
    };
  } catch (error) {
    console.error('Error getting cache statistics:', error);
    return {
      totalEntries: 0,
      languageStats: {},
      emergencyPhraseCount: 0,
      cacheSize: CACHE_CONFIG.DEFAULT_SIZE_LIMIT,
      lastCleanup: new Date()
    };
  }
};

// Effacer complètement le cache de traduction
export const clearTranslationCache = async (): Promise<void> => {
  try {
    const emptyCache: TranslationCache = {
      entries: [],
      lastCleanup: Date.now(),
      version: CACHE_CONFIG.CACHE_VERSION,
      sizeLimit: CACHE_CONFIG.DEFAULT_SIZE_LIMIT
    };
    await saveTranslationCache(emptyCache);
  } catch (error) {
    console.error('Error clearing translation cache:', error);
  }
};

// Modifier la taille limite du cache
export const setTranslationCacheLimit = async (newLimit: number): Promise<void> => {
  try {
    if (newLimit < 10) newLimit = 10; // Limite minimale
    if (newLimit > 2000) newLimit = 2000; // Limite maximale
    
    const cache = await getTranslationCache();
    cache.sizeLimit = newLimit;
    
    // Si la nouvelle limite est inférieure à la taille actuelle, nettoyer le cache
    if (cache.entries.length > newLimit) {
      await cleanupCache(cache);
    } else {
      await saveTranslationCache(cache);
    }
  } catch (error) {
    console.error('Error setting cache limit:', error);
  }
};

// Types d'erreurs de traduction pour une meilleure gestion
enum TranslationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  QUOTA_ERROR = 'QUOTA_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Interface pour les erreurs de traduction
interface TranslationError {
  type: TranslationErrorType;
  message: string;
  details?: any;
}

// Service principal de traduction avec gestion améliorée du mode hors ligne
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  isEmergencyPhrase: boolean = false
): Promise<string> => {
  if (!text) return '';
  
  try {
    // Si les langues source et cible sont identiques, retourner le texte original
    if (sourceLang === targetLang) {
      return text;
    }
    
    // Essayer de récupérer la traduction du cache d'abord
    const cachedTranslation = await getTranslationFromCache(text, sourceLang, targetLang);
    if (cachedTranslation) {
      console.log('Using cached translation');
      return cachedTranslation;
    }
    
    // Vérifier la connexion internet
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected;
    
    // Vérifier d'abord si nous avons une traduction prédéfinie pour les phrases d'urgence courantes
    if (DEMO_TRANSLATIONS[text] && DEMO_TRANSLATIONS[text][targetLang]) {
      const translation = DEMO_TRANSLATIONS[text][targetLang];
      // Stocker la traduction dans le cache pour une utilisation future
      await storeTranslationInCache(text, translation, sourceLang, targetLang, true); // Marqué comme phrase d'urgence
      return translation;
    }
    
    // Si hors ligne, essayer de trouver une traduction similaire dans le cache
    if (!isConnected) {
      const similarTranslation = await findSimilarTranslation(text, sourceLang, targetLang);
      if (similarTranslation) {
        console.log('Using similar cached translation');
        return similarTranslation + ' (approximatif)'; // Indiquer que c'est une traduction approximative
      }
      
      const error: TranslationError = {
        type: TranslationErrorType.NETWORK_ERROR,
        message: 'Pas de connexion internet'
      };
      return handleTranslationError(error, text);
    }
    
    // Utiliser l'API Google Cloud Translation
    console.log(`Translating from ${sourceLang} to ${targetLang}: "${text}"`);
    
    // Vérifier si la clé API est disponible
    if (!GOOGLE_CLOUD_API_KEY) {
      const error: TranslationError = {
        type: TranslationErrorType.API_ERROR,
        message: 'Clé API Google Cloud non configurée'
      };
      return handleTranslationError(error, text);
    }
    
    // Appeler l'API Google Cloud Translation avec gestion de timeout
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_CLOUD_API_KEY}`;
    
    // Créer une promesse avec timeout pour éviter les attentes trop longues
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de la requête API')), 10000); // 10 secondes de timeout
    });
    
    const fetchPromise = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });
    
    // Utiliser la première promesse qui se résout (fetch ou timeout)
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    // Traiter les erreurs HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorType = getErrorTypeFromStatus(response.status);
      const error: TranslationError = {
        type: errorType,
        message: `Erreur API (${response.status}): ${response.statusText}`,
        details: errorData
      };
      return handleTranslationError(error, text);
    }
    
    // Traiter la réponse
    const data = await response.json();
    
    // Vérifier si la réponse contient une erreur
    if (data.error) {
      const errorType = getErrorTypeFromAPIError(data.error);
      const error: TranslationError = {
        type: errorType,
        message: data.error.message || 'Erreur API inconnue',
        details: data.error
      };
      return handleTranslationError(error, text);
    }
    
    // Vérifier si la réponse contient des traductions
    if (!data.data || !data.data.translations || data.data.translations.length === 0) {
      const error: TranslationError = {
        type: TranslationErrorType.UNKNOWN_ERROR,
        message: 'Aucune traduction reçue de l\'API'
      };
      return handleTranslationError(error, text);
    }
    
    const translation = data.data.translations[0].translatedText;
    
    // Stocker la traduction dans le cache pour une utilisation future
    await storeTranslationInCache(text, translation, sourceLang, targetLang, isEmergencyPhrase);
    
    return translation;
  } catch (error: any) {
    console.error('Translation error:', error);
    
    // Déterminer le type d'erreur
    let errorType = TranslationErrorType.UNKNOWN_ERROR;
    let errorMessage = error?.message || 'Erreur inconnue';
    
    if (error.name === 'TypeError' && errorMessage.includes('Network request failed')) {
      errorType = TranslationErrorType.NETWORK_ERROR;
      errorMessage = 'Erreur de connexion réseau';
    } else if (errorMessage.includes('Timeout')) {
      errorType = TranslationErrorType.NETWORK_ERROR;
      errorMessage = 'Temps d\'attente dépassé pour la traduction';
    }
    
    const translationError: TranslationError = {
      type: errorType,
      message: errorMessage,
      details: error
    };
    
    return handleTranslationError(translationError, text);
  }
};

// Trouver une traduction similaire dans le cache pour le mode hors ligne
const findSimilarTranslation = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> => {
  try {
    // Récupérer le cache
    const cache = await getTranslationCache();
    
    // Filtrer les entrées qui correspondent à la même paire de langues
    const relevantEntries = cache.entries.filter(
      e => e.sourceLang === sourceLang && e.targetLang === targetLang
    );
    
    if (relevantEntries.length === 0) return null;
    
    // Fonction pour calculer la similarité entre deux chaînes
    const calculateSimilarity = (str1: string, str2: string): number => {
      // Convertir en minuscules pour une comparaison insensible à la casse
      const s1 = str1.toLowerCase();
      const s2 = str2.toLowerCase();
      
      // Calculer la distance de Levenshtein (nombre minimal d'opérations pour transformer s1 en s2)
      const matrix: number[][] = [];
      
      // Initialiser la première ligne et colonne
      for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
      for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
      
      // Remplir la matrice
      for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,      // Suppression
            matrix[i][j - 1] + 1,      // Insertion
            matrix[i - 1][j - 1] + cost // Substitution
          );
        }
      }
      
      // La distance est la valeur dans le coin inférieur droit
      const distance = matrix[s1.length][s2.length];
      
      // Normaliser la distance par rapport à la longueur de la plus longue chaîne
      const maxLength = Math.max(s1.length, s2.length);
      if (maxLength === 0) return 1; // Les deux chaînes sont vides
      
      // Convertir la distance en similarité (1 - distance normalisée)
      return 1 - distance / maxLength;
    };
    
    // Trouver l'entrée avec la plus grande similarité
    let bestMatch = null;
    let highestSimilarity = 0;
    
    for (const entry of relevantEntries) {
      const similarity = calculateSimilarity(text, entry.text);
      
      // Considérer comme similaire si la similarité est supérieure à 0.7 (70%)
      if (similarity > 0.7 && similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = entry;
      }
    }
    
    return bestMatch ? bestMatch.translation : null;
  } catch (error) {
    console.error('Error finding similar translation:', error);
    return null;
  }
};

// Fonction pour déterminer le type d'erreur à partir du code HTTP
const getErrorTypeFromStatus = (status: number): TranslationErrorType => {
  switch (status) {
    case 400:
      return TranslationErrorType.INVALID_REQUEST;
    case 401:
    case 403:
      return TranslationErrorType.AUTH_ERROR;
    case 404:
      return TranslationErrorType.UNSUPPORTED_LANGUAGE;
    case 429:
      return TranslationErrorType.QUOTA_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return TranslationErrorType.API_ERROR;
    default:
      return TranslationErrorType.UNKNOWN_ERROR;
  }
};

// Fonction pour déterminer le type d'erreur à partir de l'erreur API
const getErrorTypeFromAPIError = (error: any): TranslationErrorType => {
  if (!error) return TranslationErrorType.UNKNOWN_ERROR;
  
  const errorCode = error.code || 0;
  const errorMessage = error.message || '';
  
  if (errorCode === 400 || errorMessage.includes('Invalid request')) {
    return TranslationErrorType.INVALID_REQUEST;
  } else if (errorCode === 401 || errorCode === 403 || errorMessage.includes('API key')) {
    return TranslationErrorType.AUTH_ERROR;
  } else if (errorCode === 404 || errorMessage.includes('language')) {
    return TranslationErrorType.UNSUPPORTED_LANGUAGE;
  } else if (errorCode === 429 || errorMessage.includes('quota')) {
    return TranslationErrorType.QUOTA_ERROR;
  } else if (errorCode >= 500 && errorCode < 600) {
    return TranslationErrorType.API_ERROR;
  } else {
    return TranslationErrorType.UNKNOWN_ERROR;
  }
};

// Gérer les erreurs de traduction de manière cohérente
const handleTranslationError = (error: TranslationError, originalText: string): string => {
  console.error('Translation error:', error);
  
  // Enregistrer l'erreur pour analyse ultérieure (dans une vraie application)
  
  // Retourner un message d'erreur formaté
  let errorMessage = '';
  
  switch (error.type) {
    case TranslationErrorType.NETWORK_ERROR:
      errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      break;
    case TranslationErrorType.AUTH_ERROR:
      errorMessage = 'Erreur d\'authentification. Vérifiez votre clé API.';
      break;
    case TranslationErrorType.QUOTA_ERROR:
      errorMessage = 'Quota de traduction dépassé. Réessayez plus tard.';
      break;
    case TranslationErrorType.UNSUPPORTED_LANGUAGE:
      errorMessage = 'Langue non supportée.';
      break;
    case TranslationErrorType.INVALID_REQUEST:
      errorMessage = 'Requête invalide.';
      break;
    case TranslationErrorType.API_ERROR:
      errorMessage = 'Erreur du service de traduction.';
      break;
    default:
      errorMessage = 'Erreur inconnue.';
  }
  
  // Ajouter le message d'erreur spécifique s'il existe
  if (error.message) {
    errorMessage += ` (${error.message})`;
  }
  
  // Retourner le message d'erreur entre crochets pour le distinguer d'une traduction
  return `[${errorMessage}]`;
};

// Vérifier si une langue est disponible hors ligne
export const isLanguageAvailableOffline = async (langCode: string): Promise<boolean> => {
  try {
    const downloadedLanguages = await AsyncStorage.getItem('downloadedLanguages');
    if (!downloadedLanguages) return false;
    
    const languages = JSON.parse(downloadedLanguages);
    return languages.includes(langCode);
  } catch (error) {
    console.error('Error checking offline language availability:', error);
    return false;
  }
};

// Télécharger une langue pour une utilisation hors ligne
export const downloadLanguage = async (languageCode: string): Promise<boolean> => {
  try {
    // Vérifier la connexion internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.error('Cannot download language without internet connection');
      return false;
    }
    
    // Vérifier si la langue est valide
    const isValidLanguage = LANGUAGES.some(lang => lang.code === languageCode);
    if (!isValidLanguage) {
      console.error(`Invalid language code: ${languageCode}`);
      return false;
    }
    
    // Traduire les phrases d'urgence et les marquer comme telles dans le cache
    console.log(`Downloading language: ${languageCode} - Translating emergency phrases...`);
    
    // Créer un tableau de promesses pour traduire toutes les phrases en parallèle
    const translationPromises = EMERGENCY_PHRASES.map(phrase => 
      translateText(phrase.fr, 'fr', languageCode, true) // true = isEmergencyPhrase
    );
    
    // Attendre que toutes les traductions soient terminées
    await Promise.all(translationPromises);
    
    // Traduire également quelques phrases courantes pour enrichir le cache
    console.log(`Downloading language: ${languageCode} - Translating common phrases...`);
    
    const COMMON_PHRASES = [
      "Bonjour",
      "Merci",
      "Au revoir",
      "Oui",
      "Non",
      "S'il vous plaît",
      "Excusez-moi",
      "Je ne comprends pas",
      "Pouvez-vous répéter ?",
      "Comment allez-vous ?",
      "Je vais bien",
      "J'ai besoin d'aide",
      "Appelez une ambulance",
      "Où est l'hôpital le plus proche ?",
      "Quelle est votre adresse ?",
      "Restez calme"
    ];
    
    // Traduire les phrases courantes
    const commonTranslationPromises = COMMON_PHRASES.map(phrase => 
      translateText(phrase, 'fr', languageCode, false) // false = not emergency phrase
    );
    
    await Promise.all(commonTranslationPromises);
    
    // Stocker la langue comme téléchargée
    const downloadedLanguagesJson = await AsyncStorage.getItem('downloadedLanguages');
    const downloadedLanguages: string[] = downloadedLanguagesJson 
      ? JSON.parse(downloadedLanguagesJson) 
      : [];
    
    if (!downloadedLanguages.includes(languageCode)) {
      downloadedLanguages.push(languageCode);
      await AsyncStorage.setItem('downloadedLanguages', JSON.stringify(downloadedLanguages));
    }
    
    console.log(`Language ${languageCode} downloaded successfully`);
    return true;
  } catch (error) {
    console.error(`Error downloading language ${languageCode}:`, error);
    return false;
  }
};

// Récupérer les langues téléchargées
export const getDownloadedLanguages = async (): Promise<string[]> => {
  try {
    const downloadedLanguagesJson = await AsyncStorage.getItem('downloadedLanguages');
    return downloadedLanguagesJson ? JSON.parse(downloadedLanguagesJson) : [];
  } catch (error) {
    console.error('Error getting downloaded languages:', error);
    return [];
  }
};

// Supprimer une langue téléchargée
export const removeDownloadedLanguage = async (languageCode: string): Promise<boolean> => {
  try {
    // Récupérer les langues téléchargées
    const downloadedLanguagesJson = await AsyncStorage.getItem('downloadedLanguages');
    const downloadedLanguages: string[] = downloadedLanguagesJson 
      ? JSON.parse(downloadedLanguagesJson) 
      : [];
    
    // Filtrer la langue à supprimer
    const updatedLanguages = downloadedLanguages.filter(lang => lang !== languageCode);
    
    // Sauvegarder la liste mise à jour
    await AsyncStorage.setItem('downloadedLanguages', JSON.stringify(updatedLanguages));
    
    // Note: Nous ne supprimons pas les traductions du cache car elles peuvent être utiles
    // pour d'autres utilisateurs. Le nettoyage automatique du cache s'en chargera si nécessaire.
    
    return true;
  } catch (error) {
    console.error('Error removing downloaded language:', error);
    return false;
  }
};

// Fonction utilitaire pour obtenir le nom d'une langue à partir de son code
export const getLanguageName = (langCode: string): string => {
  const language = LANGUAGES.find(lang => lang.code === langCode);
  return language ? language.name : langCode;
};

// Liste des langues supportées
export const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'Anglais' },
  { code: 'es', name: 'Espagnol' },
  { code: 'de', name: 'Allemand' },
  { code: 'it', name: 'Italien' },
  { code: 'pt', name: 'Portugais' },
  { code: 'nl', name: 'Néerlandais' },
  { code: 'ru', name: 'Russe' },
  { code: 'ar', name: 'Arabe' },
  { code: 'zh', name: 'Chinois' },
  { code: 'ja', name: 'Japonais' },
  { code: 'ko', name: 'Coréen' },
  { code: 'tr', name: 'Turc' },
  { code: 'pl', name: 'Polonais' },
  { code: 'uk', name: 'Ukrainien' }
];

