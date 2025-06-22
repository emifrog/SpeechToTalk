import * as React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ConversationModeButton } from './ConversationModeButton';
import { ConversationParticipant, conversationModeService } from '../services/conversationModeService';
import { LANGUAGES } from '../services/translationService';
import { Picker } from '@react-native-picker/picker';

interface ConversationModePanelProps {
  isActive: boolean;
  onToggle: () => void;
  primaryColor: string;
  secondaryColor: string;
}

/**
 * Composant pour gérer l'interface utilisateur du mode conversation
 * Ce mode permet à plusieurs utilisateurs de parler à tour de rôle avec détection automatique de la langue
 */
export const ConversationModePanel: React.FC<ConversationModePanelProps> = React.memo(({
  isActive,
  onToggle,
  primaryColor,
  secondaryColor
}) => {
  const [participants, setParticipants] = React.useState<ConversationParticipant[]>([]);
  const [currentParticipant, setCurrentParticipant] = React.useState<ConversationParticipant | null>(null);

  // Mettre à jour la liste des participants
  const updateParticipantsList = React.useCallback(() => {
    setParticipants(conversationModeService.getParticipants());
  }, []);

  // Initialiser le mode conversation lorsqu'il est activé
  React.useEffect(() => {
    if (isActive) {
      // Initialiser le mode conversation avec deux participants par défaut
      conversationModeService.initializeConversation();
      updateParticipantsList();
      setCurrentParticipant(conversationModeService.getCurrentParticipant());
    }
  }, [isActive, updateParticipantsList]);

  // Passer au participant suivant
  const handleNextParticipant = React.useCallback(() => {
    const nextParticipant = conversationModeService.nextParticipant();
    setCurrentParticipant(nextParticipant);
  }, []);

  // Ajouter un nouveau participant
  const handleAddParticipant = React.useCallback(() => {
    const newParticipant = conversationModeService.addParticipant('fr');
    updateParticipantsList();
    return newParticipant;
  }, [updateParticipantsList]);

  // Supprimer un participant
  const handleRemoveParticipant = React.useCallback((participantId: string) => {
    conversationModeService.removeParticipant(participantId);
    updateParticipantsList();
    setCurrentParticipant(conversationModeService.getCurrentParticipant());
  }, [updateParticipantsList]);

  // Changer la langue d'un participant
  const handleParticipantLanguageChange = React.useCallback((participantId: string, language: string) => {
    conversationModeService.updateParticipantLanguage(participantId, language);
    updateParticipantsList();
  }, [updateParticipantsList]);

  // Rendre un élément de la liste des participants
  const renderParticipantItem = React.useCallback(({ item }: { item: ConversationParticipant }) => {
    const isCurrentParticipant = currentParticipant?.id === item.id;
    const languageName = LANGUAGES.find(lang => lang.code === item.preferredLanguage)?.name || item.preferredLanguage;
    
    return (
      <View style={[
        styles.participantItem,
        isCurrentParticipant && { borderColor: primaryColor, borderWidth: 2 }
      ]}>
        <View style={styles.participantHeader}>
          <MaterialCommunityIcons 
            name={isCurrentParticipant ? "account-voice" : "account"} 
            size={24} 
            color={isCurrentParticipant ? primaryColor : '#666'} 
          />
          <Text style={[
            styles.participantTitle,
            isCurrentParticipant && { color: primaryColor, fontWeight: '600' }
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
              onValueChange={(value) => handleParticipantLanguageChange(item.id, value)}
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
  }, [participants.length, primaryColor, handleRemoveParticipant, handleParticipantLanguageChange]);

  if (!isActive) {
    return (
      <View style={styles.container}>
        <ConversationModeButton 
          isActive={isActive}
          onToggle={onToggle}
          primaryColor={primaryColor}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ConversationModeButton 
          isActive={isActive}
          onToggle={onToggle}
          primaryColor={primaryColor}
        />
        <Text style={styles.description}>
          Ce mode permet à plusieurs utilisateurs de parler à tour de rôle avec détection automatique de la langue.
        </Text>
      </View>

      <View style={styles.participantsContainer}>
        <View style={styles.participantsHeader}>
          <Text style={[styles.participantsTitle, { color: primaryColor }]}>Participants</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: primaryColor }]}
            onPress={handleAddParticipant}
          >
            <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={participants}
          renderItem={renderParticipantItem}
          keyExtractor={(item) => item.id}
          style={styles.participantsList}
        />

        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: secondaryColor }]}
          onPress={handleNextParticipant}
        >
          <MaterialCommunityIcons name="account-switch" size={24} color="#fff" />
          <Text style={styles.nextButtonText}>Participant suivant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

ConversationModePanel.displayName = 'ConversationModePanel';

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  participantsContainer: {
    marginTop: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    maxHeight: 300,
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
});
