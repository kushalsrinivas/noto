import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes, useTasks, type Note, type Task } from "@/store/app-store";
import { useFolders } from "@/store/folder-store";

type SearchResult = { type: "note"; item: Note } | { type: "task"; item: Task };

export default function SearchScreen() {
  const colors = useColors();
  const { notes } = useNotes();
  const { tasks } = useTasks();
  const { folders } = useFolders();
  const [query, setQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).slice(
    0,
    20,
  );
  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f]));

  const results: SearchResult[] = [];
  const q = query.trim().toLowerCase();

  if (q.length > 0 || selectedFolderId || selectedTag) {
    notes
      .filter((n) => {
        if (selectedFolderId && n.folderId !== selectedFolderId) return false;
        if (selectedTag && !n.tags.includes(selectedTag)) return false;
        if (q.length === 0) return true;
        if (q.startsWith("tag:")) {
          const tagQ = q.slice(4).trim();
          return n.tags.some((t) => t.includes(tagQ));
        }
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q))
        );
      })
      .forEach((n) => results.push({ type: "note", item: n }));

    if (!selectedFolderId && !selectedTag) {
      tasks
        .filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q),
        )
        .forEach((t) => results.push({ type: "task", item: t }));
    }
  }

  const showFilters = folders.length > 0 || allTags.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.searchRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes, tags..."
          placeholderTextColor={colors.muted}
          style={[
            styles.searchInput,
            { backgroundColor: colors.paper2, color: colors.ink },
          ]}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={12}>
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {folders.map((f) => (
            <Pressable
              key={f.id}
              onPress={() =>
                setSelectedFolderId(selectedFolderId === f.id ? null : f.id)
              }
              style={[
                styles.filterChip,
                {
                  borderColor:
                    selectedFolderId === f.id ? f.color : colors.rule,
                  backgroundColor:
                    selectedFolderId === f.id ? f.color + "14" : colors.paper2,
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
                  styles.filterChipText,
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
          {allTags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
              style={[
                styles.filterChip,
                {
                  borderColor:
                    selectedTag === tag ? colors.accent : colors.rule,
                  backgroundColor:
                    selectedTag === tag ? colors.accentMuted : colors.paper2,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  {
                    color:
                      selectedTag === tag
                        ? colors.accent
                        : colors.textSecondary,
                  },
                ]}
              >
                #{tag}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {q.length === 0 && !selectedFolderId && !selectedTag ? (
        <View style={styles.emptyCenter}>
          <ThemedText
            style={[styles.emptyText, { color: colors.textTertiary }]}
          >
            Search notes, tasks, tags, and folders
          </ThemedText>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyCenter}>
          <ThemedText
            style={[styles.emptyText, { color: colors.textTertiary }]}
          >
            No results{query ? ` for "${query}"` : ""}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.type === "note") {
              const note = item.item as Note;
              const nf = note.folderId ? folderMap[note.folderId] : undefined;
              return (
                <Pressable
                  onPress={() => router.push(`/note/${note.id}`)}
                  style={[
                    styles.resultItem,
                    { borderBottomColor: colors.ruleLight },
                  ]}
                >
                  <MaterialIcons
                    name="article"
                    size={16}
                    color={colors.muted}
                  />
                  <View style={styles.resultInfo}>
                    <ThemedText style={styles.resultTitle} numberOfLines={1}>
                      {note.title || "Untitled"}
                    </ThemedText>
                    <ThemedText
                      style={[styles.resultSub, { color: colors.textTertiary }]}
                      numberOfLines={1}
                    >
                      {note.content}
                    </ThemedText>
                    {(nf || note.tags.length > 0) && (
                      <View style={styles.resultMeta}>
                        {nf && (
                          <View
                            style={[
                              styles.resultFolder,
                              { backgroundColor: nf.color + "14" },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.resultFolderText,
                                { color: nf.color },
                              ]}
                            >
                              {nf.name}
                            </ThemedText>
                          </View>
                        )}
                        {note.tags.slice(0, 2).map((t) => (
                          <ThemedText
                            key={t}
                            style={[
                              styles.resultTag,
                              { color: colors.textTertiary },
                            ]}
                          >
                            #{t}
                          </ThemedText>
                        ))}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }
            const task = item.item as Task;
            return (
              <Pressable
                onPress={() => router.push(`/task/${task.id}`)}
                style={[
                  styles.resultItem,
                  { borderBottomColor: colors.ruleLight },
                ]}
              >
                <MaterialIcons
                  name={
                    task.completed ? "check-circle" : "radio-button-unchecked"
                  }
                  size={16}
                  color={task.completed ? colors.success : colors.muted}
                />
                <View style={styles.resultInfo}>
                  <ThemedText style={styles.resultTitle} numberOfLines={1}>
                    {task.title}
                  </ThemedText>
                  <ThemedText
                    style={[styles.resultSub, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {task.priority} priority
                  </ThemedText>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
  },
  emptyCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyText: { fontFamily: "Geist_400Regular", fontSize: 15 },
  list: { paddingHorizontal: Spacing.xl },
  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultInfo: { flex: 1, gap: 2 },
  resultTitle: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    marginBottom: 2,
  },
  resultSub: { fontFamily: "Geist_400Regular", fontSize: 12 },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  resultFolder: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  resultFolderText: {
    fontFamily: "Geist_500Medium",
    fontSize: 10,
  },
  resultTag: {
    fontFamily: "Geist_400Regular",
    fontSize: 10,
  },
});
