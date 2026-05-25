import { View, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-theme-color";
import { Spacing } from "@/constants/theme";

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <MaterialIcons
        name={icon}
        size={28}
        color={colors.muted}
        style={styles.icon}
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={[styles.message, { color: colors.textTertiary }]}>
        {message}
      </ThemedText>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          size="sm"
          variant="secondary"
          style={{ marginTop: Spacing.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing["3xl"],
  },
  icon: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  message: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
});
