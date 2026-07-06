---
name: Vahnly Rider
description: Frosted-glass booking cockpit over a warm-neutral, charcoal-inked product shell
colors:
  ink-charcoal: "#1A1A1A"
  ink-secondary: "#60605B"
  ink-tertiary: "#7E7E77"
  ink-tertiary-on-glass: "#60605B"
  canvas: "#FAFAFA"
  canvas-secondary: "#F4F4F1"
  canvas-tertiary: "#EAEAE5"
  brand-blue: "#0040E0"
  brand-blue-hover: "#0035BE"
  brand-blue-mid: "#2563EB"
  brand-indigo: "#4F46E5"
  accent-steel-blue: "#4A6FA5"
  success-icon: "#3A9D68"
  success-text: "#205F3E"
  warning-icon: "#F0B840"
  warning-text: "#986F1B"
  danger-icon: "#C94030"
  danger-text: "#7A2017"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: "44px"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "28px"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
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
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "#FAFAFA"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "64px"
  button-primary-hover:
    backgroundColor: "{colors.brand-blue-hover}"
  button-secondary:
    backgroundColor: "{colors.ink-charcoal}"
    textColor: "#FAFAFA"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "56px"
  glass-tile:
    backgroundColor: "rgba(255,255,255,0.62)"
    textColor: "{colors.ink-charcoal}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Vahnly Rider

## 1. Overview

**Creative North Star: "The Frosted Cockpit"**

Vahnly's booking surface is a premium car-owner control panel floating over the map — the road stays visible beneath a layer of frosted glass, and the one action that matters (book the driver) is the only element that fully commits to color: a deep blue-to-indigo gradient (#0040E0 → #2563EB → #4F46E5) that reads instantly against the restrained warm-neutral canvas underneath. Everywhere else — trip history, account, settings — the shell stays flat, charcoal-inked, and quiet. The glass and the gradient are earned real estate, reserved for the moment the rider is actively commanding a trip; they are not a default skin applied to the whole product.

This system explicitly rejects glassmorphism as ambient decoration scattered across every screen — frost belongs to the cockpit (the booking sheet, its tiles, its panel), not to a settings row or a trip-history card. It rejects gradient text, all-caps display type, and any brand color beyond the three defined roles (charcoal ink, steel-blue accent, brand blue/indigo gradient). Every color used on a gradient background is checked against 4.5:1 before it ships — the CTA looking premium and the CTA being legible are the same requirement, not a tradeoff.

**Key Characteristics:**
- Warm off-white canvas (#FAFAFA) and charcoal ink (#1A1A1A) as the base, everywhere.
- Frosted glass (three tiers: tile, panel, sheet) exclusively on the booking cockpit over the map.
- One brand gradient, reserved for the primary CTA and active-state indicators only.
- Steel-blue as the separate, calmer accent for links, focus rings, and informational borders.
- Mono type (JetBrains Mono) exclusively for fares, ETAs, distances, and IDs — numbers that must not be mistaken for prose.

## 2. Colors

Restrained-to-committed: neutrals and charcoal ink carry the whole app; the brand gradient is deliberately rare, spent entirely on the CTA and active-state chrome of the booking cockpit.

### Primary
- **Charcoal Ink** (#1A1A1A): default text, the flat secondary-action button background, borders on selected states outside the cockpit.

### Secondary
- **Brand Blue** (#0040E0), **Brand Blue-Mid** (#2563EB), **Brand Indigo** (#4F46E5): the three-stop gradient reserved for the primary CTA (`bg-gradient-to-r from-secondary via-secondary-2 to-secondary-3`) and active-state indicators (trip pill, car class, payment method, nav tab glow). Never used for body text, never used behind text without the Inverse-Text Rule below.

### Tertiary
- **Steel-Blue Accent** (#4A6FA5): informational accent — focus rings, route-dot icons, "info" affordances. Calmer and more frequent than the brand gradient; this is the accent you see in borders and small icons, not buttons.

### Neutral
- **Canvas** (#FAFAFA): app background.
- **Canvas Secondary** (#F4F4F1) / **Canvas Tertiary** (#EAEAE5): layered surfaces (badges, secondary buttons, dividers).
- **Ink Secondary** (#60605B) / **Ink Tertiary** (#7E7E77): secondary and placeholder text on the flat canvas.
- **Ink Tertiary On Glass** (#60605B — one step darker than the flat-canvas tertiary): the same "tertiary" role, but on frosted glass. Frost eats contrast margin; this token exists so placeholder and caption text on the cockpit never drops under 4.5:1.

### Status
- **Success**: icon #3A9D68, text #205F3E (the darker step — success text sits at 400 in dot form but always renders as 600 for legibility).
- **Warning**: icon #F0B840, text #986F1B.
- **Danger**: icon #C94030, text #7A2017 (light-surface toasts always use the 600 step, never 400, to clear 4.5:1 on a tinted background).

### Named Rules
**The Inverse-Text Rule.** Any element painted with the brand gradient MUST set its text color via the `content-inverse` token (#FAFAFA), verified against 4.5:1. This shipped broken once — charcoal text on the CTA gradient, reading 2.3–3.4:1 — because the token was never mapped into the theme. It is mapped now; never leave it unmapped again.

**The Rare Gradient Rule.** The brand gradient appears in exactly two places: the primary CTA and the active-state indicator for a selectable chip/tile/tab. If a third use case seems to need it, it's asking for the steel-blue accent instead.

## 3. Typography

**Display Font:** Inter (system-ui, -apple-system fallback)
**Body Font:** Inter (same family — one sans carries headings, buttons, labels, body; this is product UI, not a brand surface)
**Mono Font:** JetBrains Mono (Fira Code fallback)

**Character:** A single well-tuned sans for everything humans read, and a distinct mono exclusively for numbers riders are trusting with money and time. The pairing signals precision without ever feeling like two competing voices.

### Hierarchy
- **Display** (700, 36px/44px, -0.02em): rare — onboarding and empty-state headlines only.
- **Headline** (700, 22px/28px): screen titles, modal headers.
- **Title** (600, 16px/22px): tile headers, card titles (`TileHeader` in the booking cockpit).
- **Body** (400, 14px/22px): default prose, addresses, descriptions.
- **Label** (600, 12px/18px, tracking 0.01em on the smallest step): buttons, chips, badges, captions.
- **Mono** (500, 16px/24px): fares, ETAs, distances, IDs — nowhere else.

### Named Rules
**The Numbers-Are-Mono Rule.** Any figure the rider is trusting financially or temporally (fare, ETA, distance, surge multiplier, OTP) renders in `--font-mono`. If it's prose describing the number, it's Inter; if it *is* the number, it's mono.

## 4. Elevation

Hybrid by design, split cleanly along one line: the booking cockpit (map-overlay booking sheet and its tiles) uses frosted glass; every other screen (trip history, account, settings, rewards) stays flat with hairline borders and soft ambient shadows, exactly as the original flat system specified. This is a deliberate scope, not a compromise — glass signals "you are actively commanding a trip right now"; flat signals "you are reviewing or configuring."

### Shadow Vocabulary
- **Elevation 1** (`0 1px 2px rgba(0,0,0,0.04)`): flat cards at rest, outside the cockpit.
- **Elevation 2** (`0 4px 12px rgba(0,0,0,0.06)`): flat cards on hover/lift.
- **Elevation 3** (`0 -2px 16px rgba(0,0,0,0.08)`): bottom sheets rising from the edge, outside the cockpit.
- **Glass Shadow** (`0 4px 24px rgba(0,0,0,0.06)` + `inset 0 1px 0 rgba(255,255,255,0.7)`): the frosted tiles' soft interior highlight + drop, cockpit only.
- **Brand Glow** (`0 4px 24px rgba(0,64,224,0.3)`): reserved for the active brand-gradient element itself (CTA, selected chip) — never applied to a flat, non-gradient surface.

### Named Rules
**The Cockpit-Only Glass Rule.** `.glass-tile` / `.glass-panel` / `.glass-sheet` render only inside the booking flow (home map overlay, the booking sheet and its child tiles, the trip-review sheet). A settings row or a trip-history card that reaches for glass is reaching for the wrong material — it should be a flat `.card`.

## 5. Components

### Buttons
- **Shape:** pill radius (999px) for the primary CTA and all selectable chips/tabs; 8px radius for the flat secondary button used outside the cockpit.
- **Primary (cockpit CTA):** brand gradient background, `content-inverse` text (#FAFAFA, never charcoal — see the Inverse-Text Rule), Brand Glow shadow, a slow one-pass sheen sweep. 64px tall, full-width.
- **Secondary (flat, app-wide):** charcoal background (`--interactive-primary`), off-white text, no gradient, no glow. This is the default button everywhere outside the booking cockpit.
- **Hover / Focus:** `focus-visible` ring in steel-blue accent (2px, offset). Press feedback via `--ease-spring` scale-down (0.97–0.98), not a color change.

### Chips (trip-type pills, transmission/car-class/payment selectors)
- **Style:** unselected = glass-tile (cockpit) or flat neutral (elsewhere) with secondary ink; selected = brand-gradient fill with inverse text and Brand Glow, driven by a shared `layoutId` spring so the active indicator glides between options rather than jump-cutting.
- **Disabled (e.g. Monthly):** glass-tile at reduced opacity with a small warning-toned "Soon" badge (11px minimum, warning-600 text — never the earlier 9px).

### Cards / Containers (flat, app-wide default)
- **Corner Style:** 12px (`--radius-md`).
- **Background:** Canvas or Canvas Secondary.
- **Shadow Strategy:** Elevation 1 at rest, Elevation 2 on hover/lift.
- **Border:** 1px hairline, `--border-opaque`.
- **Internal Padding:** 16px (`--space-500`).

### Inputs / Fields
- **Style:** 8px radius, 1px hairline border, Canvas Secondary background, 48px height minimum.
- **Focus:** border shifts to steel-blue accent + 2px focus ring.
- **Placeholder:** Ink Tertiary on flat canvas; Ink Tertiary On Glass (one step darker) inside the cockpit.
- **Progressive disclosure:** rare-use fields (promo code) start collapsed behind a small text-link toggle rather than permanently occupying cockpit real estate at the same visual weight as pickup/drop-off.

### Navigation (bottom tubelight tab bar)
- **Style:** floating pill bar, frosted (glass-solid), fixed to viewport bottom above the safe-area inset.
- **Active indicator:** a `layoutId`-animated glow pill in brand blue (never charcoal — a charcoal blur reads as a smudge, not a glow) beneath the active tab's icon+label; the label itself stays charcoal ink for on-white legibility.
- **Touch targets:** every tab ≥44×44px; icon-only affordances elsewhere in the cockpit (swap button, stepper, info button) hit the same floor via either direct sizing or the `.touch-target` invisible-hit-area utility.

## 6. Do's and Don'ts

### Do:
- **Do** reserve the brand gradient (#0040E0 → #2563EB → #4F46E5) for exactly two roles: the primary CTA and active-state indicators. Everywhere else, charcoal or steel-blue.
- **Do** map every inverse-text use through `--color-content-inverse` and verify 4.5:1 before shipping a gradient-backed button or chip.
- **Do** keep frosted glass (`.glass-tile`/`.glass-panel`/`.glass-sheet`) scoped to the booking cockpit only; flat + hairline everywhere else.
- **Do** render fares, ETAs, distances, and IDs in `--font-mono`; everything else in Inter.
- **Do** collapse rare-use controls (promo codes, secondary toggles) behind progressive disclosure instead of giving them equal permanent weight next to the primary task.
- **Do** keep every interactive control ≥44×44px, using the `.touch-target` invisible-hit-area technique for visually-small icon buttons that can't grow without breaking layout.

### Don't:
- **Don't** use gradient text (`background-clip: text`) — the gradient lives on surfaces and buttons, never behind text.
- **Don't** apply glassmorphism outside the booking cockpit — a settings row or trip-history card reaching for `.glass-tile` is using the wrong material.
- **Don't** hardcode brand-gradient hex values in component JSX (e.g. `colorFrom="#1a5cff"`) — always reference `var(--color-secondary)` and its siblings so the palette has exactly one source of truth in `tokens.css`.
- **Don't** ship a gradient-backed element with unmapped or assumed-inverse text — verify the token resolves and the contrast clears 4.5:1.
- **Don't** run more than one infinite decorative motion loop competing for attention on a single screen at default (non-reduced) motion; each one needs to earn its place.
- **Don't** use all-caps display headlines, or introduce a brand color outside charcoal / steel-blue / the brand gradient.
