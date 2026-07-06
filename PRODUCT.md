# Product

## Register

product

## Users

Riders who own cars and need professional drivers to drive them. They book in-city trips, hourly blocks, outstation routes, or monthly arrangements. Primary context: mobile-first, on-the-go, opening the app to schedule or request an immediate driver. Secondary: reviewing trip history, managing payments and account settings.

## Product Purpose

Vahnly connects car-owning riders with vetted drivers for their own vehicle. Unlike ride-hailing, the rider owns the car and the driver travels to it. The platform handles dispatch (offer-accept model), real-time GPS tracking, live trip state, fare calculation, and payment settlement. Success = reliable driver arrival, transparent pricing, and a frictionless end-to-end trip experience.

## Brand Personality

Premium, Dependable, Refined. The interface earns its polish — warm off-white canvas and charcoal ink as the base, with a frosted-glass booking surface and a deep indigo-to-violet brand gradient (#0040E0 → #2563EB → #4F46E5) carrying emphasis on the primary action and active states. Every element has a job; the glass and gradient are used deliberately at the booking surface and CTA, not scattered decoratively across the whole app. The brand earns trust through clarity and consistency, not flash — polish serves legibility and hierarchy, it never substitutes for them.

## Anti-references

- No dark mode. Single warm off-white light theme.
- No gradient text (`background-clip: text`) — the brand gradient lives on surfaces/buttons, never behind text.
- No glassmorphism scattered arbitrarily — frosted glass is reserved for the booking surface (tiles, panels, sheet) as a deliberate, named system (`.glass-tile`/`.glass-panel`/`.glass-sheet`), not applied ad hoc to unrelated screens.
- No random brand colors beyond the defined palette: charcoal (#1A1A1A) for ink/emphasis, steel-blue (#4A6FA5) for informational accents/focus rings/borders, and the brand gradient (#0040E0/#2563EB/#4F46E5, `tokens.css` `--brand-secondary*`) reserved for the primary CTA and active-state indicators only.
- No unmapped inverse text — any element using the brand gradient as a background MUST use `--color-content-inverse`, verified against 4.5:1 contrast. This was shipped broken once (charcoal text on the gradient CTA); never again silently.
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
