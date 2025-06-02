// Ce fichier fournit les clés API pour l'application
import AsyncStorage from '@react-native-async-storage/async-storage';

// Variable pour stocker la clé API
let apiKey = '';

// Fonction pour charger la clé API depuis AsyncStorage
export const loadApiKey = async () => {
  try {
    const storedKey = await AsyncStorage.getItem('GOOGLE_CLOUD_API_KEY');
    if (storedKey) {
      apiKey = storedKey;
      return storedKey;
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la clé API:', error);
  }
  return '';
};

// Fonction pour définir la clé API
export const setApiKey = async (key: string) => {
  try {
    await AsyncStorage.setItem('GOOGLE_CLOUD_API_KEY', key);
    apiKey = key;
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la clé API:', error);
    return false;
  }
};

// Récupérer la clé API Google Cloud
export const getGoogleCloudApiKey = () => apiKey;

// Initialiser le chargement de la clé au démarrage
loadApiKey().catch(error => {
  console.error('Erreur lors de l\'initialisation de la clé API:', error);
});
