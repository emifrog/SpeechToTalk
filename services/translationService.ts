import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { GOOGLE_CLOUD_API_KEY } from '../config';
import {
  compressTranslationCache,
  decompressTranslationCache,
  decompressTranslationEntry,
  optimizeTranslationStorage
} from './compressionService';
import { TranslationCache, TranslationCacheEntry, TranslationError, TranslationErrorType } from './types';

// Fonction de traduction
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
    
    // Si hors ligne, retourner un message d'erreur
    if (!isConnected) {
      return `[Pas de connexion internet - Traduction indisponible]`;
    }
    
    // Simuler une traduction (dans une vraie application, vous appelleriez une API de traduction ici)
    console.log(`Traduction de '${text}' de ${sourceLang} vers ${targetLang}`);
    const translation = `[${targetLang}] ${text}`;
    
    // Stocker la traduction dans le cache
    await storeTranslationInCache(text, translation, sourceLang, targetLang, isEmergencyPhrase);
    
    return translation;
  } catch (error) {
    console.error('Error in translation:', error);
    return `[Erreur de traduction]`;
  }
};

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

// Les interfaces TranslationCacheEntry et TranslationCache ont été déplacées dans le fichier types.ts

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
    
    // Parser le cache et décompresser les données
    const compressedCache: TranslationCache = JSON.parse(cacheJson);
    const cache = decompressTranslationCache(compressedCache);
    
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
    // Compresser le cache avant de le sauvegarder
    const compressedCache = compressTranslationCache(cache);
    await AsyncStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(compressedCache));
    
    // Optimiser le stockage périodiquement
    const now = Date.now();
    const lastOptimization = await AsyncStorage.getItem('lastStorageOptimization');
    const lastOptimizationTime = lastOptimization ? parseInt(lastOptimization) : 0;
    
    if (now - lastOptimizationTime > CACHE_CONFIG.CLEANUP_INTERVAL) {
      // Lancer l'optimisation en arrière-plan
      optimizeTranslationStorage(false).then(() => {
        AsyncStorage.setItem('lastStorageOptimization', now.toString());
      });
    }
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
export const getTranslationFromCache = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> => {
  try {
    // Récupérer le cache
    const cache = await getTranslationCache();
    
    // Rechercher une correspondance exacte
    const entry = cache.entries.find(
      entry => entry.text === text && 
              entry.sourceLang === sourceLang && 
              entry.targetLang === targetLang
    );
    
    if (entry) {
      // Décompresser l'entrée si nécessaire
      const decompressedEntry = decompressTranslationEntry(entry);
      
      // Mettre à jour les statistiques d'utilisation
      entry.useCount += 1;
      entry.timestamp = Date.now();
      await saveTranslationCache(cache);
      
      return decompressedEntry.translation;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving translation from cache:', error);
    return null;
  }
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
  { code: 'pl', name: 'Polonais' },
  { code: 'ru', name: 'Russe' },
  { code: 'ar', name: 'Arabe' },
  { code: 'zh', name: 'Chinois' },
  { code: 'ja', name: 'Japonais' },
  { code: 'ko', name: 'Coréen' },
  { code: 'tr', name: 'Turc' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ro', name: 'Roumain' },
  { code: 'uk', name: 'Ukrainien' },
  { code: 'sv', name: 'Suédois' },
  { code: 'el', name: 'Grec' }
];

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

// Obtenir des statistiques sur le cache de traduction
export const getTranslationCacheStats = async (): Promise<{
  totalEntries: number;
  languageStats: Record<string, number>;
  emergencyPhraseCount: number;
  cacheSize: number;
  compressedSize: number;
  compressionRatio: number;
  lastCleanup: Date;
}> => {
  try {
    const cache = await getTranslationCache();
    
    // Calculer les statistiques par langue
    const languageStats: Record<string, number> = {};
    cache.entries.forEach(entry => {
      const langPair = `${entry.sourceLang}-${entry.targetLang}`;
      languageStats[langPair] = (languageStats[langPair] || 0) + 1;
    });
    
    // Compter les phrases d'urgence
    const emergencyPhraseCount = cache.entries.filter(entry => entry.isEmergencyPhrase).length;
    
    // Calculer la taille du cache non compressé en octets
    const cacheSize = Buffer.byteLength(JSON.stringify(cache));
    
    // Calculer la taille du cache compressé en octets
    const compressedCache = compressTranslationCache(cache);
    const compressedSize = Buffer.byteLength(JSON.stringify(compressedCache));
    
    // Calculer le ratio de compression
    const compressionRatio = cacheSize > 0 ? cacheSize / compressedSize : 1;
    
    return {
      totalEntries: cache.entries.length,
      languageStats,
      emergencyPhraseCount,
      cacheSize,
      compressedSize,
      compressionRatio,
      lastCleanup: new Date(cache.lastCleanup)
    };
  } catch (error) {
    console.error('Error getting translation cache stats:', error);
    return {
      totalEntries: 0,
      languageStats: {},
      emergencyPhraseCount: 0,
      cacheSize: 0,
      compressedSize: 0,
      compressionRatio: 1,
      lastCleanup: new Date()
    };
  }
};

// Fonction pour forcer l'optimisation du stockage des traductions
export const forceStorageOptimization = async (): Promise<{
  success: boolean;
  compressionRatio: number;
  savedBytes: number;
}> => {
  try {
    // Lancer l'optimisation forcée
    const stats = await optimizeTranslationStorage(true);
    
    if (!stats) {
      return {
        success: false,
        compressionRatio: 1,
        savedBytes: 0
      };
    }
    
    // Calculer les octets économisés
    const savedBytes = stats.originalSize - stats.compressedSize;
    
    return {
      success: true,
      compressionRatio: stats.compressionRatio,
      savedBytes
    };
  } catch (error) {
    console.error('Error forcing storage optimization:', error);
    return {
      success: false,
      compressionRatio: 1,
      savedBytes: 0
    };
  }
};
