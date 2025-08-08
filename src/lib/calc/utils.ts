import type { RuleEffect } from '@/lib/types';

export function applyRuleEffects(baseValue: number, effects: RuleEffect[]): number {
  let current = baseValue;
  // override first
  const overrides = effects.filter(e => e.combination === 'override');
  if (overrides.length > 0) {
    const last = overrides[overrides.length - 1];
    current = last.unit === 'percent' ? baseValue * (1 + last.value / 100) : last.value;
  }
  // additive
  const add = effects.filter(e => e.combination === 'additive');
  const addPct = add.filter(e => e.unit === 'percent').reduce((a, b) => a + b.value, 0);
  const addAbs = add.filter(e => e.unit === 'absolute').reduce((a, b) => a + b.value, 0);
  current = current * (1 + addPct / 100) + addAbs;
  // multiplicative
  const mult = effects.filter(e => e.combination === 'multiplicative');
  const multFactor = mult.reduce((acc, e) => acc * (e.unit === 'percent' ? (1 + e.value / 100) : (current !== 0 ? (current + e.value) / current : 1)), 1);
  current = current * multFactor;
  return current;
}

export function expectedHyperfocusStacks(pGreat: number, cap: number = 6): number {
  // E[stacks] = sum_{k=1..cap} pGreat^k
  let sum = 0;
  for (let k = 1; k <= cap; k++) sum += Math.pow(pGreat, k);
  return sum;
}

export function remapStakeOut(great: number, good: number, fail: number, tokens: number, expectedChecks: number): { great: number; good: number; fail: number } {
  // Deterministic: convert up to tokens goods to greats across expectedChecks
  const expectedGoods = good / 100 * expectedChecks;
  const converted = Math.min(tokens, expectedGoods);
  const convertRatio = expectedGoods > 0 ? converted / expectedGoods : 0;
  const goodAfter = good * (1 - convertRatio);
  const greatAfter = great + good * convertRatio;
  return { great: greatAfter, good: goodAfter, fail };
}