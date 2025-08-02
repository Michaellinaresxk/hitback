import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

function FloatingTabButton({
  children,
  onPress,
  accessibilityState,
  index,
  totalTabs,
  ...props
}) {
  const isSelected = accessibilityState?.selected;
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const magneticX = useSharedValue(0);
  const magneticY = useSharedValue(0);

  React.useEffect(() => {
    if (isSelected) {
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
  }, [isSelected]);

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
    scale.value = withSpring(isSelected ? 1.1 : 0.9, { damping: 10 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.2 : 1, { damping: 12 });
  };

  const handlePress = () => {
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
    onPress?.();
  };

  return (
    <View style={styles.floatingButtonContainer}>
      {/* Glow Effect */}
      <Animated.View style={[styles.glowEffect, glowStyle]} />

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        <Animated.View style={[styles.floatingButton, animatedStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    </View>
  );
}

function ParticleEffect({ isVisible }) {
  const particles = Array.from({ length: 6 }, (_, i) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const scale = useSharedValue(0);

    React.useEffect(() => {
      if (isVisible) {
        const delay = i * 100;
        opacity.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.quad),
        });
        translateY.value = withTiming(-20 - Math.random() * 30, {
          duration: 800,
          easing: Easing.out(Easing.quad),
        });
        translateX.value = withTiming((Math.random() - 0.5) * 40, {
          duration: 800,
        });
        scale.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 400 })
        );
      } else {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0, { duration: 200 });
      }
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    }));

    return (
      <Animated.View
        key={i}
        style={[
          styles.particle,
          animatedStyle,
          {
            left: `${20 + Math.random() * 60}%`,
            backgroundColor: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'][
              Math.floor(Math.random() * 4)
            ],
          },
        ]}
      />
    );
  });

  return <View style={styles.particleContainer}>{particles}</View>;
}

function FloatingDockTabBar({ state, descriptors, navigation }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dockScale = useSharedValue(1);
  const dockOpacity = useSharedValue(1);

  React.useEffect(() => {
    dockScale.value = withSpring(1, { damping: 20, stiffness: 300 });
    dockOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const dockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dockScale.value }],
    opacity: dockOpacity.value,
  }));

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

      {/* Background Gradient Orbs */}
      <View style={[styles.backgroundOrb, styles.orb1]} />
      <View style={[styles.backgroundOrb, styles.orb2]} />

      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const getTabConfig = () => {
            switch (route.name) {
              case 'index':
                return {
                  icon: isFocused ? 'house.fill' : 'house',
                  color: isFocused ? '#3B82F6' : isDark ? '#64748B' : '#475569',
                  activeColor: '#3B82F6',
                  gradient: ['#3B82F6', '#1E40AF'],
                };
              case 'game':
                return {
                  icon: isFocused ? 'gamecontroller.fill' : 'gamecontroller',
                  color: isFocused ? '#10B981' : isDark ? '#64748B' : '#475569',
                  activeColor: '#10B981',
                  gradient: ['#10B981', '#059669'],
                };
              default:
                return {
                  icon: 'circle',
                  color: '#64748B',
                  activeColor: '#3B82F6',
                  gradient: ['#3B82F6', '#1E40AF'],
                };
            }
          };

          const config = getTabConfig();

          return (
            <FloatingTabButton
              key={route.key}
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              index={index}
              totalTabs={state.routes.length}
            >
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
                    isFocused && [
                      styles.activeTabLabel,
                      { color: config.color },
                    ],
                    { color: isDark ? '#E2E8F0' : '#475569' },
                  ]}
                >
                  {label}
                </Text>

                {/* Active indicator dot */}
                {isFocused && (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: config.activeColor },
                    ]}
                  />
                )}
              </View>

              {/* Particle Effects */}
              <ParticleEffect isVisible={isFocused} />
            </FloatingTabButton>
          );
        })}
      </View>

      {/* Dock reflection effect */}
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

export default function FloatingDockTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingDockTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name='game'
        options={{
          title: 'Game Master',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },

  backgroundOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },

  orb1: {
    width: 120,
    height: 120,
    backgroundColor: '#3B82F6',
    top: -60,
    left: -30,
  },

  orb2: {
    width: 100,
    height: 100,
    backgroundColor: '#10B981',
    bottom: -50,
    right: -20,
  },

  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    zIndex: 10,
  },

  floatingButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  floatingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
  },

  activeTabButtonContent: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  iconContainer: {
    marginBottom: 2,
  },

  activeIconContainer: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },

  activeTabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },

  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  dockReflection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },

  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: '50%',
  },
});
