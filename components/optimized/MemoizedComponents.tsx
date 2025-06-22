import React, { memo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// Types pour les props des composants
interface MemoizedLanguagePickerProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  languages: Array<{ code: string; name: string }>;
  style?: any;
  colors: any;
}

interface MemoizedMessageBubbleProps {
  text: string;
  isSource: boolean;
  language?: string;
  onSpeak?: () => void;
  colors: any;
}

interface MemoizedEmergencyPhraseProps {
  phrase: { fr: string; en: string };
  onPress: (phrase: any) => void;
  colors: any;
}

interface MemoizedControlButtonProps {
  onPress: () => void;
  icon: string;
  isActive?: boolean;
  style?: any;
  iconColor?: string;
  size?: number;
}

// Composant Language Picker mémorisé
export const MemoizedLanguagePicker = memo<MemoizedLanguagePickerProps>(
  ({ selectedLanguage, onLanguageChange, languages, style, colors }) => {
    return (
      <View style={[styles.pickerContainer, style]}>
        <Picker
          selectedValue={selectedLanguage}
          onValueChange={onLanguageChange}
          style={[styles.picker, { color: colors.text }]}
          itemStyle={{ color: colors.text }}
        >
          {languages.map((lang) => (
            <Picker.Item
              key={lang.code}
              label={lang.name}
              value={lang.code}
              color={colors.text}
            />
          ))}
        </Picker>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Comparaison personnalisée pour optimiser les re-rendus
    return (
      prevProps.selectedLanguage === nextProps.selectedLanguage &&
      prevProps.languages.length === nextProps.languages.length &&
      prevProps.colors === nextProps.colors
    );
  }
);

// Composant Message Bubble mémorisé
export const MemoizedMessageBubble = memo<MemoizedMessageBubbleProps>(
  ({ text, isSource, language, onSpeak, colors }) => {
    const bubbleStyle = isSource ? styles.messageBubbleSource : styles.messageBubbleTarget;
    const headerColor = isSource ? colors.primary : colors.secondary;

    return (
      <View style={[bubbleStyle, { backgroundColor: colors.card }]}>
        <View style={styles.bubbleHeader}>
          <Ionicons 
            name={isSource ? 'mic' : 'language'} 
            size={16} 
            color={headerColor} 
          />
          <Text style={[styles.bubbleHeaderText, { color: headerColor }]}>
            {isSource ? 'Texte reconnu' : `Traduction ${language ? `(${language})` : ''}`}
          </Text>
        </View>
        <Text style={[styles.messageText, { color: colors.text }]}>{text}</Text>
        {!isSource && onSpeak && (
          <TouchableOpacity style={styles.speakButton} onPress={onSpeak}>
            <Ionicons name="volume-high" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.text === nextProps.text &&
      prevProps.isSource === nextProps.isSource &&
      prevProps.language === nextProps.language &&
      prevProps.colors === nextProps.colors
    );
  }
);

// Composant Emergency Phrase mémorisé
export const MemoizedEmergencyPhrase = memo<MemoizedEmergencyPhraseProps>(
  ({ phrase, onPress, colors }) => {
    return (
      <TouchableOpacity
        style={[styles.phraseButton, { borderColor: colors.border }]}
        onPress={() => onPress(phrase)}
      >
        <Ionicons name="chatbubble" size={20} color={colors.primary} />
        <Text style={[styles.phraseText, { color: colors.text }]}>{phrase.fr}</Text>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.phrase.fr === nextProps.phrase.fr &&
      prevProps.colors === nextProps.colors
    );
  }
);

// Composant Control Button mémorisé
export const MemoizedControlButton = memo<MemoizedControlButtonProps>(
  ({ onPress, icon, isActive = false, style, iconColor = '#fff', size = 24 }) => {
    return (
      <TouchableOpacity
        style={[
          styles.controlButton,
          isActive && styles.controlButtonActive,
          style
        ]}
        onPress={onPress}
      >
        <Ionicons name={icon as any} size={size} color={iconColor} />
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.icon === nextProps.icon &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.iconColor === nextProps.iconColor &&
      prevProps.size === nextProps.size
    );
  }
);

// Styles pour les composants mémorisés
const styles = StyleSheet.create({
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  messageBubbleSource: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  messageBubbleTarget: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bubbleHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  speakButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#10b981',
    borderRadius: 20,
    padding: 8,
  },
  phraseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    minWidth: 150,
  },
  phraseText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  controlButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#ef4444',
  },
});

// Export des noms pour éviter les erreurs de lint
MemoizedLanguagePicker.displayName = 'MemoizedLanguagePicker';
MemoizedMessageBubble.displayName = 'MemoizedMessageBubble';
MemoizedEmergencyPhrase.displayName = 'MemoizedEmergencyPhrase';
MemoizedControlButton.displayName = 'MemoizedControlButton';
