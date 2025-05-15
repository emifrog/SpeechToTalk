import { PropsWithChildren, useState, ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, TextStyle, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CollapsibleProps {
  title: string | ReactNode;
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  initiallyOpen?: boolean;
}

export function Collapsible({ 
  children, 
  title, 
  titleStyle, 
  containerStyle, 
  contentStyle,
  initiallyOpen = false 
}: PropsWithChildren & CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const theme = useColorScheme() ?? 'light';

  return (
    <ThemedView style={containerStyle}>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold" style={titleStyle}>{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={[styles.content, contentStyle]}>{children}</ThemedView>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
