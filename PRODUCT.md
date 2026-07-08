# Product

## Register

product

## Users

Riders who own cars and need professional drivers to drive them. They book in-city trips, hourly blocks, outstation routes, or monthly arrangements. Primary context: mobile-first, on-the-go, opening the app to schedule or request an immediate driver. Secondary: reviewing trip history, managing payments and account settings.

## Product Purpose

Vahnly connects car-owning riders with vetted drivers for their own vehicle. Unlike ride-hailing, the rider owns the car and the driver travels to it. The platform handles dispatch (offer-accept model), real-time GPS tracking, live trip state, fare calculation, and payment settlement. Success = reliable driver arrival, transparent pricing, and a frictionless end-to-end trip experience.

## Brand Personality

Premium, Precise, Operational. The interface reads like a purchase-inspection sheet for the rider's own car: pure-white canvas, ink (#111827) typography, compact flat panels with hairline borders, mono-set numbers — and one electric decision color. Brand lime (#B7EC4B, `tokens.css` `--brand-secondary*`) fills the primary CTA and the active selection, always with ink text on top. Indigo (#4F46E5, the accent ramp) carries links, focus rings, and informational accents. The brand earns trust through clarity, density, and consistency — polish serves legibility and hierarchy, it never substitutes for them.

## Anti-references

- No dark mode. Single pure-white light theme.
- No gradient text (`background-clip: text`) and no brand gradients at all — fills are solid.
- No frosted glass — the legacy `.glass-*` class names render flat white panels with hairline borders; no backdrop blur, no translucent white borders.
- No random brand colors beyond the defined palette: ink (#111827), lime (#B7EC4B fill / #5F821F text-safe "strong" / #F2FBDC tint), indigo (#4F46E5 accent ramp), and the status set. Grays come from the neutral ramp only.
- No white-on-lime — any lime-filled element MUST use ink text/icons (`--interactive-primary-text` is pre-paired). Raw lime is never text, thin strokes, or small dots on white; those use lime-strong (#5F821F, ≥4.5:1).
- No all-caps display headlines.

## Design Principles

1. **State-driven, not page-driven.** Every screen transition follows WebSocket events. The UI is a faithful reflection of server state, not a local navigation tree. Falls in line with the offer-accept dispatch model.

2. **Trust through transparency.** Surge multipliers, fare breakdowns, driver location, ETA — all shown with explicit numbers and labels, never color alone. The rider always knows what's happening and why.

3. **Animated with purpose.** Motion exists to convey state change (driver approaching, offer expiring, trip advancing) or to give the booking surface its premium feel (one considered staggered entrance on the booking sheet, spring-based press/lift feedback via the `--ease-spring` token). It is not scattered decoratively — outside the booking surface, motion stays state-driven only. Every animation respects `prefers-reduced-motion`.

4. **Consistency over creativity.** The design system (tokens.css) is the single source of truth. No component uses hardcoded hex values. No new UI pattern is introduced without a corresponding token or component.

5. **Mobile-first, touch-optimized.** Every interactive control is ≥44×44px. Bottom-sheet patterns dominate for CTAs. Safe areas respected. The map is the primary spatial interface; everything else layers over it.

## Accessibility & Inclusion

- WCAG AA as the baseline. Body text contrast ≥4.5:1.
- `focus-visible` accent ring on all interactive controls.
- Reduced motion fully supported via `prefers-reduced-motion` — animations collapse to 100ms crossfades or snap instantly.
- Non-color redundancy: surge, fares, countdown, status all carry explicit numeric or text labels.
- Icon-only controls carry `aria-label`. Status regions use `role="status"` / `aria-live`.
