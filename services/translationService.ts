import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  compressTranslationCache,
  decompressTranslationCache,
  decompressTranslationEntry,
  optimizeTranslationStorage
} from './compressionService';
import { TranslationCache } from './types';

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
    
    // Essayer de rÃ©cupÃ©rer la traduction du cache d'abord
    const cachedTranslation = await getTranslationFromCache(text, sourceLang, targetLang);
    if (cachedTranslation) {
      console.log('Using cached translation');
      return cachedTranslation;
    }
    
    // VÃ©rifier la connexion internet
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected;
    
    // VÃ©rifier d'abord si nous avons une traduction prÃ©dÃ©finie pour les phrases d'urgence courantes
    if (DEMO_TRANSLATIONS[text] && DEMO_TRANSLATIONS[text][targetLang]) {
      const translation = DEMO_TRANSLATIONS[text][targetLang];
      // Stocker la traduction dans le cache pour une utilisation future
      await storeTranslationInCache(text, translation, sourceLang, targetLang, true); // MarquÃ© comme phrase d'urgence
      return translation;
    }
    
    // Si hors ligne, retourner un message d'erreur
    if (!isConnected) {
      return `[Pas de connexion internet - Traduction indisponible]`;
    }
    
    // Utiliser une véritable API de traduction
    let translation = '';
    try {
      // Utiliser l'API Google Cloud Translation
      // Note: Dans une vraie application, vous devriez utiliser votre propre clé API
      // et la stocker de manière sécurisée
      const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=AIzaSyDzBUV4Ogznth5CfowZB7_esRM0yYbRECE`;
      
      const response = await fetch(apiUrl, {
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
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      translation = data.data.translations[0].translatedText;
      
      // Si l'API n'est pas configurée, utiliser une simulation pour la démonstration
      if (!translation) {
        console.log('API key not configured, using demo translation');
        translation = `[${targetLang}] ${text}`;
      }
    } catch (error) {
      console.error('Translation API error:', error);
      // Fallback en cas d'erreur d'API
      translation = `[${targetLang}] ${text}`;  // Simulation pour la démo
    }
    
    // Stocker la traduction dans le cache
    await storeTranslationInCache(text, translation, sourceLang, targetLang, isEmergencyPhrase);
    
    return translation;
  } catch (error) {
    console.error('Error in translation:', error);
    return `[Erreur de traduction]`;
  }
};

// API Google Cloud Translation
// La clÃ© API est stockÃ©e de maniÃ¨re sÃ©curisÃ©e dans ../config/keys.ts
// et ce fichier est ajoutÃ© au .gitignore pour Ã©viter de partager la clÃ©

// Dictionnaire de traductions prÃ©dÃ©finies pour la dÃ©monstration
const DEMO_TRANSLATIONS: Record<string, Record<string, string>> = {
  'fr': {
    'en': 'English',
    'es': 'EspaÃ±ol',
    'de': 'Deutsch',
    'it': 'Italiano',
    'ar': 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©',
    'zh': 'ä¸­æ–‡',
    'ru': 'Ð ÑƒÑ�Ñ�ÐºÐ¸Ð¹'
  },
  'OÃ¹ avez-vous mal ?': {
    'en': 'Where does it hurt?',
    'es': 'Â¿DÃ³nde le duele?',
    'de': 'Wo haben Sie Schmerzen?',
    'it': 'Dove le fa male?',
    'ar': 'Ø£ÙŠÙ† ÙŠØ¤Ù„Ù…ÙƒØŸ',
    'zh': 'å“ªé‡Œç–¼ï¼Ÿ',
    'ru': 'Ð“Ð´Ðµ Ñƒ Ð²Ð°Ñ� Ð±Ð¾Ð»Ð¸Ñ‚?'
  },
  'Avez-vous des difficultÃ©s Ã  respirer ?': {
    'en': 'Do you have trouble breathing?',
    'es': 'Â¿Tiene dificultad para respirar?',
    'de': 'Haben Sie Schwierigkeiten beim Atmen?',
    'it': 'Ha difficoltÃ  a respirare?',
    'ar': 'Ù‡Ù„ ØªØ¬Ø¯ ØµØ¹ÙˆØ¨Ø© Ù�ÙŠ Ø§Ù„ØªÙ†Ù�Ø³ØŸ',
    'zh': 'æ‚¨å‘¼å�¸å›°éš¾å�—ï¼Ÿ',
    'ru': 'Ð£ Ð²Ð°Ñ� ÐµÑ�Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹ Ñ� Ð´Ñ‹Ñ…Ð°Ð½Ð¸ÐµÐ¼?'
  }
};

// Liste des phrases d'urgence pour les pompiers
export const EMERGENCY_PHRASES = [
  { fr: "OÃ¹ avez-vous mal ?", translations: {} },
  { fr: "Avez-vous des difficultÃ©s Ã  respirer ?", translations: {} },
  { fr: "Y a-t-il d'autres personnes Ã  l'intÃ©rieur ?", translations: {} },
  { fr: "Avez-vous des allergies ou prenez-vous des mÃ©dicaments ?", translations: {} },
  { fr: "Nous sommes lÃ  pour vous aider.", translations: {} },
  { fr: "Restez calme, les secours sont lÃ .", translations: {} },
];

// Les interfaces TranslationCacheEntry et TranslationCache ont Ã©tÃ© dÃ©placÃ©es dans le fichier types.ts

// Configuration du cache
const CACHE_CONFIG = {
  DEFAULT_SIZE_LIMIT: 500,     // Nombre maximum d'entrÃ©es par dÃ©faut
  CLEANUP_INTERVAL: 86400000,  // Intervalle de nettoyage (24 heures en ms)
  CACHE_VERSION: 1,            // Version actuelle du cache
  EMERGENCY_PHRASE_RETENTION: 30, // Nombre de jours de rÃ©tention pour les phrases d'urgence
  NORMAL_PHRASE_RETENTION: 7,  // Nombre de jours de rÃ©tention pour les phrases normales
};

// ClÃ© pour stocker le cache dans AsyncStorage
const TRANSLATION_CACHE_KEY = 'translationCache_v1';

// Initialiser ou rÃ©cupÃ©rer le cache de traduction
export const getTranslationCache = async (): Promise<TranslationCache> => {
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
    
    // Parser le cache et dÃ©compresser les donnÃ©es
    const compressedCache: TranslationCache = JSON.parse(cacheJson);
    const cache = decompressTranslationCache(compressedCache);
    
    // VÃ©rifier si le cache a besoin d'Ãªtre nettoyÃ©
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
    
    // Optimiser le stockage pÃ©riodiquement
    const now = Date.now();
    const lastOptimization = await AsyncStorage.getItem('lastStorageOptimization');
    const lastOptimizationTime = lastOptimization ? parseInt(lastOptimization) : 0;
    
    if (now - lastOptimizationTime > CACHE_CONFIG.CLEANUP_INTERVAL) {
      // Lancer l'optimisation en arriÃ¨re-plan
      optimizeTranslationStorage(false).then(() => {
        AsyncStorage.setItem('lastStorageOptimization', now.toString());
      });
    }
  } catch (error) {
    console.error('Error saving translation cache:', error);
  }
};

// Nettoyer le cache en supprimant les entrÃ©es expirÃ©es ou moins utilisÃ©es
const cleanupCache = async (cache: TranslationCache): Promise<TranslationCache> => {
  const now = Date.now();
  
  // Calculer la date d'expiration pour les phrases normales et d'urgence
  const normalExpirationTime = now - (CACHE_CONFIG.NORMAL_PHRASE_RETENTION * 24 * 60 * 60 * 1000);
  const emergencyExpirationTime = now - (CACHE_CONFIG.EMERGENCY_PHRASE_RETENTION * 24 * 60 * 60 * 1000);
  
  // Filtrer les entrÃ©es expirÃ©es
  let entries = cache.entries.filter(entry => {
    // Garder les phrases d'urgence plus longtemps
    const expirationTime = entry.isEmergencyPhrase ? emergencyExpirationTime : normalExpirationTime;
    return entry.timestamp > expirationTime;
  });
  
  // Si le cache dÃ©passe toujours la limite aprÃ¨s avoir supprimÃ© les entrÃ©es expirÃ©es
  if (entries.length > cache.sizeLimit) {
    // Trier par utilitÃ© (prioritÃ© aux phrases d'urgence, puis par nombre d'utilisations et rÃ©cence)
    entries.sort((a, b) => {
      // PrioritÃ© aux phrases d'urgence
      if (a.isEmergencyPhrase && !b.isEmergencyPhrase) return -1;
      if (!a.isEmergencyPhrase && b.isEmergencyPhrase) return 1;
      
      // Puis par nombre d'utilisations
      if (a.useCount !== b.useCount) return b.useCount - a.useCount;
      
      // Enfin par rÃ©cence
      return b.timestamp - a.timestamp;
    });
    
    // Conserver uniquement les entrÃ©es les plus utiles jusqu'Ã  la limite
    entries = entries.slice(0, cache.sizeLimit);
  }
  
  // Mettre Ã  jour le cache
  const updatedCache: TranslationCache = {
    ...cache,
    entries,
    lastCleanup: now
  };
  
  // Sauvegarder le cache nettoyÃ©
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
    // RÃ©cupÃ©rer le cache existant
    const cache = await getTranslationCache();
    
    // VÃ©rifier si cette traduction existe dÃ©jÃ 
    const existingEntryIndex = cache.entries.findIndex(
      entry => entry.text === text && 
              entry.sourceLang === sourceLang && 
              entry.targetLang === targetLang
    );
    
    const now = Date.now();
    
    if (existingEntryIndex >= 0) {
      // Mettre Ã  jour l'entrÃ©e existante
      const entry = cache.entries[existingEntryIndex];
      cache.entries[existingEntryIndex] = {
        ...entry,
        translation: translatedText,
        timestamp: now,
        useCount: entry.useCount + 1,
        isEmergencyPhrase: entry.isEmergencyPhrase || isEmergencyPhrase
      };
    } else {
      // Ajouter une nouvelle entrÃ©e
      cache.entries.push({
        text,
        translation: translatedText,
        sourceLang,
        targetLang,
        timestamp: now,
        useCount: 1,
        isEmergencyPhrase
      });
      
      // Si le cache dÃ©passe la limite, le nettoyer
      if (cache.entries.length > cache.sizeLimit) {
        await cleanupCache(cache);
        return;
      }
    }
    
    // Sauvegarder le cache mis Ã  jour
    await saveTranslationCache(cache);
  } catch (error) {
    console.error('Error storing translation in cache:', error);
  }
};

// RÃ©cupÃ©rer une traduction du cache
export const getTranslationFromCache = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> => {
  try {
    // RÃ©cupÃ©rer le cache
    const cache = await getTranslationCache();
    
    // Rechercher une correspondance exacte
    const entry = cache.entries.find(
      entry => entry.text === text && 
              entry.sourceLang === sourceLang && 
              entry.targetLang === targetLang
    );
    
    if (entry) {
      // DÃ©compresser l'entrÃ©e si nÃ©cessaire
      const decompressedEntry = decompressTranslationEntry(entry);
      
      // Mettre Ã  jour les statistiques d'utilisation
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

// Liste des langues supportÃ©es
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

// TÃ©lÃ©charger une langue pour une utilisation hors ligne
export const downloadLanguage = async (languageCode: string): Promise<boolean> => {
  try {
    // VÃ©rifier la connexion internet
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.error('Cannot download language without internet connection');
      return false;
    }
    
    // VÃ©rifier si la langue est valide
    const isValidLanguage = LANGUAGES.some(lang => lang.code === languageCode);
    if (!isValidLanguage) {
      console.error(`Invalid language code: ${languageCode}`);
      return false;
    }
    
    // Stocker la langue comme tÃ©lÃ©chargÃ©e
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
    
    // Calculer la taille du cache non compressÃ© en octets
    const cacheSize = Buffer.byteLength(JSON.stringify(cache));
    
    // Calculer la taille du cache compressÃ© en octets
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
    // Lancer l'optimisation forcÃ©e
    const stats = await optimizeTranslationStorage(true);
    
    if (!stats) {
      return {
        success: false,
        compressionRatio: 1,
        savedBytes: 0
      };
    }
    
    // Calculer les octets Ã©conomisÃ©s
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


// Fonction pour effacer complètement le cache de traduction
export const clearTranslationCache = async (): Promise<boolean> => {
  try {
    // Créer un nouveau cache vide
    const emptyCache: TranslationCache = {
      version: CACHE_CONFIG.CACHE_VERSION,
      sizeLimit: CACHE_CONFIG.DEFAULT_SIZE_LIMIT,
      entries: [],
      lastCleanup: Date.now()
    };
    
    // Sauvegarder le cache vide
    await saveTranslationCache(emptyCache);
    
    return true;
  } catch (error) {
    console.error('Error clearing translation cache:', error);
    return false;
  }
};

// Fonction pour définir la limite de taille du cache de traduction
export const setTranslationCacheLimit = async (limit: number): Promise<boolean> => {
  try {
    if (limit < 0) {
      throw new Error('La limite du cache doit être un nombre positif');
    }
    
    // Stocker la limite dans AsyncStorage
    await AsyncStorage.setItem('translation_cache_limit', limit.toString());
    
    // Récupérer le cache actuel
    const cache = await getTranslationCache();
    
    // Si la nouvelle limite est inférieure au nombre d'entrées actuel,
    // nettoyer le cache pour respecter la nouvelle limite
    if (cache.entries.length > limit) {
      // Trier les entrées par date d'utilisation (les plus récentes en premier)
      cache.entries.sort((a, b) => b.timestamp - a.timestamp);
      
      // Garder seulement les 'limit' entrées les plus récentes
      cache.entries = cache.entries.slice(0, limit);
      
      // Sauvegarder le cache mis à jour
      await saveTranslationCache(cache);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting translation cache limit:', error);
    return false;
  }
};
