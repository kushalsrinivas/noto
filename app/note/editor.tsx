import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes } from "@/store/app-store";
import { useFolders } from "@/store/folder-store";

export default function NoteEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addNote } = useNotes();
  const { folders } = useFolders();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined,
  );
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
        folderId: selectedFolderId,
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
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Math.max(Spacing["5xl"], insets.bottom + Spacing.xl),
          },
        ]}
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

        {folders.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.folderPicker}
          >
            <Pressable
              onPress={() => setSelectedFolderId(undefined)}
              style={[
                styles.folderOption,
                {
                  borderColor: !selectedFolderId ? colors.ink : colors.rule,
                  backgroundColor: !selectedFolderId
                    ? colors.ink + "0A"
                    : colors.paper2,
                },
              ]}
            >
              <ThemedText style={styles.folderOptionText}>No folder</ThemedText>
            </Pressable>
            {folders.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => setSelectedFolderId(f.id)}
                style={[
                  styles.folderOption,
                  {
                    borderColor:
                      selectedFolderId === f.id ? f.color : colors.rule,
                    backgroundColor:
                      selectedFolderId === f.id
                        ? f.color + "14"
                        : colors.paper2,
                  },
                ]}
              >
                <MaterialIcons
                  name={f.icon as keyof typeof MaterialIcons.glyphMap}
                  size={12}
                  color={
                    selectedFolderId === f.id ? f.color : colors.textSecondary
                  }
                />
                <ThemedText
                  style={[
                    styles.folderOptionText,
                    {
                      color:
                        selectedFolderId === f.id
                          ? f.color
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {f.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Start writing..."
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
  scroll: { padding: Spacing.xl },
  saveBtn: { fontFamily: "Geist_600SemiBold", fontSize: 15 },
  titleInput: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 24,
    letterSpacing: -0.5,
    marginBottom: Spacing.lg,
    padding: 0,
  },
  folderPicker: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  folderOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  folderOptionText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
  contentInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
  },
});
