import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import FloatingDockTabBar from '@/components/tabs_components/FloatingDockTabBar';
import { TabBarIcon } from '@/components/Tabbaricon';

export default function TabLayout() {
  const colorScheme = useRNColorScheme();

  return (
    <Tabs
      tabBar={(props) => <FloatingDockTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'home' : 'home-outline'}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='setup-game'
        options={{
          title: 'Setup',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'game-controller' : 'game-controller-outline'}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='game'
        options={{
          title: 'Game',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'musical-notes' : 'musical-notes-outline'}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'settings' : 'settings-outline'}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='help'
        options={{
          title: 'Help',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'help-circle' : 'help-circle-outline'}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
