import { z } from 'zod';

export const entityBase = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  rarity: z.enum(['common','uncommon','rare','very_rare','ultra_rare','event']).optional(),
  icon: z.string().optional(),
  role: z.enum(['survivor','killer']).optional(),
  rules: z.array(z.object({
    id: z.string(),
    target: z.enum(['repairSpeed','healSpeed','itemChargeRate','skillCheckGreatWindowMs','skillCheckInterval','tokenChange','skillCheckBonus']),
    value: z.number(),
    unit: z.enum(['percent','absolute']),
    combination: z.enum(['additive','multiplicative','override']),
    conditions: z.object({
      injured: z.boolean().optional(),
      teammatesNearby: z.number().optional(),
      usingItemId: z.string().optional(),
      usingItemType: z.string().optional(),
      role: z.enum(['survivor','killer']).optional(),
      action: z.enum(['repair','heal','item','skill-check']).optional(),
      onGreat: z.boolean().optional(),
      onGood: z.boolean().optional(),
      onFail: z.boolean().optional(),
      continuous: z.boolean().optional(),
    }).optional(),
    stacks: z.object({
      maxStacks: z.number().optional(),
      perStackValue: z.number().optional(),
      tokenCounter: z.string().optional(),
    }).optional()
  })).optional(),
  sources: z.array(z.string()).optional(),
});

export const datasetSchema = z.object({
  version: z.string(),
  characters: z.array(entityBase.extend({ type: z.literal('character') })),
  items: z.array(entityBase.extend({ type: z.literal('item'), charges: z.number().optional(), chargeRate: z.number().optional() })),
  addons: z.array(entityBase.extend({ type: z.literal('addon'), ownerItemType: z.string().optional() })),
  perks: z.array(entityBase.extend({ type: z.literal('perk') })),
  offerings: z.array(entityBase.extend({ type: z.literal('offering') })),
});

export const metaSchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
});

export const constantsSchema = z.object({
  base: z.object({
    generatorRepairSeconds: z.number(),
    healOtherSeconds: z.number(),
    healSelfSeconds: z.number(),
    skillCheckGreatWindowMs: z.number(),
    skillCheckGoodWindowMs: z.number(),
    skillCheckIntervalSeconds: z.number(),
  }),
  itemDefaults: z.object({
    chargeRatePerSecond: z.number(),
  }),
  multipliers: z.object({
    teammateRepairEfficiency: z.array(z.number()),
  })
});