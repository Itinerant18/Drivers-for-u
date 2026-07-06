---
target: rider-app home (glass/bento redesign)
total_score: 23
p0_count: 1
p1_count: 2
timestamp: 2026-07-06T06-09-07Z
slug: rider-app-app-app-home-page-tsx
---
Method: dual-agent (A: general-purpose design-director review · B: general-purpose detector+browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Blocker-named CTA + shimmer + surge chip are strong; garage/city-config/nearby failures silently swallowed (`.catch(() => {})`) |
| 2 | Match System / Real World | 3 | Plain-language trip hints; "D4M Care" is unexplained legacy jargon; "Mini Out." truncates cryptically |
| 3 | User Control and Freedom | 3 | Review-before-book, swap, clear controls exist; city chip (KOL/BLR) is a placebo control — affects nothing |
| 4 | Consistency and Standards | 1 | Two palettes at war (tokens.css steel-blue vs globals.css bento indigo); mixed radii; dark-mode CSS in a light-only product |
| 5 | Error Prevention | 3 | Blocker gating, schedule clamping, Monthly disabled — solid |
| 6 | Recognition Rather Than Recall | 3 | Review sheet echoes every choice; "Persons" carries zero context |
| 7 | Flexibility and Efficiency | 2 | Rebook restores raw coordinates ("Last pickup/drop"), discards the real address; no saved places for a weekly booker |
| 8 | Aesthetic and Minimalist Design | 1 | Glows, beams, sheens, shimmers, glass on a brand whose own doc says "stays out of the way" |
| 9 | Error Recovery | 2 | Booking-failure toast + inline alert is good; silent catches elsewhere leave no recovery path |
| 10 | Help and Documentation | 2 | Per-tier hints + D4M info modal exist, but the hint text is 11px at ~3.3:1 contrast |
| **Total** | | **23/40** | **Acceptable — significant improvements needed before users are happy** |

## Anti-Patterns Verdict

**Surface: yes. Structure: no.** A working designer clocks the skin as AI/template output in seconds — it's the 2025 "premium AI" kit almost item-for-item: glassmorphism as the *default* surface (`.glass-tile`/`.glass-panel`/`.glass-sheet` wrap every element, directly banned by PRODUCT.md), blurred ambient gradient blobs drifting 24s on loop, an indigo-violet gradient CTA with a 6s sheen sweep, ported component-registry pieces (`BorderBeam`, `TubelightNavbar` — the well-known 21st.dev demo, still carrying `dark:` variants in a light-only app), and uniform staggered fade-up entrance motion on every tile at 2-3× the product register's own 150-250ms budget.

What survives: hand-drawn per-class car silhouettes and payment glyphs in one stroke family, the blocker-driven CTA copy, a width-matched fare skeleton, a real review-before-commit sheet. **The IA was designed; the skin was pasted.**

**Deterministic scan (CLI, 4 findings):** 3× bounce-easing (`--ease-spring` token + `.animate-spring-up` utility in globals.css — a systematic, named motion token consumed by 10+ modal/sheet call sites app-wide, not a one-off; tagged **possible-intentional** by the detector, though Assessment A independently flags its overshoot physics as louder than the product register calls for) + 1× layout-transition in `kinetic-text.tsx` (animates `padding`/`width` on hover — **not used on this screen**, only on the referral page, out of scope here).

**Browser overlay** (injected on the live build, partial page due to a runtime error — see caveat below): 5 findings — `low-contrast` **1.1:1** white text on a pink `#fbeceb` geo-error toast ("Location unavailable"), a second `low-contrast` reading right at the 4.5:1 boundary, `cramped-padding` on the MapLibre attribution control, `gpt-thin-border-wide-shadow` (1px border + 40px shadow) on the bottom tab bar, and `flat-type-hierarchy` (10.5/12/14/16px, ~1.5 ratio steps) in the visible chunk. The 1.1:1 toast finding is new evidence neither assessment's manual pass caught elsewhere — a real, severe hit on an error-state element. The tab-bar shadow finding corroborates Assessment A's independent live-inspection finding of a dark glow "smudge" on the same nav bar (different specific defect, same broken component). **Caveat**: the overlay ran against a page that hit a client error boundary (stubbed API shape mismatch — `a.find is not a function`), so it scanned the map/toast/tab-bar/error-state, not the fully populated booking sheet; treat it as confirmed for what it saw, not exhaustive.

## Overall Impression

The booking logic is genuinely well thought through — blocker-driven CTA, review-before-commit, transparent fare breakdown. But the visual skin is un-committed template glass laid over it, and that skin ships with two verifiable defects: the primary CTA's text is barely legible on its own gradient, and the bottom nav's glow renders as a dark smudge instead of light. The single biggest opportunity is resolving the brand fork this screen created — tokens.css says steel-blue and flat, globals.css says indigo and glowing, PRODUCT.md bans the second one outright. Until one of those wins in writing, every future screen forks the identity again.

## What's Working

1. **Blocker-driven CTA** (`bookingBlocker` → CTA label): "Set pickup location" → "Add drop-off" → "Choose your car" → "Getting fare…" → "Confirm Booking". The button doubles as a progress indicator and makes an otherwise-gated form fully navigable — the strongest idea on the screen.
2. **Trust plumbing at the money moment**: review-and-confirm sheet with per-line rows, paise-accurate mono fare, an explicit labeled surge multiplier, and a breakdown modal. Directly delivers the product's own "trust through transparency" principle.
3. **Bespoke, restrained iconography**: four hand-drawn car silhouettes and four payment glyphs in one 1.5px stroke family, plus a width-matched fare skeleton that never jumps on load — real craft, not a template dump.

## Priority Issues

**[P0] CTA and active-state text is unreadable on its own gradient.** `--color-content-inverse` is never mapped in the `@theme` block (globals.css only maps primary/secondary/tertiary/accent/positive/warning/negative). Verified live: the "Confirm Booking" label, active trip pill, and active transmission segment render `#1A1A1A` (charcoal) on the `#0040E0→#4F46E5` gradient — **2.3-3.4:1**, a WCAG fail on the single highest-stakes button in the app.
**Why it matters**: this is the exact "money moment" the product's own design principles call out for trust — and it currently looks half-broken.
**Fix**: add `--color-content-inverse: var(--content-inverse);` to the `@theme` map; audit for other unmapped inverse utilities.
**Suggested command**: `/impeccable polish`

**[P1] Brand identity fork — two palettes asserting different truths.** `globals.css` carries a block literally labeled `/* ── Custom Bento Colors ── */` overriding `--secondary` to electric indigo, while `tokens.css` still declares steel-blue `#4A6FA5` as the accent and calls itself "the single source of truth." PRODUCT.md bans glassmorphism-as-default, glow shadows, and off-palette color — this screen now violates all three, unresolved in the doc.
**Why it matters**: without a decision, every next screen forks the identity again; the repo currently contains two contradictory brands.
**Fix**: pick one in writing. Cheapest coherent path: keep the bento IA, revert the surface to flat charcoal/steel-blue per current PRODUCT.md, delete the glow shadow + ambient blobs. Otherwise formalize the bento direction and update PRODUCT.md + tokens.css + the driver app to match.
**Suggested command**: `/impeccable quieter` (if reverting to restrained) or `/impeccable document` (if formalizing bento as the new system)

**[P1] Bottom nav renders a dark smudge instead of a glow.** The tubelight navbar's "neon" emitter glows using `--interactive-primary`, which is charcoal `#1A1A1A` — so the blurred glow layers over the active tab render as a dark smoke blob, visible in every screenshot. Corroborated independently by the detector's `gpt-thin-border-wide-shadow` hit on the same element (1px border + 40px shadow blur).
**Why it matters**: a component ported from a dark-theme demo, unadapted, now looks like screen dirt on every single screen in the app (bottom nav is global chrome).
**Fix**: strip the emitter/glow layers and keep the `layoutId` pill, or replace with a flat DS tab bar.
**Suggested command**: `/impeccable polish`

**[P2] Overload via non-disclosure.** ~8 co-present decision zones on one scroll (trip type ×6, route, when, transmission ×2, car class ×5, fare/promo, 2 add-ons, payment ×4, persons) — 4½ of 8 cognitive-load checklist items fail. The grouping itself is well-built (bento clusters route+when, car+spec, fare+promo correctly); the failure is that rare-use controls (promo, persons, both add-on toggles) sit permanently on-canvas at the same visual weight as pickup/drop-off.
**Why it matters**: a first-time or distracted user faces the same weight for "set your pickup" and "apply a promo code" — the primary task drowns.
**Fix**: move promo, persons, and both add-on toggles into the review sheet or one collapsed "Options" disclosure; the sheet drops from ~8 zones to 4.
**Suggested command**: `/impeccable distill`

**[P2] Fare goes stale — silently — during refetch.** The fare shimmer only shows when `isSearching && !fareEstimate`; once a first estimate lands, the *previous* number stays fully visible (undimmed) while a new one is fetched. Toggling D4M Care leaves the stale ₹324 on screen while the true fare quietly becomes ₹373.
**Why it matters**: this is a silent money mutation at the app's highest-trust interaction — the opposite of the product's own "trust through transparency" principle.
**Fix**: dim + `aria-busy` the fare tile whenever `isSearching` is true, even if a previous estimate exists.
**Suggested command**: `/impeccable harden`

## Persona Red Flags

**Casey (distracted, one-handed mobile)**: 6 trip pills in a horizontal scroller sit in the high-reach zone with the 5th/6th option clipped off-viewport at 390px width. Swap button (36px), persons steppers (40px), D4M info button (24px) all sit under the 44px touch-target floor the product's own principles set. "Confirm Booking" sits ~16px above the floating nav pill, inviting mis-taps into Home/Trips while walking.

**Jordan (first-timer booking a driver for the first time)**: the core concept — *a driver comes to drive your own car* — is never stated on screen. Worse, the car-class carousel ("4 seats · 2 bags" metadata) reads exactly like picking a taxi category, actively teaching the wrong (Uber) mental model; you don't shop for seats in a car you already own. "D4M Care" is an unexplained legacy abbreviation in an app branded Vahnly. The one sentence meant to teach the trip-type mental model (the hint) renders at 11px, ~3.3:1 contrast — nearly invisible to exactly the user who needs it most.

**Car-owner professional (weekly booker, expects Uber-grade polish)**: Rebook restores raw coordinates labeled "Last pickup"/"Last drop" — the real address is discarded, reading as data loss; no saved places (home/work) exist for the highest-frequency shortcut this persona needs. The city chip (KOL/BLR) is unpersisted local state that does nothing — power users notice placebo controls fast. The charcoal-on-gradient CTA and the dark nav smudge read as a broken build, the opposite of the premium impression the redesign is chasing.

## Minor Observations

- Sub-44px touch targets beyond the swap button: persons steppers (40px), D4M info (24px), "Soon" badge text (9px, also borderline-failing contrast at ~4.3:1).
- Secondary/placeholder text (`#7E7E77` on frosted glass over the ambient glows) sits around 3.9:1 in places — under the 4.5:1 floor the product's own accessibility section sets.
- Four infinite idle-loop animations run simultaneously by default (`auraDrift` 24s, `ctaSheen` 6s, `badgeShimmer` 5s, `BorderBeam` 8s) on a battery-constrained PWA; reduced-motion is handled properly (credit due), but default users get all four running at once.
- Dead CSS: an unused `.dark` block and a large inventory of unused shadcn oklch/rainbow/ripple keyframes sit in `globals.css` — cleanup candidate whenever the palette question above is resolved.
- `kinetic-text.tsx`'s layout-transition finding (animates `padding`/`width`) is real but out of scope — that component isn't used on this screen.
- `BorderBeam colorFrom="#1a5cff"` is a hardcoded hex directly in component JSX, violating the product's own "no component uses hardcoded hex values" rule.

## Questions to Consider

- Would this screen lose anything if shipped flat — same bento chunking, same blocker CTA, same review sheet, on off-white cards with hairline borders? If the honest answer is "it would look less premium," the glass may be compensating for typography/spacing that haven't earned the premium on their own.
- The rider's own car is the product's core noun — why does the car-spec step read as a taxi-class picker instead of "Your Honda City · WB-02-AB-1234" with a one-tap change?
- Who owns the brand's source of truth? Three artifacts (tokens.css, globals.css, PRODUCT.md) currently disagree with each other — until one wins, this fork repeats on the next screen.
