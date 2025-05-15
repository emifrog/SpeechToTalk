import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MediaTranslator from '@/components/MediaTranslator';
import { Theme } from '@/constants/Theme';

export default function MediaTranslationScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={Theme.gradients.primary}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Traduction Média</Text>
        <Text style={styles.headerSubtitle}>Images, documents et plus encore</Text>
      </LinearGradient>
      <View style={styles.content}>
        <MediaTranslator />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  headerGradient: {
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.xxxl,
    fontWeight: Theme.typography.fontWeight.bold as '700',
    color: Theme.colors.text.onPrimary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  headerSubtitle: {
    fontSize: Theme.typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.regular,
  },
  content: {
    flex: 1,
    marginTop: -Theme.spacing.lg,
    borderTopLeftRadius: Theme.borderRadius.lg,
    borderTopRightRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.background,
    overflow: 'hidden',
  },
});
