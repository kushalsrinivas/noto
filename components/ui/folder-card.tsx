import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import type { Folder } from "@/store/folder-store";

type Props = {
  folder: Folder;
  onPress?: () => void;
  onLongPress?: () => void;
  compact?: boolean;
};

export function FolderCard({ folder, onPress, onLongPress, compact }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        compact && styles.cardCompact,
        { borderColor: colors.ruleLight, backgroundColor: colors.paper2 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: folder.color + "18" }]}>
        <MaterialIcons
          name={folder.icon as keyof typeof MaterialIcons.glyphMap}
          size={compact ? 16 : 20}
          color={folder.color}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <ThemedText
            style={[styles.name, compact && styles.nameCompact]}
            numberOfLines={1}
          >
            {folder.name}
          </ThemedText>
          {folder.pinned && (
            <MaterialIcons
              name="push-pin"
              size={10}
              color={colors.textTertiary}
            />
          )}
          {folder.locked && (
            <MaterialIcons name="lock" size={10} color={colors.textTertiary} />
          )}
          {folder.isSmart && (
            <MaterialIcons
              name="auto-awesome"
              size={10}
              color={colors.accent}
            />
          )}
        </View>
        <ThemedText
          style={[styles.count, { color: colors.textTertiary }]}
          numberOfLines={1}
        >
          {folder.noteCount} {folder.noteCount === 1 ? "note" : "notes"}
        </ThemedText>
        {!compact && folder.aiSummary && (
          <ThemedText
            style={[styles.summary, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {folder.aiSummary}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minWidth: 140,
  },
  cardCompact: {
    padding: Spacing.sm,
    minWidth: 120,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    flexShrink: 1,
  },
  nameCompact: {
    fontSize: 13,
  },
  count: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
  },
  summary: {
    fontFamily: "Geist_400Regular",
    fontSize: 11,
    fontStyle: "italic",
  },
});
