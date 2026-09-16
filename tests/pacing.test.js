import { describe, expect, it } from 'vitest';
import { PACING_MODES, simulateAllPaces, simulatePacing } from '../scripts/pacing.mjs';

describe('deterministic phase-shaped pacing', () => {
  it.each(Object.entries(PACING_MODES))('%s pace reaches every phase and the wake ending', (name, options) => {
    const result = simulatePacing(options);
    const phases = result.milestones.map((milestone) => milestone.phase);
    const prestiges = result.milestones.filter((milestone) => milestone.phase === 'sleep-prestige');
    const laws = result.milestones.filter((milestone) => milestone.phase === 'dream-law');

    expect(phases[0]).toBe('manual');
    expect(phases).toContain('automation');
    expect(phases).toContain('sheep-count-sheep');
    expect(prestiges.map((milestone) => milestone.depth)).toEqual([1, 2, 3, 4]);
    expect(laws.map((milestone) => milestone.law)).toEqual([
      'skipFence',
      'doubleCount',
      'countCounters',
      'notSheep',
    ]);
    expect(phases.at(-1)).toBe('wake-ending');
    expect(result.state.ended).toBe(true);
    expect(result.totalSeconds).toBeLessThanOrEqual(options.maxSeconds);
    expect(result.state.manualClicks).toBeGreaterThan(0);
    expect(name).toBeTruthy();
  });

  it('accepts ten taps per second without collapsing any depth into a trivial phase', () => {
    const result = simulatePacing(PACING_MODES.fast);
    const runSeconds = result.milestones
      .filter((milestone) => milestone.phase === 'sleep-prestige')
      .map((milestone) => milestone.runSeconds);

    expect(result.tapsPerSecond).toBe(10);
    expect(result.state.manualClicks).toBe(result.totalSeconds * 10);
    expect(Math.min(...runSeconds)).toBeGreaterThanOrEqual(40);
    expect(runSeconds).toEqual([...runSeconds].sort((a, b) => a - b));
  });

  it('keeps normal play substantially faster than low-input play without instant late phases', () => {
    const { low, normal, fast } = simulateAllPaces();
    expect(low.totalSeconds).toBeGreaterThan(normal.totalSeconds);
    expect(normal.totalSeconds).toBeGreaterThan(fast.totalSeconds);
    expect(normal.totalSeconds).toBeGreaterThanOrEqual(15 * 60);
    expect(normal.totalSeconds).toBeLessThanOrEqual(25 * 60);
    expect(fast.totalSeconds).toBeGreaterThanOrEqual(6 * 60);
  });

  it('produces the same result on every run', () => {
    expect(simulateAllPaces()).toEqual(simulateAllPaces());
  });
});
