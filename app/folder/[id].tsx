import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { generateFolderSummary } from "@/lib/folder-classifier";
import { useNotes } from "@/store/app-store";
import { useFolders } from "@/store/folder-store";

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FolderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    folders,
    updateFolder,
    deleteFolder,
    togglePin,
    toggleLock,
    reload: reloadFolders,
  } = useFolders();
  const { notes, reload: reloadNotes, updateNote } = useNotes();

  const folder = folders.find((f) => f.id === id);
  const folderNotes = notes.filter((n) => n.folderId === id);
  const subfolders = folders.filter((f) => f.parentId === id);
  const [regenerating, setRegenerating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reloadNotes();
      reloadFolders();
    }, [reloadNotes, reloadFolders]),
  );

  async function handleRegenerateSummary() {
    if (!folder || folderNotes.length === 0) return;
    setRegenerating(true);
    try {
      const summary = await generateFolderSummary(folderNotes);
      await updateFolder(folder.id, { aiSummary: summary });
    } catch {
      Alert.alert("Error", "Could not generate summary.");
    } finally {
      setRegenerating(false);
    }
  }

  function handleRemoveNote(noteId: string) {
    Alert.alert(
      "Remove from folder",
      "This note will become unorganized. It won't be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => updateNote(noteId, { folderId: undefined }),
        },
      ],
    );
  }

  function handleDelete() {
    if (!folder) return;
    Alert.alert(
      "Delete folder",
      `Delete "${folder.name}"? Notes inside won't be deleted — they'll become unorganized.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            for (const n of folderNotes) {
              await updateNote(n.id, { folderId: undefined });
            }
            await deleteFolder(folder.id);
            router.back();
          },
        },
      ],
    );
  }

  if (!folder) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <ThemedText style={{ color: colors.textTertiary }}>
          Folder not found
        </ThemedText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={() => togglePin(folder.id)} hitSlop={12}>
                <MaterialIcons
                  name="push-pin"
                  size={20}
                  color={folder.pinned ? colors.accent : colors.textTertiary}
                  style={!folder.pinned ? { opacity: 0.5 } : undefined}
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/folder/editor",
                    params: { id: folder.id },
                  })
                }
                hitSlop={12}
              >
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
                  color={colors.error}
                />
              </Pressable>
            </View>
          ),
        }}
      />

      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: Math.max(Spacing["4xl"], insets.bottom + Spacing.xl),
          },
        ]}
        data={folderNotes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.folderIcon,
                { backgroundColor: folder.color + "18" },
              ]}
            >
              <MaterialIcons
                name={folder.icon as keyof typeof MaterialIcons.glyphMap}
                size={32}
                color={folder.color}
              />
            </View>

            <ThemedText style={styles.folderName}>{folder.name}</ThemedText>

            <ThemedText
              style={[styles.folderMeta, { color: colors.textTertiary }]}
            >
              {folderNotes.length} {folderNotes.length === 1 ? "note" : "notes"}
              {subfolders.length > 0 &&
                ` · ${subfolders.length} subfolder${subfolders.length > 1 ? "s" : ""}`}
            </ThemedText>

            {folder.aiSummary ? (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.paper2,
                    borderColor: colors.ruleLight,
                  },
                ]}
              >
                <View style={styles.summaryHeader}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={12}
                    color={colors.accent}
                  />
                  <ThemedText
                    style={[
                      styles.summaryLabel,
                      { color: colors.textTertiary },
                    ]}
                  >
                    AI Summary
                  </ThemedText>
                  <Pressable
                    onPress={handleRegenerateSummary}
                    disabled={regenerating}
                  >
                    <MaterialIcons
                      name="refresh"
                      size={14}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>
                <ThemedText
                  style={[styles.summaryText, { color: colors.textSecondary }]}
                >
                  {folder.aiSummary}
                </ThemedText>
              </View>
            ) : folderNotes.length > 0 ? (
              <Pressable
                onPress={handleRegenerateSummary}
                disabled={regenerating}
                style={[styles.generateBtn, { borderColor: colors.rule }]}
              >
                <MaterialIcons
                  name="auto-awesome"
                  size={14}
                  color={colors.accent}
                />
                <ThemedText
                  style={[styles.generateText, { color: colors.textSecondary }]}
                >
                  {regenerating ? "Generating..." : "Generate AI summary"}
                </ThemedText>
              </Pressable>
            ) : null}

            {folderNotes.length > 0 && (
              <ThemedText
                style={[styles.listLabel, { color: colors.textTertiary }]}
              >
                NOTES
              </ThemedText>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/note/${item.id}`)}
            onLongPress={() => handleRemoveNote(item.id)}
            style={[styles.noteRow, { borderBottomColor: colors.ruleLight }]}
          >
            <View style={styles.noteInfo}>
              <ThemedText style={styles.noteTitle} numberOfLines={1}>
                {item.title || "Untitled"}
              </ThemedText>
              <ThemedText
                style={[styles.notePreview, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.content || "No content"}
              </ThemedText>
            </View>
            <View style={styles.noteRight}>
              <ThemedText
                style={[styles.noteTime, { color: colors.textTertiary }]}
              >
                {formatRelativeTime(item.updatedAt)}
              </ThemedText>
              {item.source === "voice" && (
                <MaterialIcons name="mic" size={12} color={colors.accent} />
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBlock}>
            <ThemedText
              style={[styles.emptyText, { color: colors.textTertiary }]}
            >
              No notes in this folder yet.
            </ThemedText>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: Spacing.xl },
  headerBlock: {
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  folderName: {
    fontFamily: "Geist_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  folderMeta: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    flex: 1,
  },
  summaryText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  generateText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
  listLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    marginTop: Spacing.md,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  noteInfo: { flex: 1, gap: 2 },
  noteTitle: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
  },
  notePreview: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
  noteRight: { alignItems: "flex-end", gap: 4 },
  noteTime: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  emptyBlock: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
  },
});
