import React from 'react';
import { useLoadoutStore } from '@/store/loadoutStore';

export default function AssumptionsPanel() {
  const { teammatesCount, setTeammatesCount, injured, setInjured, simulationEnabled, setSimulationEnabled, simulationTrials, setSimulationTrials } = useLoadoutStore();

  return (
    <div className="card">
      <div className="section-title">Assumptions</div>
      <div className="grid cols-2">
        <label className="row" style={{ gap: 8 }}>
          Teammates working on gen
          <select value={teammatesCount} onChange={e => setTeammatesCount(Number(e.target.value))}>
            <option value={0}>Solo</option>
            <option value={1}>2 survivors</option>
            <option value={2}>3 survivors</option>
            <option value={3}>4 survivors</option>
          </select>
        </label>
        <label className="row" style={{ gap: 8 }}>
          Injured
          <input type="checkbox" checked={injured} onChange={e => setInjured(e.target.checked)} />
        </label>
      </div>
      <div className="row" style={{ gap: 12, marginTop: 8 }}>
        <label className="row" style={{ gap: 8 }}>
          Simulation mode
          <input type="checkbox" checked={simulationEnabled} onChange={e => setSimulationEnabled(e.target.checked)} />
        </label>
        {simulationEnabled && (
          <label className="row" style={{ gap: 8 }}>
            Trials
            <input className="input" type="number" value={simulationTrials} onChange={e => setSimulationTrials(Number(e.target.value))} style={{ width: 100 }} />
          </label>
        )}
      </div>
    </div>
  );
}