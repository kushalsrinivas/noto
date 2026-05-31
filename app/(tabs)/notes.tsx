import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderCard } from "@/components/ui/folder-card";
import { Input } from "@/components/ui/input";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes, type Note } from "@/store/app-store";
import { useFolders } from "@/store/folder-store";

type Filter = "all" | "voice" | "manual" | "unorganized" | string;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function NotesScreen() {
  const colors = useColors();
  const { notes, reload } = useNotes();
  const { folders, reload: reloadFolders } = useFolders();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const hasProcessing = notes.some(
    (n) =>
      n.transcriptionStatus === "transcribing" || n.aiStatus === "processing",
  );

  useFocusEffect(
    useCallback(() => {
      reload();
      reloadFolders();

      if (!hasProcessing) return;
      const interval = setInterval(() => reload(), 3000);
      return () => clearInterval(interval);
    }, [reload, reloadFolders, hasProcessing]),
  );

  const filtered = notes.filter((n) => {
    if (filter === "voice" && n.source !== "voice") return false;
    if (filter === "manual" && n.source !== "manual") return false;
    if (filter === "unorganized" && n.folderId) return false;
    if (
      filter !== "all" &&
      filter !== "voice" &&
      filter !== "manual" &&
      filter !== "unorganized" &&
      n.folderId !== filter
    )
      return false;
    if (
      search &&
      !n.title.toLowerCase().includes(search.toLowerCase()) &&
      !n.content.toLowerCase().includes(search.toLowerCase()) &&
      !n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    )
      return false;
    return true;
  });

  const folderNoteCounts = notes.reduce<Record<string, number>>((acc, n) => {
    if (n.folderId) acc[n.folderId] = (acc[n.folderId] || 0) + 1;
    return acc;
  }, {});
  const foldersWithCounts = folders.map((f) => ({
    ...f,
    noteCount: folderNoteCounts[f.id] || 0,
  }));

  const folderMap = Object.fromEntries(foldersWithCounts.map((f) => [f.id, f]));

  function renderNote({ item }: { item: Note }) {
    const isTranscribing = item.transcriptionStatus === "transcribing";
    const noteFolder = item.folderId ? folderMap[item.folderId] : undefined;

    return (
      <Pressable
        onPress={() => router.push(`/note/${item.id}`)}
        style={[styles.noteItem, { borderBottomColor: colors.ruleLight }]}
      >
        <View style={styles.noteContent}>
          <View style={styles.noteTopRow}>
            <ThemedText style={styles.noteTitle} numberOfLines={1}>
              {item.title || "Untitled"}
            </ThemedText>
            <ThemedText
              style={[styles.noteDate, { color: colors.textTertiary }]}
            >
              {formatDate(item.updatedAt)}
            </ThemedText>
          </View>
          <View style={styles.noteBottomRow}>
            {isTranscribing ? (
              <View style={styles.transcribingRow}>
                <MaterialIcons
                  name="more-horiz"
                  size={14}
                  color={colors.warning}
                />
                <ThemedText
                  style={[styles.transcribingText, { color: colors.warning }]}
                >
                  Transcribing...
                </ThemedText>
              </View>
            ) : (
              <ThemedText
                style={[styles.notePreview, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.content || "No content"}
              </ThemedText>
            )}
            {item.source === "voice" && (
              <MaterialIcons
                name="mic"
                size={12}
                color={colors.accent}
                style={styles.voiceIcon}
              />
            )}
          </View>

          {(noteFolder || item.tags.length > 0) && (
            <View style={styles.metaRow}>
              {noteFolder && (
                <View
                  style={[
                    styles.folderBadge,
                    { backgroundColor: noteFolder.color + "14" },
                  ]}
                >
                  <MaterialIcons
                    name={
                      noteFolder.icon as keyof typeof MaterialIcons.glyphMap
                    }
                    size={10}
                    color={noteFolder.color}
                  />
                  <ThemedText
                    style={[
                      styles.folderBadgeText,
                      { color: noteFolder.color },
                    ]}
                  >
                    {noteFolder.name}
                  </ThemedText>
                </View>
              )}
              {item.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag}
                  style={[styles.tagBadge, { backgroundColor: colors.paper3 }]}
                >
                  <ThemedText
                    style={[styles.tagText, { color: colors.textTertiary }]}
                  >
                    {tag}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {item.aiStatus === "processing" && (
            <View
              style={[
                styles.aiBadge,
                { backgroundColor: colors.warning + "18" },
              ]}
            >
              <ActivityIndicator size={10} color={colors.warning} />
              <ThemedText
                style={[styles.aiBadgeText, { color: colors.warning }]}
              >
                AI processing
              </ThemedText>
            </View>
          )}
          {item.aiStatus === "done" && (
            <View
              style={[styles.aiBadge, { backgroundColor: colors.successMuted }]}
            >
              <MaterialIcons
                name="check-circle"
                size={10}
                color={colors.success}
              />
              <ThemedText
                style={[styles.aiBadgeText, { color: colors.success }]}
              >
                AI ready
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        <ThemedText style={styles.screenTitle}>Notes</ThemedText>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push("/folder/editor")} hitSlop={12}>
            <MaterialIcons
              name="create-new-folder"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Pressable onPress={() => router.push("/note/editor")} hitSlop={12}>
            <MaterialIcons name="add" size={24} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {folders.length > 0 && (
        <View style={styles.foldersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.foldersScroll}
          >
            {foldersWithCounts.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                compact
                onPress={() => router.push(`/folder/${folder.id}`)}
              />
            ))}
            <Pressable
              onPress={() => router.push("/folder/editor")}
              style={[
                styles.addFolderCard,
                {
                  borderColor: colors.rule,
                  backgroundColor: colors.paper2,
                },
              ]}
            >
              <MaterialIcons name="add" size={20} color={colors.textTertiary} />
            </Pressable>
          </ScrollView>
        </View>
      )}

      <View style={styles.searchRow}>
        <Input
          placeholder="Search notes, tags..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        <Chip
          label="All"
          selected={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <Chip
          label="Voice"
          selected={filter === "voice"}
          onPress={() => setFilter("voice")}
        />
        <Chip
          label="Written"
          selected={filter === "manual"}
          onPress={() => setFilter("manual")}
        />
        <Chip
          label="Unorganized"
          selected={filter === "unorganized"}
          onPress={() => setFilter("unorganized")}
        />
        {folders
          .filter((f) => f.pinned)
          .map((f) => (
            <Chip
              key={f.id}
              label={f.name}
              selected={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyList : styles.list
        }
        style={styles.flatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="article"
            title="No notes yet"
            message={
              search
                ? "No notes match your search."
                : "Record a voice note or write one manually."
            }
            actionLabel={search ? undefined : "New note"}
            onAction={search ? undefined : () => router.push("/note/editor")}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  screenTitle: {
    fontFamily: "Geist_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  foldersSection: {
    marginBottom: Spacing.md,
  },
  foldersScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    alignItems: "center",
  },
  addFolderCard: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    width: "100%",
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  flatList: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["4xl"],
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  noteItem: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
  },
  noteContent: {
    gap: 4,
  },
  noteTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteTitle: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
    flex: 1,
    marginRight: Spacing.md,
  },
  noteDate: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  noteBottomRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notePreview: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  voiceIcon: {
    marginLeft: Spacing.sm,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  folderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  folderBadgeText: {
    fontFamily: "Geist_500Medium",
    fontSize: 10,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontFamily: "Geist_400Regular",
    fontSize: 10,
  },
  transcribingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  transcribingText: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  aiBadgeText: {
    fontFamily: "Geist_500Medium",
    fontSize: 10,
  },
});
