import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { retryTranscription } from "@/lib/transcription-queue";
import { useNotes } from "@/store/app-store";

type Tab = "transcript" | "summary";

export default function NoteDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote, deleteNote, reload } = useNotes();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("transcript");

  const note = notes.find((n) => n.id === id);
  const isTranscribing = note?.transcriptionStatus === "transcribing";
  const isAiProcessing = note?.aiStatus === "processing";

  useFocusEffect(
    useCallback(() => {
      reload();

      if (!isTranscribing && !isAiProcessing) return;

      const interval = setInterval(() => reload(), 3000);
      return () => clearInterval(interval);
    }, [reload, isTranscribing, isAiProcessing]),
  );

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.id, note?.transcriptionStatus, note?.content]);

  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText style={styles.notFound}>Note not found</ThemedText>
      </View>
    );
  }

  async function handleRetry() {
    if (!note) return;
    setRetrying(true);
    try {
      await retryTranscription(note.id);
    } catch (err) {
      Alert.alert(
        "Retry failed",
        err instanceof Error ? err.message : "Could not restart transcription.",
      );
    } finally {
      setRetrying(false);
      reload();
    }
  }

  function handleSave() {
    updateNote(note!.id, { title, content });
    setEditing(false);
  }

  function handleDelete() {
    Alert.alert("Delete note", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteNote(note!.id);
          router.back();
        },
      },
    ]);
  }

  const formattedDate = new Date(note.updatedAt).toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              {editing ? (
                <Pressable onPress={handleSave}>
                  <ThemedText style={[styles.headerBtn, { color: colors.ink }]}>
                    Done
                  </ThemedText>
                </Pressable>
              ) : (
                <>
                  {!isTranscribing && activeTab === "transcript" && (
                    <Pressable onPress={() => setEditing(true)} hitSlop={12}>
                      <MaterialIcons
                        name="edit"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  )}
                  <Pressable onPress={handleDelete} hitSlop={12}>
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </>
              )}
            </View>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scroll}
      >
        {/* Badges */}
        {note.source === "voice" && (
          <View style={styles.badgeRow}>
            <View style={styles.voiceBadge}>
              <MaterialIcons name="mic" size={12} color={colors.accent} />
              <ThemedText style={[styles.badgeText, { color: colors.accent }]}>
                Voice
              </ThemedText>
            </View>
            {isTranscribing && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: colors.warning + "18" },
                ]}
              >
                <MaterialIcons
                  name="more-horiz"
                  size={12}
                  color={colors.warning}
                />
                <ThemedText
                  style={[styles.badgeText, { color: colors.warning }]}
                >
                  Transcribing
                </ThemedText>
              </View>
            )}
            {note.transcriptionStatus === "failed" && (
              <Pressable
                onPress={handleRetry}
                disabled={retrying}
                style={[
                  styles.statusBadge,
                  { backgroundColor: colors.errorMuted },
                ]}
              >
                {retrying ? (
                  <ActivityIndicator size={12} color={colors.error} />
                ) : (
                  <MaterialIcons
                    name="refresh"
                    size={12}
                    color={colors.error}
                  />
                )}
                <ThemedText style={[styles.badgeText, { color: colors.error }]}>
                  {retrying ? "Retrying\u2026" : "Tap to retry"}
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {/* Title */}
        {editing ? (
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[
              styles.titleInput,
              { color: colors.ink, borderBottomColor: colors.rule },
            ]}
            placeholder="Title"
            placeholderTextColor={colors.muted}
          />
        ) : (
          <ThemedText style={styles.noteTitle}>
            {note.title || "Untitled"}
          </ThemedText>
        )}

        <ThemedText style={[styles.date, { color: colors.textTertiary }]}>
          {formattedDate}
        </ThemedText>

        {/* Tab bar */}
        <View style={[styles.tabBar, { borderBottomColor: colors.rule }]}>
          <Pressable
            onPress={() => setActiveTab("transcript")}
            style={[
              styles.tab,
              activeTab === "transcript" && {
                borderBottomColor: colors.ink,
                borderBottomWidth: 2,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === "transcript"
                      ? colors.ink
                      : colors.textTertiary,
                },
              ]}
            >
              Transcript
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("summary")}
            style={[
              styles.tab,
              activeTab === "summary" && {
                borderBottomColor: colors.ink,
                borderBottomWidth: 2,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === "summary" ? colors.ink : colors.textTertiary,
                },
              ]}
            >
              AI Summary
            </ThemedText>
            {isAiProcessing && (
              <ActivityIndicator
                size={12}
                color={colors.warning}
                style={{ marginLeft: 6 }}
              />
            )}
          </Pressable>
        </View>

        {/* Tab content */}
        {activeTab === "transcript" ? (
          <View style={styles.tabContent}>
            {editing ? (
              <TextInput
                value={content}
                onChangeText={setContent}
                multiline
                style={[styles.contentInput, { color: colors.ink }]}
                placeholder="Write something\u2026"
                placeholderTextColor={colors.muted}
              />
            ) : (
              <ThemedText
                style={[
                  styles.noteContent,
                  { color: isTranscribing ? colors.muted : colors.ink2 },
                  isTranscribing && styles.noteContentItalic,
                ]}
              >
                {note.content || "No content"}
              </ThemedText>
            )}

            {note.transcriptionStatus === "failed" && (
              <View
                style={[
                  styles.errorCard,
                  {
                    backgroundColor: colors.errorMuted,
                    borderColor: colors.error + "30",
                  },
                ]}
              >
                <MaterialIcons
                  name="error-outline"
                  size={16}
                  color={colors.error}
                />
                <View style={styles.errorCardBody}>
                  <ThemedText
                    style={[styles.errorTitle, { color: colors.error }]}
                  >
                    Transcription failed
                  </ThemedText>
                  {!!note.transcriptionError && (
                    <ThemedText
                      style={[
                        styles.errorDetail,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={3}
                    >
                      {note.transcriptionError}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}

            {/* AI processing status on transcript tab */}
            {isAiProcessing && (
              <View
                style={[
                  styles.aiStatusCard,
                  {
                    backgroundColor: colors.warning + "10",
                    borderColor: colors.warning + "30",
                  },
                ]}
              >
                <ActivityIndicator size={16} color={colors.warning} />
                <View style={styles.aiStatusBody}>
                  <ThemedText
                    style={[styles.aiStatusTitle, { color: colors.warning }]}
                  >
                    AI is analyzing this note
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.aiStatusDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Summary and key points will appear shortly
                  </ThemedText>
                </View>
              </View>
            )}

            {note.aiStatus === "done" && !isAiProcessing && (
              <Pressable
                onPress={() => setActiveTab("summary")}
                style={[
                  styles.aiReadyCard,
                  {
                    backgroundColor: colors.successMuted,
                    borderColor: colors.success + "30",
                  },
                ]}
              >
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color={colors.success}
                />
                <View style={styles.aiStatusBody}>
                  <ThemedText
                    style={[styles.aiStatusTitle, { color: colors.success }]}
                  >
                    AI summary ready
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.aiStatusDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tap to view summary and key points
                  </ThemedText>
                </View>
                <MaterialIcons
                  name="arrow-forward"
                  size={14}
                  color={colors.success}
                />
              </Pressable>
            )}

            {note.aiStatus === "failed" && (
              <View
                style={[
                  styles.aiStatusCard,
                  {
                    backgroundColor: colors.errorMuted,
                    borderColor: colors.error + "30",
                  },
                ]}
              >
                <MaterialIcons
                  name="error-outline"
                  size={16}
                  color={colors.error}
                />
                <View style={styles.aiStatusBody}>
                  <ThemedText
                    style={[styles.aiStatusTitle, { color: colors.error }]}
                  >
                    AI analysis failed
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.aiStatusDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    The on-device model could not process this note
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {isAiProcessing && (
              <View style={styles.aiLoadingWrap}>
                <ActivityIndicator size="large" color={colors.accent} />
                <ThemedText
                  style={[
                    styles.aiLoadingText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Analyzing your note...
                </ThemedText>
              </View>
            )}

            {note.aiStatus === "done" && (
              <>
                {/* Summary */}
                {!!note.aiSummary && (
                  <View style={styles.summarySection}>
                    <ThemedText
                      style={[
                        styles.summaryLabel,
                        { color: colors.textTertiary },
                      ]}
                    >
                      SUMMARY
                    </ThemedText>
                    <View
                      style={[
                        styles.summaryCard,
                        {
                          backgroundColor: colors.paper2,
                          borderColor: colors.rule,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[styles.summaryText, { color: colors.ink2 }]}
                      >
                        {note.aiSummary}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Key Points */}
                {note.aiKeyPoints && note.aiKeyPoints.length > 0 && (
                  <View style={styles.keyPointsSection}>
                    <ThemedText
                      style={[
                        styles.summaryLabel,
                        { color: colors.textTertiary },
                      ]}
                    >
                      KEY POINTS
                    </ThemedText>
                    {note.aiKeyPoints.map((point, i) => (
                      <View key={i} style={styles.keyPointRow}>
                        <View
                          style={[
                            styles.keyPointBullet,
                            { backgroundColor: colors.accent },
                          ]}
                        />
                        <ThemedText
                          style={[styles.keyPointText, { color: colors.ink2 }]}
                        >
                          {point}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tasks */}
                {note.aiTasks && note.aiTasks.length > 0 && (
                  <View style={styles.keyPointsSection}>
                    <ThemedText
                      style={[
                        styles.summaryLabel,
                        { color: colors.textTertiary },
                      ]}
                    >
                      EXTRACTED TASKS
                    </ThemedText>
                    {note.aiTasks.map((task, i) => (
                      <View key={i} style={styles.keyPointRow}>
                        <MaterialIcons
                          name="check-circle-outline"
                          size={14}
                          color={colors.accent}
                        />
                        <ThemedText
                          style={[styles.keyPointText, { color: colors.ink2 }]}
                        >
                          {task}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {note.aiStatus === "failed" && (
              <View style={styles.aiEmptyWrap}>
                <MaterialIcons
                  name="error-outline"
                  size={32}
                  color={colors.error}
                />
                <ThemedText
                  style={[styles.aiEmptyTitle, { color: colors.error }]}
                >
                  Analysis failed
                </ThemedText>
                <ThemedText
                  style={[styles.aiEmptyDesc, { color: colors.textSecondary }]}
                >
                  The AI model couldn't process this note. Make sure the LLM
                  model is downloaded.
                </ThemedText>
              </View>
            )}

            {!note.aiStatus && !isAiProcessing && (
              <View style={styles.aiEmptyWrap}>
                <MaterialIcons
                  name="auto-awesome"
                  size={32}
                  color={colors.muted}
                />
                <ThemedText
                  style={[styles.aiEmptyTitle, { color: colors.textSecondary }]}
                >
                  No summary yet
                </ThemedText>
                <ThemedText
                  style={[styles.aiEmptyDesc, { color: colors.textTertiary }]}
                >
                  AI summaries are generated automatically for voice notes when
                  the LLM model is available.
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing["5xl"] },
  notFound: { textAlign: "center", marginTop: Spacing["5xl"], fontSize: 15 },
  headerActions: { flexDirection: "row", gap: Spacing.lg },
  headerBtn: { fontFamily: "Geist_600SemiBold", fontSize: 15 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  voiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: { fontFamily: "Geist_500Medium", fontSize: 12 },
  noteTitle: {
    fontFamily: "Geist_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  titleInput: {
    fontFamily: "Geist_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  date: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xl,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: -StyleSheet.hairlineWidth,
  },
  tabLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
  tabContent: {
    minHeight: 200,
  },
  noteContent: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  noteContentItalic: {
    fontStyle: "italic",
  },
  contentInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: "top",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorCardBody: {
    flex: 1,
    gap: 4,
  },
  errorTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 13,
  },
  errorDetail: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  aiStatusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aiReadyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aiStatusBody: {
    flex: 1,
    gap: 2,
  },
  aiStatusTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 13,
  },
  aiStatusDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  aiLoadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.lg,
  },
  aiLoadingText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
  },
  aiEmptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
    gap: Spacing.md,
  },
  aiEmptyTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
  },
  aiEmptyDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },
  summarySection: {
    marginBottom: Spacing["2xl"],
  },
  summaryLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  summaryText: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  keyPointsSection: {
    marginBottom: Spacing["2xl"],
  },
  keyPointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  keyPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  keyPointText: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
});
