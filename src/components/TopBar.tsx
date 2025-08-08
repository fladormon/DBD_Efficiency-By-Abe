import React from 'react';
import { useDatasetStore } from '@/store/datasetStore';
import { exportShareCode } from '@/lib/share';

export default function TopBar() {
  const { meta, checkingUpdate, checkForUpdates } = useDatasetStore();

  const onExport = () => {
    exportShareCode();
  };

  return (
    <div className="topbar">
      <div className="row" style={{ gap: 12 }}>
        <strong>Dead by Daylight Loadout Optimizer</strong>
        <span className="small">Dataset v{meta?.version ?? '—'} · {meta?.lastUpdated ? new Date(meta.lastUpdated).toLocaleString() : 'not updated'}</span>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button className="button" onClick={() => checkForUpdates()} disabled={checkingUpdate}>Check for updates</button>
        <button className="button" onClick={onExport}>Export share-code</button>
      </div>
    </div>
  );
}