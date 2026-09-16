import { pathToFileURL } from 'node:url';
import {
  LAWS,
  autoRate,
  buyLaw,
  buyUpgrade,
  canBuyLaw,
  canBuyUpgrade,
  canDeepenSleep,
  canWake,
  createInitialState,
  deepenSleep,
  manualCount,
  tick,
  wake,
} from '../src/game.js';

export const PACING_MODES = {
  low: { tapsPerSecond: 0.75, maxSeconds: 45 * 60 },
  normal: { tapsPerSecond: 2, maxSeconds: 30 * 60 },
  fast: { tapsPerSecond: 10, maxSeconds: 20 * 60 },
};

const PURCHASE_ORDER = ['jumper', 'pillow', 'flock', 'recursive', 'drowse'];
const LEVEL_LIMITS = { pillow: 8, jumper: 10, flock: 10 };

/**
 * Deterministic play strategy used to compare input speeds. Every simulated
 * tap is accepted; automation and affordable upgrades continue between taps.
 */
export function simulatePacing(options = PACING_MODES.normal) {
  const { tapsPerSecond = 2, maxSeconds = 30 * 60 } = options;
  let state = createInitialState(0);
  let totalSeconds = 0;
  let runStartedAt = 0;
  let tapCredit = 0;
  const milestones = [{ phase: 'manual', at: 0, tapsPerSecond }];
  let sawAutomation = false;
  let sawRecursive = false;

  const buyAffordableUpgrades = () => {
    let purchased = true;
    while (purchased) {
      purchased = false;
      for (const id of PURCHASE_ORDER) {
        const limit = LEVEL_LIMITS[id] ?? 1;
        if (state.runUpgrades[id] >= limit || !canBuyUpgrade(state, id)) continue;
        state = buyUpgrade(state, id);
        purchased = true;
        if (!sawAutomation && autoRate(state) > 0) {
          sawAutomation = true;
          milestones.push({ phase: 'automation', at: totalSeconds });
        }
        if (!sawRecursive && state.runUpgrades.recursive > 0) {
          sawRecursive = true;
          milestones.push({ phase: 'sheep-count-sheep', at: totalSeconds });
        }
      }
    }
  };

  while (!canWake(state) && totalSeconds < maxSeconds) {
    tapCredit += tapsPerSecond;
    const tapsThisSecond = Math.floor(tapCredit);
    tapCredit -= tapsThisSecond;
    for (let tap = 0; tap < tapsThisSecond; tap += 1) state = manualCount(state);

    buyAffordableUpgrades();
    state = tick(state, 1);
    totalSeconds += 1;
    buyAffordableUpgrades();

    if (canDeepenSleep(state)) {
      const completedDepth = state.sleepDepth;
      state = deepenSleep(state);
      milestones.push({
        phase: 'sleep-prestige',
        depth: state.sleepDepth,
        at: totalSeconds,
        runSeconds: totalSeconds - runStartedAt,
        carry: state.lastPrestigeCarry,
      });
      runStartedAt = totalSeconds;

      const law = LAWS[completedDepth];
      if (law && canBuyLaw(state, law.id)) {
        state = buyLaw(state, law.id);
        milestones.push({ phase: 'dream-law', law: law.id, at: totalSeconds });
      }
    }
  }

  if (canWake(state)) {
    state = wake(state, totalSeconds * 1000);
    milestones.push({ phase: 'wake-ending', at: totalSeconds });
  }

  return { state, totalSeconds, tapsPerSecond, milestones };
}

export function simulateAllPaces() {
  return Object.fromEntries(
    Object.entries(PACING_MODES).map(([name, options]) => [name, simulatePacing(options)]),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = simulateAllPaces();
  const summary = Object.fromEntries(Object.entries(results).map(([name, result]) => [name, {
    reachedEnding: result.state.ended,
    tapsPerSecond: result.tapsPerSecond,
    totalSeconds: result.totalSeconds,
    manualClicks: result.state.manualClicks,
    lifetimeSheep: Math.floor(result.state.lifetimeSheep),
    phases: result.milestones
      .filter((milestone) => milestone.phase === 'sleep-prestige')
      .map(({ depth, at, runSeconds, carry }) => ({ depth, at, runSeconds, carry })),
  }]));
  console.log(JSON.stringify(summary, null, 2));
  if (Object.values(results).some((result) => !result.state.ended)) process.exitCode = 1;
}
