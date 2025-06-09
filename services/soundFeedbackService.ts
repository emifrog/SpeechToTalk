import { Audio } from 'expo-av';

// Types pour notre service de feedback sonore
export enum SoundType {
  SUCCESS = 'success',
  ERROR = 'error',
  START_LISTENING = 'startListening',
  STOP_LISTENING = 'stopListening',
  TRANSLATION_COMPLETE = 'translationComplete',
  BUTTON_PRESS = 'buttonPress',
  NOTIFICATION = 'notification',
}

// Configuration des sons
interface SoundConfig {
  durationMs: number;
  type: 'sine' | 'triangle' | 'sawtooth' | 'square';
  frequency: number;
  volume: number;
  pattern?: { durationMs: number; isSound: boolean }[]; // Pour les sons avec motif (comme les bips)
}

// Classe pour gérer les sons
class SoundFeedbackService {
  private isMuted = false;
  
  // Configuration des différents sons
  private soundConfigs: Record<SoundType, SoundConfig> = {
    [SoundType.SUCCESS]: {
      durationMs: 300,
      type: 'sine',
      frequency: 880, // La (A5)
      volume: 0.5,
      pattern: [
        { durationMs: 150, isSound: true },
        { durationMs: 50, isSound: false },
        { durationMs: 150, isSound: true }
      ]
    },
    [SoundType.ERROR]: {
      durationMs: 400,
      type: 'triangle',
      frequency: 220, // La (A3) plus grave
      volume: 0.5,
      pattern: [
        { durationMs: 100, isSound: true },
        { durationMs: 50, isSound: false },
        { durationMs: 250, isSound: true }
      ]
    },
    [SoundType.START_LISTENING]: {
      durationMs: 200,
      type: 'sine',
      frequency: 660, // Mi (E5)
      volume: 0.4
    },
    [SoundType.STOP_LISTENING]: {
      durationMs: 200,
      type: 'sine',
      frequency: 440, // La (A4)
      volume: 0.4
    },
    [SoundType.TRANSLATION_COMPLETE]: {
      durationMs: 300,
      type: 'sine',
      frequency: 523.25, // Do (C5)
      volume: 0.4,
      pattern: [
        { durationMs: 100, isSound: true },
        { durationMs: 50, isSound: false },
        { durationMs: 150, isSound: true }
      ]
    },
    [SoundType.BUTTON_PRESS]: {
      durationMs: 100,
      type: 'sine',
      frequency: 600,
      volume: 0.3
    },
    [SoundType.NOTIFICATION]: {
      durationMs: 350,
      type: 'sine',
      frequency: 700, // Fa# (F#5)
      volume: 0.45,
      pattern: [
        { durationMs: 100, isSound: true },
        { durationMs: 50, isSound: false },
        { durationMs: 100, isSound: true },
        { durationMs: 50, isSound: false },
        { durationMs: 100, isSound: true }
      ]
    },
  };

  constructor() {
    // Initialiser le système audio
    this.initAudio();
  }

  private async initAudio() {
    try {
      // S'assurer que l'audio est configuré correctement
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'audio:', error);
    }
  }

  // Jouer un son spécifique
  async playSound(type: SoundType) {
    try {
      if (this.isMuted) return;

      const config = this.soundConfigs[type];
      if (!config) {
        console.warn(`Configuration pour le son ${type} non trouvée`);
        return;
      }

      // Si le son a un pattern, jouer chaque partie du pattern
      if (config.pattern) {
        for (const part of config.pattern) {
          if (part.isSound) {
            // Créer et jouer le son
            const { sound } = await Audio.Sound.createAsync(
              { uri: this.generateToneUri(config.frequency, part.durationMs, config.type, config.volume) },
              { shouldPlay: true }
            );
            
            // Attendre que le son soit terminé
            await new Promise(resolve => setTimeout(resolve, part.durationMs));
            
            // Décharger le son pour libérer les ressources
            await sound.unloadAsync();
          } else {
            // Pause entre les sons
            await new Promise(resolve => setTimeout(resolve, part.durationMs));
          }
        }
      } else {
        // Créer et jouer un son simple
        const { sound } = await Audio.Sound.createAsync(
          { uri: this.generateToneUri(config.frequency, config.durationMs, config.type, config.volume) },
          { shouldPlay: true }
        );
        
        // Attendre que le son soit terminé
        await new Promise(resolve => setTimeout(resolve, config.durationMs));
        
        // Décharger le son pour libérer les ressources
        await sound.unloadAsync();
      }
    } catch (error) {
      console.error(`Erreur lors de la lecture du son ${type}:`, error);
    }
  }

  // Générer un URI pour un ton audio
  private generateToneUri(frequency: number, durationMs: number, type: string, volume: number): string {
    // Comme nous ne pouvons pas générer de vrais fichiers audio ici, nous allons simuler un URI
    // Dans une implémentation réelle, nous utiliserions une bibliothèque comme tone.js ou web-audio-api
    // pour générer un vrai fichier audio
    
    // Pour notre simulation, nous utiliserons un URI de données qui ne fait rien mais qui ne causera pas d'erreur
    // Dans une vraie implémentation, cela serait remplacé par un URI valide
    return `data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQcAAACAgICAgICA`;
  }

  // Activer/désactiver tous les sons
  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Vérifier si les sons sont activés
  isSoundEnabled(): boolean {
    return !this.isMuted;
  }

  // Jouer un son de confirmation générique
  async playConfirmation() {
    await this.playSound(SoundType.SUCCESS);
  }

  // Jouer un son d'erreur générique
  async playError() {
    await this.playSound(SoundType.ERROR);
  }

  // Jouer un son de notification
  async playNotification() {
    await this.playSound(SoundType.NOTIFICATION);
  }
}

// Exporter une instance unique du service
export const soundFeedback = new SoundFeedbackService();