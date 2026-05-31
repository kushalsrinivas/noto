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
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FolderSuggestionModal } from "@/components/folder-suggestion";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, FolderColors, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { retryTranscription } from "@/lib/transcription-queue";
import { useNotes } from "@/store/app-store";
import { useFolders } from "@/store/folder-store";

type Tab = "transcript" | "summary";

export default function NoteDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote, deleteNote, reload } = useNotes();
  const { folders, addFolder } = useFolders();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("transcript");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const note = notes.find((n) => n.id === id);
  const noteFolder = note?.folderId
    ? folders.find((f) => f.id === note.folderId)
    : undefined;
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
      setEditTags(note.tags);
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
    updateNote(note!.id, { title, content, tags: editTags });
    setEditing(false);
  }

  function handleAddTag() {
    const tag = tagInput
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_ ]/g, "");
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setEditTags(editTags.filter((t) => t !== tag));
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
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Math.max(Spacing["5xl"], insets.bottom + Spacing.xl),
          },
        ]}
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

        {/* Folder & Tags */}
        <View style={styles.metaSection}>
          {noteFolder ? (
            <Pressable
              onPress={() => router.push(`/folder/${noteFolder.id}`)}
              style={[
                styles.folderChip,
                { backgroundColor: noteFolder.color + "14" },
              ]}
            >
              <MaterialIcons
                name={noteFolder.icon as keyof typeof MaterialIcons.glyphMap}
                size={12}
                color={noteFolder.color}
              />
              <ThemedText
                style={[styles.folderChipText, { color: noteFolder.color }]}
              >
                {noteFolder.name}
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowFolderPicker(true)}
              style={[styles.folderChip, { backgroundColor: colors.paper3 }]}
            >
              <MaterialIcons
                name="folder-open"
                size={12}
                color={colors.textTertiary}
              />
              <ThemedText
                style={[styles.folderChipText, { color: colors.textTertiary }]}
              >
                Add to folder
              </ThemedText>
            </Pressable>
          )}
          {editing ? (
            <>
              {editTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => handleRemoveTag(tag)}
                  style={[styles.tagChip, { backgroundColor: colors.paper3 }]}
                >
                  <ThemedText
                    style={[styles.tagChipText, { color: colors.textTertiary }]}
                  >
                    {tag}
                  </ThemedText>
                  <MaterialIcons name="close" size={10} color={colors.muted} />
                </Pressable>
              ))}
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                placeholder="+ tag"
                placeholderTextColor={colors.muted}
                style={[styles.tagInput, { color: colors.ink }]}
                returnKeyType="done"
                blurOnSubmit={false}
              />
            </>
          ) : (
            note.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tagChip, { backgroundColor: colors.paper3 }]}
              >
                <ThemedText
                  style={[styles.tagChipText, { color: colors.textTertiary }]}
                >
                  {tag}
                </ThemedText>
              </View>
            ))
          )}
        </View>

        {/* AI folder suggestion */}
        {note.pendingFolderSuggestion && !note.folderId && (
          <Pressable
            onPress={() => setShowSuggestion(true)}
            style={[
              styles.suggestionBanner,
              {
                backgroundColor: colors.accentMuted,
                borderColor: colors.accent + "30",
              },
            ]}
          >
            <MaterialIcons
              name="auto-awesome"
              size={14}
              color={colors.accent}
            />
            <ThemedText
              style={[styles.suggestionText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              Move to "{note.pendingFolderSuggestion.folderName}"?
            </ThemedText>
            <MaterialIcons
              name="arrow-forward"
              size={14}
              color={colors.accent}
            />
          </Pressable>
        )}

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
                      <View key={i} style={styles.taskExtractedRow}>
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
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/task/editor",
                              params: { prefillTitle: task },
                            })
                          }
                          hitSlop={8}
                          style={styles.setReminderBtn}
                        >
                          <MaterialIcons
                            name="notifications-none"
                            size={14}
                            color={colors.textTertiary}
                          />
                        </Pressable>
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

      <Modal
        visible={showFolderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFolderPicker(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowFolderPicker(false)}
        >
          <View
            style={[
              styles.pickerSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.rule,
                paddingBottom: Math.max(
                  Spacing["3xl"],
                  insets.bottom + Spacing.md,
                ),
              },
            ]}
          >
            <ThemedText style={styles.pickerTitle}>Move to folder</ThemedText>

            {folders.length === 0 ? (
              <ThemedText
                style={[styles.pickerEmpty, { color: colors.textTertiary }]}
              >
                No folders yet. Create one first.
              </ThemedText>
            ) : (
              <ScrollView style={styles.pickerList}>
                {folders.map((f) => (
                  <Pressable
                    key={f.id}
                    onPress={async () => {
                      setShowFolderPicker(false);
                      await updateNote(note.id, { folderId: f.id });
                    }}
                    style={[
                      styles.pickerRow,
                      { borderBottomColor: colors.ruleLight },
                    ]}
                  >
                    <View
                      style={[
                        styles.pickerIcon,
                        { backgroundColor: f.color + "18" },
                      ]}
                    >
                      <MaterialIcons
                        name={f.icon as keyof typeof MaterialIcons.glyphMap}
                        size={18}
                        color={f.color}
                      />
                    </View>
                    <ThemedText style={styles.pickerRowText}>
                      {f.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Pressable
              onPress={() => {
                setShowFolderPicker(false);
                router.push("/folder/editor");
              }}
              style={[styles.pickerNewBtn, { borderColor: colors.rule }]}
            >
              <MaterialIcons
                name="create-new-folder"
                size={16}
                color={colors.accent}
              />
              <ThemedText
                style={[styles.pickerNewText, { color: colors.accent }]}
              >
                Create new folder
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {note.pendingFolderSuggestion && (
        <FolderSuggestionModal
          visible={showSuggestion}
          folderName={note.pendingFolderSuggestion.folderName}
          isNewFolder={!note.pendingFolderSuggestion.folderId}
          onDismiss={() => {
            setShowSuggestion(false);
            updateNote(note.id, { pendingFolderSuggestion: undefined });
          }}
          onAccept={async () => {
            setShowSuggestion(false);
            const suggestion = note.pendingFolderSuggestion!;
            if (suggestion.folderId) {
              await updateNote(note.id, {
                folderId: suggestion.folderId,
                pendingFolderSuggestion: undefined,
              });
            } else {
              const newFolder = await addFolder({
                name: suggestion.folderName,
                icon: "folder",
                color:
                  FolderColors[Math.floor(Math.random() * FolderColors.length)],
                pinned: false,
                archived: false,
                locked: false,
                isSmart: true,
              });
              await updateNote(note.id, {
                folderId: newFolder.id,
                pendingFolderSuggestion: undefined,
              });
            }
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl },
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
    marginBottom: Spacing.sm,
  },
  metaSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.md,
  },
  folderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  folderChipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 12,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  tagChipText: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
  },
  tagInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    minWidth: 50,
  },
  suggestionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  suggestionText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    flex: 1,
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
  taskExtractedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  setReminderBtn: {
    padding: Spacing.xs,
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
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  pickerSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing["2xl"],
    paddingBottom: Spacing["3xl"],
    gap: Spacing.lg,
    maxHeight: "60%",
  },
  pickerTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 17,
  },
  pickerEmpty: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    paddingVertical: Spacing.xl,
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRowText: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
    flex: 1,
  },
  pickerNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  pickerNewText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
});
