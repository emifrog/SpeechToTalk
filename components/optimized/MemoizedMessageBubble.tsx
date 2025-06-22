import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MemoizedMessageBubbleProps {
  text: string;
  isSource: boolean;
  languageName?: string;
  onSpeak?: () => void;
  colorScheme: string | null | undefined;
  colors: any;
  isLoading?: boolean;
}

const MemoizedMessageBubble = memo<MemoizedMessageBubbleProps>(({
  text,
  isSource,
  languageName,
  onSpeak,
  colorScheme,
  colors,
  isLoading = false
}) => {
  const handleSpeak = useCallback(() => {
    onSpeak?.();
  }, [onSpeak]);

  const styles = StyleSheet.create({
    messageBubble: {
      backgroundColor: isSource 
        ? (colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.15)' : 'rgba(0, 131, 143, 0.08)')
        : (colorScheme === 'dark' ? 'rgba(255, 111, 0, 0.15)' : 'rgba(255, 111, 0, 0.08)'),
      borderWidth: 1,
      borderColor: isSource
        ? (colorScheme === 'dark' ? 'rgba(0, 131, 143, 0.3)' : 'rgba(0, 131, 143, 0.2)')
        : (colorScheme === 'dark' ? 'rgba(255, 111, 0, 0.3)' : 'rgba(255, 111, 0, 0.2)'),
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      maxWidth: '90%',
      alignSelf: isSource ? 'flex-start' : 'flex-end',
      position: 'relative',
      paddingRight: !isSource && onSpeak ? 40 : 16,
    },
    bubbleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    bubbleHeaderText: {
      fontSize: 14,
      fontWeight: '500',
      color: colorScheme === 'dark' ? '#e2e8f0' : '#4a5568',
      marginLeft: 6,
    },
    messageText: {
      fontSize: 16,
      color: colorScheme === 'dark' ? '#e2e8f0' : '#2d3748',
      lineHeight: 22,
    },
    speakButton: {
      position: 'absolute',
      right: 8,
      bottom: 8,
      backgroundColor: colors.secondary,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.messageBubble}>
      <View style={styles.bubbleHeader}>
        <MaterialCommunityIcons 
          name={isSource ? "microphone" : "translate"} 
          size={16} 
          color={isSource ? colors.primary : colors.secondary} 
        />
        <Text style={styles.bubbleHeaderText}>
          {isSource ? 'Texte original' : `Traduction${languageName ? ` (${languageName})` : ''}`}
        </Text>
      </View>
      <Text style={styles.messageText}>{text}</Text>
      {!isSource && onSpeak && (
        <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
          <MaterialCommunityIcons name="volume-high" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
});

MemoizedMessageBubble.displayName = 'MemoizedMessageBubble';

export default MemoizedMessageBubble;
