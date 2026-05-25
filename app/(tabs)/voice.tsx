import { View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function VoiceTabScreen() {
  const colors = useColors();
  const ring = useSharedValue(1);

  useEffect(() => {
    ring.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [ring]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: 2 - ring.value,
  }));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.micArea}>
          <Animated.View
            style={[
              styles.outerRing,
              { borderColor: colors.accent + "20" },
              ringStyle,
            ]}
          />
          <Pressable
            onPress={() => router.push("/voice/record")}
            style={({ pressed }) => [
              styles.micButton,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
            accessibilityLabel="Start recording"
            accessibilityRole="button"
          >
            <MaterialIcons name="mic" size={36} color="#FFFFFF" />
          </Pressable>
        </View>

        <ThemedText style={styles.title}>Tap to record</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textTertiary }]}>
          Your voice note will be transcribed{"\n"}and tasks extracted
          automatically.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  micArea: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  outerRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 20,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
