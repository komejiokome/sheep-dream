# Sheep Dream v3 — Phase Redesign Brief

Status: design direction approved for implementation delegation; this document does not claim code completion.

## Reference-derived operations

- **A Dark Room:** reveal mechanics only as the player's model of the world expands; mobile pacing must be fast enough to reward curiosity but not so fast that a new system arrives before it is understood.
- **Universal Paperclips:** a major phase may retire an entire objective set and replace it with another while preserving the same thematic imperative.
- **Antimatter Dimensions / Pecorella:** a higher generator producing a lower generator changes the watched relationship, not merely the coefficient on one currency.
- **Cookie Clicker:** prestige converts accumulated history into persistent acceleration; overshoot should remain useful instead of being silently discarded.
- **Realm Grinder:** reset milestones are feature-unlock milestones; a reset earns a new way to play, not only faster replay.
- **Community paradigm-shift discussions:** satisfying shifts automate or obsolete earlier chores and move attention to a new layer.

## Binding v3 thesis

The player should stop manually operating the minute-one loop before the midpoint. Each depth is a different dream rule, not a recolored copy of the same shop. Keep one primary currency where possible, but change what creates it and what the player manipulates.

The finite arc should be authored as four mechanical acts plus a short playable finale, not four prestige copies.
## Proposed phase table

| Act | Entry | Dominant action | Watched value / relation | Structural reveal | Old task compressed | Exit |
| --- | --- | --- | --- | --- | --- | --- |
| 0 Counting | Start | multi-touch count visible sheep | sheep + next automation unlock | first sheep jumps by itself | none yet | automation is self-sustaining |
| 1 Flock | first deepening | buy/awaken counting sheep rather than tap for income | **counting sheep → ordinary sheep** generator chain | sheep can count other sheep; counters reproduce output | manual tap becomes a small optional burst, not required progression | flock becomes self-growing |
| 2 Dream routing | second deepening | assign the growing flock between 2–3 dream roles | distribution between counting / dreaming / remembering | the player now steers production rather than operating it | individual generator purchasing becomes batch/automatic | enough dream pressure rewrites a law |
| 3 Law rewrite | third deepening | choose/trigger concrete world transformations | which visible objects qualify as countable | laws convert scenery into producers with distinct behavior, not multipliers | earlier role allocation increasingly automates | all major scenery categories become countable |
| 4 Everything is sheep | final law | interact with the transformed scene for a short payoff | world conversion/completion meter, not shop efficiency | moon/clouds/stars/fence visibly join production | shop/prestige UI retires | conversion reaches morning threshold; `起きる` appears |

## Mechanical requirements

1. `羊が羊を数える` must be a generator relationship: counting-sheep units produce/activate ordinary sheep or counting capacity over time. It must be visible in rates and scene population.
2. Depth 2 must replace repetitive buying with a tiny allocation/routing interaction. Maximum three roles; no spreadsheet optimization and no trap allocation. Any allocation should progress, with different feel rather than a correct answer.
3. Dream Laws must mutate behavior. Example operations: remove the fence requirement so roaming sheep auto-count on crossing anywhere; allow pairs/groups to count as a batch; counted sheep become counters; scenery objects become countable producers. Do not express these primarily as x1.45-style modifiers.
4. The final law must begin a playable 45–120 second finale in which scenery visibly converts and the previous economy accelerates beyond relevance. `起きる` is locked until the player inhabits this state.
5. Prestige/deepening must carry accumulated history into the next act through unlocked automation/capability. Do not reset the player to the same five-item shop.
## Product-design requirements

- The screen may reconfigure at act boundaries. Do not preserve the v2 dashboard merely for consistency.
- At any moment expose one primary action, one current goal, and one next structural tease. Hide retired controls instead of leaving dead panels.
- Keep the sheep stage as the visual center. Production changes must be visible as population/behavior changes before they are explained numerically.
- Affordability feedback should occur in-place; event log remains secondary.
- Multi-touch remains valid only while manual counting is a meaningful act. Once Act 1 is mature, the UI should make it obvious that tapping is optional.

## Pacing acceptance

- Record meaningful-event timestamps, not just ending time.
- No active segment >90s may contain only repeated tapping/buying plus larger numbers.
- Fast 10 taps/sec play may shorten Act 0, but cannot skip the first automation demonstration or any later structural mechanic.
- Each act must contain a short comprehension window after its reveal before the next act can be triggered.
- Finale target: 45–120s, deliberately overpowered, visually escalating, with no ordinary shop grind.

## Implementation delegation order

1. Replace the scalar `recursive` upgrade with a tested generator-chain model and retire manual tapping as dominant income during Act 1.
2. Rework phase/state schema and save migration around authored acts; keep the current live version playable until a coherent slice passes.
3. Add Act 2 routing with at most three roles and deterministic simulation coverage.
4. Convert Laws from multipliers into behavior mutations, then implement the final conversion payoff.
5. Rebuild mobile presentation around the active act; validate 390x844 and 320x568 after every structural slice.
6. Only after mechanics pass, tune targets/costs using low/normal/fast timelines. Do not tune duration before phase structure exists.