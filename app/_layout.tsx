import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import i18n, { i18nReady } from '@/i18n';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [translationsReady, setTranslationsReady] = React.useState(
    i18n.isInitialized,
  );
  const [translationError, setTranslationError] = React.useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  React.useEffect(() => {
    let active = true;
    i18nReady.then(
      () => {
        if (active) setTranslationsReady(true);
      },
      (error) => {
        console.error('Unable to initialize translations:', error);
        if (active) setTranslationError(true);
      },
    );

    return () => {
      active = false;
    };
  }, []);

  if (!loaded || (!translationsReady && !translationError)) {
    return null;
  }

  if (translationError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>HITBACK could not load its language resources. Restart the app.</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='+not-found' />
      </Stack>
      <StatusBar style='auto' />
    </ThemeProvider>
  );
}
