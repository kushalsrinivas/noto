import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { LlmDownloadModal } from "@/components/llm-download-modal";
import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { isLlmModelDownloaded, isLlmSupported } from "@/lib/llama";
import {
  type Note,
  useNotes,
  useTasks,
  useUsageStats,
  useUserName,
} from "@/store/app-store";
import { STORAGE_KEYS } from "@/store/storage-keys";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_GAP = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.xl * 2 - CARD_GAP) / 2;

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

function AiStatusBadge({ status }: { status?: string }) {
  const colors = useColors();
  if (!status) return null;

  if (status === "processing") {
    return (
      <View
        style={[badgeStyles.badge, { backgroundColor: colors.warning + "18" }]}
      >
        <ActivityIndicator size={10} color={colors.warning} />
        <ThemedText style={[badgeStyles.text, { color: colors.warning }]}>
          AI processing
        </ThemedText>
      </View>
    );
  }

  if (status === "done") {
    return (
      <View
        style={[badgeStyles.badge, { backgroundColor: colors.successMuted }]}
      >
        <MaterialIcons name="check-circle" size={10} color={colors.success} />
        <ThemedText style={[badgeStyles.text, { color: colors.success }]}>
          AI ready
        </ThemedText>
      </View>
    );
  }

  if (status === "failed") {
    return (
      <View style={[badgeStyles.badge, { backgroundColor: colors.errorMuted }]}>
        <MaterialIcons name="error-outline" size={10} color={colors.error} />
        <ThemedText style={[badgeStyles.text, { color: colors.error }]}>
          AI failed
        </ThemedText>
      </View>
    );
  }

  return null;
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Geist_500Medium",
    fontSize: 10,
  },
});

function NoteCard({
  note,
  colors,
}: {
  note: Note;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      onPress={() => router.push(`/note/${note.id}`)}
      onPressIn={() => scale.set(withTiming(0.96, { duration: 100 }))}
      onPressOut={() => scale.set(withTiming(1, { duration: 200 }))}
      style={[
        styles.noteCard,
        {
          borderColor: colors.ruleLight,
          backgroundColor: colors.paper2,
          width: CARD_WIDTH,
        },
        animStyle,
      ]}
    >
      <View style={styles.noteCardTop}>
        <ThemedText style={styles.noteCardTitle} numberOfLines={1}>
          {note.title || "Untitled"}
        </ThemedText>
        {note.source === "voice" ? (
          <MaterialIcons name="mic" size={12} color={colors.accent} />
        ) : null}
      </View>
      <ThemedText
        style={[styles.noteCardPreview, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {note.transcriptionStatus === "transcribing"
          ? "Transcribing..."
          : note.content || "No content"}
      </ThemedText>
      <View style={styles.noteCardBottom}>
        <ThemedText
          style={[styles.noteCardTime, { color: colors.textTertiary }]}
        >
          {formatRelativeTime(note.updatedAt)}
        </ThemedText>
        <AiStatusBadge status={note.aiStatus} />
      </View>
    </AnimatedPressable>
  );
}

const LLM_PROMPT_KEY = STORAGE_KEYS.LLM_DOWNLOAD_PROMPTED;

export default function HomeScreen() {
  const colors = useColors();
  const { name } = useUserName();
  const { notes, reload: reloadNotes } = useNotes();
  const { tasks, reload: reloadTasks } = useTasks();
  const { stats, reload: reloadStats } = useUsageStats();
  const [showLlmModal, setShowLlmModal] = useState(false);

  useEffect(() => {
    if (!isLlmSupported()) return;
    if (isLlmModelDownloaded()) return;

    AsyncStorage.getItem(LLM_PROMPT_KEY).then((prompted) => {
      if (!prompted) {
        setShowLlmModal(true);
      }
    });
  }, []);

  const handleLlmDismiss = useCallback(async () => {
    await AsyncStorage.setItem(LLM_PROMPT_KEY, "true");
    setShowLlmModal(false);
  }, []);

  const handleLlmComplete = useCallback(async () => {
    await AsyncStorage.setItem(LLM_PROMPT_KEY, "true");
    setShowLlmModal(false);
  }, []);

  const hasProcessing = notes.some(
    (n) =>
      n.transcriptionStatus === "transcribing" || n.aiStatus === "processing",
  );

  useFocusEffect(
    useCallback(() => {
      reloadNotes();
      reloadTasks();
      reloadStats();

      if (!hasProcessing) return;
      const interval = setInterval(() => reloadNotes(), 3000);
      return () => clearInterval(interval);
    }, [reloadNotes, reloadTasks, reloadStats, hasProcessing]),
  );

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedCount = tasks.filter((t) => t.completed).length;
  const todayStr = new Date().toDateString();
  const todayTasks = pendingTasks.filter((t) => {
    if (t.dueDate && new Date(t.dueDate).toDateString() === todayStr)
      return true;
    if (t.reminderAt && new Date(t.reminderAt).toDateString() === todayStr)
      return true;
    return false;
  });
  const upcomingReminders = pendingTasks
    .filter((t) => {
      if (!t.reminderAt) return false;
      const d = new Date(t.reminderAt);
      return d.toDateString() !== todayStr && d.getTime() > Date.now();
    })
    .sort(
      (a, b) =>
        new Date(a.reminderAt!).getTime() - new Date(b.reminderAt!).getTime(),
    )
    .slice(0, 3);
  const recentNotes = notes.slice(0, 4);

  const weekDays = (() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  })();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText
              style={[styles.greeting, { color: colors.textTertiary }]}
            >
              {getGreeting()}
            </ThemedText>
            <ThemedText style={styles.headerName}>
              {name || "Welcome back"}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/search")}
              hitSlop={12}
              style={[styles.headerIconBtn, { backgroundColor: colors.paper2 }]}
            >
              <MaterialIcons
                name="search"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              hitSlop={12}
              style={[styles.headerIconBtn, { backgroundColor: colors.paper2 }]}
            >
              <MaterialIcons
                name="settings"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Quick Actions */}
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

        {/* Stats */}
        <View
          style={[
            styles.statsRow,
            { backgroundColor: colors.paper2, borderColor: colors.rule },
          ]}
        >
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
            <ThemedText style={styles.statNum}>{completedCount}</ThemedText>
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

        {/* Week strip */}
        <View style={styles.weekStripRow}>
          {weekDays.map((d) => {
            const isToday = d.toDateString() === todayStr;
            const hasTasks = pendingTasks.some((t) => {
              const date = t.dueDate || t.reminderAt;
              return date && new Date(date).toDateString() === d.toDateString();
            });
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => router.push("/(tabs)/calendar")}
                style={[
                  styles.weekStripDay,
                  isToday && { backgroundColor: colors.ink },
                ]}
              >
                <ThemedText
                  style={[
                    styles.weekStripLabel,
                    {
                      color: isToday ? colors.background : colors.textTertiary,
                    },
                  ]}
                >
                  {d.toLocaleDateString([], { weekday: "narrow" })}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.weekStripNum,
                    {
                      color: isToday ? colors.background : colors.ink,
                    },
                  ]}
                >
                  {d.getDate()}
                </ThemedText>
                {hasTasks && (
                  <View
                    style={[
                      styles.weekStripDot,
                      {
                        backgroundColor: isToday
                          ? colors.background
                          : colors.accent,
                      },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Upcoming reminders */}
        {upcomingReminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText
                style={[styles.sectionLabel, { color: colors.textTertiary }]}
              >
                UPCOMING REMINDERS
              </ThemedText>
            </View>
            {upcomingReminders.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => router.push(`/task/${task.id}`)}
                style={[
                  styles.taskItem,
                  { borderBottomColor: colors.ruleLight },
                ]}
              >
                <MaterialIcons
                  name="notifications-none"
                  size={14}
                  color={colors.accent}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.taskText} numberOfLines={1}>
                    {task.title}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.reminderMeta,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {new Date(task.reminderAt!).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        )}

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

        {/* Chat entry point */}
        {notes.length > 0 && (
          <Pressable
            onPress={() => router.push("/chat")}
            style={[
              styles.chatCard,
              { borderColor: colors.rule, backgroundColor: colors.paper2 },
            ]}
          >
            <View
              style={[
                styles.chatIconWrap,
                { backgroundColor: colors.accentMuted },
              ]}
            >
              <MaterialIcons name="chat" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.chatTitle}>
                Chat with your notes
              </ThemedText>
              <ThemedText
                style={[styles.chatDesc, { color: colors.textSecondary }]}
              >
                Ask questions about anything you've captured
              </ThemedText>
            </View>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={colors.textTertiary}
            />
          </Pressable>
        )}

        {/* Nudges */}
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

        {/* Recent notes — card layout */}
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
            <View style={styles.noteCardsGrid}>
              {recentNotes.map((note) => (
                <NoteCard key={note.id} note={note} colors={colors} />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: Spacing["3xl"] }} />
      </ScrollView>

      <LlmDownloadModal
        visible={showLlmModal}
        onDismiss={handleLlmDismiss}
        onComplete={handleLlmComplete}
      />
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
    paddingBottom: Spacing["2xl"],
  },
  greeting: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  headerName: {
    fontFamily: "Geist_700Bold",
    fontSize: 24,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.pill,
    borderCurve: "continuous",
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
    borderCurve: "continuous",
    borderWidth: 1,
  },
  secondaryActionLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderCurve: "continuous",
    paddingVertical: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 22,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 24 },
  section: {
    marginBottom: Spacing["2xl"],
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
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
    gap: Spacing.md,
  },
  chatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chatTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    marginBottom: 2,
  },
  chatDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  nudgeBlock: {
    marginBottom: Spacing["2xl"],
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
    borderCurve: "continuous",
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
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
  emptyBlock: {
    paddingVertical: Spacing["2xl"],
  },
  emptyText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
  },
  weekStripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
  },
  weekStripDay: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderCurve: "continuous",
    gap: 2,
    minWidth: 36,
  },
  weekStripLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  weekStripNum: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  weekStripDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  reminderMeta: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  noteCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  noteCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    gap: Spacing.sm,
  },
  noteCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteCardTitle: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
    flex: 1,
    marginRight: Spacing.sm,
  },
  noteCardPreview: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  noteCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  noteCardTime: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
