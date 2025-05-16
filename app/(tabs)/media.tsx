import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MediaTranslator from '@/components/MediaTranslator';
import { Theme } from '@/constants/Theme';
import { StandardHeader } from '@/components/ui/AppHeader';
import { AppCard } from '@/components/ui/AppCard';

export default function MediaTranslationScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StandardHeader 
        title="Traduction Média" 
        showLogo={true}
      />
      <View style={styles.content}>
        <AppCard
          title="Images, documents et plus encore"
          icon="translate"
          iconColor={Theme.colors.primary}
          style={styles.mediaCard}
        >
          <MediaTranslator />
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  mediaCard: {
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
});
