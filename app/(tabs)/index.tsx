import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import {
  useNotes,
  useTasks,
  useUsageStats,
  useUserName,
} from "@/store/app-store";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function HomeScreen() {
  const colors = useColors();
  const { name } = useUserName();
  const { notes } = useNotes();
  const { tasks } = useTasks();
  const { stats } = useUsageStats();

  const pendingTasks = tasks.filter((t) => !t.completed);
  const todayTasks = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toDateString() === new Date().toDateString();
  });
  const recentNotes = notes.slice(0, 4);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header — left-biased, not centred */}
        <View style={styles.header}>
          <ThemedText style={[styles.greeting, { color: colors.textTertiary }]}>
            {getGreeting()}
            {name ? `, ${name}` : ""}
          </ThemedText>
          <Pressable onPress={() => router.push("/search")} hitSlop={12}>
            <MaterialIcons
              name="search"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Quick Actions — horizontal, restrained */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => router.push("/voice/record")}
            style={[styles.primaryAction, { backgroundColor: colors.accent }]}
          >
            <MaterialIcons name="mic" size={20} color="#FFFFFF" />
            <ThemedText style={styles.primaryActionLabel}>Record</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push("/note/editor")}
            style={[styles.secondaryAction, { borderColor: colors.border }]}
          >
            <ThemedText
              style={[styles.secondaryActionLabel, { color: colors.ink }]}
            >
              New note
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push("/task/editor")}
            style={[styles.secondaryAction, { borderColor: colors.border }]}
          >
            <ThemedText
              style={[styles.secondaryActionLabel, { color: colors.ink }]}
            >
              Add task
            </ThemedText>
          </Pressable>
        </View>

        {/* Today's tasks */}
        {todayTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText
                style={[styles.sectionLabel, { color: colors.textTertiary }]}
              >
                TODAY
              </ThemedText>
              <ThemedText
                style={[styles.sectionCount, { color: colors.textTertiary }]}
              >
                {todayTasks.length}
              </ThemedText>
            </View>
            {todayTasks.slice(0, 4).map((task) => (
              <Pressable
                key={task.id}
                onPress={() => router.push(`/task/${task.id}`)}
                style={[
                  styles.taskItem,
                  { borderBottomColor: colors.ruleLight },
                ]}
              >
                <View
                  style={[
                    styles.taskDot,
                    {
                      backgroundColor:
                        task.priority === "high"
                          ? colors.error
                          : task.priority === "medium"
                            ? colors.warning
                            : colors.muted,
                    },
                  ]}
                />
                <ThemedText style={styles.taskText} numberOfLines={1}>
                  {task.title}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {/* Stats — restrained, no coloured fills */}
        <View style={[styles.statsRow, { borderColor: colors.rule }]}>
          <View style={styles.stat}>
            <ThemedText style={styles.statNum}>
              {pendingTasks.length}
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: colors.textTertiary }]}
            >
              open
            </ThemedText>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.rule }]}
          />
          <View style={styles.stat}>
            <ThemedText style={styles.statNum}>
              {tasks.filter((t) => t.completed).length}
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: colors.textTertiary }]}
            >
              done
            </ThemedText>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.rule }]}
          />
          <View style={styles.stat}>
            <ThemedText style={styles.statNum}>{notes.length}</ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: colors.textTertiary }]}
            >
              notes
            </ThemedText>
          </View>
        </View>

        {/* Investment signal — show after first recording */}
        {stats.totalRecordings > 0 && stats.totalRecordings < 3 && (
          <View style={styles.nudgeBlock}>
            <ThemedText
              style={[styles.nudgeText, { color: colors.textSecondary }]}
            >
              You've captured {stats.totalRecordings}{" "}
              {stats.totalRecordings === 1 ? "thought" : "thoughts"} — keep
              going
            </ThemedText>
          </View>
        )}

        {/* Upgrade nudge — appears after 3+ recordings */}
        {stats.totalRecordings >= 3 && (
          <Pressable
            onPress={() => router.push("/upgrade")}
            style={[
              styles.upgradeCard,
              { borderColor: colors.rule, backgroundColor: colors.paper2 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.upgradeTitle}>
                You've created {stats.totalRecordings} recordings
              </ThemedText>
              <ThemedText
                style={[styles.upgradeDesc, { color: colors.textSecondary }]}
              >
                Unlock unlimited recordings, PDF export, and more.
              </ThemedText>
            </View>
            <MaterialIcons
              name="arrow-forward"
              size={18}
              color={colors.textTertiary}
            />
          </Pressable>
        )}

        {/* Recent notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText
              style={[styles.sectionLabel, { color: colors.textTertiary }]}
            >
              RECENT
            </ThemedText>
            {recentNotes.length > 0 && (
              <Pressable onPress={() => router.push("/(tabs)/notes")}>
                <ThemedText
                  style={[styles.seeAll, { color: colors.textSecondary }]}
                >
                  All notes
                </ThemedText>
              </Pressable>
            )}
          </View>
          {recentNotes.length === 0 ? (
            <View style={styles.emptyBlock}>
              <ThemedText
                style={[styles.emptyText, { color: colors.textTertiary }]}
              >
                No notes yet — record your first voice note.
              </ThemedText>
            </View>
          ) : (
            recentNotes.map((note) => (
              <Pressable
                key={note.id}
                onPress={() => router.push(`/note/${note.id}`)}
                style={[
                  styles.noteItem,
                  { borderBottomColor: colors.ruleLight },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.noteTitle} numberOfLines={1}>
                    {note.title || "Untitled"}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.notePreview,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {note.content}
                  </ThemedText>
                </View>
                <View style={styles.noteMeta}>
                  {note.source === "voice" && (
                    <MaterialIcons name="mic" size={12} color={colors.accent} />
                  )}
                  <ThemedText
                    style={[styles.noteTime, { color: colors.textTertiary }]}
                  >
                    {formatRelativeTime(note.updatedAt)}
                  </ThemedText>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: Spacing["3xl"] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing["3xl"],
  },
  greeting: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    letterSpacing: 0.1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["3xl"],
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.pill,
  },
  primaryActionLabel: {
    color: "#FFFFFF",
    fontFamily: "Geist_600SemiBold",
    fontSize: 14,
  },
  secondaryAction: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  secondaryActionLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
  },
  sectionCount: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
  },
  seeAll: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskText: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing["3xl"],
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 24,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28 },
  emptyBlock: {
    paddingVertical: Spacing["2xl"],
  },
  emptyText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
  },
  noteTitle: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
    marginBottom: 2,
  },
  notePreview: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
  noteMeta: {
    alignItems: "flex-end",
    gap: 3,
  },
  noteTime: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  nudgeBlock: {
    marginBottom: Spacing["3xl"],
  },
  nudgeText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing["3xl"],
    gap: Spacing.md,
  },
  upgradeTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    marginBottom: 3,
  },
  upgradeDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
});
