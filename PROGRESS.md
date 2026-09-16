# Sheep Dream - Progress

Status: NEEDS HUMAN REPLAY 窶・v2 implementation and automated/browser checks passed; do not mark complete yet.

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
- Browser interaction: 10 rapid clicks produced exactly 10 click-value gains; tabs, prestige enablement, automatic law-tab handoff, save migration, and depth 1 竊・2 presentation were exercised.
- Browser console: zero warnings and zero errors.

## Remaining acceptance gate

- [x] Automated low / normal / fast pacing checks
- [x] 10 taps/sec does not collapse the progression curve
- [x] Useful capped prestige overflow
- [x] v1 竊・v2 save migration
- [x] Mobile no-scroll core flow at 390 x 844 and 320 x 568
- [x] Desktop/mobile browser smoke checks
- [ ] Clean-save human replay on a physical touch device
- [ ] Human confirmation that the 22-minute normal model feels restful rather than slow
- [ ] Human confirmation that 2窶・ finger tapping does not zoom on target iOS/Android hardware

Human replay remains required by the brief, so this iteration is intentionally not marked COMPLETE.

## 蛻晏ｭｦ閠・髄縺代Γ繝｢

- 縲後す繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ縲阪・縲∽ｺｺ縺梧款縺咎溘＆繧偵・繝ｭ繧ｰ繝ｩ繝縺ｧ蜀咲樟縺励※縲√ご繝ｼ繝縺碁比ｸｭ縺ｧ豁｢縺ｾ縺｣縺溘ｊ荳迸ｬ縺ｧ邨ゅｏ縺｣縺溘ｊ縺励↑縺・°遒ｺ隱阪☆繧九ユ繧ｹ繝医〒縺吶・- 縲後そ繝ｼ繝也ｧｻ陦後阪・縲∽ｻ･蜑阪・迚医〒驕翫ｓ縺險倬鹸繧呈ｶ医＆縺壹↓縲∵眠縺励＞迚医・菫晏ｭ伜ｽ｢蠑上∈隱ｭ縺ｿ譖ｿ縺医ｋ莉慕ｵ・∩縺ｧ縺吶・- 閾ｪ蜍輔ユ繧ｹ繝医→繝悶Λ繧ｦ繧ｶ遒ｺ隱阪′騾壹▲縺ｦ繧ゅ∝ｮ滄圀縺ｮ謖・〒驕翫ｓ縺諢溯ｦ壹∪縺ｧ縺ｯ蛻､譁ｭ縺ｧ縺阪∪縺帙ｓ縲ゅ◎縺ｮ縺溘ａ譛蠕後↓莠ｺ縺ｮ繝ｪ繝励Ξ繧､縺悟ｿ・ｦ√〒縺吶・
