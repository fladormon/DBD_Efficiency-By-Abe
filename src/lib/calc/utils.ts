import type { RuleEffect, DbdConstants } from '@/lib/types';

export function applyRuleEffects(baseValue: number, effects: RuleEffect[]): number {
  let current = baseValue;
  const overrides = effects.filter(e => e.combination === 'override');
  if (overrides.length > 0) {
    const last = overrides[overrides.length - 1];
    current = last.unit === 'percent' ? baseValue * (1 + last.value / 100) : last.value;
  }
  const add = effects.filter(e => e.combination === 'additive');
  const addPct = add.filter(e => e.unit === 'percent').reduce((a, b) => a + b.value, 0);
  const addAbs = add.filter(e => e.unit === 'absolute').reduce((a, b) => a + b.value, 0);
  current = current * (1 + addPct / 100) + addAbs;
  const mult = effects.filter(e => e.combination === 'multiplicative');
  const multFactor = mult.reduce((acc, e) => acc * (e.unit === 'percent' ? (1 + e.value / 100) : (current !== 0 ? (current + e.value) / current : 1)), 1);
  current = current * multFactor;
  return current;
}

export function expectedHyperfocusStacks(pGreat: number, cap: number = 6): number {
  let sum = 0;
  for (let k = 1; k <= cap; k++) sum += Math.pow(pGreat, k);
  return sum;
}

export function effectivePercentsWithPing(great: number, good: number, fail: number, pingMs: number, constants: DbdConstants): { great: number; good: number; fail: number } {
  const baseGreat = constants.base.skillCheckGreatWindowMs;
  const effectiveGreatWindow = Math.max(0, baseGreat - pingMs);
  const ratio = baseGreat > 0 ? effectiveGreatWindow / baseGreat : 1;
  const newGreat = great * ratio;
  const delta = great - newGreat; // lost from great due to ping
  const newGood = good + delta;
  return normalizePercents(newGreat, newGood, fail);
}

export function remapStakeOut(great: number, good: number, fail: number, tokens: number, expectedChecks: number): { great: number; good: number; fail: number } {
  const expectedGoods = good / 100 * expectedChecks;
  const converted = Math.min(tokens, expectedGoods);
  const convertRatio = expectedGoods > 0 ? converted / expectedGoods : 0;
  const goodAfter = good * (1 - convertRatio);
  const greatAfter = great + good * convertRatio;
  return normalizePercents(greatAfter, goodAfter, fail);
}

export function normalizePercents(great: number, good: number, fail: number) {
  const total = great + good + fail;
  if (total === 100) return { great, good, fail };
  if (total <= 0) return { great: 0, good: 0, fail: 100 };
  return { great: (great / total) * 100, good: (good / total) * 100, fail: (fail / total) * 100 };
}