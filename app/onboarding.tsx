import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ViewToken,
} from "react-native";
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
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { ensureModel } from "@/lib/whisper";
import { useOnboarding, useUserName } from "@/store/app-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_STEPS = 4;

type StepProps = {
  colors: ReturnType<typeof useColors>;
  nameValue: string;
  onNameChange: (v: string) => void;
  onRecord: () => void;
  ringStyle: { transform: { scale: number }[]; opacity: number };
};

function WelcomeStep({ colors }: Pick<StepProps, "colors">) {
  return (
    <View style={[stepStyles.container, { width: SCREEN_WIDTH }]}>
      <View style={stepStyles.iconWrap}>
        <View
          style={[
            stepStyles.iconCircle,
            { backgroundColor: colors.accentMuted },
          ]}
        >
          <MaterialIcons name="auto-awesome" size={40} color={colors.accent} />
        </View>
      </View>
      <ThemedText style={stepStyles.title}>Welcome to Noto</ThemedText>
      <ThemedText
        style={[stepStyles.subtitle, { color: colors.textSecondary }]}
      >
        Your thoughts, organized in seconds.{"\n"}Speak naturally — AI handles
        the rest.
      </ThemedText>
    </View>
  );
}

function NameStep({
  colors,
  nameValue,
  onNameChange,
}: Pick<StepProps, "colors" | "nameValue" | "onNameChange">) {
  return (
    <View style={[stepStyles.container, { width: SCREEN_WIDTH }]}>
      <View style={stepStyles.iconWrap}>
        <View
          style={[
            stepStyles.iconCircle,
            { backgroundColor: colors.accentMuted },
          ]}
        >
          <MaterialIcons
            name="person-outline"
            size={40}
            color={colors.accent}
          />
        </View>
      </View>
      <ThemedText style={stepStyles.title}>What's your name?</ThemedText>
      <ThemedText
        style={[stepStyles.subtitle, { color: colors.textSecondary }]}
      >
        We'll use it to greet you on the home screen.
      </ThemedText>
      <TextInput
        value={nameValue}
        onChangeText={onNameChange}
        placeholder="Your name"
        placeholderTextColor={colors.muted}
        style={[
          stepStyles.nameInput,
          {
            color: colors.ink,
            borderColor: colors.rule,
            backgroundColor: colors.paper2,
          },
        ]}
        autoCapitalize="words"
        returnKeyType="done"
      />
    </View>
  );
}

function FeaturesStep({ colors }: Pick<StepProps, "colors">) {
  const features = [
    {
      icon: "mic" as const,
      label: "Voice capture",
      desc: "Record your thoughts hands-free",
    },
    {
      icon: "text-snippet" as const,
      label: "AI transcription",
      desc: "Speech converted to clean text on-device",
    },
    {
      icon: "checklist" as const,
      label: "Task extraction",
      desc: "Action items pulled out automatically",
    },
  ];

  return (
    <View style={[stepStyles.container, { width: SCREEN_WIDTH }]}>
      <ThemedText style={stepStyles.title}>How it works</ThemedText>
      <ThemedText
        style={[stepStyles.subtitle, { color: colors.textSecondary }]}
      >
        Everything runs on your device. No cloud required.
      </ThemedText>
      <View style={stepStyles.featureList}>
        {features.map((f) => (
          <View key={f.icon} style={stepStyles.featureRow}>
            <View
              style={[
                stepStyles.featureIcon,
                { backgroundColor: colors.accentMuted },
              ]}
            >
              <MaterialIcons name={f.icon} size={20} color={colors.accent} />
            </View>
            <View style={stepStyles.featureText}>
              <ThemedText style={stepStyles.featureLabel}>{f.label}</ThemedText>
              <ThemedText
                style={[
                  stepStyles.featureDesc,
                  { color: colors.textSecondary },
                ]}
              >
                {f.desc}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function TryItStep({
  colors,
  onRecord,
  ringStyle,
}: Pick<StepProps, "colors" | "onRecord" | "ringStyle">) {
  return (
    <View style={[stepStyles.container, { width: SCREEN_WIDTH }]}>
      <ThemedText style={stepStyles.title}>Try it out</ThemedText>
      <ThemedText
        style={[stepStyles.subtitle, { color: colors.textSecondary }]}
      >
        Speak for 10 seconds. We'll turn it into{"\n"}notes and action items.
      </ThemedText>
      <View style={stepStyles.micArea}>
        <Animated.View
          style={[
            stepStyles.outerRing,
            { borderColor: colors.accent + "20" },
            ringStyle,
          ]}
        />
        <Pressable
          onPress={onRecord}
          style={({ pressed }) => [
            stepStyles.micButton,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
          ]}
          accessibilityLabel="Start recording"
          accessibilityRole="button"
        >
          <MaterialIcons name="mic" size={40} color="#FFFFFF" />
        </Pressable>
      </View>
      <ThemedText style={[stepStyles.micPrompt, { color: colors.muted }]}>
        Say anything — I'll organize it
      </ThemedText>
    </View>
  );
}

export default function OnboardingScreen() {
  const colors = useColors();
  const { markComplete } = useOnboarding();
  const { setName } = useUserName();
  const [currentStep, setCurrentStep] = useState(0);
  const [nameValue, setNameValue] = useState("");
  const listRef = useRef<FlatList>(null);
  const ring = useSharedValue(1);

  useEffect(() => {
    ensureModel().catch(() => {});
  }, []);

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

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentStep(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  function goNext() {
    if (currentStep === 1 && nameValue.trim()) {
      setName(nameValue.trim());
    }
    if (currentStep < TOTAL_STEPS - 1) {
      listRef.current?.scrollToIndex({
        index: currentStep + 1,
        animated: true,
      });
    }
  }

  function handleRecord() {
    if (nameValue.trim()) {
      setName(nameValue.trim());
    }
    router.push("/voice/record");
  }

  async function handleSkip() {
    if (nameValue.trim()) {
      await setName(nameValue.trim());
    }
    await markComplete();
    router.replace("/(tabs)");
  }

  const handleFinish = useCallback(async () => {
    if (nameValue.trim()) {
      await setName(nameValue.trim());
    }
    await markComplete();
    router.replace("/(tabs)");
  }, [nameValue, setName, markComplete]);

  const steps = [
    { key: "welcome" },
    { key: "name" },
    { key: "features" },
    { key: "tryit" },
  ];

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.topBar}>
        <View style={styles.dotRow}>
          {steps.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentStep ? colors.ink : colors.rule,
                  width: i === currentStep ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <ThemedText style={[styles.skipText, { color: colors.textTertiary }]}>
            Skip
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={steps}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        renderItem={({ index }) => {
          switch (index) {
            case 0:
              return <WelcomeStep colors={colors} />;
            case 1:
              return (
                <NameStep
                  colors={colors}
                  nameValue={nameValue}
                  onNameChange={setNameValue}
                />
              );
            case 2:
              return <FeaturesStep colors={colors} />;
            case 3:
              return (
                <TryItStep
                  colors={colors}
                  onRecord={handleRecord}
                  ringStyle={ringStyle}
                />
              );
            default:
              return null;
          }
        }}
      />

      <View style={styles.bottomBar}>
        {isLastStep ? (
          <Pressable
            onPress={handleFinish}
            style={[styles.finishButton, { backgroundColor: colors.ink }]}
          >
            <ThemedText
              style={[styles.finishLabel, { color: colors.background }]}
            >
              Get started
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable
            onPress={goNext}
            style={[styles.nextButton, { backgroundColor: colors.ink }]}
          >
            <ThemedText
              style={[styles.nextLabel, { color: colors.background }]}
            >
              Continue
            </ThemedText>
            <MaterialIcons
              name="arrow-forward"
              size={18}
              color={colors.background}
            />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  skipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["4xl"],
    paddingTop: Spacing.lg,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.pill,
  },
  nextLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
  },
  finishButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.pill,
  },
  finishLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
  },
});

const stepStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  iconWrap: {
    marginBottom: Spacing["3xl"],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Geist_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  nameInput: {
    width: "100%",
    maxWidth: 280,
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    textAlign: "center",
  },
  featureList: {
    width: "100%",
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  micArea: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
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
});
