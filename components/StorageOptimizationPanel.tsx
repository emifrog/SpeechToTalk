import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { forceStorageOptimization, getTranslationCacheStats } from '../services/translationService';
import { AppCard } from './ui/AppCard';
import { AppButton } from './ui/AppButton';

interface StorageStats {
  totalEntries: number;
  cacheSize: number;
  compressedSize: number;
  compressionRatio: number;
  emergencyPhraseCount: number;
}

export const StorageOptimizationPanel = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const theme = Theme;
  
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimized, setLastOptimized] = useState<Date | null>(null);
  
  // Charger les statistiques au chargement du composant
  useEffect(() => {
    loadStats();
  }, []);
  
  // Fonction pour charger les statistiques
  const loadStats = async () => {
    setIsLoading(true);
    try {
      const cacheStats = await getTranslationCacheStats();
      setStats({
        totalEntries: cacheStats.totalEntries,
        cacheSize: cacheStats.cacheSize,
        compressedSize: cacheStats.compressedSize,
        compressionRatio: cacheStats.compressionRatio,
        emergencyPhraseCount: cacheStats.emergencyPhraseCount
      });
      setLastOptimized(cacheStats.lastCleanup);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour optimiser le stockage
  const optimizeStorage = async () => {
    setIsOptimizing(true);
    try {
      const result = await forceStorageOptimization();
      if (result.success) {
        // Recharger les statistiques après l'optimisation
        await loadStats();
        setLastOptimized(new Date());
      }
    } catch (error) {
      console.error('Error optimizing storage:', error);
    } finally {
      setIsOptimizing(false);
    }
  };
  
  // Formater la taille en KB ou MB
  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} octets`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  // Formater le ratio de compression
  const formatRatio = (ratio: number) => {
    return `${ratio.toFixed(1)}x`;
  };
  
  // Calculer l'espace économisé
  const calculateSavedSpace = () => {
    if (!stats) return '0 octets';
    const savedBytes = stats.cacheSize - stats.compressedSize;
    return formatSize(savedBytes);
  };
  
  // Formater la date de dernière optimisation
  const formatLastOptimized = () => {
    if (!lastOptimized) return 'Jamais';
    return lastOptimized.toLocaleDateString() + ' ' + lastOptimized.toLocaleTimeString();
  };
  
  return (
    <AppCard
      title="Optimisation du stockage"
      icon="database-check"
      iconColor={theme.colors.primary}
      style={styles.container}
      elevation={3}
    >
      
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={styles.statsContainer}>
            {stats && (
              <>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Traductions stockées:</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalEntries}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Taille originale:</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{formatSize(stats.cacheSize)}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Taille compressée:</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{formatSize(stats.compressedSize)}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Ratio de compression:</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{formatRatio(stats.compressionRatio)}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Espace économisé:</Text>
                  <Text style={[styles.statValue, { color: colors.text, fontWeight: 'bold' }]}>
                    {calculateSavedSpace()}
                  </Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Dernière optimisation:</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{formatLastOptimized()}</Text>
                </View>
              </>
            )}
            
            {!stats && (
              <Text style={[styles.noDataText, { color: colors.text }]}>
                Aucune donnée de traduction disponible
              </Text>
            )}
          </View>
          
          <View style={styles.footer}>
            <AppButton
              title="Optimiser maintenant"
              icon="database-sync"
              onPress={optimizeStorage}
              disabled={isOptimizing}
              loading={isOptimizing}
              type="primary"
              size="medium"
              fullWidth
            />
          </View>
          
          <Text style={[styles.infoText, { color: isDark ? '#aaaaaa' : '#666666' }]}>
            La compression des données réduit l&apos;espace de stockage utilisé par les traductions,
            permettant de stocker plus de langues et de phrases pour une utilisation hors ligne.
          </Text>
        </>
      )}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loader: {
    marginVertical: 20,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
