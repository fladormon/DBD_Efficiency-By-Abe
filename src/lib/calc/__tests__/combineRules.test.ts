import { describe, it, expect } from 'vitest';
import { applyRuleEffects } from '../../calc/utils';

describe('applyRuleEffects', () => {
  it('applies override, then additive, then multiplicative', () => {
    const base = 100;
    const effects = [
      { id: 'o', target: 'repairSpeed', value: 200, unit: 'absolute', combination: 'override' },
      { id: 'a1', target: 'repairSpeed', value: 10, unit: 'percent', combination: 'additive' },
      { id: 'a2', target: 'repairSpeed', value: 5, unit: 'absolute', combination: 'additive' },
      { id: 'm1', target: 'repairSpeed', value: 10, unit: 'percent', combination: 'multiplicative' },
    ] as any;
    const v = applyRuleEffects(base, effects);
    // override -> 200, additive percent -> 220, additive abs -> 225, mult 10% -> 247.5
    expect(v).toBeCloseTo(247.5, 5);
  });
});