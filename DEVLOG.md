# Sheep Dream - Development Log

## 2026-09-16 - v2 no-scroll mobile and phase-shaped economy

Rebuilt the interaction surface and progression curve after the human baseline scored 2/100. This is an implementation milestone, not a completion claim; a clean-save human replay is still required.

### Redesigned

- Replaced the stacked mobile page with a two-part viewport layout: a permanently visible sheep stage and a compact tabbed control deck. The count action stays fixed at the bottom of the deck, while all five upgrades fit without page scrolling.
- Moved counting from `click` to multitouch-safe `pointerdown` handling. Every pointer produces one count, the count surface blocks browser zoom/pan gestures, and pinch zoom remains available outside that surface.
- Separated the sheep pasture from the count button so the resting and running sheep remain visible instead of being covered by the primary action.
- Added distinct named depths (まどろみ / 雲の寝床 / 星の牧草地 / 数える深海 / 朝のふち), palette and scene changes, a full-screen depth transition, phase-specific story copy, and automatic handoff to each newly unlocked law.
- Replaced the `14 ** depth` economy and large 2x/3x/5x/10x law stack with explicit mild phase profiles, 1.35x–1.8x laws, depth-gated upgrades, and four tuned targets.
- Converted 35% of prestige overshoot into starting sheep for the next phase, with a hard cap of 6% of the next target.

### Additional high-impact fixes found during review

- The old animation loop rebuilt every upgrade button and the full event log up to 60 times per second. Rendering is now capped at 10 updates per second, and logs only rebuild when their contents change.
- Local storage exceptions could stop saving and interrupt gameplay. Save writes now fail safely.
- Returning to a still-open hidden tab discarded elapsed time because animation-frame delta was capped. Visibility changes now save on hide and apply bounded offline production on return.
- Delegated shop clicks now use `closest(...)`, so nested button contents cannot break purchases.
- Tabs now expose correct keyboard arrow navigation and selected state.

### Economy measurements

- v1 baseline depth times: 852 / 13 / 3 / 3 seconds (871 seconds total).
- v2 low input, 0.75 taps/sec: 407 / 519 / 557 / 688 seconds (2,171 total).
- v2 normal input, 2 taps/sec: 184 / 268 / 341 / 523 seconds (1,316 total).
- v2 fast input, 10 taps/sec: 42 / 69 / 101 / 208 seconds (420 total and all 4,200 taps counted).

### Verification

- Vitest: 15/15 checks passed across core economy, phase unlocks, capped overflow, v1 migration, offline progress, and three deterministic pacing modes.
- Production build: passed (5.23 kB HTML, 17.03 kB CSS, 14.86 kB JavaScript before gzip).
- Chrome at 390 x 844: page height equaled viewport height; all upgrades and the count control were visible.
- Chrome at 320 x 568: page height equaled viewport height; all upgrades, rates, and the count control were visible.
- Chrome desktop at 1920 x 911: the sheep and core count control were both visible.
- Browser interaction covered 10 rapid taps, all three tabs, prestige activation, depth transition, automatic law-tab selection, and v1 save hydration; no console warnings or errors appeared.

### Next

Run a clean-save human replay on physical iOS/Android hardware. Record actual first-run depth times, comfort at 2–3 finger tapping, accidental zoom behavior, purchase comprehension, and whether the final phase still feels too long. Keep status open until that replay is complete.

## 2026-09-16 - Playable responsive milestone

Implemented the first coherent playable milestone from the initial uncommitted prototype.

### Added

- A complete responsive night-sky interface in `src/styles.css` with desktop and mobile layouts, animated sheep, depth-driven color changes, focus-visible states, and reduced-motion support.
- Nine deterministic Vitest checks covering manual production, upgrade costs, automation, prestige, laws, ending behavior, versioned save hydration, corrupt-value sanitization, offline progress, and full-run determinism.
- `npm run simulate`, a deterministic public-API play strategy that verifies the intended phase order and finite ending.
- Accessible progress-bar semantics and live progress updates.

### Fixed

- Capped sleep depth at 4 so the finite ending cannot accidentally continue into unintended prestige levels.
- Added defensive normalization for malformed version-1 localStorage data.
- Rendered saved event-log text through `textContent` rather than HTML parsing.
- Removed the production-build warning by providing the referenced stylesheet.

### Verification

- Tests: 9/9 passed across 2 files.
- Pacing simulation: completed in 871 seconds, with automation at 16 seconds, recursive sheep at 575 seconds, four prestiges, all four laws, and the wake ending.
- Production build: succeeded; output includes bundled CSS and JavaScript.
- Chrome smoke test: desktop and 390 x 844 mobile layouts inspected; core controls exercised; saved state restored after reload; no browser warnings or errors were reported.

### Next

Run one unassisted clean-save human playtest and use the observed first-prestige time and purchasing behavior to decide whether the first-run economy needs a focused adjustment.

## 2026-09-16 - Final verification and release

The completed vertical slice was revalidated after GitHub Pages deployment.

### Verification

- Unit/pacing suite passed: 9/9 tests.
- Deterministic full-run simulation reached the wake ending in 871 seconds.
- Production Vite build completed successfully.
- Published Pages endpoint returned HTTP 200 and expected HTML.
- Repository was clean and synchronized with `origin/main` before this ledger-only completion update.

### Status

All defined acceptance criteria are satisfied. Remaining human clean-save playtesting is optional subjective economy tuning rather than a release blocker.
