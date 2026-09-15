import { describe, expect, it } from 'vitest';
import { simulatePacing } from '../scripts/pacing.mjs';

describe('deterministic full-playthrough pacing', () => {
  it('reaches every intended phase and the wake ending within 30 minutes', () => {
    const result = simulatePacing();
    const phases = result.milestones.map((milestone) => milestone.phase);
    const prestiges = result.milestones.filter((milestone) => milestone.phase === 'sleep-prestige');
    const laws = result.milestones.filter((milestone) => milestone.phase === 'dream-law');

    expect(phases.slice(0, 4)).toEqual(['manual', 'automation', 'sheep-count-sheep', 'sleep-prestige']);
    expect(prestiges.map((milestone) => milestone.depth)).toEqual([1, 2, 3, 4]);
    expect(laws.map((milestone) => milestone.law)).toEqual([
      'skipFence',
      'doubleCount',
      'countCounters',
      'notSheep',
    ]);
    expect(phases.at(-1)).toBe('wake-ending');
    expect(result.state.ended).toBe(true);
    expect(result.totalSeconds).toBeLessThanOrEqual(30 * 60);
    expect(result.state.manualClicks).toBeGreaterThan(0);
  });

  it('produces the same result on every run', () => {
    expect(simulatePacing()).toEqual(simulatePacing());
  });
});
