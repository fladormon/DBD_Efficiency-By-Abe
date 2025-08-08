import type { DeterministicResult, DbdConstants, CompiledDataset } from '@/lib/types';
import type { LoadoutState } from '@/store/loadoutStore';
import { applyRuleEffects, expectedHyperfocusStacks, remapStakeOut } from './utils';

export function computeDeterministic({ loadout, dataset, constants }: { loadout: LoadoutState; dataset: CompiledDataset; constants: DbdConstants }): DeterministicResult {
  const baseGen = constants.base.generatorRepairSeconds;
  const baseHealOther = constants.base.healOtherSeconds;
  const baseHealSelf = constants.base.healSelfSeconds;

  // For simplicity, gather rules from selected entities
  const selectedEntities = [
    ...dataset.perks.filter(p => loadout.perkIds.includes(p.id)),
    ...dataset.addons.filter(a => loadout.addonIds.includes(a.id)),
    ...dataset.items.filter(i => i.id === loadout.itemId),
    ...dataset.offerings.filter(o => o.id === loadout.offeringId),
    ...dataset.characters.filter(c => c.id === loadout.selectedCharacterId),
  ].filter(Boolean);

  const forAction = (action: 'repair' | 'heal' | 'item' | 'skill-check') => selectedEntities.flatMap(e => e.rules ?? []).filter(r => !r.conditions || r.conditions.action === action || r.conditions.continuous);

  // Repair speed: apply effects to speed (we treat lower time as better). Convert speed bonuses to time modifiers.
  const repairEffects = forAction('repair').filter(r => r.target === 'repairSpeed');
  const repairSpeedMultiplier = applyRuleEffects(1, repairEffects);
  const teammateIdx = Math.max(0, Math.min(constants.multipliers.teammateRepairEfficiency.length - 1, loadout.teammatesCount));
  const teamMultiplier = constants.multipliers.teammateRepairEfficiency[teammateIdx] ?? 1;

  // Skill checks impact via Hyperfocus: treat as overall speed bonus proportional to expected stacks
  const expectedStacks = expectedHyperfocusStacks(loadout.greatPercent / 100);
  const hyperfocusRule = selectedEntities.flatMap(e => e.rules ?? []).find(r => r.stacks?.tokenCounter === 'hyperfocus' && r.target === 'repairSpeed');
  const hyperfocusBonusPerStack = hyperfocusRule?.stacks?.perStackValue ?? 0;
  const hyperfocusSpeed = 1 + (loadout.hyperfocusEnabled ? (expectedStacks * (hyperfocusRule?.unit === 'percent' ? hyperfocusBonusPerStack / 100 : hyperfocusBonusPerStack)) : 0);

  const repairTimeSolo = baseGen / (repairSpeedMultiplier * hyperfocusSpeed);
  const repairTimeTeam = repairTimeSolo / teamMultiplier;

  // Healing
  const healEffects = forAction('heal').filter(r => r.target === 'healSpeed');
  const healSpeed = applyRuleEffects(1, healEffects);
  const healSelfTime = baseHealSelf / healSpeed;
  const healOtherTime = baseHealOther / healSpeed;

  // Item charges
  const item = dataset.items.find(i => i.id === loadout.itemId);
  const itemChargeRateEffects = forAction('item').filter(r => r.target === 'itemChargeRate');
  const itemRate = applyRuleEffects(item?.chargeRate ?? constants.itemDefaults.chargeRatePerSecond, itemChargeRateEffects);
  const totalCharges = item?.charges ?? 0;
  const chargesUsed = Math.min(totalCharges, itemRate * healOtherTime); // example: using item to heal other for duration

  // Skill check remapping (Stake Out)
  const expectedChecks = Math.max(1, Math.floor(repairTimeSolo / constants.base.skillCheckIntervalSeconds));
  const sc = loadout.stakeOutEnabled ? remapStakeOut(loadout.greatPercent, loadout.goodPercent, loadout.failPercent, /* tokens */ 4, expectedChecks) : { great: loadout.greatPercent, good: loadout.goodPercent, fail: loadout.failPercent };

  return {
    repair: { soloTimeSeconds: repairTimeSolo, teamTimeSeconds: repairTimeTeam },
    healing: { selfTimeSeconds: healSelfTime, otherTimeSeconds: healOtherTime },
    item: { chargesUsed, totalCharges },
    skill: { expectedHyperfocusStacks: expectedStacks },
  };
}