import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { useUsageStats } from "@/store/app-store";

const PRO_FEATURES = [
  {
    icon: "all-inclusive" as const,
    title: "Unlimited recordings",
    desc: "Record as much as you need, no daily cap.",
  },
  {
    icon: "picture-as-pdf" as const,
    title: "PDF export",
    desc: "Share your notes as polished documents.",
  },
  {
    icon: "psychology" as const,
    title: "AI memory",
    desc: "Context that carries across recordings.",
  },
  {
    icon: "sync" as const,
    title: "Cloud sync",
    desc: "Access your notes on any device.",
  },
];

export default function UpgradeScreen() {
  const colors = useColors();
  const { stats } = useUsageStats();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.hero}>
          <ThemedText
            style={[styles.progressText, { color: colors.textTertiary }]}
          >
            {stats.totalRecordings} recording
            {stats.totalRecordings !== 1 ? "s" : ""} created
          </ThemedText>
          <ThemedText style={styles.headline}>
            You're getting things done.{"\n"}Do even more.
          </ThemedText>
        </View>

        <View style={styles.features}>
          {PRO_FEATURES.map((feature) => (
            <View
              key={feature.title}
              style={[
                styles.featureRow,
                { borderBottomColor: colors.ruleLight },
              ]}
            >
              <View
                style={[styles.featureIcon, { backgroundColor: colors.paper2 }]}
              >
                <MaterialIcons
                  name={feature.icon}
                  size={20}
                  color={colors.ink}
                />
              </View>
              <View style={styles.featureContent}>
                <ThemedText style={styles.featureTitle}>
                  {feature.title}
                </ThemedText>
                <ThemedText
                  style={[styles.featureDesc, { color: colors.textSecondary }]}
                >
                  {feature.desc}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Button
          title="Upgrade to Pro — $4.99/mo"
          onPress={() => router.back()}
          size="lg"
        />
        <Pressable
          onPress={() => router.back()}
          style={styles.laterBtn}
          hitSlop={12}
        >
          <ThemedText
            style={[styles.laterText, { color: colors.textTertiary }]}
          >
            Maybe later
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
  },
  hero: {
    paddingTop: Spacing["3xl"],
    paddingBottom: Spacing["4xl"],
  },
  progressText: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: Spacing.md,
  },
  headline: {
    fontFamily: "Geist_700Bold",
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.5,
  },
  features: {
    gap: 0,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: { flex: 1 },
  featureTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  bottom: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["4xl"],
    paddingTop: Spacing.lg,
    alignItems: "center",
  },
  laterBtn: {
    paddingVertical: Spacing.md,
  },
  laterText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
  },
});
