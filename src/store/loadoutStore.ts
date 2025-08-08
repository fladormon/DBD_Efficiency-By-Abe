import { create } from 'zustand';

type Role = 'survivor' | 'killer';

export type LoadoutState = {
  role: Role;
  selectedCharacterId: string | null;
  itemId: string | null;
  addonIds: string[];
  perkIds: string[];
  offeringId: string | null;
  teammatesCount: number; // other teammates working on gen (0-3)
  injured: boolean;
  greatPercent: number;
  goodPercent: number;
  failPercent: number;
  stakeOutEnabled: boolean;
  stakeOutTokens: number;
  hyperfocusEnabled: boolean;
  pingMs: number;
  simulationEnabled: boolean;
  simulationTrials: number;
  setRole: (role: Role) => void;
  setCharacterId: (id: string | null) => void;
  setItemId: (id: string | null) => void;
  setAddonIds: (ids: string[]) => void;
  setPerkIds: (ids: string[]) => void;
  setOfferingId: (id: string | null) => void;
  setTeammatesCount: (n: number) => void;
  setInjured: (v: boolean) => void;
  setSkillPercents: (great: number, good: number, fail: number) => void;
  setStakeOutEnabled: (v: boolean) => void;
  setStakeOutTokens: (n: number) => void;
  setPingMs: (ms: number) => void;
  setSimulationEnabled: (v: boolean) => void;
  setSimulationTrials: (n: number) => void;
};

export const useLoadoutStore = create<LoadoutState>((set) => ({
  role: 'survivor',
  selectedCharacterId: null,
  itemId: null,
  addonIds: [],
  perkIds: [],
  offeringId: null,
  teammatesCount: 0,
  injured: false,
  greatPercent: 50,
  goodPercent: 40,
  failPercent: 10,
  stakeOutEnabled: false,
  stakeOutTokens: 0,
  hyperfocusEnabled: true,
  pingMs: 50,
  simulationEnabled: false,
  simulationTrials: 10000,
  setRole: (role) => set({ role }),
  setCharacterId: (id) => set({ selectedCharacterId: id }),
  setItemId: (id) => set({ itemId: id }),
  setAddonIds: (ids) => set({ addonIds: ids }),
  setPerkIds: (ids) => set({ perkIds: ids }),
  setOfferingId: (id) => set({ offeringId: id }),
  setTeammatesCount: (n) => set({ teammatesCount: n }),
  setInjured: (v) => set({ injured: v }),
  setSkillPercents: (great, good, fail) => set({ greatPercent: great, goodPercent: good, failPercent: fail }),
  setStakeOutEnabled: (v) => set({ stakeOutEnabled: v }),
  setStakeOutTokens: (n) => set({ stakeOutTokens: n }),
  setPingMs: (ms) => set({ pingMs: ms }),
  setSimulationEnabled: (v) => set({ simulationEnabled: v }),
  setSimulationTrials: (n) => set({ simulationTrials: n }),
}));