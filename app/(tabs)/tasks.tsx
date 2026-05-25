import { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { useColors } from "@/hooks/use-theme-color";
import { useTasks, type Task } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";

type TabFilter = "today" | "upcoming" | "done";

function isToday(dateStr?: string) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function formatDueDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function TasksScreen() {
  const colors = useColors();
  const { tasks, toggleTask, reload } = useTasks();
  const [tab, setTab] = useState<TabFilter>("today");

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const filtered = tasks.filter((t) => {
    if (tab === "done") return t.completed;
    if (tab === "today") return !t.completed && isToday(t.dueDate);
    return !t.completed && !isToday(t.dueDate);
  });

  function renderTask({ item }: { item: Task }) {
    return (
      <Pressable
        onPress={() => router.push(`/task/${item.id}`)}
        style={[styles.taskItem, { borderBottomColor: colors.ruleLight }]}
      >
        <Pressable
          onPress={() => toggleTask(item.id)}
          style={[
            styles.checkbox,
            {
              borderColor: item.completed ? colors.success : colors.rule,
              backgroundColor: item.completed ? colors.success : "transparent",
            },
          ]}
          hitSlop={8}
        >
          {item.completed && (
            <MaterialIcons name="check" size={12} color="#FFFFFF" />
          )}
        </Pressable>
        <View style={styles.taskContent}>
          <ThemedText
            style={[
              styles.taskTitle,
              item.completed && {
                textDecorationLine: "line-through",
                color: colors.textTertiary,
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </ThemedText>
          <View style={styles.taskMeta}>
            {item.dueDate && !item.completed && (
              <ThemedText
                style={[styles.metaText, { color: colors.textTertiary }]}
              >
                {formatDueDate(item.dueDate)}
              </ThemedText>
            )}
            {item.priority === "high" && (
              <View
                style={[styles.priorityDot, { backgroundColor: colors.error }]}
              />
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  const emptyMessages: Record<TabFilter, { title: string; message: string }> = {
    today: { title: "All clear", message: "No tasks for today." },
    upcoming: {
      title: "Nothing ahead",
      message: "Future tasks will appear here.",
    },
    done: {
      title: "No completions yet",
      message: "Finished tasks show up here.",
    },
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        <ThemedText style={styles.screenTitle}>Tasks</ThemedText>
        <Pressable onPress={() => router.push("/task/editor")} hitSlop={12}>
          <MaterialIcons name="add" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {(["today", "upcoming", "done"] as TabFilter[]).map((t) => (
          <Chip
            key={t}
            label={t.charAt(0).toUpperCase() + t.slice(1)}
            selected={tab === t}
            onPress={() => setTab(t)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="check-circle-outline"
            title={emptyMessages[tab].title}
            message={emptyMessages[tab].message}
            actionLabel={tab !== "done" ? "Add task" : undefined}
            onAction={
              tab !== "done" ? () => router.push("/task/editor") : undefined
            }
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
  tabRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing["3xl"] },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  taskContent: { flex: 1 },
  taskTitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 3,
  },
  metaText: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
