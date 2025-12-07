import { Tabs } from 'expo-router';
import React from 'react';
import FloatingDockTabBar from '@/components/tabs_components/FloatingDockTabBar';

export default function TabsLayout() {
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
