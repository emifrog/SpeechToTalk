/**
 * Types partagés pour les services de l'application SpeechToTalk
 */

// Interface pour une entrée du cache de traduction
export interface TranslationCacheEntry {
  text: string;                // Texte original
  translation: string;         // Texte traduit
  sourceLang: string;          // Langue source
  targetLang: string;          // Langue cible
  timestamp: number;           // Horodatage de la dernière utilisation
  useCount: number;            // Nombre d'utilisations
  isEmergencyPhrase?: boolean; // Indique si c'est une phrase d'urgence prioritaire
}

// Structure du cache de traduction
export interface TranslationCache {
  entries: TranslationCacheEntry[];
  lastCleanup: number;         // Dernier nettoyage du cache
  version: number;             // Version du cache pour les migrations futures
  sizeLimit: number;           // Limite de taille du cache (nombre d'entrées)
}

// Types d'erreurs de traduction
export enum TranslationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Interface pour les erreurs de traduction
export interface TranslationError {
  type: TranslationErrorType;
  message: string;
  details?: any;
}

// Structure pour les statistiques de compression
export interface CompressionStats {
  originalSize: number;       // Taille originale des données (en octets)
  compressedSize: number;     // Taille compressée des données (en octets)
  compressionRatio: number;   // Ratio de compression (originalSize / compressedSize)
  entriesCompressed: number;  // Nombre d'entrées compressées
  entriesTotal: number;       // Nombre total d'entrées
  lastOptimization: number;   // Timestamp de la dernière optimisation
  version: number;            // Version du format de compression
}

// Interface pour une langue supportée
export interface Language {
  code: string;
  name: string;
}
