/**
 * @fileoverview Service de chiffrement pour la protection des données sensibles
 *
 * Ce service fournit des fonctions de chiffrement et déchiffrement pour protéger
 * les données sensibles stockées dans AsyncStorage, notamment les clés API
 * et les données utilisateur.
 *
 * @module services/encryptionService
 * @requires buffer
 * @requires @react-native-async-storage/async-storage
 */

import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuration du service de chiffrement
 * @constant {Object}
 * @private
 */
const ENCRYPTION_CONFIG = {
  /** Préfixe pour identifier les données chiffrées */
  ENCRYPTED_PREFIX: 'ENC:',
  /** Version du format de chiffrement pour les migrations */
  VERSION: 1,
  /** Clé de stockage pour la clé de chiffrement dérivée */
  DERIVED_KEY_STORAGE: 'app_derived_key',
  /** Sel pour la dérivation de clé (en production, utiliser un sel unique par appareil) */
  SALT: 'SpeechToTalk_Salt_v1',
};

/**
 * Génère une clé de chiffrement unique pour l'appareil
 *
 * Cette fonction génère une clé pseudo-aléatoire basée sur un identifiant unique
 * de l'appareil. En production, il est recommandé d'utiliser expo-secure-store
 * ou react-native-keychain pour un stockage vraiment sécurisé.
 *
 * @async
 * @function getOrCreateEncryptionKey
 * @returns {Promise<string>} La clé de chiffrement
 * @private
 */
const getOrCreateEncryptionKey = async (): Promise<string> => {
  try {
    // Vérifier si une clé existe déjà
    let key = await AsyncStorage.getItem(ENCRYPTION_CONFIG.DERIVED_KEY_STORAGE);

    if (!key) {
      // Générer une nouvelle clé basée sur un timestamp et des valeurs aléatoires
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substring(2, 15);
      const randomPart2 = Math.random().toString(36).substring(2, 15);
      key = `${timestamp}-${randomPart}-${randomPart2}-${ENCRYPTION_CONFIG.SALT}`;

      // Sauvegarder la clé
      await AsyncStorage.setItem(ENCRYPTION_CONFIG.DERIVED_KEY_STORAGE, key);
    }

    return key;
  } catch (error) {
    console.error('Erreur lors de la génération de la clé de chiffrement:', error);
    // Fallback vers une clé par défaut (moins sécurisé)
    return ENCRYPTION_CONFIG.SALT;
  }
};

/**
 * Effectue une opération XOR simple entre les données et la clé
 *
 * Cette fonction implémente un chiffrement XOR basique. Pour une sécurité
 * renforcée en production, utiliser une bibliothèque de cryptographie
 * comme react-native-crypto ou expo-crypto.
 *
 * @function xorCipher
 * @param {string} data - Les données à chiffrer/déchiffrer
 * @param {string} key - La clé de chiffrement
 * @returns {string} Les données transformées
 * @private
 */
const xorCipher = (data: string, key: string): string => {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
};

/**
 * Chiffre une chaîne de caractères
 *
 * Utilise un chiffrement XOR avec encodage Base64 pour protéger les données.
 * Les données chiffrées sont préfixées pour identification.
 *
 * @async
 * @function encryptString
 * @param {string} plainText - Le texte à chiffrer
 * @returns {Promise<string>} Le texte chiffré encodé en Base64 avec préfixe
 *
 * @example
 * const encrypted = await encryptString('ma-cle-api-secrete');
 * console.log(encrypted); // "ENC:base64encodeddata..."
 */
export const encryptString = async (plainText: string): Promise<string> => {
  try {
    if (!plainText) return '';

    const key = await getOrCreateEncryptionKey();
    const encrypted = xorCipher(plainText, key);
    const base64Encoded = Buffer.from(encrypted, 'utf-8').toString('base64');

    return ENCRYPTION_CONFIG.ENCRYPTED_PREFIX + base64Encoded;
  } catch (error) {
    console.error('Erreur lors du chiffrement:', error);
    return plainText; // Fallback: retourner le texte original
  }
};

/**
 * Déchiffre une chaîne de caractères
 *
 * Décode et déchiffre les données préalablement chiffrées avec encryptString.
 * Si les données ne sont pas chiffrées (pas de préfixe), elles sont retournées telles quelles.
 *
 * @async
 * @function decryptString
 * @param {string} encryptedText - Le texte chiffré à déchiffrer
 * @returns {Promise<string>} Le texte déchiffré
 *
 * @example
 * const decrypted = await decryptString('ENC:base64encodeddata...');
 * console.log(decrypted); // "ma-cle-api-secrete"
 */
export const decryptString = async (encryptedText: string): Promise<string> => {
  try {
    if (!encryptedText) return '';

    // Vérifier si les données sont chiffrées
    if (!encryptedText.startsWith(ENCRYPTION_CONFIG.ENCRYPTED_PREFIX)) {
      return encryptedText; // Données non chiffrées
    }

    const key = await getOrCreateEncryptionKey();
    const base64Data = encryptedText.substring(ENCRYPTION_CONFIG.ENCRYPTED_PREFIX.length);
    const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');

    return xorCipher(decoded, key);
  } catch (error) {
    console.error('Erreur lors du déchiffrement:', error);
    return encryptedText; // Fallback: retourner le texte original
  }
};

/**
 * Stocke une valeur chiffrée dans AsyncStorage
 *
 * @async
 * @function setSecureItem
 * @param {string} key - La clé de stockage
 * @param {string} value - La valeur à stocker (sera chiffrée)
 * @returns {Promise<boolean>} true si le stockage a réussi
 *
 * @example
 * await setSecureItem('API_KEY', 'ma-cle-secrete');
 */
export const setSecureItem = async (key: string, value: string): Promise<boolean> => {
  try {
    const encryptedValue = await encryptString(value);
    await AsyncStorage.setItem(key, encryptedValue);
    return true;
  } catch (error) {
    console.error(`Erreur lors du stockage sécurisé de ${key}:`, error);
    return false;
  }
};

/**
 * Récupère et déchiffre une valeur depuis AsyncStorage
 *
 * @async
 * @function getSecureItem
 * @param {string} key - La clé de stockage
 * @returns {Promise<string|null>} La valeur déchiffrée ou null si non trouvée
 *
 * @example
 * const apiKey = await getSecureItem('API_KEY');
 * if (apiKey) {
 *   console.log('Clé récupérée avec succès');
 * }
 */
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    const encryptedValue = await AsyncStorage.getItem(key);
    if (!encryptedValue) return null;

    return await decryptString(encryptedValue);
  } catch (error) {
    console.error(`Erreur lors de la récupération sécurisée de ${key}:`, error);
    return null;
  }
};

/**
 * Supprime une valeur du stockage sécurisé
 *
 * @async
 * @function removeSecureItem
 * @param {string} key - La clé de stockage à supprimer
 * @returns {Promise<boolean>} true si la suppression a réussi
 *
 * @example
 * await removeSecureItem('API_KEY');
 */
export const removeSecureItem = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de ${key}:`, error);
    return false;
  }
};

/**
 * Vérifie si une valeur stockée est chiffrée
 *
 * @async
 * @function isEncrypted
 * @param {string} key - La clé de stockage à vérifier
 * @returns {Promise<boolean>} true si la valeur est chiffrée
 *
 * @example
 * const encrypted = await isEncrypted('API_KEY');
 * console.log(encrypted ? 'Données chiffrées' : 'Données en clair');
 */
export const isEncrypted = async (key: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value?.startsWith(ENCRYPTION_CONFIG.ENCRYPTED_PREFIX) ?? false;
  } catch (error) {
    console.error(`Erreur lors de la vérification de ${key}:`, error);
    return false;
  }
};

/**
 * Migre une valeur non chiffrée vers un format chiffré
 *
 * Utile pour la migration de données existantes vers le nouveau
 * système de stockage sécurisé.
 *
 * @async
 * @function migrateToEncrypted
 * @param {string} key - La clé de stockage à migrer
 * @returns {Promise<boolean>} true si la migration a réussi ou n'était pas nécessaire
 *
 * @example
 * await migrateToEncrypted('GOOGLE_CLOUD_API_KEY');
 */
export const migrateToEncrypted = async (key: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return true; // Rien à migrer

    // Vérifier si déjà chiffré
    if (value.startsWith(ENCRYPTION_CONFIG.ENCRYPTED_PREFIX)) {
      return true; // Déjà chiffré
    }

    // Chiffrer et sauvegarder
    const encryptedValue = await encryptString(value);
    await AsyncStorage.setItem(key, encryptedValue);

    console.log(`Clé ${key} migrée vers le format chiffré`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la migration de ${key}:`, error);
    return false;
  }
};

/**
 * Statistiques sur le stockage sécurisé
 */
export interface SecureStorageStats {
  /** Nombre total de clés analysées */
  totalKeys: number;
  /** Nombre de clés chiffrées */
  encryptedKeys: number;
  /** Nombre de clés non chiffrées */
  unencryptedKeys: number;
  /** Liste des clés non chiffrées (pour migration) */
  keysToMigrate: string[];
}

/**
 * Obtient des statistiques sur le stockage sécurisé
 *
 * Analyse toutes les clés AsyncStorage pour identifier celles
 * qui sont chiffrées et celles qui nécessitent une migration.
 *
 * @async
 * @function getSecureStorageStats
 * @returns {Promise<SecureStorageStats>} Statistiques du stockage
 *
 * @example
 * const stats = await getSecureStorageStats();
 * console.log(`${stats.encryptedKeys}/${stats.totalKeys} clés chiffrées`);
 */
export const getSecureStorageStats = async (): Promise<SecureStorageStats> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToMigrate: string[] = [];
    let encryptedCount = 0;

    for (const key of allKeys) {
      // Ignorer les clés système
      if (key.startsWith('app_derived_key')) continue;

      const value = await AsyncStorage.getItem(key);
      if (value?.startsWith(ENCRYPTION_CONFIG.ENCRYPTED_PREFIX)) {
        encryptedCount++;
      } else if (value) {
        keysToMigrate.push(key);
      }
    }

    return {
      totalKeys: allKeys.length,
      encryptedKeys: encryptedCount,
      unencryptedKeys: keysToMigrate.length,
      keysToMigrate,
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse du stockage:', error);
    return {
      totalKeys: 0,
      encryptedKeys: 0,
      unencryptedKeys: 0,
      keysToMigrate: [],
    };
  }
};
