import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ColorPicker } from "@/components/ui/color-picker";
import { IconPicker } from "@/components/ui/icon-picker";
import { BorderRadius, FolderColors, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import type { FolderIcon } from "@/store/folder-store";
import { useFolders } from "@/store/folder-store";

export default function FolderEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    suggestedName?: string;
  }>();
  const { folders, addFolder, updateFolder } = useFolders();

  const existing = params.id
    ? folders.find((f) => f.id === params.id)
    : undefined;

  const [name, setName] = useState(
    existing?.name || params.suggestedName || "",
  );
  const [icon, setIcon] = useState<FolderIcon>(existing?.icon || "folder");
  const [color, setColor] = useState(existing?.color || FolderColors[0]);
  const [parentId, setParentId] = useState<string | undefined>(
    existing?.parentId,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setIcon(existing.icon);
      setColor(existing.color);
      setParentId(existing.parentId);
    }
  }, [existing?.id]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Give your folder a name.");
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await updateFolder(existing.id, {
          name: trimmed,
          icon,
          color,
          parentId,
        });
      } else {
        await addFolder({
          name: trimmed,
          icon,
          color,
          parentId,
          pinned: false,
          archived: false,
          locked: false,
          isSmart: false,
        });
      }
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save folder.");
    } finally {
      setSaving(false);
    }
  }

  const eligibleParents = folders.filter(
    (f) => f.id !== existing?.id && !f.parentId,
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
              <ThemedText
                style={[
                  styles.saveBtn,
                  {
                    color: saving ? colors.muted : colors.accent,
                  },
                ]}
              >
                {saving ? "Saving..." : "Save"}
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(Spacing["2xl"], insets.bottom + Spacing.xl),
          },
        ]}
      >
        <View style={styles.previewRow}>
          <View style={[styles.previewIcon, { backgroundColor: color + "18" }]}>
            <MaterialIcons
              name={icon as keyof typeof MaterialIcons.glyphMap}
              size={28}
              color={color}
            />
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor={colors.muted}
            style={[
              styles.nameInput,
              { color: colors.ink, borderBottomColor: colors.rule },
            ]}
            autoFocus
            maxLength={40}
          />
        </View>

        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionLabel, { color: colors.textTertiary }]}
          >
            COLOR
          </ThemedText>
          <ColorPicker selected={color} onSelect={setColor} />
        </View>

        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionLabel, { color: colors.textTertiary }]}
          >
            ICON
          </ThemedText>
          <IconPicker selected={icon} color={color} onSelect={setIcon} />
        </View>

        {eligibleParents.length > 0 && (
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionLabel, { color: colors.textTertiary }]}
            >
              PARENT FOLDER
            </ThemedText>
            <View style={styles.parentList}>
              <Pressable
                onPress={() => setParentId(undefined)}
                style={[
                  styles.parentChip,
                  {
                    borderColor: !parentId ? colors.ink : colors.rule,
                    backgroundColor: !parentId
                      ? colors.ink + "0A"
                      : colors.paper2,
                  },
                ]}
              >
                <ThemedText style={styles.parentChipText}>None</ThemedText>
              </Pressable>
              {eligibleParents.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setParentId(p.id)}
                  style={[
                    styles.parentChip,
                    {
                      borderColor: parentId === p.id ? colors.ink : colors.rule,
                      backgroundColor:
                        parentId === p.id ? colors.ink + "0A" : colors.paper2,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={p.icon as keyof typeof MaterialIcons.glyphMap}
                    size={14}
                    color={p.color}
                  />
                  <ThemedText style={styles.parentChipText}>
                    {p.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing["2xl"] },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    flex: 1,
    fontFamily: "Geist_600SemiBold",
    fontSize: 20,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  section: { gap: Spacing.md },
  sectionLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 11,
    letterSpacing: 1,
  },
  parentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  parentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  parentChipText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
  },
  saveBtn: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
  },
});
