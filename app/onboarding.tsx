import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { useOnboarding } from "@/store/app-store";

export default function OnboardingScreen() {
  const colors = useColors();
  const { markComplete } = useOnboarding();
  const ring = useSharedValue(1);

  useEffect(() => {
    ring.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [ring]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: 2 - ring.value,
  }));

  function handleRecord() {
    router.push("/voice/record");
  }

  async function handleSkip() {
    await markComplete();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.copyBlock}>
          <ThemedText style={styles.headline}>
            Your thoughts,{"\n"}organized in seconds
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Speak for 10 seconds. I'll turn it into{"\n"}notes and action items.
          </ThemedText>
        </View>

        <View style={styles.micArea}>
          <Animated.View
            style={[
              styles.outerRing,
              { borderColor: colors.accent + "20" },
              ringStyle,
            ]}
          />
          <Pressable
            onPress={handleRecord}
            style={({ pressed }) => [
              styles.micButton,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
            accessibilityLabel="Start recording"
            accessibilityRole="button"
          >
            <MaterialIcons name="mic" size={40} color="#FFFFFF" />
          </Pressable>
        </View>

        <ThemedText style={[styles.micPrompt, { color: colors.muted }]}>
          Say anything — I'll organize it
        </ThemedText>
      </View>

      <View style={styles.bottom}>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <ThemedText style={[styles.skipText, { color: colors.textTertiary }]}>
            I'll explore first
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  copyBlock: {
    alignSelf: "stretch",
    marginBottom: Spacing["5xl"],
  },
  headline: {
    fontFamily: "Geist_700Bold",
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 23,
    marginTop: Spacing.md,
  },
  micArea: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  outerRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  micPrompt: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
  },
  bottom: {
    alignItems: "center",
    paddingBottom: Spacing["4xl"],
  },
  skipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
});
