import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { useTasks, type Task } from "@/store/app-store";

type CalendarView = "agenda" | "month" | "week";

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatRelativeDay(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (isSameDay(d, now)) return "Today";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(d, tomorrow)) return "Tomorrow";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getWeekDays(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const dayOfWeek = d.getDay();
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });
}

export default function CalendarScreen() {
  const colors = useColors();
  const { tasks, toggleTask, reload } = useTasks();
  const [view, setView] = useState<CalendarView>("agenda");
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [weekRef, setWeekRef] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (t.completed) continue;
      const key = t.dueDate
        ? toDateKey(new Date(t.dueDate))
        : t.reminderAt
          ? toDateKey(new Date(t.reminderAt))
          : undefined;
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    }
    return map;
  }, [tasks]);

  const unscheduledTasks = useMemo(
    () => tasks.filter((t) => !t.completed && !t.dueDate && !t.reminderAt),
    [tasks],
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor: string }> = {};
    for (const key of Object.keys(tasksByDate)) {
      marks[key] = { marked: true, dotColor: colors.accent };
    }
    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        marked: marks[selectedDate]?.marked ?? false,
        dotColor: marks[selectedDate]?.dotColor ?? colors.accent,
      } as typeof marks[string] & {
        selected: boolean;
        selectedColor: string;
      };
      (marks[selectedDate] as Record<string, unknown>).selected = true;
      (marks[selectedDate] as Record<string, unknown>).selectedColor =
        colors.ink;
    }
    return marks;
  }, [tasksByDate, selectedDate, colors]);

  const selectedDayTasks = tasksByDate[selectedDate] ?? [];

  const agendaDates = useMemo(() => {
    const dates = Object.keys(tasksByDate).sort();
    const todayKey = toDateKey(new Date());
    if (!dates.includes(todayKey)) dates.push(todayKey);
    dates.sort();
    return dates;
  }, [tasksByDate]);

  const weekDays = useMemo(() => getWeekDays(weekRef), [weekRef]);

  function renderTaskRow(item: Task) {
    const time =
      item.reminderAt || item.dueDate
        ? formatTime(item.reminderAt || item.dueDate!)
        : null;

    return (
      <Pressable
        key={item.id}
        onPress={() => router.push(`/task/${item.id}`)}
        style={[styles.taskItem, { borderBottomColor: colors.ruleLight }]}
      >
        <Pressable
          onPress={() => toggleTask(item.id)}
          style={[styles.checkbox, { borderColor: colors.rule }]}
          hitSlop={8}
        >
          {item.completed && (
            <MaterialIcons name="check" size={12} color="#FFFFFF" />
          )}
        </Pressable>
        <View style={styles.taskContent}>
          <ThemedText style={styles.taskTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <View style={styles.taskMeta}>
            {time && (
              <View style={styles.timeBadge}>
                <MaterialIcons
                  name="schedule"
                  size={10}
                  color={colors.textTertiary}
                />
                <ThemedText
                  style={[styles.timeText, { color: colors.textTertiary }]}
                >
                  {time}
                </ThemedText>
              </View>
            )}
            {item.priority === "high" && (
              <View
                style={[styles.priorityDot, { backgroundColor: colors.error }]}
              />
            )}
            {item.linkedNoteId && (
              <MaterialIcons
                name="link"
                size={12}
                color={colors.textTertiary}
              />
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.headerRow}>
        <ThemedText style={styles.screenTitle}>Calendar</ThemedText>
        <Pressable onPress={() => router.push("/task/editor")} hitSlop={12}>
          <MaterialIcons name="add" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.viewRow}>
        {(["agenda", "month", "week"] as CalendarView[]).map((v) => (
          <Chip
            key={v}
            label={v.charAt(0).toUpperCase() + v.slice(1)}
            selected={view === v}
            onPress={() => setView(v)}
          />
        ))}
      </View>

      {view === "month" && (
        <>
          <Calendar
            current={selectedDate}
            onDayPress={(day: { dateString: string }) =>
              setSelectedDate(day.dateString)
            }
            markedDates={markedDates}
            theme={{
              calendarBackground: colors.background,
              textSectionTitleColor: colors.textTertiary,
              selectedDayBackgroundColor: colors.ink,
              selectedDayTextColor: colors.background,
              todayTextColor: colors.accent,
              dayTextColor: colors.ink,
              textDisabledColor: colors.muted,
              dotColor: colors.accent,
              selectedDotColor: colors.background,
              arrowColor: colors.ink,
              monthTextColor: colors.ink,
              textDayFontFamily: "Geist_400Regular",
              textMonthFontFamily: "Geist_600SemiBold",
              textDayHeaderFontFamily: "Geist_500Medium",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
          <View style={styles.dayHeader}>
            <ThemedText
              style={[styles.dayLabel, { color: colors.textTertiary }]}
            >
              {formatRelativeDay(selectedDate).toUpperCase()}
            </ThemedText>
            <ThemedText
              style={[styles.dayCount, { color: colors.textTertiary }]}
            >
              {selectedDayTasks.length}
            </ThemedText>
          </View>
          <FlatList
            data={selectedDayTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderTaskRow(item)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedText
                style={[styles.emptyDay, { color: colors.textTertiary }]}
              >
                No tasks for this day
              </ThemedText>
            }
          />
        </>
      )}

      {view === "week" && (
        <>
          <View style={styles.weekNav}>
            <Pressable
              onPress={() => {
                const prev = new Date(weekRef);
                prev.setDate(prev.getDate() - 7);
                setWeekRef(prev);
              }}
              hitSlop={12}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={colors.ink}
              />
            </Pressable>
            <ThemedText style={styles.weekLabel}>
              {weekDays[0].toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}{" "}
              –{" "}
              {weekDays[6].toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}
            </ThemedText>
            <Pressable
              onPress={() => {
                const next = new Date(weekRef);
                next.setDate(next.getDate() + 7);
                setWeekRef(next);
              }}
              hitSlop={12}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={colors.ink}
              />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStrip}
          >
            {weekDays.map((day) => {
              const key = toDateKey(day);
              const isSelected = key === selectedDate;
              const isToday = isSameDay(day, new Date());
              const count = tasksByDate[key]?.length ?? 0;
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedDate(key)}
                  style={[
                    styles.weekDay,
                    isSelected && { backgroundColor: colors.ink },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.weekDayName,
                      {
                        color: isSelected
                          ? colors.background
                          : colors.textTertiary,
                      },
                    ]}
                  >
                    {day
                      .toLocaleDateString([], { weekday: "short" })
                      .slice(0, 2)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.weekDayNum,
                      {
                        color: isSelected
                          ? colors.background
                          : isToday
                            ? colors.accent
                            : colors.ink,
                      },
                    ]}
                  >
                    {day.getDate()}
                  </ThemedText>
                  {count > 0 && (
                    <View
                      style={[
                        styles.weekDot,
                        {
                          backgroundColor: isSelected
                            ? colors.background
                            : colors.accent,
                        },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.dayHeader}>
            <ThemedText
              style={[styles.dayLabel, { color: colors.textTertiary }]}
            >
              {formatRelativeDay(selectedDate).toUpperCase()}
            </ThemedText>
          </View>
          <FlatList
            data={selectedDayTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderTaskRow(item)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedText
                style={[styles.emptyDay, { color: colors.textTertiary }]}
              >
                No tasks for this day
              </ThemedText>
            }
          />
        </>
      )}

      {view === "agenda" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {agendaDates.length === 0 && unscheduledTasks.length === 0 ? (
            <EmptyState
              icon="event"
              title="No tasks yet"
              message="Create a task or record a voice note with reminders."
              actionLabel="Add task"
              onAction={() => router.push("/task/editor")}
            />
          ) : (
            <>
              {agendaDates.map((dateKey) => {
                const dayTasks = tasksByDate[dateKey] ?? [];
                return (
                  <View key={dateKey} style={styles.agendaGroup}>
                    <View style={styles.agendaDateRow}>
                      <ThemedText
                        style={[
                          styles.agendaDate,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {formatRelativeDay(dateKey).toUpperCase()}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.agendaCount,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {dayTasks.length}
                      </ThemedText>
                    </View>
                    {dayTasks.length === 0 ? (
                      <ThemedText
                        style={[
                          styles.agendaEmpty,
                          { color: colors.textTertiary },
                        ]}
                      >
                        No tasks
                      </ThemedText>
                    ) : (
                      dayTasks.map((t) => renderTaskRow(t))
                    )}
                  </View>
                );
              })}

              {unscheduledTasks.length > 0 && (
                <View style={styles.agendaGroup}>
                  <View style={styles.agendaDateRow}>
                    <ThemedText
                      style={[
                        styles.agendaDate,
                        { color: colors.textTertiary },
                      ]}
                    >
                      UNSCHEDULED
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.agendaCount,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {unscheduledTasks.length}
                    </ThemedText>
                  </View>
                  {unscheduledTasks.map((t) => renderTaskRow(t))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
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
  viewRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
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
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  timeText: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  dayLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
  },
  dayCount: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
  },
  emptyDay: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    paddingVertical: Spacing["2xl"],
    textAlign: "center",
  },
  weekNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  weekLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
  },
  weekStrip: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  weekDay: {
    width: 42,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 2,
  },
  weekDayName: {
    fontFamily: "Geist_500Medium",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  weekDayNum: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
  },
  weekDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  agendaGroup: {
    marginBottom: Spacing.xl,
  },
  agendaDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.xs,
  },
  agendaDate: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
  },
  agendaCount: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
  },
  agendaEmpty: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    paddingVertical: Spacing.md,
  },
});
