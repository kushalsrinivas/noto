import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Audio } from "expo-av";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
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

type RecordingState = "idle" | "recording" | "paused";

// iOS: WAV (16 kHz mono 16-bit PCM) → Whisper reads this directly.
// Android: M4A (AAC 16 kHz mono) → needs conversion for Whisper.
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: ".wav",
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

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
  const recordingRef = useRef<Audio.Recording | null>(null);

  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);
  const waveValues = useRef(
    Array.from({ length: 24 }, () => useSharedValue(3)),
  ).current;

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

  async function requestPermissions() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Microphone access is required to record voice notes.",
      );
      return false;
    }
    return true;
  }

  async function startRecording() {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } =
        await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      setState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err) {
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  }

  async function pauseRecording() {
    try {
      await recordingRef.current?.pauseAsync();
      setState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    } catch {
      // Some devices don't support pause — just keep recording
    }
  }

  async function resumeRecording() {
    try {
      await recordingRef.current?.startAsync();
      setState("recording");
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      Alert.alert("Error", "Could not resume recording.");
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setState("idle");

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        router.replace({
          pathname: "/voice/review",
          params: { uri, duration: elapsed.toString() },
        });
      } else {
        Alert.alert("Error", "Recording file not found.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save recording.");
    }
  }

  async function cancel() {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch {}
      recordingRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
    router.back();
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

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
                : "Tap to record"}
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
