import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from "@expo-google-fonts/geist";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { setupRecordingNotifications } from "@/lib/recording-notification";
import { useOnboarding } from "@/store/app-store";

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
  const { complete: onboardingComplete } = useOnboarding();

  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  const ready = fontsLoaded && onboardingComplete !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
      setupRecordingNotifications();
    }
  }, [ready]);

  if (!ready) return null;

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
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="upgrade"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
