import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColorScheme } from '@/hooks/useColorScheme';
import { styles } from './styles';
import { useEffect } from 'react';
import React from 'react';
import FloatingTabButton from './FloatingTabButton';

export default function FloatingDockTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dockScale = useSharedValue(1);
  const dockOpacity = useSharedValue(1);

  useEffect(() => {
    dockScale.value = withSpring(1, { damping: 20, stiffness: 300 });
    dockOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const dockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dockScale.value }],
    opacity: dockOpacity.value,
  }));

  const handleTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <Animated.View
      style={[
        styles.dockContainer,
        dockStyle,
        {
          backgroundColor: isDark
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      <BlurView
        intensity={isDark ? 50 : 100}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.backgroundOrb, styles.orb1]} />
      <View style={[styles.backgroundOrb, styles.orb2]} />

      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          return (
            <FloatingTabButton
              key={route.key}
              routeName={route.name}
              label={label}
              isFocused={isFocused}
              isDark={isDark}
              onPress={() => handleTabPress(route, isFocused)}
              index={index}
              totalTabs={state.routes.length}
            />
          );
        })}
      </View>

      <View
        style={[
          styles.dockReflection,
          {
            backgroundColor: isDark
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(30, 64, 175, 0.05)',
          },
        ]}
      />
    </Animated.View>
  );
}
