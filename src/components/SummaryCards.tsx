import React from 'react';
import { useLoadoutStore } from '@/store/loadoutStore';
import { useDatasetStore } from '@/store/datasetStore';
import { computeDeterministic } from '@/lib/calc/deterministic';
import { simulate } from '@/lib/calc/simulation';

export default function SummaryCards() {
  const loadout = useLoadoutStore();
  const { dataset, constants } = useDatasetStore();

  if (!dataset || !constants) return null;

  const results = computeDeterministic({ loadout, dataset, constants });
  const sim = loadout.simulationEnabled ? simulate({ loadout, dataset, constants, trials: loadout.simulationTrials }) : null;

  return (
    <div className="card">
      <div className="section-title">Summary</div>
      <div className="grid cols-2">
        <div>
          <div className="badge">Generator Repair</div>
          <div className="small">Solo: {results.repair.soloTimeSeconds.toFixed(1)} s {sim && `(sim avg ${sim.repairTimeSeconds.avg.toFixed(1)} s)`}</div>
          <div className="small">With team (n={loadout.teammatesCount+1}): {results.repair.teamTimeSeconds.toFixed(1)} s</div>
        </div>
        <div>
          <div className="badge">Healing</div>
          <div className="small">Self: {results.healing.selfTimeSeconds.toFixed(1)} s</div>
          <div className="small">Other: {results.healing.otherTimeSeconds.toFixed(1)} s</div>
        </div>
        <div>
          <div className="badge">Item</div>
          <div className="small">Charges used: {results.item.chargesUsed.toFixed(1)} / {results.item.totalCharges.toFixed(1)}</div>
          <div className="small">Leftover: {Math.max(0, results.item.totalCharges - results.item.chargesUsed).toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}