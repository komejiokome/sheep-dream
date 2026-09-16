# Sheep Dream - Progress

Status: NEEDS HUMAN REPLAY — v2 implementation and automated/browser checks passed; do not mark complete yet.

## v2 improvement iteration - 2026-09-16

This iteration replaces the original long-page/mobile flow and the exponential late-game spike with one finite, viewport-contained play surface and a phase-shaped four-depth economy.

### Implemented

- One-screen mobile play at both 390 x 844 and 320 x 568: the sheep scene, all five upgrade purchases, depth control, tabs, rates, and count button remain reachable without page scrolling.
- A dedicated multitouch count surface using pointer input and `touch-action: none`; each concurrent pointer is counted once while zoom gestures are suppressed only on that surface.
- UI rendering throttled from up to 60 full list/log rebuilds per second to 10 lightweight updates per second, with event logs rebuilt only when they change.
- Four distinct phase profiles, depth-gated upgrades, milder multipliers, new story beats, visibly different palettes/scenery, and a full-screen depth transition.
- Prestige overshoot now carries 35% of excess sheep into the next dream, capped at 6% of the next target so overflow is useful without skipping a phase.
- Save format v2 with automatic migration from v1, defensive sanitization, storage-failure tolerance, and resumed hidden-tab progress.
- Keyboard-operable tabs, safe focus states, reduced-motion behavior, and persistent always-reachable count control.

### Measured pacing

| Input model | Total | Depth 1 | Depth 2 | Depth 3 | Depth 4 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Low, 0.75 taps/sec | 36m 11s | 407s | 519s | 557s | 688s |
| Normal, 2 taps/sec | 21m 56s | 184s | 268s | 341s | 523s |
| Fast, 10 taps/sec | 7m 00s | 42s | 69s | 101s | 208s |

The v1 baseline completed in 871 seconds but split its depths 852 / 13 / 3 / 3 seconds. In v2, even sustained 10 taps/sec retains a minimum 42-second phase, and all 4,200 simulated taps are counted.

### Verification

- `npm.cmd test`: 2 files / 15 tests passed.
- `npm.cmd run simulate`: low, normal, and fast deterministic runs all reached the finite wake ending.
- `npm.cmd run build`: Vite production build passed; output was 5.23 kB HTML, 17.03 kB CSS, and 14.86 kB JavaScript before gzip.
- Chrome desktop: stage sheep and count button were both visible in a 1920 x 911 viewport.
- Chrome 390 x 844: document exactly matched the viewport; all upgrade buttons and the count button were visible with no page scroll.
- Chrome 320 x 568: document exactly matched the viewport; all upgrade buttons, rate strip, and count button remained visible.
- Browser interaction: 10 rapid clicks produced exactly 10 click-value gains; tabs, prestige enablement, automatic law-tab handoff, save migration, and depth 1 → 2 presentation were exercised.
- Browser console: zero warnings and zero errors.

## Remaining acceptance gate

- [x] Automated low / normal / fast pacing checks
- [x] 10 taps/sec does not collapse the progression curve
- [x] Useful capped prestige overflow
- [x] v1 → v2 save migration
- [x] Mobile no-scroll core flow at 390 x 844 and 320 x 568
- [x] Desktop/mobile browser smoke checks
- [ ] Clean-save human replay on a physical touch device
- [ ] Human confirmation that the 22-minute normal model feels restful rather than slow
- [ ] Human confirmation that 2–3 finger tapping does not zoom on target iOS/Android hardware

Human replay remains required by the brief, so this iteration is intentionally not marked COMPLETE.

## 初学者向けメモ

- 「シミュレーション」は、人が押す速さをプログラムで再現して、ゲームが途中で止まったり一瞬で終わったりしないか確認するテストです。
- 「セーブ移行」は、以前の版で遊んだ記録を消さずに、新しい版の保存形式へ読み替える仕組みです。
- 自動テストとブラウザ確認が通っても、実際の指で遊んだ感覚までは判断できません。そのため最後に人のリプレイが必要です。
