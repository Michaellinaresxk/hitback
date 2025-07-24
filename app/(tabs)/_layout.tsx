import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981', // Verde activo (puedes usar otro)
        tabBarInactiveTintColor: isDark ? '#aaa' : '#555',
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView
            tint={colorScheme ?? 'light'}
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 70,
          borderRadius: 24,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name='house.fill' color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='game'
        options={{
          title: 'Game Master',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name='gamecontroller.fill' color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
