import { describe, expect, it } from 'vitest';
import {
  MAX_SLEEP_DEPTH,
  SAVE_VERSION,
  applyOfflineProgress,
  autoRate,
  buyLaw,
  buyUpgrade,
  canBuyLaw,
  canDeepenSleep,
  canWake,
  clickValue,
  createInitialState,
  deepenSleep,
  manualCount,
  normalizeState,
  prestigeTarget,
  tick,
  upgradeCost,
  wake,
} from '../src/game.js';

describe('core progression', () => {
  it('counts manually without mutating the previous state', () => {
    const initial = createInitialState(100);
    const counted = manualCount(initial);

    expect(initial.sheep).toBe(0);
    expect(counted.sheep).toBe(1);
    expect(counted.lifetimeSheep).toBe(1);
    expect(counted.manualClicks).toBe(1);
  });

  it('deducts upgrade costs and scales manual and automatic production', () => {
    let state = { ...createInitialState(0), sheep: 100 };
    expect(upgradeCost(state, 'pillow')).toBe(12);
    state = buyUpgrade(state, 'pillow');
    expect(state.sheep).toBe(88);
    expect(clickValue(state)).toBe(2);
    expect(upgradeCost(state, 'pillow')).toBe(27);

    state = buyUpgrade(state, 'jumper');
    expect(autoRate(state)).toBe(0.5);
    const afterTick = tick(state, 10);
    expect(afterTick.sheep).toBe(state.sheep + 5);
    expect(afterTick.elapsedSeconds).toBe(10);
  });

  it('prestiges exactly four times, awards shards, and preserves dream laws', () => {
    let state = createInitialState(0);

    for (let depth = 0; depth < MAX_SLEEP_DEPTH; depth += 1) {
      state = { ...state, sheep: prestigeTarget(depth) };
      expect(canDeepenSleep(state)).toBe(true);
      state = deepenSleep(state);
      expect(state.sleepDepth).toBe(depth + 1);
      expect(state.dreamShards).toBe(depth + 1);

      const lawIds = ['skipFence', 'doubleCount', 'countCounters', 'notSheep'];
      const lawId = lawIds[depth];
      expect(canBuyLaw(state, lawId)).toBe(true);
      state = buyLaw(state, lawId);
      expect(state.laws[lawId]).toBe(true);
      expect(state.dreamShards).toBe(0);
    }

    state = { ...state, sheep: prestigeTarget(MAX_SLEEP_DEPTH) };
    expect(canDeepenSleep(state)).toBe(false);
    expect(canWake(state)).toBe(true);
  });

  it('applies law multipliers and records a finite ending summary', () => {
    let state = {
      ...createInitialState(0),
      sleepDepth: 4,
      laws: { skipFence: true, doubleCount: true, countCounters: true, notSheep: true },
      runUpgrades: { pillow: 1, jumper: 2, flock: 0, recursive: 1, drowse: 1 },
      elapsedSeconds: 42,
    };

    expect(clickValue(state)).toBe(2 * (14 ** 4) * 2 * 3 * 10 * 3);
    expect(autoRate(state)).toBe(1 * 4 * 5 * (14 ** 4) * 2 * 3 * 10 * 3);
    state = wake(state, 50_000);
    expect(state.ended).toBe(true);
    expect(state.wakeSummary).toMatchObject({ elapsedSeconds: 42, sleepDepth: 4, endedAt: 50_000 });
    expect(manualCount(state)).toBe(state);
    expect(tick(state, 10)).toBe(state);
  });
});

describe('versioned saves and offline progress', () => {
  it('hydrates a partial current-version save and rejects a different version', () => {
    const hydrated = normalizeState({
      version: SAVE_VERSION,
      sheep: 25,
      runUpgrades: { jumper: 2 },
      startedAt: 10,
      lastSavedAt: 20,
    }, 100);
    expect(hydrated.runUpgrades).toMatchObject({ pillow: 0, jumper: 2, flock: 0 });
    expect(hydrated.laws).toEqual({});
    expect(hydrated.startedAt).toBe(10);

    const reset = normalizeState({ version: SAVE_VERSION + 1, sheep: 999 }, 100);
    expect(reset).toMatchObject({ version: SAVE_VERSION, sheep: 0, startedAt: 100 });
  });

  it('sanitizes invalid save values before they can poison production', () => {
    const state = normalizeState({
      version: SAVE_VERSION,
      sheep: -1,
      lifetimeSheep: Number.NaN,
      sleepDepth: 99,
      dreamShards: -5,
      runUpgrades: { jumper: -2, recursive: 7 },
    }, 100);

    expect(state.sheep).toBe(0);
    expect(state.lifetimeSheep).toBe(0);
    expect(state.sleepDepth).toBe(MAX_SLEEP_DEPTH);
    expect(state.dreamShards).toBe(0);
    expect(state.runUpgrades.jumper).toBe(0);
    expect(state.runUpgrades.recursive).toBe(1);
  });

  it('grants deterministic offline production and caps it at four hours', () => {
    const base = {
      ...createInitialState(0),
      lastSavedAt: 1_000,
      runUpgrades: { ...createInitialState(0).runUpgrades, jumper: 2 },
    };
    const afterMinute = applyOfflineProgress(base, 61_000);
    expect(afterMinute.sheep).toBe(60);
    expect(afterMinute.elapsedSeconds).toBe(60);
    expect(afterMinute.lastSavedAt).toBe(61_000);

    const afterDay = applyOfflineProgress(base, 86_401_000);
    expect(afterDay.sheep).toBe(14_400);
    expect(afterDay.elapsedSeconds).toBe(14_400);
  });
});
