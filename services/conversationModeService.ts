import { detectLanguageFromText, LanguageDetectionResult } from './languageDetectionService';
import { LANGUAGES } from './translationService';

/**
 * Interface pour représenter un participant à la conversation
 */
export interface ConversationParticipant {
  id: string;
  preferredLanguage: string;
  lastDetectedLanguage?: string;
  detectionConfidence?: number;
}

/**
 * Interface pour représenter un tour de parole dans la conversation
 */
export interface ConversationTurn {
  participantId: string;
  originalText: string;
  detectedLanguage: string;
  timestamp: number;
}

/**
 * Service pour gérer le mode conversation avec détection automatique de la langue
 * Ce service permet à plusieurs utilisateurs de parler à tour de rôle
 * avec détection automatique de la langue pour chacun
 */
class ConversationModeService {
  private participants: ConversationParticipant[] = [];
  private conversationHistory: ConversationTurn[] = [];
  private currentParticipantIndex: number = 0;
  private active: boolean = false;
  private languageDetectionThreshold: number = 0.7;

  /**
   * Initialiser le mode conversation
   * @param initialParticipants - Liste initiale des participants
   */
  public initializeConversation(initialParticipants: ConversationParticipant[] = []): void {
    this.participants = initialParticipants.length > 0 
      ? initialParticipants 
      : [
          { id: 'participant1', preferredLanguage: 'fr' },
          { id: 'participant2', preferredLanguage: 'en' }
        ];
    this.conversationHistory = [];
    this.currentParticipantIndex = 0;
    this.active = true;
  }

  /**
   * Définir l'état actif du mode conversation
   * @param active - true pour activer, false pour désactiver
   */
  public setActive(active: boolean): void {
    this.active = active;
    
    // Si on active le mode conversation, initialiser avec des participants par défaut
    if (active && this.participants.length === 0) {
      this.initializeConversation();
    }
  }
  
  /**
   * Vérifier si le mode conversation est actif
   * @returns true si le mode conversation est actif, false sinon
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * Traiter le texte d'entrée pour le participant actuel
   * @param text - Texte à analyser
   */
  public async processTextInput(text: string): Promise<void> {
    if (!this.active || !this.participants.length) {
      return;
    }
    
    try {
      // Détecter la langue du texte
      const detectionResult = await detectLanguageFromText(text);
      
      if (detectionResult.isReliable) {
        const currentParticipant = this.getCurrentParticipant();
        
        // Mettre à jour la dernière langue détectée pour le participant actuel
        this.updateParticipantDetectedLanguage(
          currentParticipant.id,
          detectionResult.detectedLanguage,
          detectionResult.confidence
        );
        
        // Enregistrer ce tour de parole dans l'historique
        this.conversationHistory.push({
          participantId: currentParticipant.id,
          originalText: text,
          detectedLanguage: detectionResult.detectedLanguage,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement du texte en mode conversation:', error);
    }
  }
  
  /**
   * Obtenir le nom d'une langue à partir de son code
   * @param languageCode - Code de la langue
   * @returns Le nom de la langue ou le code si la langue n'est pas trouvée
   */
  public getLanguageName(languageCode: string): string {
    const language = LANGUAGES.find(lang => lang.code === languageCode);
    return language ? language.name : languageCode;
  }
  
  /**
   * Ajouter un participant à la conversation
   * @param preferredLanguage - Langue préférée du participant
   * @returns L'ID du participant ajouté
   */
  public addParticipant(preferredLanguage: string): string {
    const participantId = `participant${this.participants.length + 1}`;
    this.participants.push({
      id: participantId,
      preferredLanguage
    });
    return participantId;
  }

  /**
   * Mettre à jour la langue détectée d'un participant
   * @param participantId - ID du participant
   * @param detectedLanguage - Langue détectée
   * @param confidence - Niveau de confiance de la détection
   */
  public updateParticipantDetectedLanguage(
    participantId: string,
    detectedLanguage: string,
    confidence: number
  ): void {
    const participantIndex = this.participants.findIndex(p => p.id === participantId);
    
    if (participantIndex !== -1) {
      this.participants[participantIndex].lastDetectedLanguage = detectedLanguage;
      this.participants[participantIndex].detectionConfidence = confidence;
    }
  }
  
  /**
   * Obtenir le participant actuel (celui dont c'est le tour de parler)
   * @returns Le participant actuel
   */
  public getCurrentParticipant(): ConversationParticipant {
    return this.participants[this.currentParticipantIndex];
  }
  
  /**
   * Passer au participant suivant
   * @returns Le nouveau participant actuel
   */
  public nextParticipant(): ConversationParticipant {
    this.currentParticipantIndex = (this.currentParticipantIndex + 1) % this.participants.length;
    return this.getCurrentParticipant();
  }
  
  /**
   * Obtenir la liste des participants
   * @returns La liste des participants
   */
  public getParticipants(): ConversationParticipant[] {
    return [...this.participants];
  }
  
  /**
   * Supprimer un participant de la conversation
   * @param participantId - ID du participant à supprimer
   * @returns true si le participant a été supprimé, false sinon
   */
  public removeParticipant(participantId: string): boolean {
    const initialLength = this.participants.length;
    this.participants = this.participants.filter(p => p.id !== participantId);
    
    // Ajuster l'index du participant courant si nécessaire
    if (this.currentParticipantIndex >= this.participants.length) {
      this.currentParticipantIndex = 0;
    }
    
    return this.participants.length < initialLength;
  }
  
  /**
   * Obtenir l'historique complet de la conversation
   * @returns L'historique de la conversation
   */
  public getConversationHistory(): ConversationTurn[] {
    return [...this.conversationHistory];
  }
  
  /**
   * Effacer l'historique de la conversation
   */
  public clearConversationHistory(): void {
    this.conversationHistory = [];
  }
  
  /**
   * Mettre à jour la langue préférée d'un participant
   * @param participantId - ID du participant
   * @param preferredLanguage - Nouvelle langue préférée
   * @returns true si la mise à jour a réussi, false sinon
   */
  public updateParticipantLanguage(participantId: string, preferredLanguage: string): boolean {
    const participant = this.participants.find(p => p.id === participantId);
    if (!participant) return false;
    
    participant.preferredLanguage = preferredLanguage;
    return true;
  }


}

// Exporter une instance unique du service
export const conversationModeService = new ConversationModeService();
