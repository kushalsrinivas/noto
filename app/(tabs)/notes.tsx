import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes, type Note } from "@/store/app-store";

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

  const hasProcessing = notes.some(
    (n) =>
      n.transcriptionStatus === "transcribing" || n.aiStatus === "processing",
  );

  useFocusEffect(
    useCallback(() => {
      reload();

      if (!hasProcessing) return;
      const interval = setInterval(() => reload(), 3000);
      return () => clearInterval(interval);
    }, [reload, hasProcessing]),
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
    const isTranscribing = item.transcriptionStatus === "transcribing";

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
      {/* Header */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.screenTitle}>Notes</ThemedText>
        <Pressable onPress={() => router.push("/note/editor")} hitSlop={12}>
          <MaterialIcons name="add" size={24} color={colors.ink} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Input
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Filter chips */}
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

      {/* Notes list */}
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
  screenTitle: {
    fontFamily: "Geist_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  searchRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    width: "100%",
  },
  filterRow: {
    flexDirection: "row",
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
