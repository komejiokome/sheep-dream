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

const PURCHASE_ORDER = ['jumper', 'pillow', 'flock', 'recursive', 'drowse'];
const LEVEL_LIMITS = { pillow: 8, jumper: 10, flock: 10 };

/**
 * Runs a deterministic, plausible play strategy entirely through the public
 * game API. Two clicks per simulated second establish each run, then the
 * player lets automation carry it while buying affordable improvements.
 */
export function simulatePacing(maxSeconds = 30 * 60) {
  let state = createInitialState(0);
  let totalSeconds = 0;
  let runStartedAt = 0;
  const milestones = [{ phase: 'manual', at: 0 }];
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
    const secondsInRun = totalSeconds - runStartedAt;
    if (autoRate(state) < 2 || secondsInRun < 20) {
      state = manualCount(manualCount(state));
    }

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

  return { state, totalSeconds, milestones };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = simulatePacing();
  const summary = {
    reachedEnding: result.state.ended,
    totalSeconds: result.totalSeconds,
    manualClicks: result.state.manualClicks,
    lifetimeSheep: Math.floor(result.state.lifetimeSheep),
    milestones: result.milestones,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!result.state.ended) process.exitCode = 1;
}
