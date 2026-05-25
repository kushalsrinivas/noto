import { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TextInput, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes, useTasks, type Note, type Task } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";

type SearchResult = { type: "note"; item: Note } | { type: "task"; item: Task };

export default function SearchScreen() {
  const colors = useColors();
  const { notes } = useNotes();
  const { tasks } = useTasks();
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const results: SearchResult[] = [];
  if (query.trim().length > 0) {
    const q = query.toLowerCase();
    notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q),
      )
      .forEach((n) => results.push({ type: "note", item: n }));
    tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      )
      .forEach((t) => results.push({ type: "task", item: t }));
  }

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
          placeholder="Search"
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

      {query.trim().length === 0 ? (
        <View style={styles.emptyCenter}>
          <ThemedText
            style={[styles.emptyText, { color: colors.textTertiary }]}
          >
            Search notes and tasks
          </ThemedText>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyCenter}>
          <ThemedText
            style={[styles.emptyText, { color: colors.textTertiary }]}
          >
            No results for "{query}"
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
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.resultTitle} numberOfLines={1}>
                      {note.title || "Untitled"}
                    </ThemedText>
                    <ThemedText
                      style={[styles.resultSub, { color: colors.textTertiary }]}
                      numberOfLines={1}
                    >
                      {note.content}
                    </ThemedText>
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
                <View style={{ flex: 1 }}>
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
  emptyCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyText: { fontFamily: "Geist_400Regular", fontSize: 15 },
  list: { paddingHorizontal: Spacing.xl },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultTitle: { fontFamily: "Geist_500Medium", fontSize: 14, marginBottom: 2 },
  resultSub: { fontFamily: "Geist_400Regular", fontSize: 12 },
});
