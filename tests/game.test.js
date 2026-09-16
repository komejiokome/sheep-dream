import { describe, expect, it } from 'vitest';
import {
  MAX_SLEEP_DEPTH,
  SAVE_VERSION,
  applyOfflineProgress,
  autoRate,
  buyLaw,
  buyUpgrade,
  canBuyLaw,
  canBuyUpgrade,
  canDeepenSleep,
  canWake,
  clickValue,
  createInitialState,
  deepenSleep,
  manualCount,
  normalizeState,
  prestigeCarry,
  prestigeTarget,
  tick,
  upgradeCost,
  wake,
} from '../src/game.js';

describe('core progression', () => {
  it('counts every manual input without mutating the previous state', () => {
    const initial = createInitialState(100);
    let counted = initial;
    for (let tap = 0; tap < 30; tap += 1) counted = manualCount(counted);

    expect(initial.sheep).toBe(0);
    expect(counted.sheep).toBe(30);
    expect(counted.lifetimeSheep).toBe(30);
    expect(counted.manualClicks).toBe(30);
  });

  it('uses gentler upgrade scaling for manual and automatic production', () => {
    let state = { ...createInitialState(0), sheep: 100 };
    expect(upgradeCost(state, 'pillow')).toBe(18);
    state = buyUpgrade(state, 'pillow');
    expect(state.sheep).toBe(82);
    expect(clickValue(state)).toBeCloseTo(1.55);
    expect(upgradeCost(state, 'pillow')).toBe(33);

    state = buyUpgrade(state, 'jumper');
    expect(autoRate(state)).toBeCloseTo(0.65);
    const afterTick = tick(state, 10);
    expect(afterTick.sheep).toBeCloseTo(state.sheep + 6.5);
    expect(afterTick.elapsedSeconds).toBe(10);
  });

  it('unlocks phase-specific upgrades instead of exposing the late game at once', () => {
    let state = { ...createInitialState(0), sheep: 10_000 };
    expect(canBuyUpgrade(state, 'flock')).toBe(false);
    expect(canBuyUpgrade(state, 'recursive')).toBe(false);
    expect(canBuyUpgrade(state, 'drowse')).toBe(false);

    state = { ...state, sleepDepth: 1 };
    expect(canBuyUpgrade(state, 'flock')).toBe(true);
    expect(canBuyUpgrade(state, 'recursive')).toBe(false);
    state = { ...state, sleepDepth: 3 };
    expect(canBuyUpgrade(state, 'recursive')).toBe(true);
    expect(canBuyUpgrade(state, 'drowse')).toBe(true);
  });

  it('prestiges four times, resets run upgrades, and preserves dream laws', () => {
    let state = createInitialState(0);
    const lawIds = ['skipFence', 'doubleCount', 'countCounters', 'notSheep'];

    for (let depth = 0; depth < MAX_SLEEP_DEPTH; depth += 1) {
      state = { ...state, sheep: prestigeTarget(depth) };
      expect(canDeepenSleep(state)).toBe(true);
      state = deepenSleep(state);
      expect(state.sleepDepth).toBe(depth + 1);
      expect(state.dreamShards).toBe(depth + 1);
      expect(state.runUpgrades.pillow).toBe(0);

      const lawId = lawIds[depth];
      expect(canBuyLaw(state, lawId)).toBe(true);
      state = buyLaw(state, lawId);
      expect(state.laws[lawId]).toBe(true);
      expect(state.dreamShards).toBe(0);
    }

    expect(canDeepenSleep({ ...state, sheep: 1e12 })).toBe(false);
    expect(canWake(state)).toBe(true);
  });

  it('converts overshoot into useful next-run sheep with a hard six-percent cap', () => {
    const target = prestigeTarget(0);
    const nextTarget = prestigeTarget(1);
    const modest = { ...createInitialState(0), sheep: target + 100 };
    expect(prestigeCarry(modest)).toBe(35);
    expect(deepenSleep(modest).sheep).toBe(35);

    const huge = { ...createInitialState(0), sheep: target + 1_000_000 };
    expect(prestigeCarry(huge)).toBe(Math.floor(nextTarget * 0.06));
    const deepened = deepenSleep(huge);
    expect(deepened.lastPrestigeCarry).toBe(Math.floor(nextTarget * 0.06));
    expect(deepened.sheep).toBe(deepened.lastPrestigeCarry);
  });

  it('keeps late-game multipliers finite and records a wake summary', () => {
    let state = {
      ...createInitialState(0),
      sleepDepth: 4,
      laws: { skipFence: true, doubleCount: true, countCounters: true, notSheep: true },
      runUpgrades: { pillow: 1, jumper: 2, flock: 1, recursive: 1, drowse: 1 },
      elapsedSeconds: 42,
    };

    expect(clickValue(state)).toBeGreaterThan(1);
    expect(clickValue(state)).toBeLessThan(100);
    expect(autoRate(state)).toBeGreaterThan(100);
    expect(autoRate(state)).toBeLessThan(10_000);
    state = wake(state, 50_000);
    expect(state.ended).toBe(true);
    expect(state.wakeSummary).toMatchObject({ elapsedSeconds: 42, sleepDepth: 4, endedAt: 50_000 });
    expect(manualCount(state)).toBe(state);
    expect(tick(state, 10)).toBe(state);
  });
});

describe('versioned saves and offline progress', () => {
  it('migrates a version-1 save without losing player progress', () => {
    const migrated = normalizeState({
      version: 1,
      sheep: 25,
      lifetimeSheep: 100,
      sleepDepth: 2,
      dreamShards: 3,
      runUpgrades: { jumper: 2 },
      laws: { skipFence: true },
      startedAt: 10,
      lastSavedAt: 20,
    }, 100);

    expect(migrated).toMatchObject({
      version: SAVE_VERSION,
      sheep: 25,
      lifetimeSheep: 100,
      sleepDepth: 2,
      dreamShards: 3,
      lastPrestigeCarry: 0,
    });
    expect(migrated.runUpgrades).toMatchObject({ pillow: 0, jumper: 2, flock: 0 });
    expect(migrated.laws.skipFence).toBe(true);
  });

  it('hydrates version 2, rejects unknown versions, and sanitizes poisoned values', () => {
    const hydrated = normalizeState({
      version: SAVE_VERSION,
      sheep: -1,
      lifetimeSheep: Number.NaN,
      sleepDepth: 99,
      dreamShards: -5,
      lastPrestigeCarry: -4,
      runUpgrades: { jumper: -2, pillow: 10_000, recursive: 7 },
    }, 100);

    expect(hydrated.sheep).toBe(0);
    expect(hydrated.lifetimeSheep).toBe(0);
    expect(hydrated.sleepDepth).toBe(MAX_SLEEP_DEPTH);
    expect(hydrated.dreamShards).toBe(0);
    expect(hydrated.lastPrestigeCarry).toBe(0);
    expect(hydrated.runUpgrades.jumper).toBe(0);
    expect(hydrated.runUpgrades.pillow).toBe(100);
    expect(hydrated.runUpgrades.recursive).toBe(1);

    const reset = normalizeState({ version: 99, sheep: 999 }, 100);
    expect(reset).toMatchObject({ version: SAVE_VERSION, sheep: 0, startedAt: 100 });
  });

  it('grants deterministic offline production and caps it at four hours', () => {
    const base = {
      ...createInitialState(0),
      lastSavedAt: 1_000,
      runUpgrades: { ...createInitialState(0).runUpgrades, jumper: 2 },
    };
    const afterMinute = applyOfflineProgress(base, 61_000);
    expect(afterMinute.sheep).toBeCloseTo(78);
    expect(afterMinute.elapsedSeconds).toBe(60);
    expect(afterMinute.lastSavedAt).toBe(61_000);

    const afterDay = applyOfflineProgress(base, 86_401_000);
    expect(afterDay.sheep).toBeCloseTo(18_720);
    expect(afterDay.elapsedSeconds).toBe(14_400);
  });
});
