import { describe, it, expect } from 'vitest';
import { remapStakeOut } from '../../calc/utils';

describe('remapStakeOut', () => {
  it('converts goods into greats up to tokens across expected checks', () => {
    const res = remapStakeOut(50, 40, 10, 2, 5);
    // expected goods = 2; all converted
    expect(res.great).toBeCloseTo(50 + 40 * (2/2));
    expect(res.good).toBeCloseTo(0);
    expect(res.fail).toBe(10);
  });
});