import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import NetInfo from '@react-native-community/netinfo';

// Importer les fonctions de gestion du cache
import {
  getTranslationCacheStats,
  clearTranslationCache,
  setTranslationCacheLimit,
  downloadLanguage,
  LANGUAGES
} from '../../services/translationService';

export default function SettingsScreen() {
  // États pour les statistiques du cache
  const [cacheStats, setCacheStats] = useState<{
    totalEntries: number;
    languageStats: Record<string, number>;
    emergencyPhraseCount: number;
    cacheSize: number;
    lastCleanup: Date;
  } | null>(null);
  
  // État pour la limite de taille du cache
  const [cacheSizeLimit, setCacheSizeLimit] = useState(500);
  
  // État pour la langue sélectionnée pour le téléchargement
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // États pour les indicateurs de chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // État pour la connectivité
  const [isConnected, setIsConnected] = useState(true);
  
  // Charger les statistiques du cache au chargement de l'écran
  useEffect(() => {
    loadCacheStats();
    
    // Vérifier la connectivité
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Fonction pour charger les statistiques du cache
  const loadCacheStats = async () => {
    setIsLoading(true);
    try {
      const stats = await getTranslationCacheStats();
      setCacheStats(stats);
      setCacheSizeLimit(stats.cacheSize);
    } catch (error) {
      console.error('Error loading cache stats:', error);
      Alert.alert('Erreur', 'Impossible de charger les statistiques du cache.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour effacer le cache
  const handleClearCache = async () => {
    Alert.alert(
      'Effacer le cache',
      'Êtes-vous sûr de vouloir effacer toutes les traductions en cache ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearTranslationCache();
              await loadCacheStats();
              Alert.alert('Succès', 'Le cache de traduction a été effacé.');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Erreur', 'Impossible d\'effacer le cache.');
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };
  
  // Fonction pour mettre à jour la limite de taille du cache
  const handleCacheSizeLimitChange = async (newLimit: number) => {
    try {
      await setTranslationCacheLimit(newLimit);
      await loadCacheStats();
    } catch (error) {
      console.error('Error setting cache limit:', error);
      Alert.alert('Erreur', 'Impossible de modifier la limite du cache.');
    }
  };
  
  // Fonction pour télécharger une langue
  const handleDownloadLanguage = async () => {
    if (!isConnected) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté à Internet pour télécharger une langue.'
      );
      return;
    }
    
    setIsDownloading(true);
    try {
      const success = await downloadLanguage(selectedLanguage);
      if (success) {
        await loadCacheStats();
      }
    } catch (error) {
      console.error('Error downloading language:', error);
      Alert.alert(
        'Erreur',
        'Impossible de télécharger la langue. Veuillez réessayer plus tard.'
      );
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Formater la date pour l'affichage
  const formatDate = (date: Date) => {
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Obtenir le nom d'une langue à partir de son code
  const getLanguageName = (code: string) => {
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="cog"
            size={28}
            color="#4361ee"
            style={styles.titleIcon}
          />
          <Text style={styles.headerTitle}>Paramètres</Text>
        </View>
        <View style={styles.connectionStatus}>
          <MaterialCommunityIcons
            name={isConnected ? 'wifi' : 'wifi-off'}
            size={18}
            color={isConnected ? '#4CAF50' : '#F44336'}
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'En ligne' : 'Hors ligne'}
          </Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4361ee" />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <>
            {/* Section de gestion du cache */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gestion du cache de traduction</Text>
              
              <View style={styles.card}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Traductions en cache:</Text>
                  <Text style={styles.statValue}>{cacheStats?.totalEntries || 0}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Phrases d&lsquo;urgence:</Text>
                  <Text style={styles.statValue}>{cacheStats?.emergencyPhraseCount || 0}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Dernier nettoyage:</Text>
                  <Text style={styles.statValue}>
                    {cacheStats?.lastCleanup ? formatDate(cacheStats.lastCleanup) : 'Jamais'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton, isClearing && styles.disabledButton]}
                  onPress={handleClearCache}
                  disabled={isClearing || cacheStats?.totalEntries === 0}
                >
                  {isClearing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Effacer le cache</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Section des langues par nombre de traductions */}
            {cacheStats?.languageStats && Object.keys(cacheStats.languageStats).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Traductions par langue</Text>
                
                <View style={styles.card}>
                  {Object.entries(cacheStats.languageStats).map(([langCode, count]) => (
                    <View key={langCode} style={styles.statRow}>
                      <Text style={styles.statLabel}>{getLanguageName(langCode)}:</Text>
                      <Text style={styles.statValue}>{count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Section de téléchargement de langues */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Télécharger des langues pour le mode hors ligne</Text>
              
              <View style={styles.card}>
                <Text style={styles.cardDescription}>
                  Téléchargez des langues pour pouvoir les utiliser même sans connexion internet.
                  Les phrases d&lsquo;urgence et les traductions fréquentes seront disponibles hors ligne.
                </Text>
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedLanguage}
                    style={styles.picker}
                    onValueChange={(value) => setSelectedLanguage(value)}
                    dropdownIconColor="#4361ee"
                  >
                    {LANGUAGES.filter(lang => lang.code !== 'fr').map((lang) => (
                      <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
                    ))}
                  </Picker>
                </View>
                
                <TouchableOpacity
                  style={[styles.button, isDownloading && styles.disabledButton]}
                  onPress={handleDownloadLanguage}
                  disabled={isDownloading || !isConnected}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="download" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Télécharger la langue</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Section de configuration du cache */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configuration du cache</Text>
              
              <View style={styles.card}>
                <Text style={styles.cardDescription}>
                  Définissez la taille maximale du cache de traduction. Une taille plus grande permet
                  de stocker plus de traductions, mais utilise plus de mémoire sur l&apos;appareil.
                </Text>
                
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Limite du cache: {cacheSizeLimit} traductions</Text>
                  {/* Utiliser un composant personnalisé au lieu du Slider qui pose problème */}
                  <View style={styles.customSliderContainer}>
                    <View style={styles.buttonsContainer}>
                      <TouchableOpacity 
                        style={styles.customSliderButton}
                        onPress={() => {
                          const newValue = Math.max(100, cacheSizeLimit - 100);
                          setCacheSizeLimit(newValue);
                          handleCacheSizeLimitChange(newValue);
                        }}
                      >
                        <Text style={styles.customSliderButtonText}>-</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.customSlider}>
                        <View 
                          style={[styles.customSliderFill, {width: `${(cacheSizeLimit-100)/(2000-100)*100}%`}]}
                        />
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.customSliderButton}
                        onPress={() => {
                          const newValue = Math.min(2000, cacheSizeLimit + 100);
                          setCacheSizeLimit(newValue);
                          handleCacheSizeLimitChange(newValue);
                        }}
                      >
                        <Text style={styles.customSliderButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderMinLabel}>100</Text>
                    <Text style={styles.sliderMaxLabel}>2000</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    marginBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4361ee',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  connectionText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#4361ee',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4361ee',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4361ee',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f2f6',
  },
  cardDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  statLabel: {
    fontSize: 16,
    color: '#2d3748',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4361ee',
  },
  button: {
    backgroundColor: '#4361ee',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  picker: {
    height: 45,
    width: '100%',
  },
  sliderContainer: {
    marginTop: 10,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -5,
  },
  sliderMinLabel: {
    fontSize: 12,
    color: '#718096',
  },
  sliderMaxLabel: {
    fontSize: 12,
    color: '#718096',
  },
  // Styles pour le slider personnalisé
  customSliderContainer: {
    marginVertical: 15,
    width: '100%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  customSlider: {
    height: 8,
    backgroundColor: '#d3d3d3',
    borderRadius: 4,
    marginBottom: 15,
    marginHorizontal: 10,
  },
  customSliderFill: {
    height: 8,
    backgroundColor: '#4361ee',
    borderRadius: 4,
  },
  customSliderButton: {
    backgroundColor: '#4361ee',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    position: 'absolute',
    right: 0,
    top: -14,
  },
  customSliderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
