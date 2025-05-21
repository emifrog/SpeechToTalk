import { StandardHeader } from '@/components/ui/AppHeader';
import { Colors } from '@/constants/Colors';
import { Theme } from '@/constants/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { StorageOptimizationPanel } from '../components/StorageOptimizationPanel';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';

// Importer les fonctions de gestion du cache
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clearTranslationCache,
  downloadLanguage,
  getTranslationCacheStats,
  LANGUAGES,
  setTranslationCacheLimit
} from '../services/translationService';

export default function FeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const theme = Theme;
  
  // États pour la partie feedback
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug' | 'improvement' | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  
  // États pour la partie settings
  const [activeTab, setActiveTab] = useState<'feedback' | 'settings'>('feedback');
  const [cacheStats, setCacheStats] = useState<{
    totalEntries: number;
    languageStats: Record<string, number>;
    emergencyPhraseCount: number;
    cacheSize: number;
    lastCleanup: Date;
  } | null>(null);
  const [cacheSizeLimit, setCacheSizeLimit] = useState(500);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
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

  const handleSubmit = () => {
    if (!feedbackType) {
      Alert.alert('Type requis', 'Veuillez sélectionner un type de feedback');
      return;
    }
    
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Veuillez entrer un titre pour votre feedback');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Description requise', 'Veuillez décrire votre feedback');
      return;
    }
    
    // Adresse email de destination pour le feedback
    const destinationEmail = 'xav.robart@gmail.com'; // Remplacez par votre adresse email
    
    // Créer le sujet de l'email
    const subject = `SpeechToTalk Feedback: ${feedbackType} - ${title}`;
    
    // Créer le corps de l'email
    const body = `Type de feedback: ${feedbackType}\n\n` +
                `Titre: ${title}\n\n` +
                `Description:\n${description}\n\n` +
                `Email de l'utilisateur: ${email.trim() || 'Non fourni'}\n\n` +
                `Date: ${new Date().toLocaleString()}\n\n` +
                `Envoyé depuis l'application SpeechToTalk`;
    
    // Construire l'URL mailto
    const mailtoUrl = `mailto:${destinationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Ouvrir le client email de l'utilisateur
    Linking.canOpenURL(mailtoUrl).then(supported => {
      if (supported) {
        Linking.openURL(mailtoUrl);
        console.log('Email client opened with feedback data');
      } else {
        console.log('Cannot open email client');
        Alert.alert(
          'Erreur',
          'Impossible d\'ouvrir votre client email. Veuillez vérifier que vous avez une application email configurée sur votre appareil.',
          [{ text: 'OK' }]
        );
      }
    }).catch(err => {
      console.error('An error occurred', err);
      Alert.alert(
        'Erreur',
        'Une erreur s\'est produite lors de l\'ouverture de votre client email.',
        [{ text: 'OK' }]
      );
    });
    
    // Afficher un message de remerciement
    Alert.alert(
      'Merci pour votre feedback !',
      'Votre contribution est précieuse pour améliorer l\'application. Un email va s\'ouvrir pour vous permettre d\'envoyer votre feedback.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const FeedbackTypeButton = ({ type, icon, label }: { type: 'suggestion' | 'bug' | 'improvement', icon: string, label: string }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        feedbackType === type && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
      ]}
      onPress={() => setFeedbackType(type)}
    >
      <MaterialCommunityIcons name={icon as any} size={24} color={feedbackType === type ? colors.primary : colors.icon} />
      <Text style={[styles.typeLabel, feedbackType === type && { color: colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[
        styles.container,
        { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 10,
          backgroundColor: isDark ? colors.background : theme.colors.background
        }
      ]}>
        <StandardHeader
          title="Feedback & Paramètres"
          showBackButton={true}
          rightIcon="image"
          onRightIconPress={() => {}}
          rightIconColor={colors.primary}
        />
        <View style={{ position: 'absolute', top: insets.top + 12, right: 16, zIndex: 10 }}>
          <Image
            source={require('../assets/images/talk-logo2.png')}
            style={styles.logoSmall}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'feedback' && styles.activeTab]}
            onPress={() => setActiveTab('feedback')}
          >
            <Text style={[styles.tabText, activeTab === 'feedback' && styles.activeTabText]}>Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Paramètres</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {activeTab === 'feedback' ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Type de feedback</Text>
                  <View style={styles.typeContainer}>
                <FeedbackTypeButton type="suggestion" icon="lightbulb-outline" label="Suggestion" />
                <FeedbackTypeButton type="improvement" icon="trending-up" label="Amélioration" />
                <FeedbackTypeButton type="bug" icon="bug-outline" label="Bug" />
              </View>
              
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Titre</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                    color: colors.text,
                    borderColor: isDark ? '#444' : '#e0e0e0'
                  }
                ]}
                placeholder="Titre court et descriptif"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={title}
                onChangeText={setTitle}
              />
              
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                    color: colors.text,
                    borderColor: isDark ? '#444' : '#e0e0e0'
                  }
                ]}
                placeholder="Décrivez en détail votre suggestion ou le problème rencontré"
                placeholderTextColor={isDark ? '#888' : '#999'}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
              
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Email (optionnel)</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                    color: colors.text,
                    borderColor: isDark ? '#444' : '#e0e0e0'
                  }
                ]}
                placeholder="Pour vous contacter si nécessaire"
                placeholderTextColor={isDark ? '#888' : '#999'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              
              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4361ee" />
                  <Text style={styles.loadingText}>Chargement des statistiques...</Text>
                </View>
              ) : (
                <>
                  {/* Section de gestion du cache */}
                  <AppCard
                    title="Gestion du cache"
                    icon="database"
                    style={styles.section}
                  >
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Traductions en cache:</Text>
                      <Text style={styles.statValue}>{cacheStats?.totalEntries || 0}</Text>
                    </View>
                    
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Phrases d&apos;urgence:</Text>
                      <Text style={styles.statValue}>{cacheStats?.emergencyPhraseCount || 0}</Text>
                    </View>
                    
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Dernier nettoyage:</Text>
                      <Text style={styles.statValue}>
                        {cacheStats?.lastCleanup ? formatDate(cacheStats.lastCleanup) : "Jamais"}
                      </Text>
                    </View>
                    {/* Bouton pour effacer le cache */}
                    <AppButton 
                      title="Effacer le cache de traduction"
                      icon="delete-sweep"
                      onPress={handleClearCache}
                      disabled={isClearing}
                      loading={isClearing}
                      type="secondary"
                      size="medium"
                      fullWidth
                    />
                  </AppCard>
                  
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
                  <AppCard
                    title="Téléchargement de langues"
                    icon="download"
                    style={styles.section}
                  >
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
                    {/* Bouton de téléchargement */}
                    <AppButton 
                      title="Télécharger la langue"
                      icon="download"
                      onPress={handleDownloadLanguage}
                      disabled={isDownloading || !isConnected}
                      loading={isDownloading}
                      type="primary"
                      size="medium"
                      fullWidth
                    />
                    
                    {!isConnected && (
                      <Text style={styles.warningText}>
                        Vous devez être connecté à Internet pour télécharger des langues.
                      </Text>
                    )}
                  </AppCard>
                  
                  {/* Section d'optimisation du stockage */}
                  <StorageOptimizationPanel />
                  
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
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  logo: {
    height: 50,
    width: 150,
    marginRight: 0,
  },
  logoSmall: {
    height: 40,
    width: 40,
    marginRight: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#4361ee',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  typeLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles pour la partie settings
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  warningText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  sliderContainer: {
    marginTop: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  customSliderContainer: {
    marginVertical: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customSliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4361ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSliderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customSlider: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  customSliderFill: {
    height: '100%',
    backgroundColor: '#4361ee',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderMinLabel: {
    fontSize: 12,
    color: '#999',
  },
  sliderMaxLabel: {
    fontSize: 12,
    color: '#999',
  },
});
