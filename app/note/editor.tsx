import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { router, Stack } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes } from "@/store/app-store";
import { Spacing } from "@/constants/theme";

export default function NoteEditorScreen() {
  const colors = useColors();
  const { addNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Empty note", "Add a title or some content.");
      return;
    }
    setSaving(true);
    try {
      await addNote({
        title: title.trim() || "Untitled",
        content: content.trim(),
        source: "manual",
        tags: [],
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={saving}>
              <ThemedText
                style={[
                  styles.saveBtn,
                  { color: colors.ink, opacity: saving ? 0.4 : 1 },
                ]}
              >
                Save
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scroll}
        keyboardDismissMode="interactive"
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.muted}
          style={[styles.titleInput, { color: colors.ink }]}
          autoFocus
        />
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Start writing…"
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.contentInput, { color: colors.ink }]}
          textAlignVertical="top"
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing["5xl"] },
  saveBtn: { fontFamily: "Geist_600SemiBold", fontSize: 15 },
  titleInput: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 24,
    letterSpacing: -0.5,
    marginBottom: Spacing.xl,
    padding: 0,
  },
  contentInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
  },
});
