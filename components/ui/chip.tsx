import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { BorderRadius, Spacing } from "@/constants/theme";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Chip({ label, selected = false, onPress, style }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : "transparent",
          borderColor: selected ? colors.ink : colors.rule,
        },
        style,
      ]}
    >
      <ThemedText
        style={[
          styles.label,
          { color: selected ? colors.background : colors.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: "Geist_500Medium",
    fontSize: 12,
  },
});
