/**
 * @fileoverview Types et interfaces partagés pour les services de l'application SpeechToTalk
 *
 * Ce module contient toutes les définitions de types TypeScript utilisées
 * à travers les différents services de l'application.
 *
 * @module services/types
 */

/**
 * Représente une entrée unique dans le cache de traduction
 *
 * Chaque entrée stocke une traduction avec ses métadonnées associées
 * pour permettre la gestion du cache (expiration, priorité, etc.)
 *
 * @interface TranslationCacheEntry
 * @property {string} text - Le texte original à traduire
 * @property {string} translation - Le texte traduit
 * @property {string} sourceLang - Code ISO 639-1 de la langue source (ex: 'fr')
 * @property {string} targetLang - Code ISO 639-1 de la langue cible (ex: 'en')
 * @property {number} timestamp - Timestamp Unix de la dernière utilisation
 * @property {number} useCount - Nombre de fois que cette traduction a été utilisée
 * @property {boolean} [isEmergencyPhrase] - Si true, la traduction est prioritaire et conservée plus longtemps
 */
export interface TranslationCacheEntry {
  text: string;                // Texte original
  translation: string;         // Texte traduit
  sourceLang: string;          // Langue source
  targetLang: string;          // Langue cible
  timestamp: number;           // Horodatage de la dernière utilisation
  useCount: number;            // Nombre d'utilisations
  isEmergencyPhrase?: boolean; // Indique si c'est une phrase d'urgence prioritaire
}

/**
 * Structure complète du cache de traduction
 *
 * Contient toutes les entrées de traduction ainsi que les métadonnées
 * de gestion du cache (version, limite, dernier nettoyage).
 *
 * @interface TranslationCache
 * @property {TranslationCacheEntry[]} entries - Liste des traductions en cache
 * @property {number} lastCleanup - Timestamp du dernier nettoyage automatique
 * @property {number} version - Version du format de cache (pour migrations futures)
 * @property {number} sizeLimit - Nombre maximum d'entrées autorisées
 */
export interface TranslationCache {
  entries: TranslationCacheEntry[];
  lastCleanup: number;         // Dernier nettoyage du cache
  version: number;             // Version du cache pour les migrations futures
  sizeLimit: number;           // Limite de taille du cache (nombre d'entrées)
}

/**
 * Types d'erreurs pouvant survenir lors des opérations de traduction
 *
 * @enum {string} TranslationErrorType
 * @property {string} NETWORK_ERROR - Erreur de connexion réseau
 * @property {string} API_ERROR - Erreur retournée par l'API de traduction
 * @property {string} QUOTA_EXCEEDED - Quota d'utilisation de l'API dépassé
 * @property {string} UNSUPPORTED_LANGUAGE - Langue non supportée par le service
 * @property {string} INVALID_REQUEST - Requête malformée
 * @property {string} UNKNOWN_ERROR - Erreur non identifiée
 */
export enum TranslationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Structure d'une erreur de traduction
 *
 * Utilisée pour standardiser le format des erreurs à travers l'application.
 *
 * @interface TranslationError
 * @property {TranslationErrorType} type - Type de l'erreur
 * @property {string} message - Message descriptif de l'erreur
 * @property {any} [details] - Détails supplémentaires (stack trace, réponse API, etc.)
 */
export interface TranslationError {
  type: TranslationErrorType;
  message: string;
  details?: any;
}

/**
 * Statistiques de compression du cache de traduction
 *
 * Ces statistiques permettent de monitorer l'efficacité de la compression
 * et l'état du stockage.
 *
 * @interface CompressionStats
 * @property {number} originalSize - Taille originale en octets avant compression
 * @property {number} compressedSize - Taille après compression en octets
 * @property {number} compressionRatio - Ratio de compression (original/compressé)
 * @property {number} entriesCompressed - Nombre d'entrées actuellement compressées
 * @property {number} entriesTotal - Nombre total d'entrées dans le cache
 * @property {number} lastOptimization - Timestamp de la dernière optimisation
 * @property {number} version - Version du format de compression
 */
export interface CompressionStats {
  originalSize: number;       // Taille originale des données (en octets)
  compressedSize: number;     // Taille compressée des données (en octets)
  compressionRatio: number;   // Ratio de compression (originalSize / compressedSize)
  entriesCompressed: number;  // Nombre d'entrées compressées
  entriesTotal: number;       // Nombre total d'entrées
  lastOptimization: number;   // Timestamp de la dernière optimisation
  version: number;            // Version du format de compression
}

/**
 * Représente une langue supportée par l'application
 *
 * @interface Language
 * @property {string} code - Code ISO 639-1 de la langue (ex: 'fr', 'en', 'es')
 * @property {string} name - Nom de la langue en français (ex: 'Français', 'Anglais')
 */
export interface Language {
  code: string;
  name: string;
}
