/**
 * @fileoverview Module de configuration pour l'application SpeechToTalk
 *
 * Ce module gère la configuration de l'application, notamment les clés API
 * et leur stockage sécurisé. Les clés sont chiffrées avant d'être stockées
 * dans AsyncStorage pour protéger les données sensibles.
 *
 * @module config
 * @requires @react-native-async-storage/async-storage
 * @requires ../services/encryptionService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setSecureItem,
  getSecureItem,
  migrateToEncrypted
} from '../services/encryptionService';

/**
 * Clé de stockage pour la clé API Google Cloud
 * @constant {string}
 * @private
 */
const API_KEY_STORAGE_KEY = 'GOOGLE_CLOUD_API_KEY';

/**
 * Variable en mémoire pour stocker la clé API (évite les lectures répétées)
 * @private
 */
let cachedApiKey = '';

/**
 * Indicateur de chargement initial
 * @private
 */
let isInitialized = false;

/**
 * Charge la clé API Google Cloud depuis le stockage sécurisé
 *
 * Cette fonction tente de charger la clé depuis AsyncStorage, la déchiffre
 * si nécessaire, et la met en cache pour les accès ultérieurs.
 *
 * @async
 * @function loadApiKey
 * @returns {Promise<string>} La clé API déchiffrée ou une chaîne vide si non trouvée
 *
 * @example
 * const apiKey = await loadApiKey();
 * if (apiKey) {
 *   console.log('Clé API chargée avec succès');
 * }
 */
export const loadApiKey = async (): Promise<string> => {
  try {
    // Migrer les anciennes données non chiffrées si nécessaire
    await migrateToEncrypted(API_KEY_STORAGE_KEY);

    // Charger et déchiffrer la clé
    const storedKey = await getSecureItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      cachedApiKey = storedKey;
      isInitialized = true;
      return storedKey;
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la clé API:', error);
  }
  return '';
};

/**
 * Définit et stocke de manière sécurisée la clé API Google Cloud
 *
 * La clé est chiffrée avant d'être stockée dans AsyncStorage.
 *
 * @async
 * @function setApiKey
 * @param {string} key - La clé API à stocker
 * @returns {Promise<boolean>} true si le stockage a réussi
 *
 * @example
 * const success = await setApiKey('AIzaSy...');
 * if (success) {
 *   console.log('Clé API enregistrée de manière sécurisée');
 * }
 */
export const setApiKey = async (key: string): Promise<boolean> => {
  try {
    const success = await setSecureItem(API_KEY_STORAGE_KEY, key);
    if (success) {
      cachedApiKey = key;
      isInitialized = true;
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la clé API:', error);
    return false;
  }
};

/**
 * Récupère la clé API Google Cloud
 *
 * Retourne la clé depuis le cache mémoire si disponible.
 * Sinon, effectue un chargement asynchrone.
 *
 * @function getGoogleCloudApiKey
 * @returns {string} La clé API ou une chaîne vide si non configurée
 *
 * @example
 * const apiKey = getGoogleCloudApiKey();
 * if (apiKey) {
 *   // Utiliser la clé pour les appels API
 * }
 */
export const getGoogleCloudApiKey = (): string => {
  return cachedApiKey;
};

/**
 * Vérifie si une clé API est configurée
 *
 * @function isApiKeyConfigured
 * @returns {boolean} true si une clé API est disponible
 *
 * @example
 * if (!isApiKeyConfigured()) {
 *   console.log('Veuillez configurer votre clé API');
 * }
 */
export const isApiKeyConfigured = (): boolean => {
  return cachedApiKey.length > 0;
};

/**
 * Efface la clé API du stockage et de la mémoire
 *
 * @async
 * @function clearApiKey
 * @returns {Promise<boolean>} true si la suppression a réussi
 *
 * @example
 * await clearApiKey();
 * console.log('Clé API supprimée');
 */
export const clearApiKey = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    cachedApiKey = '';
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la clé API:', error);
    return false;
  }
};

/**
 * Initialise le module de configuration
 *
 * Charge automatiquement la clé API au démarrage de l'application.
 * Cette fonction est appelée automatiquement lors de l'import du module.
 *
 * @async
 * @function initializeConfig
 * @returns {Promise<void>}
 */
export const initializeConfig = async (): Promise<void> => {
  if (!isInitialized) {
    await loadApiKey();
  }
};

// Initialisation automatique au chargement du module
initializeConfig().catch(error => {
  console.error('Erreur lors de l\'initialisation de la configuration:', error);
});
