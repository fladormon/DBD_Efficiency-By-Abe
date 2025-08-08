import { describe, it, expect } from 'vitest';
import { expectedHyperfocusStacks } from '../../calc/utils';

describe('simulation vs deterministic parity', () => {
  it('expected Hyperfocus stacks increases with Great%', () => {
    const s1 = expectedHyperfocusStacks(0.4);
    const s2 = expectedHyperfocusStacks(0.6);
    expect(s2).toBeGreaterThan(s1);
  });
});