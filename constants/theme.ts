import { Platform } from "react-native";

/**
 * Hallmark · genre: modern-minimal · tone: utilitarian
 * Paper: warm off-white (light) / warm near-black (dark)
 * Ink: warm near-black (light) / warm off-white (dark)
 * Accent: signal orange — ≤5% of any viewport
 * Neutrals: tinted warm (hue 50–80 anchor)
 */

export const Colors = {
  light: {
    paper: "#FAFAF7",
    paper2: "#F4F3F0",
    paper3: "#EEEDEA",
    ink: "#1C1B18",
    ink2: "#3D3C38",
    muted: "#7A786F",
    rule: "#E3E2DE",
    ruleLight: "#F0EFEC",
    accent: "#E8590C",
    accentMuted: "#FDF2EC",
    focus: "#D04A08",
    success: "#2D7A3A",
    successMuted: "#EDF7EF",
    error: "#C4321A",
    errorMuted: "#FDF0EE",
    warning: "#A65E00",

    // Legacy compat aliases
    text: "#1C1B18",
    textSecondary: "#5C5A54",
    textTertiary: "#7A786F",
    background: "#FAFAF7",
    surface: "#FFFFFF",
    surfaceSecondary: "#F4F3F0",
    primary: "#E8590C",
    border: "#E3E2DE",
    borderLight: "#F0EFEC",
    icon: "#5C5A54",
    tint: "#E8590C",
    tabIconDefault: "#7A786F",
    tabIconSelected: "#1C1B18",
    card: "#FFFFFF",
    overlay: "rgba(28, 27, 24, 0.4)",
  },
  dark: {
    paper: "#141413",
    paper2: "#1E1D1B",
    paper3: "#282724",
    ink: "#EEEDEA",
    ink2: "#C8C6C0",
    muted: "#7A786F",
    rule: "#2E2D2A",
    ruleLight: "#232220",
    accent: "#F47A3E",
    accentMuted: "#2A1A10",
    focus: "#F5894F",
    success: "#5FBF6D",
    successMuted: "#162318",
    error: "#F07563",
    errorMuted: "#2A1614",
    warning: "#E8A033",

    text: "#EEEDEA",
    textSecondary: "#A8A69F",
    textTertiary: "#7A786F",
    background: "#141413",
    surface: "#1E1D1B",
    surfaceSecondary: "#282724",
    primary: "#F47A3E",
    border: "#2E2D2A",
    borderLight: "#232220",
    icon: "#A8A69F",
    tint: "#F47A3E",
    tabIconDefault: "#7A786F",
    tabIconSelected: "#EEEDEA",
    card: "#1E1D1B",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 56,
  "6xl": 72,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "Geist_700Bold",
  },
  title1: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "600" as const,
    fontFamily: "Geist_600SemiBold",
  },
  title2: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "600" as const,
    fontFamily: "Geist_600SemiBold",
  },
  title3: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "600" as const,
    fontFamily: "Geist_600SemiBold",
  },
  headline: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600" as const,
    fontFamily: "Geist_600SemiBold",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400" as const,
    fontFamily: "Geist_400Regular",
  },
  callout: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily: "Geist_400Regular",
  },
  subhead: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "400" as const,
    fontFamily: "Geist_400Regular",
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
    fontFamily: "Geist_400Regular",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    fontFamily: "Geist_500Medium",
  },
  mono: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
    fontFamily: 'Platform.OS === "ios" ? "Menlo" : "monospace"',
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "Geist_400Regular",
    sansMedium: "Geist_500Medium",
    sansSemiBold: "Geist_600SemiBold",
    sansBold: "Geist_700Bold",
    mono: "Menlo",
  },
  default: {
    sans: "Geist_400Regular",
    sansMedium: "Geist_500Medium",
    sansSemiBold: "Geist_600SemiBold",
    sansBold: "Geist_700Bold",
    mono: "monospace",
  },
});
