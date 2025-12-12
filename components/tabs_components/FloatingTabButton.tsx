import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { styles } from './styles';
import ParticleEffect from './ParticleEffect';

interface TabConfig {
  icon: string;
  color: string;
  activeColor: string;
  gradient: string[];
}

interface FloatingTabButtonProps {
  routeName: string;
  label: string;
  isFocused: boolean;
  isDark: boolean;
  onPress: () => void;
  index: number;
  totalTabs: number;
}

const TAB_CONFIGS: Record<string, Omit<TabConfig, 'color'>> = {
  index: {
    icon: 'house',
    activeColor: '#3B82F6',
    gradient: ['#3B82F6', '#1E40AF'],
  },
  game: {
    icon: 'gamecontroller',
    activeColor: '#10B981',
    gradient: ['#10B981', '#059669'],
  },
};

const DEFAULT_TAB_CONFIG: Omit<TabConfig, 'color'> = {
  icon: 'circle',
  activeColor: '#3B82F6',
  gradient: ['#3B82F6', '#1E40AF'],
};

export default function FloatingTabButton({
  routeName,
  label,
  isFocused,
  isDark,
  onPress,
  index,
  totalTabs,
}: FloatingTabButtonProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const magneticX = useSharedValue(0);

  const baseConfig = TAB_CONFIGS[routeName] || DEFAULT_TAB_CONFIG;
  const inactiveColor = isDark ? '#64748B' : '#475569';

  const config: TabConfig = {
    ...baseConfig,
    icon: isFocused ? `${baseConfig.icon}.fill` : baseConfig.icon,
    color: isFocused ? baseConfig.activeColor : inactiveColor,
  };

  React.useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1.2, { damping: 12, stiffness: 200 });
      translateY.value = withSpring(-8, { damping: 15 });
      glowOpacity.value = withTiming(1, { duration: 300 });
      rotateZ.value = withSequence(
        withTiming(5, { duration: 150 }),
        withTiming(-5, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    } else {
      scale.value = withSpring(1, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      rotateZ.value = withTiming(0, { duration: 200 });
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotateZ: `${rotateZ.value}deg` },
      { translateX: magneticX.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.4]) }],
  }));

  const handlePressIn = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(isFocused ? 1.1 : 0.9, { damping: 10 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(isFocused ? 1.2 : 1, { damping: 12 });
  };

  const handlePress = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  return (
    <View style={styles.floatingButtonContainer}>
      <Animated.View style={[styles.glowEffect, glowStyle]} />

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole='button'
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
      >
        <Animated.View style={[styles.floatingButton, animatedStyle]}>
          <View
            style={[
              styles.tabButtonContent,
              isFocused && [
                styles.activeTabButtonContent,
                { backgroundColor: `${config.activeColor}20` },
              ],
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && styles.activeIconContainer,
              ]}
            >
              <IconSymbol
                name={config.icon}
                size={isFocused ? 26 : 22}
                color={config.color}
              />
            </View>

            <Text
              style={[
                styles.tabLabel,
                isFocused && [styles.activeTabLabel, { color: config.color }],
                { color: isDark ? '#E2E8F0' : '#475569' },
              ]}
            >
              {label}
            </Text>

            {isFocused && (
              <View
                style={[
                  styles.activeDot,
                  { backgroundColor: config.activeColor },
                ]}
              />
            )}
          </View>

          <ParticleEffect isVisible={isFocused} />
        </Animated.View>
      </Pressable>
    </View>
  );
}
