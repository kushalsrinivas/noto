import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIFICATION_ID = "recording-controls";
const CATEGORY_RECORDING = "RECORDING_ACTIVE";
const CATEGORY_PAUSED = "RECORDING_PAUSED";

type RecordingAction = "pause" | "resume" | "stop";

let actionCallback: ((action: RecordingAction) => void) | null = null;
let responseSub: Notifications.Subscription | null = null;

export function registerActionHandler(
  handler: (action: RecordingAction) => void,
) {
  actionCallback = handler;
}

export function unregisterActionHandler() {
  actionCallback = null;
}

export async function setupRecordingNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("recording", {
      name: "Recording Controls",
      importance: Notifications.AndroidImportance.HIGH,
      sound: undefined,
      vibrationPattern: undefined,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY_RECORDING, [
    {
      identifier: "PAUSE",
      buttonTitle: "Pause",
      options: { opensAppToForeground: false },
    },
    {
      identifier: "STOP",
      buttonTitle: "Stop & Save",
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(CATEGORY_PAUSED, [
    {
      identifier: "RESUME",
      buttonTitle: "Resume",
      options: { opensAppToForeground: false },
    },
    {
      identifier: "STOP",
      buttonTitle: "Stop & Save",
      options: { opensAppToForeground: true },
    },
  ]);

  if (responseSub) responseSub.remove();
  responseSub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const actionId = response.actionIdentifier;

      if (actionId === "PAUSE") {
        actionCallback?.("pause");
      } else if (actionId === "RESUME") {
        actionCallback?.("resume");
      } else if (actionId === "STOP") {
        actionCallback?.("stop");
      } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // App comes to foreground automatically; the recording screen is already active.
        // Don't push a new route — that would open a duplicate recording session.
      }
    },
  );
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function showRecordingNotification(
  recordingState: "recording" | "paused",
) {
  const isRecording = recordingState === "recording";

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: isRecording ? "Recording in progress" : "Recording paused",
      body: isRecording
        ? "Your voice note is being captured."
        : "Tap Resume to continue or Stop to save.",
      categoryIdentifier: isRecording ? CATEGORY_RECORDING : CATEGORY_PAUSED,
      sound: false,
      ...(Platform.OS === "android" && {
        sticky: true,
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        channelId: "recording",
      }),
    },
    trigger: null,
  });
}

export async function dismissRecordingNotification() {
  try {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  } catch {
    // Best-effort dismissal
  }
}
