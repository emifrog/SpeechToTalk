import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmergencyPhrase {
  fr: string;
  translations: Record<string, string>;
}

interface MemoizedEmergencyPhrasesProps {
  phrases: EmergencyPhrase[];
  onPhrasePress: (phrase: string) => void;
  colorScheme: string | null | undefined;
  colors: any;
}

const MemoizedEmergencyPhrases = memo<MemoizedEmergencyPhrasesProps>(({
  phrases,
  onPhrasePress,
  colorScheme,
  colors
}) => {
  const handlePhrasePress = useCallback((phrase: string) => {
    onPhrasePress(phrase);
  }, [onPhrasePress]);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginLeft: 8,
    },
    phrasesContainer: {
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emergencyPhraseButton: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 111, 0, 0.15)' : 'rgba(255, 111, 0, 0.08)',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 111, 0, 0.3)' : 'rgba(255, 111, 0, 0.2)',
      borderRadius: 12,
      padding: 12,
      marginRight: 12,
      marginBottom: 8,
      minWidth: 150,
      elevation: 2,
      shadowColor: colors.secondary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    phraseIcon: {
      marginRight: 8,
    },
    emergencyPhraseText: {
      fontSize: 15,
      color: colorScheme === 'dark' ? '#e2e8f0' : '#2d3748',
      fontWeight: '500',
      flex: 1,
    },
  });

  if (!phrases || phrases.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="alert-circle" size={20} color={colors.secondary} />
        <Text style={styles.sectionTitle}>Phrases d&apos;urgence</Text>
      </View>
      <View style={styles.phrasesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {phrases.map((phrase, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emergencyPhraseButton}
              onPress={() => handlePhrasePress(phrase.fr)}
            >
              <MaterialCommunityIcons
                name="medical-bag"
                size={16}
                color={colors.secondary}
                style={styles.phraseIcon}
              />
              <Text style={styles.emergencyPhraseText} numberOfLines={2}>
                {phrase.fr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

MemoizedEmergencyPhrases.displayName = 'MemoizedEmergencyPhrases';

export default MemoizedEmergencyPhrases;
