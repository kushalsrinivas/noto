import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function NoteDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote, deleteNote } = useNotes();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const note = notes.find((n) => n.id === id);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.id]);

  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText style={styles.notFound}>Note not found</ThemedText>
      </View>
    );
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
                  <Pressable onPress={() => setEditing(true)} hitSlop={12}>
                    <MaterialIcons
                      name="edit"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
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
          <View style={styles.voiceBadge}>
            <MaterialIcons name="mic" size={12} color={colors.accent} />
            <ThemedText style={[styles.badgeText, { color: colors.accent }]}>
              Voice
            </ThemedText>
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
          <ThemedText style={[styles.noteContent, { color: colors.ink2 }]}>
            {note.content || "No content"}
          </ThemedText>
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
  voiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.md,
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
  contentInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: "top",
  },
});
