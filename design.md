# Design — noto

A locked design system for this app. Every screen reads this file before
emitting code. Do not regenerate per screen — extend or amend this file when
the system needs to grow.

## Genre

modern-minimal

## Tone

utilitarian — a tool, not a toy

## Palette

Warm neutrals anchored on hue 50–80. One chromatic accent (signal orange)
used at ≤5% of any viewport.

- Paper (light): `#FAFAF7`
- Paper (dark): `#141413`
- Ink (light): `#1C1B18`
- Ink (dark): `#EEEDEA`
- Muted: `#7A786F`
- Rule: `#E3E2DE` / `#2E2D2A`
- Accent: `#E8590C` (light) / `#F47A3E` (dark)

No purple. No teal. No gradients. No pure `#000` or `#fff`.

## Typography

- Display: **Geist 700 Bold** — tight tracking (`-0.5` letter-spacing)
- Body: **Geist 400 Regular**
- Medium: **Geist 500 Medium** — labels, nav, metadata
- Semibold: **Geist 600 SemiBold** — headings, section titles
- Scale anchor: 16px body → 24–26px title → 32px display (mobile)
- Line-height: 1.1–1.2 display, 1.4–1.5 body
- Max 2 weight extremes visible per screen (400 + 700)

## Spacing

4-point scale, named:

```
xs: 4   sm: 8   md: 12   lg: 16   xl: 20
2xl: 24   3xl: 32   4xl: 40   5xl: 56   6xl: 72
```

## Border radius

```
sm: 4   md: 8   lg: 12   xl: 16   pill: 999
```

## Motion

- Single pulse animation on mic button (Reanimated)
- No scroll-triggered reveals
- No bounce/overshoot easings
- `Easing.inOut(Easing.ease)` for all transitions
- `prefers-reduced-motion`: collapse to instant state change

## Microinteractions

- Silent success (no celebratory toasts)
- Pressed opacity: 0.85 (not scale transforms)
- Checkboxes: instant state, no animation
- Lists: no stagger, content just appears

## CTA voice

- Primary: ink-filled pill (`borderRadius: 999`)
- Secondary: outlined pill (1px border, ink text)
- Accent: reserved ONLY for the mic/record action

## Icon library

Material Icons (via `@expo/vector-icons/MaterialIcons`). Single library
across the entire app. No emoji as icons.

## What screens MUST share

- The warm neutral paper + ink
- Geist at consistent weights (400 body, 500 labels, 600 headings, 700 titles)
- Pill-shaped CTAs (ink-filled or outlined)
- Accent at ≤5% (mic button, voice badge, switch thumbs)
- Hairline dividers (`StyleSheet.hairlineWidth`)
- Left-biased layouts (no centred-everything)

## What screens MAY differ on

- Section density (home is sparse, notes list is dense)
- Whether stats/counts appear
- Empty state copy
