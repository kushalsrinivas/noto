import { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-theme-color";
import { useNotes, useTasks } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";

const SAMPLE_TRANSCRIPT = `I need to pick up groceries tomorrow, maybe around 3 PM. Also, don't forget to email the design team about the new mockups. Oh, and I had this idea for the app — we should add a dark mode toggle in the settings page.`;

const EXTRACTED_TASKS = [
  { text: "Pick up groceries", due: "Tomorrow 3:00 PM", checked: true },
  { text: "Email design team about new mockups", due: "", checked: true },
  { text: "Add dark mode toggle to settings", due: "", checked: false },
];

export default function ReviewScreen() {
  const colors = useColors();
  const { addNote } = useNotes();
  const { addTask } = useTasks();

  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [extractedTasks, setExtractedTasks] = useState(EXTRACTED_TASKS);
  const [saveAsNote, setSaveAsNote] = useState(true);
  const [addTasksToList, setAddTasksToList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"processing" | "review">("processing");

  useState(() => {
    const timeout = setTimeout(() => setStep("review"), 1800);
    return () => clearTimeout(timeout);
  });

  function toggleExtractedTask(index: number) {
    setExtractedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, checked: !t.checked } : t)),
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (saveAsNote) {
        await addNote({
          title: transcript.split(".")[0]?.trim().slice(0, 50) || "Voice Note",
          content: transcript,
          source: "voice",
          tags: ["voice"],
        });
      }
      if (addTasksToList) {
        for (const task of extractedTasks.filter((t) => t.checked)) {
          await addTask({
            title: task.text,
            description: "",
            priority: "medium",
            dueDate: task.due
              ? new Date(Date.now() + 86400000).toISOString()
              : undefined,
          });
        }
      }
      router.dismiss();
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (step === "processing") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.processingCenter}>
          <ThemedText style={styles.processingTitle}>Processing</ThemedText>
          <View style={styles.steps}>
            {[
              { label: "Transcribing audio", done: true },
              { label: "Extracting tasks", done: false },
            ].map((s) => (
              <View key={s.label} style={styles.stepRow}>
                <MaterialIcons
                  name={s.done ? "check" : "more-horiz"}
                  size={16}
                  color={s.done ? colors.success : colors.muted}
                />
                <ThemedText
                  style={[
                    styles.stepLabel,
                    { color: s.done ? colors.ink : colors.muted },
                  ]}
                >
                  {s.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Transcript */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionLabel, { color: colors.textTertiary }]}
          >
            TRANSCRIPT
          </ThemedText>
          <TextInput
            value={transcript}
            onChangeText={setTranscript}
            multiline
            style={[
              styles.transcriptInput,
              { color: colors.ink, backgroundColor: colors.paper2 },
            ]}
          />
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionLabel, { color: colors.textTertiary }]}
          >
            EXTRACTED TASKS
          </ThemedText>
          {extractedTasks.map((task, i) => (
            <Pressable
              key={i}
              style={[styles.taskRow, { borderBottomColor: colors.ruleLight }]}
              onPress={() => toggleExtractedTask(i)}
            >
              <View
                style={[
                  styles.taskCheck,
                  {
                    borderColor: task.checked ? colors.ink : colors.rule,
                    backgroundColor: task.checked ? colors.ink : "transparent",
                  },
                ]}
              >
                {task.checked && (
                  <MaterialIcons
                    name="check"
                    size={11}
                    color={colors.background}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.taskText}>{task.text}</ThemedText>
                {task.due ? (
                  <ThemedText
                    style={[styles.taskDue, { color: colors.textTertiary }]}
                  >
                    {task.due}
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Options */}
        <View style={styles.section}>
          <View
            style={[styles.optionRow, { borderBottomColor: colors.ruleLight }]}
          >
            <ThemedText style={styles.optionLabel}>Save as note</ThemedText>
            <Switch
              value={saveAsNote}
              onValueChange={setSaveAsNote}
              trackColor={{ false: colors.rule, true: colors.accent + "40" }}
              thumbColor={saveAsNote ? colors.accent : colors.muted}
            />
          </View>
          <View style={styles.optionRow}>
            <ThemedText style={styles.optionLabel}>Add tasks</ThemedText>
            <Switch
              value={addTasksToList}
              onValueChange={setAddTasksToList}
              trackColor={{ false: colors.rule, true: colors.accent + "40" }}
              thumbColor={addTasksToList ? colors.accent : colors.muted}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.ruleLight }]}>
        <Pressable onPress={() => router.back()} style={styles.discardBtn}>
          <ThemedText
            style={[styles.discardText, { color: colors.textSecondary }]}
          >
            Discard
          </ThemedText>
        </Pressable>
        <Button
          title="Save"
          onPress={handleSave}
          loading={saving}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  processingCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  processingTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 20,
    marginBottom: Spacing.xl,
  },
  steps: { gap: Spacing.md },
  stepRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  stepLabel: { fontFamily: "Geist_400Regular", fontSize: 15 },
  section: { marginBottom: Spacing["2xl"] },
  sectionLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  transcriptInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    minHeight: 120,
    textAlignVertical: "top",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskCheck: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  taskText: { fontFamily: "Geist_400Regular", fontSize: 14 },
  taskDue: { fontFamily: "Geist_400Regular", fontSize: 12, marginTop: 2 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: { fontFamily: "Geist_400Regular", fontSize: 15 },
  bottomBar: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  discardBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  discardText: { fontFamily: "Geist_500Medium", fontSize: 15 },
});
