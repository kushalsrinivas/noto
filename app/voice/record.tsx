import { useState, useEffect, useRef, useCallback } from "react";
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
  cancelAnimation,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { Spacing, BorderRadius } from "@/constants/theme";

type RecordingState = "idle" | "recording" | "paused";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function RecordScreen() {
  const colors = useColors();
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);

  const waveValues = Array.from({ length: 24 }, () => useSharedValue(3));

  const startPulse = useCallback(() => {
    ring1.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 1800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    ring2.value = withRepeat(
      withSequence(
        withTiming(1.45, { duration: 2400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [ring1, ring2]);

  const stopPulse = useCallback(() => {
    cancelAnimation(ring1);
    cancelAnimation(ring2);
    ring1.value = withTiming(1, { duration: 200 });
    ring2.value = withTiming(1, { duration: 200 });
  }, [ring1, ring2]);

  useEffect(() => {
    if (state === "recording") {
      startPulse();
      waveValues.forEach((wv) => {
        wv.value = withRepeat(
          withSequence(
            withTiming(3 + Math.random() * 20, {
              duration: 250 + Math.random() * 350,
            }),
            withTiming(3 + Math.random() * 6, {
              duration: 250 + Math.random() * 350,
            }),
          ),
          -1,
          true,
        );
      });
    } else {
      stopPulse();
      waveValues.forEach((wv) => {
        cancelAnimation(wv);
        wv.value = withTiming(3, { duration: 200 });
      });
    }
  }, [state]);

  function startRecording() {
    setState("recording");
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  function pauseRecording() {
    setState("paused");
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function resumeRecording() {
    setState("recording");
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  function stopRecording() {
    setState("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    router.replace({
      pathname: "/voice/review",
      params: { duration: elapsed.toString() },
    });
  }

  function cancel() {
    setState("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: 2 - ring1.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value }],
    opacity: 2 - ring2.value,
  }));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={cancel} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Timer */}
      <View style={styles.timerArea}>
        <ThemedText style={styles.timer}>{formatTime(elapsed)}</ThemedText>
        <View style={styles.statusRow}>
          {state === "recording" && (
            <View
              style={[styles.liveDot, { backgroundColor: colors.accent }]}
            />
          )}
          <ThemedText
            style={[styles.statusText, { color: colors.textTertiary }]}
          >
            {state === "recording"
              ? "Recording"
              : state === "paused"
                ? "Paused"
                : "Ready"}
          </ThemedText>
        </View>
      </View>

      {/* Waveform */}
      <View style={styles.waveform}>
        {waveValues.map((wv, i) => {
          const animStyle = useAnimatedStyle(() => ({ height: wv.value }));
          return (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  backgroundColor:
                    state === "recording" ? colors.accent : colors.rule,
                },
                animStyle,
              ]}
            />
          );
        })}
      </View>

      {/* Mic button */}
      <View style={styles.micArea}>
        <Animated.View
          style={[
            styles.ring,
            { borderColor: colors.accent + "12" },
            ring2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            { borderColor: colors.accent + "25" },
            ring1Style,
          ]}
        />

        {state === "idle" ? (
          <Pressable
            onPress={startRecording}
            style={[styles.micButton, { backgroundColor: colors.accent }]}
          >
            <MaterialIcons name="mic" size={36} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            onPress={state === "recording" ? pauseRecording : resumeRecording}
            style={[
              styles.micButton,
              {
                backgroundColor:
                  state === "recording" ? colors.ink : colors.accent,
              },
            ]}
          >
            <MaterialIcons
              name={state === "recording" ? "pause" : "mic"}
              size={36}
              color="#FFFFFF"
            />
          </Pressable>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {state !== "idle" && (
          <>
            <Pressable onPress={cancel} style={styles.controlBtn} hitSlop={12}>
              <MaterialIcons
                name="delete-outline"
                size={24}
                color={colors.textTertiary}
              />
            </Pressable>
            <Pressable
              onPress={stopRecording}
              style={[styles.doneButton, { backgroundColor: colors.ink }]}
            >
              <MaterialIcons name="check" size={20} color={colors.background} />
              <ThemedText
                style={[styles.doneLabel, { color: colors.background }]}
              >
                Done
              </ThemedText>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  timerArea: {
    alignItems: "center",
    marginTop: Spacing["4xl"],
  },
  timer: {
    fontFamily: "Geist_400Regular",
    fontSize: 48,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Geist_500Medium", fontSize: 13 },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    gap: 2,
    marginTop: Spacing["3xl"],
    paddingHorizontal: Spacing["4xl"],
  },
  waveBar: { width: 2.5, borderRadius: 1.5, minHeight: 3 },
  micArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing["4xl"],
    paddingBottom: Spacing["5xl"],
  },
  controlBtn: { padding: Spacing.md },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.pill,
  },
  doneLabel: { fontFamily: "Geist_600SemiBold", fontSize: 15 },
});
