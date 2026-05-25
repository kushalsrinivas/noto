import { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes, type Note } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";

type Filter = "all" | "voice" | "manual";

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
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const filtered = notes.filter((n) => {
    if (filter === "voice" && n.source !== "voice") return false;
    if (filter === "manual" && n.source !== "manual") return false;
    if (
      search &&
      !n.title.toLowerCase().includes(search.toLowerCase()) &&
      !n.content.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function renderNote({ item }: { item: Note }) {
    return (
      <Pressable
        onPress={() => router.push(`/note/${item.id}`)}
        style={[styles.noteItem, { borderBottomColor: colors.ruleLight }]}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.noteHeader}>
            <ThemedText style={styles.noteTitle} numberOfLines={1}>
              {item.title || "Untitled"}
            </ThemedText>
            {item.source === "voice" && (
              <MaterialIcons name="mic" size={12} color={colors.accent} />
            )}
          </View>
          <ThemedText
            style={[styles.notePreview, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.content || "No content"}
          </ThemedText>
        </View>
        <ThemedText style={[styles.noteDate, { color: colors.textTertiary }]}>
          {formatDate(item.updatedAt)}
        </ThemedText>
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
        <Pressable onPress={() => router.push("/note/editor")} hitSlop={12}>
          <MaterialIcons name="add" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Input
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
          containerStyle={{ flex: 1 }}
        />
      </View>

      <View style={styles.filterRow}>
        {(["all", "voice", "manual"] as Filter[]).map((f) => (
          <Chip
            key={f}
            label={f === "all" ? "All" : f === "voice" ? "Voice" : "Written"}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
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
  screenTitle: {
    fontFamily: "Geist_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  searchRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing["3xl"] },
  noteItem: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.lg,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 3,
  },
  noteTitle: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
  },
  notePreview: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  noteDate: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
