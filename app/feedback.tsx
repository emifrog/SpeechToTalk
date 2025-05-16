import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug' | 'improvement' | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

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
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 10,
          backgroundColor: isDark ? colors.background : '#fff'
        }
      ]}>
        <View style={styles.header}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={require('../assets/images/talk-logo2.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={{ width: 50 }} />
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
  },
  backButton: {
    padding: 8,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
});
