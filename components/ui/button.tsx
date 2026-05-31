import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => scale.set(withTiming(0.96, { duration: 100 }))}
      onPressOut={() => scale.set(withTiming(1, { duration: 200 }))}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyles[size],
        { backgroundColor: bgMap[variant] },
        borderMap[variant]
          ? {
              borderWidth: 1,
              borderColor: borderMap[variant],
            }
          : undefined,
        (disabled || loading) && { opacity: 0.4 },
        animatedStyle,
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
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.pill,
    borderCurve: "continuous",
  },
  text: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
  },
});
