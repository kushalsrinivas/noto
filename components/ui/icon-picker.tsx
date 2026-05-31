import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/theme";
import { useColors } from "@/hooks/use-theme-color";
import { FOLDER_ICONS, type FolderIcon } from "@/store/folder-store";

type Props = {
  selected: FolderIcon;
  color: string;
  onSelect: (icon: FolderIcon) => void;
};

export function IconPicker({ selected, color, onSelect }: Props) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      {FOLDER_ICONS.map((icon) => {
        const isActive = icon === selected;
        return (
          <Pressable
            key={icon}
            onPress={() => onSelect(icon)}
            style={[
              styles.cell,
              {
                backgroundColor: isActive ? color + "18" : colors.paper2,
                borderColor: isActive ? color : colors.ruleLight,
              },
            ]}
          >
            <MaterialIcons
              name={icon as keyof typeof MaterialIcons.glyphMap}
              size={20}
              color={isActive ? color : colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
