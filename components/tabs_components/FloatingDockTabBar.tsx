import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColorScheme as useRNColorScheme } from 'react-native';
import React from 'react';
import FloatingTabButton from './FloatingTabButton';

export default function FloatingDockTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useRNColorScheme();
  const isDark = colorScheme === 'dark';

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
    <View
      style={[
        styles.dockContainer,
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
    </View>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  backgroundOrb: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.3,
  },
  orb1: {
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    top: -50,
    left: -30,
  },
  orb2: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    bottom: -60,
    right: -40,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  dockReflection: {
    position: 'absolute',
    bottom: -8,
    left: '10%',
    right: '10%',
    height: 8,
    borderRadius: 10,
    opacity: 0.6,
    transform: [{ scaleY: 0.3 }],
  },
});
