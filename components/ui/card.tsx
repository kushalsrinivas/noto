import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/use-theme-color";
import { BorderRadius, Spacing } from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Card({ children, onPress, style }: Props) {
  const colors = useColors();

  const baseStyle: ViewStyle = {
    ...styles.card,
    borderColor: colors.rule,
    ...style,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <Pressable style={baseStyle} disabled>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
});
