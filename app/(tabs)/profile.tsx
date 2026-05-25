import { View, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { useUserName, useAiMode, useNotes, useTasks } from "@/store/app-store";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useState } from "react";

export default function ProfileScreen() {
  const colors = useColors();
  const { name } = useUserName();
  const { mode, setMode } = useAiMode();
  const { notes } = useNotes();
  const { tasks } = useTasks();
  const [notifications, setNotifications] = useState(true);

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
        { icon: "translate" as const, label: "Language", value: "English" },
        { icon: "mic" as const, label: "Recording quality", value: "High" },
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
        { icon: "folder-open" as const, label: "Manage recordings" },
        { icon: "delete-outline" as const, label: "Clear cache" },
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
  version: {
    fontFamily: "Geist_400Regular",
    textAlign: "center",
    fontSize: 12,
    marginTop: Spacing.xl,
  },
});
