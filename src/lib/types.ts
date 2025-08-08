export type Role = 'survivor' | 'killer';

export type CombinationMethod = 'additive' | 'multiplicative' | 'override' | 'cap' | 'clamp';

export type RuleCondition = {
  injured?: boolean;
  teammatesNearby?: number; // number of teammates affecting action
  usingItemId?: string;
  usingItemType?: string;
  role?: Role;
  action?: 'repair' | 'heal' | 'item' | 'skill-check';
  onGreat?: boolean;
  onGood?: boolean;
  onFail?: boolean;
  continuous?: boolean;
};

export type StackInfo = {
  maxStacks?: number;
  perStackValue?: number; // for effects that scale per stack
  tokenCounter?: 'hyperfocus' | 'stakeout' | string;
};

export type RuleEffect = {
  id: string;
  target: 'repairSpeed' | 'healSpeed' | 'itemChargeRate' | 'skillCheckGreatWindowMs' | 'skillCheckInterval' | 'tokenChange' | 'skillCheckBonus';
  value: number; // data-driven; semantics depend on combination and target
  unit: 'percent' | 'absolute';
  combination: 'additive' | 'multiplicative' | 'override';
  conditions?: RuleCondition;
  stacks?: StackInfo;
};

export type EntityBase = {
  id: string;
  name: string;
  description?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'ultra_rare' | 'event';
  icon?: string; // local path or remote URL
  role?: Role;
  rules?: RuleEffect[];
  sources?: string[];
};

export type Perk = EntityBase & { type: 'perk' };
export type AddOn = EntityBase & { type: 'addon'; ownerItemType?: string };
export type Item = EntityBase & { type: 'item'; charges?: number; chargeRate?: number };
export type Offering = EntityBase & { type: 'offering' };
export type Character = EntityBase & { type: 'character' };

export type CompiledDataset = {
  version: string;
  characters: Character[];
  items: Item[];
  addons: AddOn[];
  perks: Perk[];
  offerings: Offering[];
};

export type DatasetMeta = {
  version: string;
  lastUpdated: string; // ISO timestamp
};

export type DbdConstants = {
  base: {
    generatorRepairSeconds: number;
    healOtherSeconds: number;
    healSelfSeconds: number;
    skillCheckGreatWindowMs: number;
    skillCheckGoodWindowMs: number;
    skillCheckIntervalSeconds: number; // average interval between checks
  };
  itemDefaults: {
    chargeRatePerSecond: number; // how many charges consumed per second when using
  };
  multipliers: {
    teammateRepairEfficiency: number[]; // index 0..3 additional teammates multiplier
  };
};

export type DeterministicResult = {
  repair: { soloTimeSeconds: number; teamTimeSeconds: number };
  healing: { selfTimeSeconds: number; otherTimeSeconds: number };
  item: { chargesUsed: number; totalCharges: number };
  skill: { expectedHyperfocusStacks: number };
};