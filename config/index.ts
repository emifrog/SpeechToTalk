// Ce fichier fournit les clés API pour l'application en les chargeant depuis les variables d'environnement
import * as dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Récupérer la clé API Google Cloud depuis les variables d'environnement
export const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY || '';

// Vérifier si la clé API est définie
if (!GOOGLE_CLOUD_API_KEY) {
  console.warn(
    'ATTENTION: La clé API Google Cloud n\'est pas définie. ' +
    'Veuillez créer un fichier .env à la racine du projet avec GOOGLE_CLOUD_API_KEY=votre_clé_api'
  );
}
