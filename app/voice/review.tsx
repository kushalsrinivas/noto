import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import {
  useNotes,
  useOnboarding,
  useRecordings,
  useTasks,
  useUsageStats,
} from "@/store/app-store";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReviewScreen() {
  const colors = useColors();
  const { uri, duration } = useLocalSearchParams<{
    uri: string;
    duration: string;
  }>();
  const durationSecs = parseInt(duration || "0", 10);

  const { addNote } = useNotes();
  const { addTask } = useTasks();
  const { addRecording } = useRecordings();
  const { complete: onboardingComplete, markComplete } = useOnboarding();
  const { incrementRecording, incrementNote } = useUsageStats();

  const [transcript, setTranscript] = useState("");
  const [saveAsNote, setSaveAsNote] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"processing" | "review">("processing");

  // Playback state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTranscript(
        uri
          ? `Voice recording (${formatDuration(durationSecs)})\n\nRecorded on ${new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
          : "",
      );
      setStep("review");
    }, 1200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  async function togglePlayback() {
    if (!uri) return;

    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis / 1000);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPosition(0);
              soundRef.current?.setPositionAsync(0);
            }
          }
        },
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      Alert.alert("Playback Error", "Could not play the recording.");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const recording = await addRecording({
        uri: uri || "",
        duration: durationSecs,
        transcript: transcript || undefined,
      });

      await incrementRecording();

      if (saveAsNote) {
        const title = transcript
          ? transcript.split("\n")[0]?.trim().slice(0, 50) || "Voice Note"
          : `Voice Note — ${formatDuration(durationSecs)}`;

        await addNote({
          title,
          content:
            transcript || `Voice recording (${formatDuration(durationSecs)})`,
          source: "voice",
          tags: ["voice"],
          recordingId: recording.id,
        });

        await incrementNote();
      }

      if (!onboardingComplete) {
        await markComplete();
      }

      router.dismiss();
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscard() {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    router.back();
  }

  if (step === "processing") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.processingCenter}>
          <ThemedText style={styles.processingTitle}>Processing</ThemedText>
          <View style={styles.steps}>
            {[
              { label: "Saving audio file", done: true },
              { label: "Preparing review", done: false },
            ].map((s) => (
              <View key={s.label} style={styles.stepRow}>
                <MaterialIcons
                  name={s.done ? "check" : "more-horiz"}
                  size={16}
                  color={s.done ? colors.success : colors.muted}
                />
                <ThemedText
                  style={[
                    styles.stepLabel,
                    { color: s.done ? colors.ink : colors.muted },
                  ]}
                >
                  {s.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Playback */}
        <View
          style={[
            styles.playerCard,
            { backgroundColor: colors.paper2, borderColor: colors.ruleLight },
          ]}
        >
          <Pressable
            onPress={togglePlayback}
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
          >
            <MaterialIcons
              name={isPlaying ? "pause" : "play-arrow"}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
          <View style={styles.playerInfo}>
            <ThemedText style={styles.playerTitle}>Voice Recording</ThemedText>
            <ThemedText
              style={[styles.playerDuration, { color: colors.textTertiary }]}
            >
              {formatDuration(Math.floor(playbackPosition))} /{" "}
              {formatDuration(durationSecs)}
            </ThemedText>
          </View>
        </View>

        {/* Transcript / Notes */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionLabel, { color: colors.textTertiary }]}
          >
            NOTES
          </ThemedText>
          <TextInput
            value={transcript}
            onChangeText={setTranscript}
            multiline
            placeholder="Add notes about this recording..."
            placeholderTextColor={colors.muted}
            style={[
              styles.transcriptInput,
              {
                color: colors.ink,
                backgroundColor: colors.paper2,
                borderColor: colors.ruleLight,
              },
            ]}
          />
        </View>

        {/* Options */}
        <View style={styles.section}>
          <View
            style={[styles.optionRow, { borderBottomColor: colors.ruleLight }]}
          >
            <ThemedText style={styles.optionLabel}>Save as note</ThemedText>
            <Switch
              value={saveAsNote}
              onValueChange={setSaveAsNote}
              trackColor={{ false: colors.rule, true: colors.accent + "40" }}
              thumbColor={saveAsNote ? colors.accent : colors.muted}
            />
          </View>
        </View>

        {/* Recording info */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionLabel, { color: colors.textTertiary }]}
          >
            DETAILS
          </ThemedText>
          <View style={styles.detailRow}>
            <ThemedText
              style={[styles.detailLabel, { color: colors.textSecondary }]}
            >
              Duration
            </ThemedText>
            <ThemedText style={styles.detailValue}>
              {formatDuration(durationSecs)}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText
              style={[styles.detailLabel, { color: colors.textSecondary }]}
            >
              Recorded
            </ThemedText>
            <ThemedText style={styles.detailValue}>
              {new Date().toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.ruleLight }]}>
        <Pressable onPress={handleDiscard} style={styles.discardBtn}>
          <ThemedText
            style={[styles.discardText, { color: colors.textSecondary }]}
          >
            Discard
          </ThemedText>
        </Pressable>
        <Button
          title="Save"
          onPress={handleSave}
          loading={saving}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  processingCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  processingTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 20,
    marginBottom: Spacing.xl,
  },
  steps: { gap: Spacing.md },
  stepRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  stepLabel: { fontFamily: "Geist_400Regular", fontSize: 15 },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
    gap: Spacing.md,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInfo: { flex: 1 },
  playerTitle: { fontFamily: "Geist_500Medium", fontSize: 15 },
  playerDuration: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  section: { marginBottom: Spacing["2xl"] },
  sectionLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  transcriptInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 120,
    textAlignVertical: "top",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: { fontFamily: "Geist_400Regular", fontSize: 15 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  detailLabel: { fontFamily: "Geist_400Regular", fontSize: 14 },
  detailValue: { fontFamily: "Geist_500Medium", fontSize: 14 },
  bottomBar: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  discardBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  discardText: { fontFamily: "Geist_500Medium", fontSize: 15 },
});
