# Incremental Design Audit Baseline

This document is the reference frame for Sheep Dream improvement runs. It is not a list of features to copy. It extracts repeatable design properties from strong incremental games and production writeups, then turns them into audit questions.

## Reference set

- A Dark Room — Game Developer, "A Dark Room's unique journey from the web to iOS". Key idea: mechanics and player understanding expand together; mobile pacing was repeatedly tuned by watching where first-time players lost interest.
- Universal Paperclips — VICE analysis/interview material. Key idea: sub-goals repeatedly replace one another; whole objective sets disappear and are replaced at major phase changes.
- Antimatter Dimensions — official/community wiki. Key idea: higher generators produce lower generators; prestige layers unlock new systems rather than only bigger multipliers.
- Cookie Clicker — Cookie Clicker Wiki ascension guide. Key idea: ascension converts accumulated history into permanent progression and supports overshooting rather than punishing it.
- Realm Grinder — community wiki Reincarnation/Progress Agenda. Key idea: reset tiers are also scheduled feature-unlock milestones, not merely production boosts.
- Anthony Pecorella, Game Developer, Math of Idle Games Parts I–III. Key idea: cost/production growth, generator relevance, derivative generator chains, and prestige must be balanced as curves rather than isolated multipliers.
- r/incremental_games design discussion. Recurring community theme: strong incrementals recontextualize or automate older tedious actions while introducing a new scope of play; merely repeating the minute-1 loop with larger values feels hollow to many players.

## Core audit rule

Every major phase must change at least one of these, preferably two:
1. what the player physically does;
2. what the player watches;
3. what resource relationship the player reasons about;
4. what old task becomes automated/compressed;
5. what the fiction now means.

A palette change, larger number, or standalone multiplier does not count as a phase change.
## Product-design audit

For each reachable mobile state at 390x844 and 320x568:
- Identify the single current goal in under 2 seconds from a screenshot alone.
- Current resource, next meaningful unlock, and affordance to act must be visible without scrolling.
- A newly affordable purchase must be visually legible without reading a log.
- The main active input cannot cover the object that input is supposed to animate or celebrate.
- Frequent actions need large stable hit targets and must not shift position as numbers or text change.
- Rapid multi-touch must not zoom, select text, scroll, or lose valid inputs.
- Secondary explanation/history may be behind tabs; current action and current consequence may not be.
- A structural unlock deserves a structural presentation change, not only toast text or recoloring.

## Level-design audit

For each phase, record: entry event, dominant action, dominant watched value, first meaningful purchase time, first automation time, first interaction change, exit condition, expected duration by tap profile, and what becomes obsolete at exit.

Reject a phase if:
- its dominant action/watch target is materially identical to the previous phase;
- more than ~25% of its duration is empty waiting with no new decision, reveal, or visible acceleration;
- one purchase accounts for most of the phase's total acceleration unless that purchase is intentionally staged as the climax;
- a fast player can skip a structural reveal before seeing/using it;
- prestige turns the next phase into a few-second formality;
- overflow is destroyed without feedback, or overflow completely bypasses the next phase;
- the optimal action is obvious and repeated enough that the player is effectively operating a vending machine.

## Reward-cadence audit

Track meaningful events rather than purchases. Meaningful events are: new action, automation, new generator relationship, new visible entity, new rule, new resource, prestige/compression, narrative/world reframe, or deliberate domination of an old wall.

For this short game, target frequent early events and increasing event significance later. If 60–90 seconds pass during active play with only "same action, larger amount", flag the segment for redesign rather than simply lowering its target.
## Current v2 diagnosis after 5/100 human replay

- Depth profiles change numeric coefficients, not the player's activity. Manual tapping remains the same verb from start to ending.
- The five upgrades are all scalar production improvements. Unlocking `flock`, `recursive`, and `drowse` changes magnitude but does not introduce a new resource relationship or interaction loop.
- The four named Dream Laws are fictionally radical but mechanically only 1.35x/1.6x/1.8x/1.45x multipliers. The implementation does not deliver the promise of "rewriting a law".
- Dream Shards are a single-use gate currency with almost no allocation tension: each depth grants the amount needed for the next obvious law.
- Prestige changes palette/copy and resets the same shop. It does not sufficiently automate/compress the old task or introduce a new dominant watched system.
- The final law immediately enables waking, so the most conceptually extreme state has no mastery/payoff run in which the player gets to inhabit it.
- The 10 taps/sec model being exactly seven minutes is not itself the defect; the defect is that those seven minutes contain too few distinct kinds of play.

## Redesign requirement

Do not solve the 5/100 result primarily by lengthening targets or weakening multipliers. At least two middle/late phases must gain genuinely new mechanics or generator relationships, and at least one old action must become obsolete/automated as the player's attention moves elsewhere. The final "everything can count as sheep" state must be played, not merely unlocked immediately before the ending.

## 2026-09-16 reference check: Act 1 implementation gate

Fresh source check reinforced the v3 direction rather than suggesting more scalar tuning. Amir Rajan described mobile A Dark Room pacing as needing to progress quickly without confusing the player, and described the game opening from a one-button surface into a substantially more complex game. Frank Lantz describes Universal Paperclips as beginning with manual clips, then automation and escalating scope; contemporary descriptions emphasize pattern/repetition/variation and deliberate gear shifts. Pecorella Part II explicitly contrasts the standard many-generators-to-one-currency model with alternative growth structures; Part III treats prestige as a loop/pattern design problem. Antimatter Dimensions' Infinity Dimensions explicitly use higher tiers producing lower tiers. Cookie Clicker's current wiki states ascension resets current progress while permanent heavenly upgrades persist, and its guide explicitly says overshooting ascension milestones need not slow progress if later important upgrades are bought. Realm Grinder's Reincarnation table schedules Challenges, Research, factions, Ascensions, and Lineages across reset milestones.

**Lead inference:** the highest-impact next slice remains the Act 1 generator chain. It simultaneously changes the resource relationship, moves attention away from raw tapping, and makes the fiction `羊が羊を数える` mechanically true. No duration tuning should precede this slice.

Implementation ownership and acceptance criteria are in `docs/delegation-act1.md`. The lead must reject any implementation that represents counting sheep only as a multiplier, or that lets fast input skip seeing the new relationship.