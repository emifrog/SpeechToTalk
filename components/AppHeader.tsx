import React from 'react';
import { View, Image, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  
  // Les animations ont été supprimées
  
  const handleMenuPress = () => {
    // Fonction pour gérer l'ouverture du menu
    console.log('Menu pressed');
    // Ici, vous pourriez implémenter l'ouverture d'un menu latéral ou d'un modal
  };
  
  const handleHelpPress = () => {
    // Fonction pour afficher l'aide
    console.log('Help pressed');
    // Ici, vous pourriez implémenter l'affichage d'un écran d'aide ou d'un modal
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#1a1a1a' : 'white', borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
        <MaterialCommunityIcons name="menu" size={24} color={colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/talk-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
        <MaterialCommunityIcons name="help-circle" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuButton: {
    padding: 8,
  },
  helpButton: {
    padding: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 50,
    width: 150,
    marginRight: 0,
  },
  // Les styles des icônes ont été supprimés car les icônes ne sont plus utilisées
});
