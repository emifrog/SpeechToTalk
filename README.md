# SpeechToTalk 💬

## À propos de l'application

SpeechToTalk est une application mobile de traduction vocale en temps réel conçue spécifiquement pour les chefs d'agrès sapeurs-pompiers qui sont au contact de personnes ne parlant pas français. L'application utilise la reconnaissance vocale pour capturer la parole, la traduit dans la langue cible, et peut même prononcer la traduction à haute voix. Grâce à son système de cache, elle peut fonctionner hors ligne dans des situations d'urgence.

## Fonctionnalités principales

- **Traduction vocale en temps réel** : Parlez dans votre langue et obtenez une traduction instantanée
- **Interface utilisateur intuitive** : Design moderne et cohérent avec des composants réutilisables
- **Phrases d'urgence prédéfinies** : Accès rapide à des phrases essentielles pour les situations d'urgence médicales
- **Traduction de médias** : Possibilité de traduire du texte à partir d'images et de documents
- **Système de cache avancé** : Stockage intelligent des traductions pour une utilisation hors ligne
- **Mode hors ligne** : Utilisez l'application même sans connexion internet (pour les langues téléchargées)
- **Support multi-langues** : Traduction entre plus de 15 langues
- **Mode haute visibilité** : Interface adaptée pour une utilisation dans des conditions difficiles

## Installation

1. Clonez ce dépôt

   ```bash
   git clone https://github.com/votre-nom/SpeechToTalk.git
   cd SpeechToTalk
   ```

2. Installez les dépendances

   ```bash
   npm install
   ```

3. Démarrez l'application

   ```bash
   npx expo start
   ```

## Technologies utilisées

- **React Native** : Framework pour le développement d'applications mobiles
- **Expo** : Plateforme pour simplifier le développement React Native
- **React Navigation** : Navigation entre les écrans
- **@react-native-voice/voice** : Reconnaissance vocale
- **react-native-tts** : Synthèse vocale (Text-to-Speech)
- **@react-native-picker/picker** : Sélection des langues
- **@expo/vector-icons** : Icônes pour l'interface utilisateur
- **AsyncStorage** : Persistance des données pour le cache de traduction
- **NetInfo** : Détection de la connectivité réseau
- **expo-document-picker** et **expo-image-picker** : Sélection de documents et d'images pour la traduction

## Structure du projet

- **/app** : Code source principal de l'application
  - **/app/(tabs)** : Écrans principaux de l'application (accueil, exploration, médias, paramètres)
- **/components** : Composants réutilisables
  - **/components/ui** : Composants UI réutilisables (AppButton, AppCard, AppHeader)
  - **/components** : Autres composants (MediaTranslator, StorageOptimizationPanel, etc.)
- **/constants** : Constantes de l'application (Colors, Theme)
- **/services** : Services de l'application
  - **/services/translationService.ts** : Gestion des traductions et du cache
  - **/services/compressionService.ts** : Optimisation du stockage des traductions
- **/assets** : Images, polices et autres ressources

## Captures d'écran

[Insérer des captures d'écran de l'application ici]

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## Améliorations récentes

### Version 2.0.0 (Mai 2025)

- **Refonte de l'interface utilisateur** : Implémentation de composants UI réutilisables pour une meilleure cohérence visuelle
- **Nouveau module de traduction de médias** : Ajout de la possibilité de traduire du texte à partir d'images et de documents
- **Optimisation du système de cache** : Amélioration des performances et réduction de l'utilisation de la mémoire
- **Mode haute visibilité** : Ajout d'un mode d'affichage optimisé pour les conditions difficiles
- **Corrections de bugs** : Résolution de divers problèmes d'encodage et d'affichage

## Auteurs

Développé par l'équipe SpeechToTalk pour les services d'urgence français.
