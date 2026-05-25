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

export default function NoteDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote, deleteNote, reload } = useNotes();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [retrying, setRetrying] = useState(false);

  const note = notes.find((n) => n.id === id);
  const isTranscribing = note?.transcriptionStatus === "transcribing";

  useFocusEffect(
    useCallback(() => {
      reload();

      if (!isTranscribing) return;

      const interval = setInterval(() => reload(), 3000);
      return () => clearInterval(interval);
    }, [reload, isTranscribing]),
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
                  {!isTranscribing && (
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
                  {retrying ? "Retrying…" : "Tap to retry"}
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

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

        {editing ? (
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            style={[styles.contentInput, { color: colors.ink }]}
            placeholder="Write something…"
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
              <ThemedText style={[styles.errorTitle, { color: colors.error }]}>
                Transcription failed
              </ThemedText>
              {!!note.transcriptionError && (
                <ThemedText
                  style={[styles.errorDetail, { color: colors.textSecondary }]}
                  numberOfLines={3}
                >
                  {note.transcriptionError}
                </ThemedText>
              )}
            </View>
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
    marginBottom: Spacing.xl,
  },
  noteContent: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  noteContentItalic: {
    fontStyle: "italic",
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
  contentInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: "top",
  },
});
