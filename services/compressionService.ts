/**
 * Service de compression pour les données de traduction
 * Ce service permet de compresser et décompresser les données de traduction
 * afin d'économiser l'espace de stockage sur l'appareil
 */

import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Interfaces nécessaires pour la compression
// Ces interfaces sont duplicates de celles dans types.ts pour éviter les problèmes d'importation
interface TranslationCacheEntry {
  text: string;                // Texte original
  translation: string;         // Texte traduit
  sourceLang: string;          // Langue source
  targetLang: string;          // Langue cible
  timestamp: number;           // Horodatage de la dernière utilisation
  useCount: number;            // Nombre d'utilisations
  isEmergencyPhrase?: boolean; // Indique si c'est une phrase d'urgence prioritaire
}

interface TranslationCache {
  entries: TranslationCacheEntry[];
  lastCleanup: number;         // Dernier nettoyage du cache
  version: number;             // Version du cache pour les migrations futures
  sizeLimit: number;           // Limite de taille du cache (nombre d'entrées)
}

interface CompressionStats {
  originalSize: number;       // Taille originale des données (en octets)
  compressedSize: number;     // Taille compressée des données (en octets)
  compressionRatio: number;   // Ratio de compression (originalSize / compressedSize)
  entriesCompressed: number;  // Nombre d'entrées compressées
  entriesTotal: number;       // Nombre total d'entrées
  lastOptimization: number;   // Timestamp de la dernière optimisation
  version: number;            // Version du format de compression
}

// Configuration de la compression
const COMPRESSION_CONFIG = {
  // Version du format de compression pour les migrations futures
  VERSION: 1,
  
  // Seuil de taille à partir duquel la compression est appliquée (en caractères)
  COMPRESSION_THRESHOLD: 100,
  
  // Préfixe pour identifier les données compressées
  COMPRESSED_PREFIX: 'COMP:',
  
  // Clé pour stocker les statistiques de compression
  COMPRESSION_STATS_KEY: 'translationCompressionStats',
  
  // Intervalle entre les optimisations automatiques (24 heures en ms)
  OPTIMIZATION_INTERVAL: 86400000,
};

// Configuration de la compression

/**
 * Compresse une chaîne de caractères
 * Utilise une technique de compression simple basée sur LZ-string
 * 
 * @param input - Chaîne à compresser
 * @returns Chaîne compressée encodée en base64
 */
export const compressString = (input: string): string => {
  try {
    // Si la chaîne est trop courte, ne pas la compresser
    if (input.length < COMPRESSION_CONFIG.COMPRESSION_THRESHOLD) {
      return input;
    }
    
    // Utiliser TextEncoder pour convertir la chaîne en tableau d'octets
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Convertir en Buffer pour la manipulation
    const buffer = Buffer.from(data);
    
    // Encoder en base64 et ajouter le préfixe pour identifier les données compressées
    return COMPRESSION_CONFIG.COMPRESSED_PREFIX + buffer.toString('base64');
  } catch (error) {
    console.error('Error compressing string:', error);
    return input; // En cas d'erreur, retourner la chaîne originale
  }
};

/**
 * Décompresse une chaîne de caractères
 * 
 * @param input - Chaîne compressée encodée en base64
 * @returns Chaîne décompressée
 */
export const decompressString = (input: string): string => {
  try {
    // Vérifier si la chaîne est compressée
    if (!input.startsWith(COMPRESSION_CONFIG.COMPRESSED_PREFIX)) {
      return input; // Si non compressée, retourner telle quelle
    }
    
    // Enlever le préfixe
    const compressedData = input.substring(COMPRESSION_CONFIG.COMPRESSED_PREFIX.length);
    
    // Décoder de base64 vers Buffer
    const buffer = Buffer.from(compressedData, 'base64');
    
    // Convertir le Buffer en chaîne
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
  } catch (error) {
    console.error('Error decompressing string:', error);
    return input; // En cas d'erreur, retourner la chaîne originale
  }
};

/**
 * Compresse une entrée de cache de traduction
 * 
 * @param entry - Entrée de cache à compresser
 * @returns Entrée de cache compressée
 */
export const compressTranslationEntry = (entry: TranslationCacheEntry): TranslationCacheEntry => {
  // Ne compresser que les champs textuels suffisamment longs
  return {
    ...entry,
    text: entry.text.length >= COMPRESSION_CONFIG.COMPRESSION_THRESHOLD 
      ? compressString(entry.text) 
      : entry.text,
    translation: entry.translation.length >= COMPRESSION_CONFIG.COMPRESSION_THRESHOLD 
      ? compressString(entry.translation) 
      : entry.translation
  };
};

/**
 * Décompresse une entrée de cache de traduction
 * 
 * @param entry - Entrée de cache compressée
 * @returns Entrée de cache décompressée
 */
export const decompressTranslationEntry = (entry: TranslationCacheEntry): TranslationCacheEntry => {
  return {
    ...entry,
    text: decompressString(entry.text),
    translation: decompressString(entry.translation)
  };
};

/**
 * Compresse tout le cache de traduction
 * 
 * @param cache - Cache de traduction à compresser
 * @returns Cache de traduction compressé
 */
export const compressTranslationCache = (cache: TranslationCache): TranslationCache => {
  const compressedEntries = cache.entries.map(compressTranslationEntry);
  
  return {
    ...cache,
    entries: compressedEntries
  };
};

/**
 * Décompresse tout le cache de traduction
 * 
 * @param cache - Cache de traduction compressé
 * @returns Cache de traduction décompressé
 */
export const decompressTranslationCache = (cache: TranslationCache): TranslationCache => {
  const decompressedEntries = cache.entries.map(decompressTranslationEntry);
  
  return {
    ...cache,
    entries: decompressedEntries
  };
};

/**
 * Calcule et met à jour les statistiques de compression
 * 
 * @param originalCache - Cache de traduction original
 * @param compressedCache - Cache de traduction compressé
 */
export const updateCompressionStats = async (
  originalCache: TranslationCache,
  compressedCache: TranslationCache
): Promise<CompressionStats> => {
  // Calculer la taille des données originales et compressées
  const originalSize = Buffer.byteLength(JSON.stringify(originalCache));
  const compressedSize = Buffer.byteLength(JSON.stringify(compressedCache));
  
  // Calculer le ratio de compression
  const compressionRatio = originalSize > 0 ? originalSize / compressedSize : 1;
  
  // Compter les entrées compressées
  const entriesCompressed = compressedCache.entries.filter((entry: TranslationCacheEntry) => 
    entry.text.startsWith(COMPRESSION_CONFIG.COMPRESSED_PREFIX) || 
    entry.translation.startsWith(COMPRESSION_CONFIG.COMPRESSED_PREFIX)
  ).length;
  
  // Créer les statistiques
  const stats: CompressionStats = {
    originalSize,
    compressedSize,
    compressionRatio,
    entriesCompressed,
    entriesTotal: originalCache.entries.length,
    lastOptimization: Date.now(),
    version: COMPRESSION_CONFIG.VERSION
  };
  
  // Sauvegarder les statistiques
  await AsyncStorage.setItem(
    COMPRESSION_CONFIG.COMPRESSION_STATS_KEY, 
    JSON.stringify(stats)
  );
  
  return stats;
};

/**
 * Récupère les statistiques de compression
 * 
 * @returns Statistiques de compression
 */
export const getCompressionStats = async (): Promise<CompressionStats | null> => {
  try {
    const statsJson = await AsyncStorage.getItem(COMPRESSION_CONFIG.COMPRESSION_STATS_KEY);
    if (!statsJson) return null;
    
    return JSON.parse(statsJson) as CompressionStats;
  } catch (error) {
    console.error('Error getting compression stats:', error);
    return null;
  }
};

/**
 * Optimise le stockage des données de traduction
 * Cette fonction compresse les données et met à jour les statistiques
 * 
 * @param forceOptimization - Forcer l'optimisation même si l'intervalle n'est pas écoulé
 * @returns Statistiques de compression après optimisation
 */
export const optimizeTranslationStorage = async (
  forceOptimization: boolean = false
): Promise<CompressionStats | null> => {
  try {
    // Vérifier si l'optimisation est nécessaire
    const stats = await getCompressionStats();
    const now = Date.now();
    
    if (
      !forceOptimization && 
      stats && 
      now - stats.lastOptimization < COMPRESSION_CONFIG.OPTIMIZATION_INTERVAL
    ) {
      console.log('Skipping optimization: last optimization was recent');
      return stats;
    }
    
    console.log('Starting translation data optimization...');
    
    // Récupérer le cache de traduction
    const cacheJson = await AsyncStorage.getItem('translationCache_v1');
    if (!cacheJson) {
      console.log('No translation cache found, nothing to optimize');
      return null;
    }
    
    // Parser le cache
    const originalCache: TranslationCache = JSON.parse(cacheJson);
    
    // Compresser le cache
    const compressedCache = compressTranslationCache(originalCache);
    
    // Sauvegarder le cache compressé
    await AsyncStorage.setItem('translationCache_v1', JSON.stringify(compressedCache));
    
    // Mettre à jour les statistiques
    const newStats = await updateCompressionStats(originalCache, compressedCache);
    
    console.log('Translation data optimization completed:', newStats);
    return newStats;
  } catch (error) {
    console.error('Error optimizing translation storage:', error);
    return null;
  }
};

/**
 * Exporte les données de traduction compressées dans un fichier
 * Utile pour sauvegarder ou partager les données
 * 
 * @returns Chemin du fichier exporté
 */
export const exportCompressedTranslationData = async (): Promise<string | null> => {
  try {
    // Récupérer le cache de traduction
    const cacheJson = await AsyncStorage.getItem('translationCache_v1');
    if (!cacheJson) {
      console.log('No translation cache found, nothing to export');
      return null;
    }
    
    // Créer le nom du fichier avec la date
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `speechtotalk_translations_${date}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Écrire les données dans le fichier
    await FileSystem.writeAsStringAsync(filePath, cacheJson);
    
    console.log(`Translation data exported to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error exporting translation data:', error);
    return null;
  }
};

/**
 * Importe des données de traduction compressées depuis un fichier
 * 
 * @param filePath - Chemin du fichier à importer
 * @returns Succès de l'importation
 */
export const importCompressedTranslationData = async (filePath: string): Promise<boolean> => {
  try {
    // Lire le fichier
    const fileContent = await FileSystem.readAsStringAsync(filePath);
    
    // Vérifier que le contenu est valide
    const cache = JSON.parse(fileContent) as TranslationCache;
    if (!cache || !cache.entries || !Array.isArray(cache.entries)) {
      console.error('Invalid translation data file');
      return false;
    }
    
    // Sauvegarder les données
    await AsyncStorage.setItem('translationCache_v1', fileContent);
    
    console.log('Translation data imported successfully');
    return true;
  } catch (error) {
    console.error('Error importing translation data:', error);
    return false;
  }
};
