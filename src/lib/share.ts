import { useLoadoutStore } from '@/store/loadoutStore';

export function exportShareCode() {
  const s = useLoadoutStore.getState();
  const payload = {
    role: s.role,
    character: s.selectedCharacterId,
    item: s.itemId,
    addons: s.addonIds,
    perks: s.perkIds,
    offering: s.offeringId,
    assumptions: {
      teammates: s.teammatesCount,
      injured: s.injured,
      skill: { great: s.greatPercent, good: s.goodPercent, fail: s.failPercent },
      pingMs: s.pingMs,
      simulation: { enabled: s.simulationEnabled, trials: s.simulationTrials },
    },
  };
  const str = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(str)));
  navigator.clipboard.writeText(base64);
}

export function importShareCode(base64: string) {
  const s = useLoadoutStore.getState();
  const json = decodeURIComponent(escape(atob(base64)));
  const p = JSON.parse(json);
  s.setRole(p.role);
  s.setCharacterId(p.character ?? null);
  s.setItemId(p.item ?? null);
  s.setAddonIds(p.addons ?? []);
  s.setPerkIds(p.perks ?? []);
  s.setOfferingId(p.offering ?? null);
  s.setTeammatesCount(p.assumptions?.teammates ?? 0);
  s.setInjured(Boolean(p.assumptions?.injured));
  const skill = p.assumptions?.skill ?? { great: 50, good: 40, fail: 10 };
  s.setSkillPercents(skill.great, skill.good, skill.fail);
  s.setPingMs(p.assumptions?.pingMs ?? 50);
  s.setSimulationEnabled(Boolean(p.assumptions?.simulation?.enabled));
  s.setSimulationTrials(p.assumptions?.simulation?.trials ?? 10000);
}