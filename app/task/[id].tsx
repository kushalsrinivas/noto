import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { cancelTaskReminder, snoozeTask } from "@/lib/reminder-notifications";
import { useTasks } from "@/store/app-store";

function formatDateTime(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function TaskDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, toggleTask, deleteTask, updateTask } = useTasks();

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText style={styles.notFound}>Task not found</ThemedText>
      </View>
    );
  }

  async function handleDelete() {
    Alert.alert("Delete task", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await cancelTaskReminder(task!.notificationId);
          deleteTask(task!.id);
          router.back();
        },
      },
    ]);
  }

  async function handleToggle() {
    if (!task!.completed && task!.notificationId) {
      await cancelTaskReminder(task!.notificationId);
      await updateTask(task!.id, { notificationId: undefined });
    }
    toggleTask(task!.id);
  }

  function handleSnooze() {
    Alert.alert("Snooze reminder", "Reschedule this reminder:", [
      {
        text: "15 minutes",
        onPress: () => snoozeTask(task!.id, 15 * 60 * 1000),
      },
      {
        text: "1 hour",
        onPress: () => snoozeTask(task!.id, 60 * 60 * 1000),
      },
      {
        text: "Tomorrow 9 AM",
        onPress: () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          const ms = tomorrow.getTime() - Date.now();
          snoozeTask(task!.id, ms);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const formattedDue = formatDate(task.dueDate);
  const formattedReminder = formatDateTime(task.reminderAt);
  const formattedSnoozed = formatDateTime(task.snoozedUntil);

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
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Math.max(Spacing["5xl"], insets.bottom + Spacing.xl),
          },
        ]}
      >
        <View style={styles.metaRow}>
          <View
            style={[
              styles.badge,
              { borderColor: task.completed ? colors.success : colors.rule },
            ]}
          >
            <ThemedText
              style={[
                styles.badgeText,
                { color: task.completed ? colors.success : colors.muted },
              ]}
            >
              {task.completed ? "Done" : "Open"}
            </ThemedText>
          </View>
          <View style={[styles.badge, { borderColor: colors.rule }]}>
            <ThemedText style={[styles.badgeText, { color: colors.muted }]}>
              {task.priority}
            </ThemedText>
          </View>
          {task.recurrence && task.recurrence !== "none" && (
            <View style={[styles.badge, { borderColor: colors.accent + "40" }]}>
              <MaterialIcons name="repeat" size={10} color={colors.accent} />
              <ThemedText style={[styles.badgeText, { color: colors.accent }]}>
                {task.recurrence}
              </ThemedText>
            </View>
          )}
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

        {/* Reminder card */}
        {formattedReminder && !task.completed && (
          <View
            style={[
              styles.reminderCard,
              {
                backgroundColor: colors.accentMuted,
                borderColor: colors.accent + "30",
              },
            ]}
          >
            <MaterialIcons
              name="notifications-active"
              size={16}
              color={colors.accent}
            />
            <View style={styles.reminderBody}>
              <ThemedText
                style={[styles.reminderTitle, { color: colors.accent }]}
              >
                Reminder set
              </ThemedText>
              <ThemedText
                style={[styles.reminderTime, { color: colors.textSecondary }]}
              >
                {formattedReminder}
              </ThemedText>
              {formattedSnoozed && (
                <ThemedText
                  style={[styles.reminderTime, { color: colors.textTertiary }]}
                >
                  Snoozed until {formattedSnoozed}
                </ThemedText>
              )}
            </View>
            <Pressable onPress={handleSnooze} hitSlop={8}>
              <MaterialIcons
                name="snooze"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        )}

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
          {task.linkedNoteId && (
            <Pressable
              style={[
                styles.detailRow,
                { borderBottomColor: colors.ruleLight },
              ]}
              onPress={() => router.push(`/note/${task.linkedNoteId}`)}
            >
              <ThemedText
                style={[styles.detailLabel, { color: colors.textTertiary }]}
              >
                Linked note
              </ThemedText>
              <View style={styles.linkRow}>
                <ThemedText
                  style={[styles.detailValue, { color: colors.accent }]}
                >
                  Open
                </ThemedText>
                <MaterialIcons
                  name="arrow-forward"
                  size={14}
                  color={colors.accent}
                />
              </View>
            </Pressable>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title={task.completed ? "Reopen" : "Mark done"}
            onPress={handleToggle}
            variant={task.completed ? "secondary" : "primary"}
          />
          {task.reminderAt && !task.completed && (
            <Button title="Snooze" onPress={handleSnooze} variant="secondary" />
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl },
  notFound: { textAlign: "center", marginTop: Spacing["5xl"], fontSize: 15 },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  badgeText: { fontFamily: "Geist_500Medium", fontSize: 12 },
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
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xl,
  },
  reminderBody: {
    flex: 1,
    gap: 2,
  },
  reminderTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 13,
  },
  reminderTime: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  detailsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: { fontFamily: "Geist_400Regular", fontSize: 14 },
  detailValue: { fontFamily: "Geist_500Medium", fontSize: 14 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing["2xl"],
  },
});
