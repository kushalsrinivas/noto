import { View, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-theme-color";
import { useTasks } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function TaskDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, toggleTask, deleteTask } = useTasks();

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText style={styles.notFound}>Task not found</ThemedText>
      </View>
    );
  }

  function handleDelete() {
    Alert.alert("Delete task", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTask(task!.id);
          router.back();
        },
      },
    ]);
  }

  const formattedDue = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={12}>
              <MaterialIcons
                name="delete-outline"
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.metaRow}>
          <View
            style={[
              styles.statusBadge,
              { borderColor: task.completed ? colors.success : colors.rule },
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                { color: task.completed ? colors.success : colors.muted },
              ]}
            >
              {task.completed ? "Done" : "Open"}
            </ThemedText>
          </View>
          <View style={[styles.priorityBadge, { borderColor: colors.rule }]}>
            <ThemedText style={[styles.statusText, { color: colors.muted }]}>
              {task.priority}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          style={[
            styles.taskTitle,
            task.completed && {
              textDecorationLine: "line-through",
              color: colors.muted,
            },
          ]}
        >
          {task.title}
        </ThemedText>

        {task.description ? (
          <ThemedText
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {task.description}
          </ThemedText>
        ) : null}

        {/* Details */}
        <View
          style={[styles.detailsList, { borderTopColor: colors.ruleLight }]}
        >
          {formattedDue && (
            <View
              style={[
                styles.detailRow,
                { borderBottomColor: colors.ruleLight },
              ]}
            >
              <ThemedText
                style={[styles.detailLabel, { color: colors.textTertiary }]}
              >
                Due
              </ThemedText>
              <ThemedText style={styles.detailValue}>{formattedDue}</ThemedText>
            </View>
          )}
          <View
            style={[styles.detailRow, { borderBottomColor: colors.ruleLight }]}
          >
            <ThemedText
              style={[styles.detailLabel, { color: colors.textTertiary }]}
            >
              Created
            </ThemedText>
            <ThemedText style={styles.detailValue}>
              {new Date(task.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}
            </ThemedText>
          </View>
        </View>

        <Button
          title={task.completed ? "Reopen" : "Mark done"}
          onPress={() => toggleTask(task.id)}
          variant={task.completed ? "secondary" : "primary"}
          style={{ marginTop: Spacing["2xl"] }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing["5xl"] },
  notFound: { textAlign: "center", marginTop: Spacing["5xl"], fontSize: 15 },
  metaRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  statusText: { fontFamily: "Geist_500Medium", fontSize: 12 },
  taskTitle: {
    fontFamily: "Geist_700Bold",
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  description: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  detailsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: { fontFamily: "Geist_400Regular", fontSize: 14 },
  detailValue: { fontFamily: "Geist_500Medium", fontSize: 14 },
});
