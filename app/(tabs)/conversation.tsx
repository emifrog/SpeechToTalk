import { AppCard } from '@/components/ui/AppCard';
import { StandardHeader } from '@/components/ui/AppHeader';
import { Colors } from '@/constants/Colors';
import { ConversationParticipant, ConversationTurn, conversationModeService } from '@/services/conversationModeService';
import { LANGUAGES } from '@/services/translationService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

/**
 * Page dédiée au mode conversation multilingue à tour de rôle
 */
export default function ConversationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const [isActive, setIsActive] = useState(false);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<ConversationParticipant | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  
  // Initialiser le composant
  useEffect(() => {
    // Vérifier si le mode conversation est déjà actif
    const active = conversationModeService.isActive();
    setIsActive(active);
    
    if (active) {
      updateParticipantsList();
      updateCurrentParticipant();
      updateConversationHistory();
    }
  }, []);
  
  // Mettre à jour la liste des participants
  const updateParticipantsList = () => {
    setParticipants(conversationModeService.getParticipants());
  };
  
  // Mettre à jour le participant actuel
  const updateCurrentParticipant = () => {
    setCurrentParticipant(conversationModeService.getCurrentParticipant());
  };
  
  // Mettre à jour l'historique de la conversation
  const updateConversationHistory = () => {
    setConversationHistory(conversationModeService.getConversationHistory());
  };
  
  // Activer ou désactiver le mode conversation
  const toggleConversationMode = () => {
    const newState = !isActive;
    setIsActive(newState);
    conversationModeService.setActive(newState);
    
    if (newState) {
      // Initialiser le mode conversation si nécessaire
      conversationModeService.initializeConversation();
      updateParticipantsList();
      updateCurrentParticipant();
    }
  };
  
  // Passer au participant suivant
  const handleNextParticipant = () => {
    conversationModeService.nextParticipant();
    updateCurrentParticipant();
  };
  
  // Ajouter un nouveau participant
  const handleAddParticipant = () => {
    // Par défaut, ajouter un participant avec la langue française
    conversationModeService.addParticipant('fr');
    updateParticipantsList();
    updateCurrentParticipant();
  };
  
  // Supprimer un participant
  const handleRemoveParticipant = (participantId: string) => {
    conversationModeService.removeParticipant(participantId);
    updateParticipantsList();
    updateCurrentParticipant();
  };
  
  // Mettre à jour la langue préférée d'un participant
  const handleLanguageChange = (participantId: string, language: string) => {
    conversationModeService.updateParticipantLanguage(participantId, language);
    updateParticipantsList();
  };
  
  // Effacer l'historique de la conversation
  const handleClearHistory = () => {
    conversationModeService.clearConversationHistory();
    updateConversationHistory();
  };
  
  // Rendre un élément de la liste des participants
  const renderParticipantItem = (item: ConversationParticipant) => {
    const isCurrentParticipant = currentParticipant?.id === item.id;
    
    return (
      <View key={item.id} style={[
        styles.participantItem,
        isCurrentParticipant && { borderColor: colors.primary, borderWidth: 2 }
      ]}>
        <View style={styles.participantHeader}>
          <MaterialCommunityIcons 
            name={isCurrentParticipant ? "account-voice" : "account"} 
            size={24} 
            color={isCurrentParticipant ? colors.primary : '#666'} 
          />
          <Text style={[
            styles.participantTitle,
            isCurrentParticipant && { color: colors.primary, fontWeight: '600' }
          ]}>
            {`Participant ${item.id.replace('participant', '')}`}
            {isCurrentParticipant && " (Actuel)"}
          </Text>
          
          {participants.length > 2 && (
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemoveParticipant(item.id)}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color="#ff5252" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.languageSelector}>
          <Text style={styles.languageLabel}>Langue préférée:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.preferredLanguage}
              style={styles.picker}
              onValueChange={(value) => handleLanguageChange(item.id, value)}
              dropdownIconColor="#144291"
            >
              {LANGUAGES.map((lang) => (
                <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
              ))}
            </Picker>
          </View>
        </View>
        
        {item.lastDetectedLanguage && (
          <View style={styles.detectedLanguageContainer}>
            <MaterialCommunityIcons name="auto-fix" size={16} color="#4caf50" />
            <Text style={styles.detectedLanguageText}>
              Dernière langue détectée: {conversationModeService.getLanguageName(item.lastDetectedLanguage)}
              {item.detectionConfidence && ` (${Math.round(item.detectionConfidence * 100)}%)`}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Rendre un élément de l'historique de la conversation
  const renderHistoryItem = (item: ConversationTurn) => {
    const participant = participants.find(p => p.id === item.participantId);
    
    if (!participant) return null;
    
    return (
      <View key={`${item.participantId}-${item.timestamp}`} style={styles.historyItem}>
        <View style={styles.historyItemHeader}>
          <MaterialCommunityIcons name="account" size={16} color="#666" />
          <Text style={styles.historyParticipant}>
            {`Participant ${participant.id.replace('participant', '')}`}
          </Text>
          <Text style={styles.historyTime}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.historyContent}>
          <Text style={styles.historyText}>{item.originalText}</Text>
          <Text style={styles.historyLanguage}>
            Langue détectée: {conversationModeService.getLanguageName(item.detectedLanguage)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StandardHeader title="Mode Conversation" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <AppCard 
          title="Mode Conversation Multilingue" 
          icon="account-group" 
          style={{ marginVertical: 10, marginHorizontal: 16 }}
        >
          <Text style={styles.description}>
            Ce mode permet à plusieurs utilisateurs de parler à tour de rôle avec détection automatique de la langue.
            Chaque participant peut parler dans sa langue préférée et être compris par les autres.
          </Text>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isActive ? styles.activeButton : styles.inactiveButton
            ]}
            onPress={toggleConversationMode}
          >
            <MaterialCommunityIcons
              name={isActive ? "account-group" : "account-group-outline"}
              size={24}
              color="#fff"
            />
            <Text style={styles.toggleButtonText}>
              {isActive ? "Désactiver le mode conversation" : "Activer le mode conversation"}
            </Text>
          </TouchableOpacity>
        </AppCard>
        
        {isActive && (
          <>
            <AppCard 
              title="Participants" 
              icon="account-multiple" 
              style={{ marginVertical: 10, marginHorizontal: 16 }}
            >
              <View style={styles.participantsHeader}>
                <Text style={[styles.participantsTitle, { color: colors.primary }]}>
                  Gérer les participants
                </Text>
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddParticipant}
                >
                  <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.participantsList}>
                {participants.map(renderParticipantItem)}
              </View>
              
              <TouchableOpacity 
                style={[styles.nextButton, { backgroundColor: colors.secondary }]}
                onPress={handleNextParticipant}
              >
                <MaterialCommunityIcons name="account-switch" size={24} color="#fff" />
                <Text style={styles.nextButtonText}>Participant suivant</Text>
              </TouchableOpacity>
            </AppCard>
            
            <AppCard 
              title="Historique de la conversation" 
              icon="history" 
              style={{ marginVertical: 10, marginHorizontal: 16 }}
            >
              <View style={styles.historyHeader}>
                <Text style={[styles.historyTitle, { color: colors.primary }]}>
                  Tours de parole récents
                </Text>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={handleClearHistory}
                >
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#ff5252" />
                  <Text style={styles.clearButtonText}>Effacer</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.historyList}>
                {conversationHistory.length > 0 ? (
                  conversationHistory.map(renderHistoryItem)
                ) : (
                  <Text style={styles.emptyHistory}>
                    Aucun historique disponible. Commencez à parler pour voir l&apos;historique ici.
                  </Text>
                )}
              </View>
            </AppCard>
            
            <AppCard 
              title="Instructions" 
              icon="information-outline" 
              style={{ marginVertical: 10, marginHorizontal: 16 }}
            >
              <Text style={styles.instructionText}>
                1. Activez le mode conversation pour commencer.
              </Text>
              <Text style={styles.instructionText}>
                2. Ajoutez des participants selon vos besoins.
              </Text>
              <Text style={styles.instructionText}>
                3. Sélectionnez la langue préférée pour chaque participant.
              </Text>
              <Text style={styles.instructionText}>
                4. Utilisez le bouton &quot;Participant suivant&quot; pour passer la parole.
              </Text>
              <Text style={styles.instructionText}>
                5. Parlez dans votre langue, la détection automatique identifiera la langue.
              </Text>
              <Text style={styles.instructionText}>
                6. Consultez l&apos;historique pour voir les tours de parole précédents.
              </Text>
            </AppCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  activeButton: {
    backgroundColor: '#4caf50',
  },
  inactiveButton: {
    backgroundColor: '#2196f3',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  participantsList: {
    marginBottom: 12,
  },
  participantItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantTitle: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  languageLabel: {
    fontSize: 14,
    marginRight: 8,
    width: 110,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  detectedLanguageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detectedLanguageText: {
    fontSize: 12,
    color: '#4caf50',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  nextButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ff5252',
  },
  clearButtonText: {
    color: '#ff5252',
    marginLeft: 4,
    fontSize: 14,
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyParticipant: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
  historyContent: {
    marginLeft: 22,
  },
  historyText: {
    fontSize: 15,
    marginBottom: 4,
  },
  historyLanguage: {
    fontSize: 12,
    color: '#4caf50',
    fontStyle: 'italic',
  },
  emptyHistory: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
});
