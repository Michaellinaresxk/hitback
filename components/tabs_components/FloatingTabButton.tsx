import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingTabButtonProps {
  routeName: string;
  label: string;
  isFocused: boolean;
  isDark: boolean;
  onPress: () => void;
  index: number;
  totalTabs: number;
}

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  'setup-game': 'game-controller',
  game: 'musical-notes',
  settings: 'settings',
  help: 'help-circle',
};

export default function FloatingTabButton({
  routeName,
  label,
  isFocused,
  isDark,
  onPress,
}: FloatingTabButtonProps) {
  const iconName = iconMap[routeName] || 'ellipse';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tabButton,
        isFocused && styles.tabButtonActive,
        {
          backgroundColor: isFocused
            ? isDark
              ? 'rgba(59, 130, 246, 0.2)'
              : 'rgba(59, 130, 246, 0.15)'
            : 'transparent',
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={iconName}
          size={24}
          color={
            isFocused
              ? isDark
                ? '#60A5FA'
                : '#3B82F6'
              : isDark
              ? '#94A3B8'
              : '#64748B'
          }
        />
        {isFocused && (
          <View
            style={[
              styles.activeIndicator,
              {
                backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
              },
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
