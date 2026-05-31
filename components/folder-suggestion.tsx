import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";

type Props = {
  visible: boolean;
  folderName: string;
  isNewFolder: boolean;
  onAccept: () => void;
  onDismiss: () => void;
};

export function FolderSuggestionModal({
  visible,
  folderName,
  isNewFolder,
  onAccept,
  onDismiss,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.rule,
              paddingBottom: Math.max(
                Spacing["2xl"],
                insets.bottom + Spacing.md,
              ),
            },
          ]}
        >
          <View style={styles.header}>
            <View
              style={[styles.aiIcon, { backgroundColor: colors.accentMuted }]}
            >
              <MaterialIcons
                name="auto-awesome"
                size={20}
                color={colors.accent}
              />
            </View>
            <ThemedText style={styles.title}>AI Suggestion</ThemedText>
          </View>

          <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
            {isNewFolder
              ? `This note seems like a new topic. Create a "${folderName}" folder?`
              : `This note seems related to your "${folderName}" folder. Move it there?`}
          </ThemedText>

          <View style={styles.actions}>
            <Pressable
              onPress={onDismiss}
              style={[styles.btn, { borderColor: colors.rule }]}
            >
              <ThemedText
                style={[styles.btnText, { color: colors.textSecondary }]}
              >
                Not now
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={onAccept}
              style={[
                styles.btn,
                styles.btnPrimary,
                { backgroundColor: colors.ink },
              ]}
            >
              <ThemedText
                style={[styles.btnText, { color: colors.background }]}
              >
                {isNewFolder ? "Create folder" : "Move"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing["2xl"],
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 17,
  },
  message: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnText: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
  },
});
