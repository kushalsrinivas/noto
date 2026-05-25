import { useState } from "react";
import { View, StyleSheet, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-theme-color";
import { useOnboarding, useUserName, useAiMode } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";

type Step = "welcome" | "features" | "name" | "mode";

const FEATURES = [
  {
    icon: "mic" as const,
    title: "Voice to text",
    desc: "Record and get an instant transcript.",
  },
  {
    icon: "auto-awesome" as const,
    title: "Task extraction",
    desc: "Action items pulled out automatically.",
  },
  {
    icon: "offline-bolt" as const,
    title: "On-device",
    desc: "Runs locally. Your data stays yours.",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const { markComplete } = useOnboarding();
  const { setName } = useUserName();
  const { setMode } = useAiMode();

  const [step, setStep] = useState<Step>("welcome");
  const [featureIdx, setFeatureIdx] = useState(0);
  const [userName, setUserName] = useState("");
  const [selectedMode, setSelectedMode] = useState<"full" | "lite">("lite");

  async function finish() {
    if (userName.trim()) await setName(userName.trim());
    await setMode(selectedMode);
    await markComplete();
    router.replace("/(tabs)");
  }

  if (step === "welcome") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.main}>
          <ThemedText style={styles.wordmark}>noto</ThemedText>
          <ThemedText style={[styles.tagline, { color: colors.textTertiary }]}>
            Speak. Organize. Done.
          </ThemedText>
        </View>
        <View style={styles.bottom}>
          <Button
            title="Get started"
            onPress={() => setStep("features")}
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === "features") {
    const f = FEATURES[featureIdx];
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.skipRow}>
          <Pressable onPress={() => setStep("name")}>
            <ThemedText
              style={[styles.skipText, { color: colors.textTertiary }]}
            >
              Skip
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.main}>
          <MaterialIcons
            name={f.icon}
            size={32}
            color={colors.accent}
            style={{ marginBottom: Spacing.xl }}
          />
          <ThemedText style={styles.featureTitle}>{f.title}</ThemedText>
          <ThemedText
            style={[styles.featureDesc, { color: colors.textSecondary }]}
          >
            {f.desc}
          </ThemedText>
          <View style={styles.dots}>
            {FEATURES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === featureIdx ? colors.ink : colors.rule,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.bottom}>
          <Button
            title={featureIdx < FEATURES.length - 1 ? "Next" : "Continue"}
            onPress={() => {
              if (featureIdx < FEATURES.length - 1)
                setFeatureIdx(featureIdx + 1);
              else setStep("name");
            }}
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === "name") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.skipRow}>
          <Pressable onPress={() => setStep("mode")}>
            <ThemedText
              style={[styles.skipText, { color: colors.textTertiary }]}
            >
              Skip
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.main}>
          <ThemedText style={styles.stepTitle}>Your name</ThemedText>
          <TextInput
            value={userName}
            onChangeText={setUserName}
            placeholder="What should we call you?"
            placeholderTextColor={colors.muted}
            style={[
              styles.nameInput,
              { color: colors.ink, borderBottomColor: colors.rule },
            ]}
            autoFocus
          />
        </View>
        <View style={styles.bottom}>
          <Button title="Continue" onPress={() => setStep("mode")} size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  // mode
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.main}>
        <ThemedText style={styles.stepTitle}>AI mode</ThemedText>
        <ThemedText style={[styles.stepDesc, { color: colors.textSecondary }]}>
          Choose how recordings are processed.
        </ThemedText>

        <View style={styles.modeOptions}>
          {[
            {
              key: "lite" as const,
              label: "Lite",
              desc: "Basic transcription, fast.",
            },
            {
              key: "full" as const,
              label: "Full AI",
              desc: "Smart extraction. ~500 MB download.",
            },
          ].map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setSelectedMode(opt.key)}
              style={[
                styles.modeOption,
                {
                  borderColor:
                    selectedMode === opt.key ? colors.ink : colors.rule,
                  borderWidth: selectedMode === opt.key ? 1.5 : 1,
                },
              ]}
            >
              <ThemedText style={styles.modeLabel}>{opt.label}</ThemedText>
              <ThemedText
                style={[styles.modeDesc, { color: colors.textTertiary }]}
              >
                {opt.desc}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.bottom}>
        <Button title="Start using noto" onPress={finish} size="lg" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing["2xl"] },
  main: { flex: 1, justifyContent: "center" },
  bottom: { paddingBottom: Spacing["4xl"] },
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: Spacing.lg,
  },
  skipText: { fontFamily: "Geist_500Medium", fontSize: 14 },
  wordmark: {
    fontFamily: "Geist_700Bold",
    fontSize: 48,
    letterSpacing: -2,
  },
  tagline: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  featureTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 22,
    marginBottom: Spacing.sm,
  },
  featureDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing["3xl"],
  },
  dots: { flexDirection: "row", gap: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stepTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 22,
    marginBottom: Spacing.md,
  },
  stepDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing["2xl"],
  },
  nameInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 18,
    borderBottomWidth: 1,
    paddingVertical: Spacing.md,
  },
  modeOptions: { gap: Spacing.md, marginTop: Spacing.md },
  modeOption: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modeLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    marginBottom: 3,
  },
  modeDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
});
