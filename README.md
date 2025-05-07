# SpeechToTalk 🎤 ➡️ 💬

## À propos de l'application

SpeechToTalk est une application mobile de traduction vocale en temps réel qui permet aux utilisateurs de communiquer facilement dans différentes langues. L'application utilise la reconnaissance vocale pour capturer la parole, la traduit dans la langue cible, et peut même prononcer la traduction à haute voix.

## Fonctionnalités principales

- **Traduction vocale en temps réel** : Parlez dans votre langue et obtenez une traduction instantanée
- **Interface utilisateur intuitive** : Design moderne avec des couleurs turquoise/teal (#00838f) et orange (#ff6f00)
- **Phrases d'urgence prédéfinies** : Accès rapide à des phrases essentielles pour les situations d'urgence
- **Historique des conversations** : Gardez une trace de vos traductions précédentes
- **Mode hors ligne** : Utilisez l'application même sans connexion internet (pour les langues téléchargées)
- **Support multi-langues** : Traduction entre de nombreuses langues

## Installation

1. Clonez ce dépôt

   ```bash
   git clone https://github.com/votre-nom/SpeechToTalk.git
   cd SpeechToTalk/SpeechTranslator
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

## Structure du projet

- **/app** : Code source principal de l'application
  - **/app/(tabs)** : Écrans principaux de l'application (accueil, exploration, paramètres)
- **/components** : Composants réutilisables (AppHeader, HapticTab, etc.)
- **/constants** : Constantes de l'application (couleurs, thèmes)
- **/assets** : Images, polices et autres ressources

## Captures d'écran

[Insérer des captures d'écran de l'application ici]

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
