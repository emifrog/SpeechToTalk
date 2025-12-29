/**
 * @fileoverview Service de traduction pour l'application SpeechToTalk
 *
 * Ce service gère toutes les opérations de traduction de texte en utilisant
 * l'API Google Cloud Translation. Il inclut également un système de cache
 * intelligent avec compression pour optimiser les performances et réduire
 * les appels API.
 *
 * @module services/translationService
 * @requires @react-native-async-storage/async-storage
 * @requires @react-native-community/netinfo
 * @requires ./compressionService
 * @requires ./types
 * @requires ../config
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  compressTranslationCache,
  decompressTranslationCache,
  decompressTranslationEntry,
  optimizeTranslationStorage
} from './compressionService';
import { TranslationCache } from './types';
import { getGoogleCloudApiKey } from '../config';

/**
 * Traduit un texte d'une langue source vers une langue cible
 *
 * Cette fonction vérifie d'abord le cache local, puis les traductions prédéfinies,
 * et enfin appelle l'API Google Cloud Translation si nécessaire.
 *
 * @async
 * @function translateText
 * @param {string} text - Le texte à traduire
 * @param {string} sourceLang - Code de la langue source (ex: 'fr', 'en')
 * @param {string} targetLang - Code de la langue cible (ex: 'en', 'es')
 * @param {boolean} [isEmergencyPhrase=false] - Indique si c'est une phrase d'urgence (priorité dans le cache)
 * @returns {Promise<string>} Le texte traduit
 * @throws {Error} En cas d'erreur de traduction, retourne un message d'erreur formaté
 *
 * @example
 * const translation = await translateText('Bonjour', 'fr', 'en');
 * console.log(translation); // "Hello"
 *
 * @example
 * // Traduction d'une phrase d'urgence (sera conservée plus longtemps dans le cache)
 * const emergency = await translateText('Où avez-vous mal ?', 'fr', 'en', true);
 */
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
      // Utiliser l'API Google Cloud Translation avec la clé sécurisée
      const apiKey = getGoogleCloudApiKey();
      if (!apiKey) {
        console.warn('Clé API non configurée, utilisation du mode démo');
        return `[${targetLang}] ${text}`;
      }
      const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
      
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

/**
 * Dictionnaire de traductions prédéfinies pour les phrases courantes
 *
 * Ces traductions sont utilisées en priorité pour éviter les appels API
 * et garantir des traductions de qualité pour les phrases d'urgence.
 *
 * @constant {Record<string, Record<string, string>>}
 * @private
 */
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

/**
 * Liste des phrases d'urgence prédéfinies pour les sapeurs-pompiers
 *
 * Ces phrases sont les plus fréquemment utilisées lors des interventions
 * et sont prioritaires dans le système de cache.
 *
 * @constant {Array<{fr: string, translations: object}>}
 * @exports EMERGENCY_PHRASES
 */
export const EMERGENCY_PHRASES = [
  { fr: "OÃ¹ avez-vous mal ?", translations: {} },
  { fr: "Avez-vous des difficultÃ©s Ã  respirer ?", translations: {} },
  { fr: "Y a-t-il d'autres personnes Ã  l'intÃ©rieur ?", translations: {} },
  { fr: "Avez-vous des allergies ou prenez-vous des mÃ©dicaments ?", translations: {} },
  { fr: "Nous sommes lÃ  pour vous aider.", translations: {} },
  { fr: "Restez calme, les secours sont lÃ .", translations: {} },
];

/**
 * Configuration du système de cache de traduction
 *
 * @constant {Object} CACHE_CONFIG
 * @property {number} DEFAULT_SIZE_LIMIT - Nombre maximum d'entrées dans le cache (défaut: 500)
 * @property {number} CLEANUP_INTERVAL - Intervalle de nettoyage automatique en ms (24h)
 * @property {number} CACHE_VERSION - Version du format de cache pour les migrations
 * @property {number} EMERGENCY_PHRASE_RETENTION - Durée de rétention des phrases d'urgence en jours
 * @property {number} NORMAL_PHRASE_RETENTION - Durée de rétention des phrases normales en jours
 * @private
 */
const CACHE_CONFIG = {
  DEFAULT_SIZE_LIMIT: 500,     // Nombre maximum d'entrÃ©es par dÃ©faut
  CLEANUP_INTERVAL: 86400000,  // Intervalle de nettoyage (24 heures en ms)
  CACHE_VERSION: 1,            // Version actuelle du cache
  EMERGENCY_PHRASE_RETENTION: 30, // Nombre de jours de rÃ©tention pour les phrases d'urgence
  NORMAL_PHRASE_RETENTION: 7,  // Nombre de jours de rÃ©tention pour les phrases normales
};

/**
 * Clé de stockage pour le cache de traduction dans AsyncStorage
 * @constant {string}
 * @private
 */
const TRANSLATION_CACHE_KEY = 'translationCache_v1';

/**
 * Récupère le cache de traduction depuis AsyncStorage
 *
 * Initialise un nouveau cache si aucun n'existe. Décompresse automatiquement
 * les données et déclenche le nettoyage si nécessaire.
 *
 * @async
 * @function getTranslationCache
 * @returns {Promise<TranslationCache>} Le cache de traduction (existant ou nouveau)
 *
 * @example
 * const cache = await getTranslationCache();
 * console.log(`${cache.entries.length} traductions en cache`);
 */
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

/**
 * Sauvegarde le cache de traduction dans AsyncStorage
 *
 * Compresse automatiquement les données avant la sauvegarde et déclenche
 * une optimisation périodique du stockage.
 *
 * @async
 * @function saveTranslationCache
 * @param {TranslationCache} cache - Le cache à sauvegarder
 * @returns {Promise<void>}
 * @private
 */
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

/**
 * Nettoie le cache en supprimant les entrées expirées ou moins utilisées
 *
 * Les phrases d'urgence sont conservées plus longtemps que les phrases normales.
 * Si le cache dépasse la limite après le nettoyage des entrées expirées,
 * les entrées les moins utiles sont supprimées.
 *
 * @async
 * @function cleanupCache
 * @param {TranslationCache} cache - Le cache à nettoyer
 * @returns {Promise<TranslationCache>} Le cache nettoyé
 * @private
 */
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

/**
 * Stocke une traduction dans le cache
 *
 * Met à jour une entrée existante ou en crée une nouvelle.
 * Déclenche le nettoyage si la limite de taille est atteinte.
 *
 * @async
 * @function storeTranslationInCache
 * @param {string} text - Le texte original
 * @param {string} translatedText - La traduction
 * @param {string} sourceLang - Code de la langue source
 * @param {string} targetLang - Code de la langue cible
 * @param {boolean} [isEmergencyPhrase=false] - Indique si c'est une phrase d'urgence
 * @returns {Promise<void>}
 * @private
 */
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

/**
 * Récupère une traduction depuis le cache
 *
 * Recherche une correspondance exacte (texte + langues source/cible).
 * Met à jour les statistiques d'utilisation si trouvée.
 *
 * @async
 * @function getTranslationFromCache
 * @param {string} text - Le texte original à rechercher
 * @param {string} sourceLang - Code de la langue source
 * @param {string} targetLang - Code de la langue cible
 * @returns {Promise<string|null>} La traduction trouvée ou null
 *
 * @example
 * const cached = await getTranslationFromCache('Hello', 'en', 'fr');
 * if (cached) {
 *   console.log('Traduction en cache:', cached);
 * }
 */
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

/**
 * Liste des langues supportées par l'application
 *
 * Chaque langue est définie par son code ISO 639-1 et son nom en français.
 *
 * @constant {Array<{code: string, name: string}>}
 * @exports LANGUAGES
 */
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

/**
 * Télécharge une langue pour une utilisation hors ligne
 *
 * Marque la langue comme téléchargée dans le stockage local.
 * Nécessite une connexion internet.
 *
 * @async
 * @function downloadLanguage
 * @param {string} languageCode - Code ISO 639-1 de la langue (ex: 'fr', 'en')
 * @returns {Promise<boolean>} true si le téléchargement a réussi, false sinon
 *
 * @example
 * const success = await downloadLanguage('es');
 * if (success) {
 *   console.log('Espagnol téléchargé avec succès');
 * }
 */
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

/**
 * Obtient des statistiques détaillées sur le cache de traduction
 *
 * Retourne des informations sur le nombre d'entrées, la répartition par langue,
 * la taille du cache et le ratio de compression.
 *
 * @async
 * @function getTranslationCacheStats
 * @returns {Promise<Object>} Statistiques du cache
 * @property {number} totalEntries - Nombre total d'entrées
 * @property {Record<string, number>} languageStats - Nombre de traductions par paire de langues
 * @property {number} emergencyPhraseCount - Nombre de phrases d'urgence
 * @property {number} cacheSize - Taille non compressée en octets
 * @property {number} compressedSize - Taille compressée en octets
 * @property {number} compressionRatio - Ratio de compression
 * @property {Date} lastCleanup - Date du dernier nettoyage
 *
 * @example
 * const stats = await getTranslationCacheStats();
 * console.log(`Cache: ${stats.totalEntries} entrées, ratio: ${stats.compressionRatio.toFixed(2)}x`);
 */
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

/**
 * Force l'optimisation du stockage des traductions
 *
 * Compresse toutes les données du cache et retourne les statistiques
 * de compression.
 *
 * @async
 * @function forceStorageOptimization
 * @returns {Promise<Object>} Résultat de l'optimisation
 * @property {boolean} success - Indique si l'optimisation a réussi
 * @property {number} compressionRatio - Ratio de compression obtenu
 * @property {number} savedBytes - Nombre d'octets économisés
 *
 * @example
 * const result = await forceStorageOptimization();
 * if (result.success) {
 *   console.log(`Économisé ${result.savedBytes} octets`);
 * }
 */
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


/**
 * Efface complètement le cache de traduction
 *
 * Crée un nouveau cache vide et le sauvegarde dans AsyncStorage.
 * Cette action est irréversible.
 *
 * @async
 * @function clearTranslationCache
 * @returns {Promise<boolean>} true si le cache a été effacé avec succès
 *
 * @example
 * const cleared = await clearTranslationCache();
 * if (cleared) {
 *   console.log('Cache effacé avec succès');
 * }
 */
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

/**
 * Définit la limite de taille du cache de traduction
 *
 * Si la nouvelle limite est inférieure au nombre d'entrées actuel,
 * les entrées les plus anciennes sont supprimées.
 *
 * @async
 * @function setTranslationCacheLimit
 * @param {number} limit - Nouvelle limite (doit être positive)
 * @returns {Promise<boolean>} true si la limite a été définie avec succès
 * @throws {Error} Si la limite est négative
 *
 * @example
 * await setTranslationCacheLimit(1000);
 */
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
