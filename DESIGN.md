---
name: Vahnly Rider
description: Lime-charged operational cockpit on a pure-white, ink-typed product shell
colors:
  ink: "#111827"
  ink-secondary: "#4B5563"
  ink-tertiary: "#6B7280"
  canvas: "#FFFFFF"
  canvas-secondary: "#F9FAFB"
  canvas-tertiary: "#F3F4F6"
  border-hairline: "#E5E7EB"
  border-strong: "#8E8E93"
  brand-lime: "#B7EC4B"
  brand-lime-hover: "#A9DE3D"
  brand-lime-strong: "#5F821F"
  brand-lime-tint: "#F2FBDC"
  accent-indigo: "#4F46E5"
  accent-indigo-deep: "#3730A3"
  success-icon: "#34C759"
  success-text: "#1B7232"
  warning-icon: "#F0B840"
  warning-text: "#986F1B"
  danger-icon: "#C94030"
  danger-text: "#7A2017"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: "44px"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "28px"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "18px"
  mono:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
rounded:
  sm: "8px"
  md: "8px"
  lg: "16px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand-lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "64px"
  button-primary-hover:
    backgroundColor: "{colors.brand-lime-hover}"
  panel:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.border-hairline}"
    padding: "16px"
---

# Design System: Vahnly Rider

## 1. Overview

**Creative North Star: "The Inspection Sheet"**

Vahnly's interface reads like a premium purchase-inspection dashboard for the rider's own car and trip: a pure-white operational surface, compact modular panels with hairline borders, ink typography, mono-set numbers — and one electric decision color. Lime (#B7EC4B) is the commit color: it fills the primary CTA and the currently-selected option, always carrying ink text on top. Indigo (#4F46E5) is the information color: links, focus rings, informational accents and effects. Everything else is white, gray, and ink.

This system explicitly rejects frosted glass, brand gradients, gradient text, and decorative glow. Panels are flat white with `#E5E7EB` hairlines; density and rhythm — not materials — signal hierarchy.

**Key Characteristics:**
- Pure white canvas (#FFFFFF) with ink (#111827) type, everywhere.
- Flat modular panels: white fill, 1px hairline border, 8px radius, soft shadow.
- Lime as a FILL only — CTA and active states — always paired with ink text.
- Indigo as the calmer informational accent for links, focus, and effects.
- Native system font for all prose; JetBrains Mono exclusively for fares, ETAs, distances, IDs.

## 2. Colors

Restrained with one committed decision color: white/gray/ink carry the whole app; lime is spent entirely on the primary action and the active selection.

### Primary action
- **Brand Lime** (#B7EC4B): CTA fill, active chip/tab/card fill or tint. ~1.4:1 against white — it is NEVER text, never a thin stroke, never a small dot on white.
- **Lime Strong** (#5F821F): the text-and-indicator-safe lime (≥4.5:1 on white). Selected-state labels, selected-card borders, small brand dots, route pickup markers.
- **Lime Tint** (#F2FBDC): selected-card and highlight wash background.

### Informational accent
- **Indigo** (#4F46E5): links, focus rings, informational borders/icons, decorative effect colors (shine, beams, particles). 6.3:1 on white — safe as text.

### Neutral
- **Canvas** (#FFFFFF) / **Canvas Secondary** (#F9FAFB) / **Canvas Tertiary** (#F3F4F6): page, inset fields, segmented-control tracks.
- **Hairline** (#E5E7EB): default panel/card border. **Border Strong** (#8E8E93): emphasized borders only.
- **Ink** (#111827) / **Ink Secondary** (#4B5563) / **Ink Tertiary** (#6B7280): text ramp; tertiary clears 4.5:1 on white.

### Status
- **Success**: icon/dot #34C759 (iOS green), text #1B7232.
- **Warning**: icon #F0B840, text #986F1B.
- **Danger**: icon #C94030, text #7A2017.

### Named Rules
**The Ink-on-Lime Rule.** Any element filled with brand lime MUST use ink (`--content-primary`, #111827 ≈ 12:1) for its text and icons. White-on-lime is invisible and has shipped broken before in this codebase's previous palette era; the interactive tokens (`--interactive-primary` + `--interactive-primary-text`) are pre-paired to make the right thing automatic.

**The Lime-Is-A-Fill Rule.** Raw lime (#B7EC4B) appears only as a filled surface ≥ roughly a chip in size. Text, thin borders, indicator dots, and strokes that must read against white use Lime Strong (#5F821F). If an element needs lime and can't take ink text, it's asking for Lime Strong or indigo instead.

## 3. Typography

**Display/Body Font:** native system stack (-apple-system / Segoe UI / Roboto) — zero webfont download, native feel per platform.
**Mono Font:** JetBrains Mono (Fira Code fallback).

**Character:** the OS's own voice for everything humans read; a distinct mono for the numbers riders trust with money and time.

### Hierarchy
- **Display** (700, 36px/44px, -0.02em): onboarding and empty-state headlines only.
- **Headline** (700, 22px/28px): screen titles, modal headers.
- **Title** (600, 16px/22px): tile headers, card titles.
- **Body** (400, 14px/22px): default prose, addresses.
- **Label** (600, 12px/18px): buttons, chips, badges, captions.
- **Mono** (500, 16px/24px): fares, ETAs, distances, IDs — nowhere else.

### Named Rules
**The Numbers-Are-Mono Rule.** Any figure the rider trusts financially or temporally (fare, ETA, distance, surge multiplier, OTP) renders in `--font-mono`. Prose describing the number is system sans; the number itself is mono.

## 4. Elevation

Flat throughout. Panels separate from the canvas by hairline border first, shadow second.

### Shadow Vocabulary
- **Elevation 1** (`0 1px 2px rgba(0,0,0,0.04)`): panels/cards at rest.
- **Elevation 2** (`0 4px 12px rgba(0,0,0,0.06)`): hover/lift.
- **Elevation 3** (`0 -2px 16px rgba(0,0,0,0.08)`): bottom sheets rising from the edge.
- **Sheet shadow** (`0 -8px 32px rgba(17,24,39,0.08)`): the booking surface over the map.

### Named Rules
**The No-Glass Rule.** The legacy `.glass-tile` / `.glass-panel` / `.glass-sheet` class names survive in markup but render flat white panels with hairline borders. No backdrop blur, no translucent white fills, no white-on-white borders. New components use flat panels directly.

## 5. Components

### Buttons
- **Primary CTA:** lime fill, ink text, pill radius, 56–64px tall. Hover shifts to #A9DE3D; press feedback via spring scale-down (0.97–0.98).
- **Focus:** `focus-visible` ring in indigo (2px, offset 2px).

### Chips & selectors (trip type, transmission, car class, payment)
- **Unselected:** flat white tile, hairline border, secondary ink.
- **Selected:** lime pill/fill with ink text for large chips; lime-tint background + 2px Lime Strong border for cards; shared `layoutId` spring glides the indicator between options.

### Panels / Cards
- **Corner:** 8px (`--radius-md`). **Background:** white or canvas-secondary. **Border:** 1px hairline. **Padding:** 16–24px.

### Inputs
- **Style:** canvas-secondary fill, hairline border, 8px radius, ≥48px tall. **Focus:** indigo border + ring. **Placeholder:** Ink Tertiary.

### Navigation (bottom tab bar)
- Floating white pill bar, hairline border, above the safe-area inset.
- **Active indicator:** a `layoutId`-animated lime pill filling the active tab area, ink label on top; inactive tabs are secondary ink.
- **Touch targets:** every tab ≥44×44px.

## 6. Do's and Don'ts

### Do:
- **Do** reserve raw lime for exactly two roles: the primary CTA fill and active-state fills/tints. Everywhere else, ink, gray, Lime Strong, or indigo.
- **Do** pair every lime fill with ink text/icons via the pre-paired interactive tokens.
- **Do** use Lime Strong (#5F821F) for any lime that must read against white: text, 2px selected borders, dots, thin indicators.
- **Do** render fares, ETAs, distances, and IDs in `--font-mono`.
- **Do** keep panels flat: white fill, hairline border, 8px radius.
- **Do** keep every interactive control ≥44×44px.

### Don't:
- **Don't** put white text or white icons on lime — ink only.
- **Don't** use raw lime (#B7EC4B) as text, thin strokes, or small indicators on white.
- **Don't** use gradient text or brand gradients — the gradient era is over; fills are solid.
- **Don't** reintroduce frosted glass or translucent white borders (`border-white/60` on white panels is invisible).
- **Don't** hardcode palette hexes in component JSX where a token exists — `tokens.css` is the single source of truth.
- **Don't** use all-caps display headlines, or introduce a brand color outside lime / Lime Strong / indigo / the status set.
