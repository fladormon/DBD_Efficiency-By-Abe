import type { CompiledDataset, DbdConstants } from '@/lib/types';
import type { LoadoutState } from '@/store/loadoutStore';
import { effectivePercentsWithPing } from './utils';

export type SimulationResult = {
  repairTimeSeconds: { avg: number; p50: number; p90: number };
  expectedStacksAvg: number;
  itemChargesUsedAvg?: number;
};

export function simulate({ loadout, dataset, constants, trials = 10000 }: { loadout: LoadoutState; dataset: CompiledDataset; constants: DbdConstants; trials?: number }): SimulationResult {
  const baseGen = constants.base.generatorRepairSeconds;
  const checkInterval = constants.base.skillCheckIntervalSeconds;

  const times: number[] = [];
  const stacks: number[] = [];

  for (let t = 0; t < trials; t++) {
    let time = 0;
    let progress = 0;
    let stacksNow = 0;
    let stakeTokens = loadout.stakeOutEnabled ? loadout.stakeOutTokens : 0;

    const perc0 = { great: loadout.greatPercent, good: loadout.goodPercent, fail: loadout.failPercent };
    while (progress < 1) {
      time += checkInterval;
      const percPing = effectivePercentsWithPing(perc0.great, perc0.good, perc0.fail, loadout.pingMs, constants);
      // Apply Stake Out at sampling time: if we roll good and tokens>0, upgrade to great and consume 1
      const r = Math.random() * 100;
      let outcome: 'great' | 'good' | 'fail';
      if (r < percPing.great) outcome = 'great';
      else if (r < percPing.great + percPing.good) outcome = 'good';
      else outcome = 'fail';

      if (outcome === 'good' && stakeTokens > 0) {
        outcome = 'great';
        stakeTokens -= 1;
      }

      if (outcome === 'great') {
        stacksNow = Math.min(stacksNow + 1, 6);
        progress += checkInterval / baseGen * (1 + stacksNow * hyperfocusPerStackFactor(dataset));
      } else if (outcome === 'good') {
        // modest progress with no hyperfocus increase
        stacksNow = 0; // reset on non-great
        progress += checkInterval / baseGen;
      } else {
        // fail: lose some progress
        stacksNow = 0;
        progress = Math.max(0, progress - 0.05);
      }
    }
    times.push(time);
    stacks.push(stacksNow);
  }

  times.sort((a, b) => a - b);
  return {
    repairTimeSeconds: { avg: avg(times), p50: percentile(times, 50), p90: percentile(times, 90) },
    expectedStacksAvg: avg(stacks),
  };
}

function hyperfocusPerStackFactor(dataset: CompiledDataset): number {
  const rule = dataset.perks.find(p => p.id.includes('hyperfocus'))?.rules?.find(r => r.stacks?.tokenCounter === 'hyperfocus' && r.target === 'repairSpeed');
  if (!rule) return 0;
  const v = rule.stacks?.perStackValue ?? 0;
  return rule.unit === 'percent' ? v / 100 : v;
}

function avg(a: number[]): number { return a.reduce((x, y) => x + y, 0) / a.length; }
function percentile(arr: number[], p: number): number {
  const idx = Math.floor((p / 100) * (arr.length - 1));
  return arr[idx];
}