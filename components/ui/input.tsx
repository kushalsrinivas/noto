import {
  TextInput,
  StyleSheet,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColors } from "@/hooks/use-theme-color";
import { BorderRadius, Spacing } from "@/constants/theme";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export function Input({ label, error, containerStyle, style, ...rest }: Props) {
  const colors = useColors();

  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText style={[styles.label, { color: colors.textTertiary }]}>
          {label}
        </ThemedText>
      )}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.paper2,
            color: colors.ink,
            borderColor: error ? colors.error : "transparent",
          },
          style,
        ]}
        {...rest}
      />
      {error && (
        <ThemedText style={[styles.error, { color: colors.error }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  error: {
    fontFamily: "Geist_400Regular",
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
