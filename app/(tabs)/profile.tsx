import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { releaseContext } from "@/lib/llama";
import {
  clearAllUserData,
  useAiMode,
  useNotes,
  useOnboarding,
  useRecordings,
  useTasks,
  useUserName,
} from "@/store/app-store";

export default function ProfileScreen() {
  const colors = useColors();
  const { name } = useUserName();
  const { mode, setMode } = useAiMode();
  const { notes } = useNotes();
  const { tasks } = useTasks();
  const { recordings } = useRecordings();
  const { resetOnboarding } = useOnboarding();
  const [notifications, setNotifications] = useState(true);

  function handleManageRecordings() {
    Alert.alert(
      "Recordings",
      `You have ${recordings.length} recording${recordings.length !== 1 ? "s" : ""} stored on this device.`,
      [{ text: "OK" }],
    );
  }

  async function handleClearCache() {
    Alert.alert(
      "Clear cache",
      "This will release the AI model from memory. It will be reloaded when needed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            try {
              await releaseContext();
              Alert.alert("Done", "Cache cleared successfully.");
            } catch {
              Alert.alert("Error", "Failed to clear cache.");
            }
          },
        },
      ],
    );
  }

  async function handleRestartOnboarding() {
    await resetOnboarding();
    router.replace("/onboarding");
  }

  function handleDeleteAllData() {
    Alert.alert(
      "Delete all data",
      "This will permanently delete all your notes, tasks, recordings, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            try {
              await releaseContext();
            } catch {
              // ignore
            }
            await clearAllUserData();
            router.replace("/onboarding");
          },
        },
      ],
    );
  }

  const sections = [
    {
      title: "AI",
      items: [
        {
          icon: "auto-awesome" as const,
          label: "Processing mode",
          value: mode === "full" ? "Full AI" : "Lite",
          onPress: () => setMode(mode === "full" ? "lite" : "full"),
        },
      ],
    },
    {
      title: "PREFERENCES",
      items: [
        {
          icon: "translate" as const,
          label: "Language",
          value: "English",
          onPress: () =>
            Alert.alert("Language", "Only English is currently supported."),
        },
        {
          icon: "mic" as const,
          label: "Recording quality",
          value: "High",
          onPress: () =>
            Alert.alert(
              "Recording quality",
              "Audio is recorded at 16 kHz for optimal transcription accuracy.",
            ),
        },
      ],
    },
    {
      title: "NOTIFICATIONS",
      items: [
        {
          icon: "notifications-none" as const,
          label: "Task reminders",
          toggle: true,
          toggleValue: notifications,
          onToggle: setNotifications,
        },
      ],
    },
    {
      title: "DATA",
      items: [
        {
          icon: "folder-open" as const,
          label: "Manage recordings",
          onPress: handleManageRecordings,
        },
        {
          icon: "delete-outline" as const,
          label: "Clear cache",
          onPress: handleClearCache,
        },
        {
          icon: "replay" as const,
          label: "Restart onboarding",
          onPress: handleRestartOnboarding,
        },
      ],
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ThemedText style={styles.screenTitle}>Settings</ThemedText>

        {/* Identity */}
        <View style={[styles.identityRow, { borderBottomColor: colors.rule }]}>
          <View style={[styles.avatar, { backgroundColor: colors.paper2 }]}>
            <ThemedText style={[styles.avatarText, { color: colors.ink }]}>
              {name ? name.charAt(0).toUpperCase() : "N"}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={styles.identityName}>
              {name || "Noto"}
            </ThemedText>
            <ThemedText
              style={[styles.identitySub, { color: colors.textTertiary }]}
            >
              {notes.length} notes · {tasks.filter((t) => t.completed).length}{" "}
              tasks done
            </ThemedText>
          </View>
        </View>

        {/* Settings sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.textTertiary }]}
            >
              {section.title}
            </ThemedText>
            {section.items.map((item, idx) => (
              <Pressable
                key={item.label}
                onPress={"onPress" in item ? item.onPress : undefined}
                disabled={!("onPress" in item) && !("toggle" in item)}
                style={[
                  styles.settingItem,
                  idx < section.items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.ruleLight,
                  },
                ]}
              >
                <View style={styles.settingLeft}>
                  <MaterialIcons
                    name={item.icon}
                    size={18}
                    color={colors.textSecondary}
                  />
                  <ThemedText style={styles.settingLabel}>
                    {item.label}
                  </ThemedText>
                </View>
                {"toggle" in item && item.toggle ? (
                  <Switch
                    value={item.toggleValue}
                    onValueChange={item.onToggle}
                    trackColor={{
                      false: colors.rule,
                      true: colors.accent + "40",
                    }}
                    thumbColor={item.toggleValue ? colors.accent : colors.muted}
                  />
                ) : (
                  <View style={styles.settingRight}>
                    {"value" in item && item.value && (
                      <ThemedText
                        style={[
                          styles.settingValue,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {item.value}
                      </ThemedText>
                    )}
                    <MaterialIcons
                      name="chevron-right"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        ))}

        {/* Delete all data */}
        <Pressable
          onPress={handleDeleteAllData}
          style={[styles.dangerButton, { borderColor: colors.error + "40" }]}
        >
          <MaterialIcons name="warning" size={18} color={colors.error} />
          <ThemedText style={[styles.dangerLabel, { color: colors.error }]}>
            Delete all user data
          </ThemedText>
        </Pressable>

        <ThemedText style={[styles.version, { color: colors.textTertiary }]}>
          noto v1.0.0
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing["4xl"] },
  screenTitle: {
    fontFamily: "Geist_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
    paddingTop: Spacing["2xl"],
    marginBottom: Spacing["2xl"],
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    paddingBottom: Spacing["2xl"],
    marginBottom: Spacing["2xl"],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 18,
  },
  identityName: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
  },
  identitySub: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingLabel: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  settingValue: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  dangerLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
  },
  version: {
    fontFamily: "Geist_400Regular",
    textAlign: "center",
    fontSize: 12,
    marginTop: Spacing["2xl"],
  },
});
