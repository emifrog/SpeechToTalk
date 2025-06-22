import { useCallback, useRef, useState } from 'react';
import { translateText } from '../services/translationService';
import { useDebouncedCallback } from './usePerformanceOptimization';

// Vérifier si AbortController est disponible dans l'environnement
const isAbortControllerSupported = typeof AbortController !== 'undefined';

// Type pour notre contrôleur d'annulation personnalisé
type AbortControllerLike = {
  signal: { aborted: boolean };
  abort: () => void;
};

// Type union pour supporter à la fois AbortController natif et notre implémentation
type AbortControllerType = AbortController | AbortControllerLike;

// Créer une implémentation minimale d'AbortController si non supporté
class SimpleAbortController implements AbortControllerLike {
  signal: { aborted: boolean } = { aborted: false };
  
  abort() {
    this.signal.aborted = true;
  }
}

// Fonction pour créer un contrôleur d'annulation compatible
function createAbortController(): AbortControllerLike {
  return isAbortControllerSupported ? new AbortController() : new SimpleAbortController();
}

interface UseTranslationOptimizationProps {
  sourceLanguage: string;
  targetLanguage: string;
  onTranslationStart?: () => void;
  onTranslationComplete?: (result: string) => void;
  onTranslationError?: (error: Error) => void;
}

interface UseTranslationOptimizationReturn {
  isTranslating: boolean;
  translateWithOptimization: (text: string) => Promise<string>;
  cancelPendingTranslation: () => void;
  getTranslationCacheKey: (text: string, source: string, target: string) => string;
}

/**
 * Hook pour optimiser les traductions avec cache, debounce et annulation
 */
export const useTranslationOptimization = ({
  sourceLanguage,
  targetLanguage,
  onTranslationStart,
  onTranslationComplete,
  onTranslationError,
}: UseTranslationOptimizationProps): UseTranslationOptimizationReturn => {
  
  const [isTranslating, setIsTranslating] = useState(false);
  const translationCacheRef = useRef<Map<string, string>>(new Map());
  const pendingTranslationRef = useRef<AbortControllerType | null>(null);
  const lastTranslationRef = useRef<string>('');

  // Génère une clé de cache pour la traduction
  const getTranslationCacheKey = useCallback((text: string, source: string, target: string) => {
    return `${text.toLowerCase().trim()}_${source}_${target}`;
  }, []);

  // Annule la traduction en cours
  const cancelPendingTranslation = useCallback(() => {
    if (pendingTranslationRef.current) {
      pendingTranslationRef.current.abort();
      pendingTranslationRef.current = null;
      setIsTranslating(false);
    }
  }, []);

  // Fonction de traduction optimisée avec cache et debounce
  const translateWithOptimization = useCallback(async (text: string): Promise<string> => {
    // Vérification des entrées
    if (!text || !text.trim()) {
      return '';
    }

    const trimmedText = text.trim();
    
    // Éviter les traductions répétitives
    if (trimmedText === lastTranslationRef.current) {
      return '';
    }

    // Annuler la traduction précédente si elle existe
    cancelPendingTranslation();

    // Vérifier le cache local
    const cacheKey = getTranslationCacheKey(trimmedText, sourceLanguage, targetLanguage);
    const cachedResult = translationCacheRef.current.get(cacheKey);
    
    if (cachedResult) {
      lastTranslationRef.current = trimmedText;
      onTranslationComplete?.(cachedResult);
      return cachedResult;
    }

    // Créer un nouveau contrôleur d'annulation compatible
    const abortController = createAbortController();
    pendingTranslationRef.current = abortController;

    try {
      setIsTranslating(true);
      onTranslationStart?.();

      // Appel à l'API de traduction
      const result = await translateText(trimmedText, sourceLanguage, targetLanguage);
      
      // Vérifier si la traduction n'a pas été annulée
      if (!abortController.signal.aborted && result) {
        // Mettre en cache le résultat
        translationCacheRef.current.set(cacheKey, result);
        
        // Limiter la taille du cache (garder seulement les 100 dernières traductions)
        if (translationCacheRef.current.size > 100) {
          const firstKey = translationCacheRef.current.keys().next().value;
          if (firstKey !== undefined) {
            translationCacheRef.current.delete(firstKey);
          }
        }

        lastTranslationRef.current = trimmedText;
        onTranslationComplete?.(result);
        return result;
      }
      
      return '';
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error('Erreur de traduction:', error);
        onTranslationError?.(error as Error);
      }
      return '';
    } finally {
      if (!abortController.signal.aborted) {
        setIsTranslating(false);
        pendingTranslationRef.current = null;
      }
    }
  }, [
    sourceLanguage,
    targetLanguage,
    getTranslationCacheKey,
    cancelPendingTranslation,
    onTranslationStart,
    onTranslationComplete,
    onTranslationError,
  ]);

  // Version debounced de la traduction pour éviter les appels trop fréquents
  const debouncedTranslate = useDebouncedCallback(translateWithOptimization, 500);

  return {
    isTranslating,
    translateWithOptimization: debouncedTranslate,
    cancelPendingTranslation,
    getTranslationCacheKey,
  };
};

/**
 * Hook pour optimiser la reconnaissance vocale
 */
export const useVoiceRecognitionOptimization = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  // Dans React Native, setTimeout retourne un nombre, pas un objet Timeout
  const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Démarre l'écoute avec timeout automatique
  const startListeningWithTimeout = useCallback((maxDuration: number = 30000) => {
    setIsListening(true);
    setRecognizedText('');

    // Timeout de sécurité pour arrêter l'écoute automatiquement
    recognitionTimeoutRef.current = setTimeout(() => {
      stopListening();
    }, maxDuration);
  }, []);

  // Arrête l'écoute
  const stopListening = useCallback(() => {
    setIsListening(false);
    
    // Nettoyer les timeouts
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  // Gère la détection de silence pour arrêter automatiquement
  const handleSilenceDetection = useCallback((silenceDuration: number = 3000) => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    silenceTimeoutRef.current = setTimeout(() => {
      if (isListening && recognizedText) {
        stopListening();
      }
    }, silenceDuration);
  }, [isListening, recognizedText, stopListening]);

  // Met à jour le texte reconnu
  const updateRecognizedText = useCallback((text: string) => {
    setRecognizedText(text);
    // Redémarrer le timer de silence quand on reçoit du nouveau texte
    handleSilenceDetection();
  }, [handleSilenceDetection]);

  return {
    isListening,
    recognizedText,
    startListeningWithTimeout,
    stopListening,
    updateRecognizedText,
    setRecognizedText,
  };
};

/**
 * Hook pour optimiser la synthèse vocale
 */
export const useTextToSpeechOptimization = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechQueueRef = useRef<string[]>([]);
  const currentSpeechRef = useRef<string>('');

  // Ajoute un texte à la queue de synthèse vocale
  const queueSpeech = useCallback((text: string) => {
    if (!text || text === currentSpeechRef.current) {
      return;
    }

    speechQueueRef.current.push(text);
    processNextSpeech();
  }, []);

  // Traite le prochain élément de la queue
  const processNextSpeech = useCallback(async () => {
    if (isSpeaking || speechQueueRef.current.length === 0) {
      return;
    }

    const nextText = speechQueueRef.current.shift();
    if (!nextText) return;

    try {
      setIsSpeaking(true);
      currentSpeechRef.current = nextText;
      
      // Ici, vous intégreriez votre logique TTS réelle
      // Exemple: await Tts.speak(nextText);
      
      // Simulation pour l'exemple - remplacez par votre implémentation réelle
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Erreur de synthèse vocale:', error);
    } finally {
      setIsSpeaking(false);
      currentSpeechRef.current = '';
      
      // Traiter le prochain élément de la queue
      setTimeout(processNextSpeech, 100);
    }
  }, [isSpeaking]);

  // Arrête la synthèse vocale et vide la queue
  const stopSpeech = useCallback(() => {
    speechQueueRef.current = [];
    setIsSpeaking(false);
    currentSpeechRef.current = '';
  }, []);

  // Version debounced pour éviter les appels trop fréquents
  const debouncedQueueSpeech = useDebouncedCallback(queueSpeech, 300);

  return {
    isSpeaking,
    queueSpeech: debouncedQueueSpeech,
    stopSpeech,
    speechQueue: speechQueueRef.current,
  };
};
