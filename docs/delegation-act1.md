# Delegation: v3 Act 1 generator-chain slice

You own implementation and local verification of this slice. Read `docs/v3-phase-redesign-brief.md` and `docs/incremental-design-audit.md` first. Do not redesign the whole game in one pass.

## Goal
Replace the current scalar `recursive` upgrade with a real generator relationship so Act 1 is mechanically different from Act 0. After the first deepening, manual tapping must become optional and the player's attention must move to a visible relationship between counting sheep and ordinary sheep.

## Required behavior
- Introduce explicit state for counting-sheep units/capacity; do not encode this as a hidden multiplier.
- Counting sheep must produce or activate ordinary sheep/capacity over time in a way visible through rates and scene/UI.
- Preserve Act 0 manual count + first automation, but after Act 1 matures manual input must be a small burst rather than required progression.
- Deepening must carry a capability forward; do not reset to the identical five-item shop.
- Keep the current live experience coherent while this slice is implemented; migrate v1/v2 saves defensively.
- Do not implement Act 2 routing or final-law mechanics in this slice.
## Acceptance tests
- Unit tests prove the generator relationship itself, not only total production.
- Pacing simulation logs meaningful events: first automation, Act 1 entry, first counting-sheep unit, point manual tapping becomes <25% of modeled income, Act 1 exit.
- Low/normal/fast input all encounter the generator-chain reveal; fast input cannot skip it.
- No active span >90s may contain only repeated tapping/buying and larger numbers.
- Existing multi-touch/no-scroll behavior must not regress.
- `npm test`, `npm run simulate`, and `npm run build` must pass.

## Delivery
Implement, test, and document the slice in `PROGRESS.md`/`DEVLOG.md`. Do not push or deploy; leave a cleanly reviewable working tree for the lead to inspect. Do not claim the whole v3 is complete. If a product choice is ambiguous, choose the simplest mechanic that makes the generator relationship legible without introducing optimization traps.