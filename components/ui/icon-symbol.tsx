import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "doc.text.fill": "description",
  "checkmark.circle.fill": "check-circle",
  "mic.fill": "mic",
  "person.fill": "person",
  magnifyingglass: "search",
  plus: "add",
  xmark: "close",
  gear: "settings",
  "bell.fill": "notifications",
  "tag.fill": "label",
  "trash.fill": "delete",
  "square.and.pencil": "edit",
  calendar: "event",
  "clock.fill": "schedule",
  waveform: "graphic-eq",
  "stop.fill": "stop",
  "pause.fill": "pause",
  "play.fill": "play-arrow",
  "arrow.left": "arrow-back",
  ellipsis: "more-horiz",
  "folder.fill": "folder",
  "star.fill": "star",
  "flag.fill": "flag",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
