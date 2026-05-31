import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

import type { Task } from "@/store/app-store";
import { loadTasksRaw, saveTasksRaw } from "@/store/app-store";

const CATEGORY_REMINDER = "TASK_REMINDER";
const CHANNEL_ID = "reminders";

export async function setupReminderNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY_REMINDER, [
    {
      identifier: "MARK_DONE",
      buttonTitle: "Done",
      options: { opensAppToForeground: false },
    },
    {
      identifier: "SNOOZE_15",
      buttonTitle: "Snooze 15m",
      options: { opensAppToForeground: false },
    },
    {
      identifier: "SNOOZE_1H",
      buttonTitle: "Snooze 1h",
      options: { opensAppToForeground: false },
    },
  ]);

  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data as {
      taskId?: string;
      type?: string;
    };
    if (data?.type !== "task_reminder" || !data.taskId) return;

    const actionId = response.actionIdentifier;

    if (actionId === "MARK_DONE") {
      await markTaskDone(data.taskId);
    } else if (actionId === "SNOOZE_15") {
      await snoozeTask(data.taskId, 15 * 60 * 1000);
    } else if (actionId === "SNOOZE_1H") {
      await snoozeTask(data.taskId, 60 * 60 * 1000);
    } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      router.push(`/task/${data.taskId}`);
    }
  });
}

export async function scheduleTaskReminder(
  task: Task,
): Promise<string | undefined> {
  if (!task.reminderAt) return undefined;

  const triggerDate = new Date(task.reminderAt);
  if (triggerDate.getTime() <= Date.now()) return undefined;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Reminder",
      body: task.title,
      categoryIdentifier: CATEGORY_REMINDER,
      sound: "default",
      data: { taskId: task.id, type: "task_reminder" },
      ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return id;
}

export async function cancelTaskReminder(
  notificationId: string | undefined,
): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already cancelled or expired
  }
}

export async function rescheduleTaskReminder(
  task: Task,
): Promise<string | undefined> {
  await cancelTaskReminder(task.notificationId);
  return scheduleTaskReminder(task);
}

export async function snoozeTask(
  taskId: string,
  durationMs: number,
): Promise<void> {
  const tasks = await loadTasksRaw();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return;

  const task = tasks[idx];
  await cancelTaskReminder(task.notificationId);

  const snoozedUntil = new Date(Date.now() + durationMs).toISOString();
  const updatedTask: Task = {
    ...task,
    snoozedUntil,
    reminderAt: snoozedUntil,
  };

  const newNotifId = await scheduleTaskReminder(updatedTask);
  tasks[idx] = { ...updatedTask, notificationId: newNotifId };
  await saveTasksRaw(tasks);
}

async function markTaskDone(taskId: string): Promise<void> {
  const tasks = await loadTasksRaw();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return;

  await cancelTaskReminder(tasks[idx].notificationId);
  tasks[idx] = {
    ...tasks[idx],
    completed: true,
    completedAt: new Date().toISOString(),
  };
  await saveTasksRaw(tasks);
}

export async function reconcileReminders(tasks: Task[]): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set(scheduled.map((n) => n.identifier));

  for (const task of tasks) {
    if (task.completed || !task.reminderAt) {
      if (task.notificationId && scheduledIds.has(task.notificationId)) {
        await cancelTaskReminder(task.notificationId);
      }
      continue;
    }

    const triggerDate = new Date(task.reminderAt);
    if (triggerDate.getTime() <= Date.now()) continue;

    if (task.notificationId && scheduledIds.has(task.notificationId)) continue;

    const newId = await scheduleTaskReminder(task);
    if (newId && newId !== task.notificationId) {
      const allTasks = await loadTasksRaw();
      const i = allTasks.findIndex((t) => t.id === task.id);
      if (i !== -1) {
        allTasks[i] = { ...allTasks[i], notificationId: newId };
        await saveTasksRaw(allTasks);
      }
    }
  }
}
