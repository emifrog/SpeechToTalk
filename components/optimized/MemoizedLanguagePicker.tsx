import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LANGUAGES } from '../../services/translationService';

interface MemoizedLanguagePickerProps {
  label: string;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  enabled?: boolean;
  colorScheme: string | null | undefined;
  colors: any;
  style?: any;
}

const MemoizedLanguagePicker = memo<MemoizedLanguagePickerProps>(({
  label,
  selectedLanguage,
  onLanguageChange,
  enabled = true,
  colorScheme,
  colors,
  style
}) => {
  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.primary,
      marginBottom: 4,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? '#333333' : '#e2e8f0',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colorScheme === 'dark' ? '#252525' : '#f8f9fa',
      opacity: enabled ? 1 : 0.7,
    },
    picker: {
      height: 45,
      width: '100%',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLanguage}
          onValueChange={onLanguageChange}
          style={styles.picker}
          enabled={enabled}
          dropdownIconColor={enabled ? '#144291' : '#aaaaaa'}
        >
          {LANGUAGES.map((lang) => (
            <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
          ))}
        </Picker>
      </View>
    </View>
  );
});

MemoizedLanguagePicker.displayName = 'MemoizedLanguagePicker';

export default MemoizedLanguagePicker;
