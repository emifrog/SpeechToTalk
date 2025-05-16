import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Theme } from '@/constants/Theme';

interface AppCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: number;
  bordered?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export function AppCard({
  title,
  subtitle,
  children,
  icon,
  iconColor,
  onPress,
  style,
  elevation = 2,
  bordered = false,
  rightIcon,
  onRightIconPress,
}: AppCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const theme = Theme;
  
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
          shadowOpacity: isDark ? 0.1 : 0.2,
          elevation: isDark ? elevation / 2 : elevation,
          borderColor: bordered ? theme.colors.border.light : 'transparent',
          borderWidth: bordered ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || icon) && (
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            {icon && (
              <MaterialCommunityIcons
                name={icon as any}
                size={24}
                color={iconColor || theme.colors.primary}
                style={styles.icon}
              />
            )}
            <View>
              {title && (
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? theme.colors.text.onPrimary : theme.colors.text.primary },
                  ]}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          
          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconContainer}>
              <MaterialCommunityIcons
                name={rightIcon as any}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.cardContent}>{children}</View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
  },
  rightIconContainer: {
    padding: 4,
  },
});
