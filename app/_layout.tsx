import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from "@expo-google-fonts/geist";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.ink,
    background: Colors.light.paper,
    card: Colors.light.surface,
    text: Colors.light.ink,
    border: Colors.light.rule,
  },
};

const darkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.ink,
    background: Colors.dark.paper,
    card: Colors.dark.surface,
    text: Colors.dark.ink,
    border: Colors.dark.rule,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? darkNavTheme : lightNavTheme}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="note/[id]"
          options={{ headerShown: true, title: "" }}
        />
        <Stack.Screen
          name="note/editor"
          options={{ headerShown: true, title: "", presentation: "modal" }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{ headerShown: true, title: "" }}
        />
        <Stack.Screen
          name="task/editor"
          options={{ headerShown: true, title: "", presentation: "modal" }}
        />
        <Stack.Screen
          name="voice/record"
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="voice/review"
          options={{ headerShown: true, title: "", presentation: "modal" }}
        />
        <Stack.Screen
          name="search"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
