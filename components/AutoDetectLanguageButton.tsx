import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AutoDetectLanguageButtonProps {
  isActive: boolean;
  onToggle: () => void;
  detectedLanguage: string | null;
  languageName?: string;
  primaryColor: string;
}

/**
 * Composant bouton pour activer/désactiver la détection automatique de langue
 */
export const AutoDetectLanguageButton: React.FC<AutoDetectLanguageButtonProps> = ({
  isActive,
  onToggle,
  detectedLanguage,
  languageName,
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
          name="auto-fix"
          size={18}
          color={isActive ? '#fff' : primaryColor}
        />
        <Text
          style={[
            styles.buttonText,
            { color: isActive ? '#fff' : primaryColor }
          ]}
        >
          Auto
        </Text>
      </TouchableOpacity>
      
      {isActive && detectedLanguage && (
        <Text style={[styles.detectedText, { color: '#4caf50' }]}>
          Langue détectée: {languageName || detectedLanguage}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  detectedText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  }
});
