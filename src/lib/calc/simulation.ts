import type { CompiledDataset, DbdConstants } from '@/lib/types';
import type { LoadoutState } from '@/store/loadoutStore';
import { expectedHyperfocusStacks } from './utils';

export type SimulationResult = {
  repairTimeSeconds: { avg: number; p50: number; p90: number };
  expectedStacksAvg: number;
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
    while (progress < 1) {
      // time until next check
      time += checkInterval;
      // roll outcome
      const r = Math.random() * 100;
      const g = loadout.greatPercent;
      const gd = loadout.goodPercent;
      if (r < g) {
        stacksNow = Math.min(stacksNow + 1, 6);
        progress += 1 / (baseGen / checkInterval); // naive progress chunk
      } else if (r < g + gd) {
        // good
        progress += 1 / (baseGen / checkInterval);
      } else {
        // fail: lose small progress
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

function avg(a: number[]): number { return a.reduce((x, y) => x + y, 0) / a.length; }
function percentile(arr: number[], p: number): number {
  const idx = Math.floor((p / 100) * (arr.length - 1));
  return arr[idx];
}