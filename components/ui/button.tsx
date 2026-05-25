import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { BorderRadius, Spacing } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  style,
}: Props) {
  const colors = useColors();

  const bgMap: Record<ButtonVariant, string> = {
    primary: colors.ink,
    secondary: "transparent",
    ghost: "transparent",
    danger: colors.error,
  };

  const textMap: Record<ButtonVariant, string> = {
    primary: colors.background,
    secondary: colors.ink,
    ghost: colors.ink,
    danger: "#FFFFFF",
  };

  const borderMap: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: colors.border,
    ghost: undefined,
    danger: undefined,
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    lg: { paddingVertical: 14, paddingHorizontal: Spacing["2xl"] },
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        { backgroundColor: bgMap[variant] },
        borderMap[variant] && {
          borderWidth: 1,
          borderColor: borderMap[variant],
        },
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.4 },
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={textMap[variant]} size="small" />
      ) : (
        <>
          {icon}
          <ThemedText
            style={[
              styles.text,
              { color: textMap[variant] },
              icon ? { marginLeft: Spacing.sm } : undefined,
            ]}
          >
            {title}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.pill,
  },
  text: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
  },
});
