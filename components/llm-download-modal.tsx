import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { ensureLlmModel, isLlmModelDownloaded } from "@/lib/llama";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
};

export function LlmDownloadModal({ visible, onDismiss, onComplete }: Props) {
  const colors = useColors();
  const [status, setStatus] = useState<
    "idle" | "downloading" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 300 });
  }, [progress, progressWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  useEffect(() => {
    if (visible && isLlmModelDownloaded()) {
      onComplete();
    }
  }, [visible, onComplete]);

  async function handleDownload() {
    setStatus("downloading");
    setProgress(0);
    setErrorMsg("");

    try {
      await ensureLlmModel((fraction) => {
        setProgress(fraction);
      });
      setStatus("done");
      setTimeout(onComplete, 600);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
      setStatus("error");
    }
  }

  function formatSize(fraction: number): string {
    const downloaded = Math.round(fraction * 400);
    return `${downloaded} / 400 MB`;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.iconRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.accentMuted },
              ]}
            >
              <MaterialIcons
                name="psychology"
                size={28}
                color={colors.accent}
              />
            </View>
          </View>

          <ThemedText style={styles.title}>Download AI Model</ThemedText>
          <ThemedText
            style={[styles.description, { color: colors.textSecondary }]}
          >
            Download a small language model (~400 MB) to analyze your voice
            notes locally. This enables summaries, key points, and task
            extraction — all on-device.
          </ThemedText>

          {status === "downloading" && (
            <View style={styles.progressSection}>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.ruleLight },
                ]}
              >
                <Animated.View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.accent },
                    barStyle,
                  ]}
                />
              </View>
              <View style={styles.progressInfo}>
                <ThemedText
                  style={[styles.progressText, { color: colors.muted }]}
                >
                  {formatSize(progress)}
                </ThemedText>
                <ThemedText
                  style={[styles.progressText, { color: colors.muted }]}
                >
                  {Math.round(progress * 100)}%
                </ThemedText>
              </View>
            </View>
          )}

          {status === "done" && (
            <View style={styles.doneRow}>
              <MaterialIcons
                name="check-circle"
                size={20}
                color={colors.success}
              />
              <ThemedText style={[styles.doneText, { color: colors.success }]}>
                Download complete
              </ThemedText>
            </View>
          )}

          {status === "error" && (
            <View style={styles.errorRow}>
              <MaterialIcons name="error" size={16} color={colors.error} />
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {errorMsg}
              </ThemedText>
            </View>
          )}

          <View style={styles.actions}>
            {status === "idle" || status === "error" ? (
              <>
                <Pressable onPress={onDismiss} style={styles.secondaryBtn}>
                  <ThemedText
                    style={[
                      styles.secondaryBtnText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Later
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleDownload}
                  style={[styles.primaryBtn, { backgroundColor: colors.ink }]}
                >
                  <MaterialIcons
                    name="download"
                    size={18}
                    color={colors.background}
                  />
                  <ThemedText
                    style={[
                      styles.primaryBtnText,
                      { color: colors.background },
                    ]}
                  >
                    {status === "error" ? "Retry" : "Download"}
                  </ThemedText>
                </Pressable>
              </>
            ) : status === "downloading" ? (
              <View style={styles.downloadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <ThemedText
                  style={[styles.downloadingText, { color: colors.muted }]}
                >
                  Downloading in background...
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  sheet: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing["2xl"],
  },
  iconRow: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 18,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  progressSection: {
    marginBottom: Spacing.xl,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  progressText: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  doneText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  errorText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  secondaryBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  secondaryBtnText: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.pill,
  },
  primaryBtnText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
  },
  downloadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  downloadingText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
  },
});
