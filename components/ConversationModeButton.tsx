import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ConversationModeButtonProps {
  isActive: boolean;
  onToggle: () => void;
  primaryColor: string;
}

/**
 * Composant bouton pour activer/désactiver le mode conversation
 * Ce mode permet à plusieurs utilisateurs de parler à tour de rôle avec détection automatique de la langue
 */
export const ConversationModeButton: React.FC<ConversationModeButtonProps> = ({
  isActive,
  onToggle,
  primaryColor
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { borderColor: primaryColor },
          isActive && { backgroundColor: primaryColor }
        ]}
        onPress={onToggle}
      >
        <MaterialCommunityIcons
          name="account-group"
          size={18}
          color={isActive ? '#fff' : primaryColor}
        />
        <Text
          style={[
            styles.buttonText,
            { color: isActive ? '#fff' : primaryColor }
          ]}
        >
          Conversation
        </Text>
      </TouchableOpacity>
      
      {isActive && (
        <Text style={[styles.activeText, { color: '#4caf50' }]}>
          Mode conversation activé
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  }
});
