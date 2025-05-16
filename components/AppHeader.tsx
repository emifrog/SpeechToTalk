import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();
  
  // État pour suivre la connexion internet
  const [isConnected, setIsConnected] = useState(true);
  
  // Vérifier l'état de la connexion internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected !== null ? state.isConnected : true);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Les animations ont été supprimées
  
  const handleMenuPress = () => {
    // Fonction pour gérer l'ouverture du menu
    console.log('Menu pressed');
    // Ici, vous pourriez implémenter l'ouverture d'un menu latéral ou d'un modal
  };
  
  const handleHelpPress = () => {
    // Naviguer vers la page de feedback et suggestions
    console.log('Navigating to feedback page');
    router.push('/feedback');
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#1a1a1a' : 'white', borderBottomColor: colors.border }]}>
      {/*<TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
        <MaterialCommunityIcons name="menu" size={24} color={colors.primary} />
      </TouchableOpacity>*/}
      <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
        <MaterialCommunityIcons name="help-circle" size={24} color={colors.primary} />
      </TouchableOpacity>
      
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Image
            source={require('../assets/images/talk-logo2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={{ position: 'absolute', right: 12, top: 20 }}>
          <MaterialCommunityIcons
            name={isConnected ? 'wifi' : 'wifi-off'}
            size={24}
            color={isConnected ? colors.success : colors.error}
          />
        </View>
      </View>    

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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 131, 143, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  // Les styles des icônes ont été supprimés car les icônes ne sont plus utilisées
});
