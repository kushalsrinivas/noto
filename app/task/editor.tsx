import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { scheduleTaskReminder } from "@/lib/reminder-notifications";
import { useTasks, type Recurrence } from "@/store/app-store";

type Priority = "low" | "medium" | "high";

export default function TaskEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTask, updateTask } = useTasks();
  const params = useLocalSearchParams<{
    prefillTitle?: string;
    prefillDueDate?: string;
    prefillReminder?: string;
  }>();

  const [title, setTitle] = useState(params.prefillTitle ?? "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    params.prefillDueDate ? new Date(params.prefillDueDate) : undefined,
  );
  const [reminderTime, setReminderTime] = useState<Date | undefined>(
    params.prefillReminder ? new Date(params.prefillReminder) : undefined,
  );
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [saving, setSaving] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function setQuickDate(offset: number | undefined) {
    if (offset === undefined) {
      setDueDate(undefined);
      setReminderTime(undefined);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(23, 59, 59, 0);
    setDueDate(d);
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Enter a task title.");
      return;
    }
    setSaving(true);
    try {
      const dueDateIso = dueDate?.toISOString();
      const reminderAtIso = reminderTime?.toISOString();

      const task = await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDateIso,
        reminderAt: reminderAtIso,
        recurrence: recurrence !== "none" ? recurrence : undefined,
      });

      if (task.reminderAt) {
        const notifId = await scheduleTaskReminder(task);
        if (notifId) {
          await updateTask(task.id, { notificationId: notifId });
        }
      }

      router.back();
    } catch {
      Alert.alert("Error", "Failed to create task.");
    } finally {
      setSaving(false);
    }
  }

  const formattedDueDate = dueDate
    ? dueDate.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : undefined;

  const formattedReminderTime = reminderTime
    ? reminderTime.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : undefined;

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
        <Input
          label="TITLE"
          value={title}
          onChangeText={setTitle}
          placeholder="What needs doing?"
          autoFocus
          containerStyle={{ marginBottom: Spacing.xl }}
        />
        <Input
          label="DETAILS"
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description"
          multiline
          style={{ minHeight: 60, textAlignVertical: "top" }}
          containerStyle={{ marginBottom: Spacing.xl }}
        />

        {/* Priority */}
        <View style={styles.fieldSection}>
          <ThemedText
            style={[styles.fieldLabel, { color: colors.textTertiary }]}
          >
            PRIORITY
          </ThemedText>
          <View style={styles.row}>
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.priorityOption,
                  { borderColor: priority === p ? colors.ink : colors.rule },
                ]}
              >
                <ThemedText
                  style={[
                    styles.priorityLabel,
                    { color: priority === p ? colors.ink : colors.muted },
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Due date */}
        <View style={styles.fieldSection}>
          <ThemedText
            style={[styles.fieldLabel, { color: colors.textTertiary }]}
          >
            DUE DATE
          </ThemedText>
          <View style={styles.row}>
            <Chip
              label="Today"
              selected={
                dueDate !== undefined &&
                dueDate.toDateString() === new Date().toDateString()
              }
              onPress={() => setQuickDate(0)}
            />
            <Chip
              label="Tomorrow"
              selected={
                dueDate !== undefined &&
                dueDate.toDateString() ===
                  new Date(
                    new Date().setDate(new Date().getDate() + 1),
                  ).toDateString()
              }
              onPress={() => setQuickDate(1)}
            />
            <Chip
              label="None"
              selected={!dueDate}
              onPress={() => setQuickDate(undefined)}
            />
          </View>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateButton, { borderColor: colors.rule }]}
          >
            <MaterialIcons
              name="event"
              size={16}
              color={colors.textSecondary}
            />
            <ThemedText
              style={[
                styles.dateButtonText,
                { color: formattedDueDate ? colors.ink : colors.muted },
              ]}
            >
              {formattedDueDate || "Pick a date..."}
            </ThemedText>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={new Date()}
              onChange={(_, selected) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selected) setDueDate(selected);
              }}
              themeVariant="light"
            />
          )}
        </View>

        {/* Reminder time */}
        <View style={styles.fieldSection}>
          <ThemedText
            style={[styles.fieldLabel, { color: colors.textTertiary }]}
          >
            REMINDER
          </ThemedText>
          <Pressable
            onPress={() => setShowTimePicker(true)}
            style={[styles.dateButton, { borderColor: colors.rule }]}
          >
            <MaterialIcons
              name="notifications-none"
              size={16}
              color={colors.textSecondary}
            />
            <ThemedText
              style={[
                styles.dateButtonText,
                { color: formattedReminderTime ? colors.ink : colors.muted },
              ]}
            >
              {formattedReminderTime || "Set a reminder..."}
            </ThemedText>
            {reminderTime && (
              <Pressable onPress={() => setReminderTime(undefined)} hitSlop={8}>
                <MaterialIcons
                  name="close"
                  size={14}
                  color={colors.textTertiary}
                />
              </Pressable>
            )}
          </Pressable>

          {showTimePicker && (
            <DateTimePicker
              value={reminderTime || dueDate || new Date()}
              mode="datetime"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(_, selected) => {
                setShowTimePicker(Platform.OS === "ios");
                if (selected) setReminderTime(selected);
              }}
              themeVariant="light"
            />
          )}
        </View>

        {/* Recurrence */}
        <View style={styles.fieldSection}>
          <ThemedText
            style={[styles.fieldLabel, { color: colors.textTertiary }]}
          >
            REPEAT
          </ThemedText>
          <View style={styles.row}>
            {(["none", "daily", "weekly", "monthly"] as Recurrence[]).map(
              (r) => (
                <Chip
                  key={r}
                  label={r.charAt(0).toUpperCase() + r.slice(1)}
                  selected={recurrence === r}
                  onPress={() => setRecurrence(r)}
                />
              ),
            )}
          </View>
        </View>

        <Button
          title="Create task"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: Spacing["2xl"] }}
          size="lg"
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl },
  saveBtn: { fontFamily: "Geist_600SemiBold", fontSize: 15 },
  fieldSection: { marginBottom: Spacing.xl },
  fieldLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  row: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  priorityOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  priorityLabel: { fontFamily: "Geist_500Medium", fontSize: 13 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  dateButtonText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    flex: 1,
  },
});
