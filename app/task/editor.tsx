import { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useColors } from "@/hooks/use-theme-color";
import { useTasks } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";

type Priority = "low" | "medium" | "high";

export default function TaskEditorScreen() {
  const colors = useColors();
  const { addTask } = useTasks();
  const params = useLocalSearchParams<{ prefillTitle?: string }>();

  const [title, setTitle] = useState(params.prefillTitle ?? "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueToday, setDueToday] = useState(false);
  const [dueTomorrow, setDueTomorrow] = useState(false);
  const [saving, setSaving] = useState(false);

  function getDueDate(): string | undefined {
    if (dueToday) {
      const d = new Date();
      d.setHours(23, 59, 59);
      return d.toISOString();
    }
    if (dueTomorrow) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 59);
      return d.toISOString();
    }
    return undefined;
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Enter a task title.");
      return;
    }
    setSaving(true);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: getDueDate(),
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to create task.");
    } finally {
      setSaving(false);
    }
  }

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
        contentContainerStyle={styles.scroll}
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
          <View style={styles.priorityRow}>
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
            DUE
          </ThemedText>
          <View style={styles.dateRow}>
            <Chip
              label="Today"
              selected={dueToday}
              onPress={() => {
                setDueToday(!dueToday);
                setDueTomorrow(false);
              }}
            />
            <Chip
              label="Tomorrow"
              selected={dueTomorrow}
              onPress={() => {
                setDueTomorrow(!dueTomorrow);
                setDueToday(false);
              }}
            />
            <Chip
              label="None"
              selected={!dueToday && !dueTomorrow}
              onPress={() => {
                setDueToday(false);
                setDueTomorrow(false);
              }}
            />
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
  scroll: { padding: Spacing.xl, paddingBottom: Spacing["5xl"] },
  saveBtn: { fontFamily: "Geist_600SemiBold", fontSize: 15 },
  fieldSection: { marginBottom: Spacing.xl },
  fieldLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  priorityRow: { flexDirection: "row", gap: Spacing.sm },
  priorityOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  priorityLabel: { fontFamily: "Geist_500Medium", fontSize: 13 },
  dateRow: { flexDirection: "row", gap: Spacing.sm },
});
