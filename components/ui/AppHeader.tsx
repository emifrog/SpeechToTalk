import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
  rightIconColor?: string;
}

export function StandardHeader({
  title,
  showBackButton = false,
  showLogo = true,
  rightIcon,
  onRightIconPress,
  rightIconColor
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();
  
  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
          borderBottomColor: colors.border
        }
      ]}
    >
      {showBackButton ? (
        <TouchableOpacity style={styles.leftButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.leftButton} />
      )}

      <View style={styles.centerContainer}>
        {showLogo && (
          <Image
            source={require('@/assets/images/talk-logo2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      </View>

      {rightIcon ? (
        <TouchableOpacity style={styles.rightButton} onPress={onRightIconPress}>
          <MaterialCommunityIcons
            name={rightIcon as any}
            size={24}
            color={rightIconColor || colors.primary}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  leftButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 50,
    width: 150,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  rightButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
