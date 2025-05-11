import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

// Composant Badge personnalisé pour les onglets
const TabBadge = ({ count, color }: { count: number; color: string }) => {
  if (count <= 0) return null;
  
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

// Composant d'indicateur de progression statique (sans animation)
const LoadingIndicator = ({ isLoading, color }: { isLoading: boolean; color: string }) => {
  if (!isLoading) return null;
  
  return (
    <View style={[styles.loadingIndicator, { backgroundColor: color }]} />
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  // État pour simuler des notifications et le chargement
  const [phrasesNotifications] = useState(3); // Nous utilisons seulement la valeur, pas le setter
  const [isLoading, setIsLoading] = useState(false);
  
  // Simuler un chargement lors des changements d'onglet
  const handleTabPress = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaProvider>
      <AppHeader />
      <LoadingIndicator isLoading={isLoading} color={colors.primary} />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: (props) => (
          <HapticTab {...props} onPress={(e) => {
            handleTabPress();
            if (props.onPress) props.onPress(e);
          }} />
        ),
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
        // Ajouter une animation de transition entre les onglets
        animation: 'fade',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Traducteur',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons name="translate" size={28} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Photos/Fichiers',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons name="file-image" size={28} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Phrases',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons name="message-text" size={28} color={color} />
              {/*<TabBadge count={phrasesNotifications} color={colors.secondary} />*/}  
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons name="cog" size={28} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    height: 3,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 999,
  },
});
