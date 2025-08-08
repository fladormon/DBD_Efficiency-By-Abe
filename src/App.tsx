import React from 'react';
import TopBar from './components/TopBar';
import LoadoutBuilder from './components/LoadoutBuilder';
import SummaryCards from './components/SummaryCards';
import SkillCheckCard from './components/SkillCheckCard';
import AssumptionsPanel from './components/AssumptionsPanel';
import { useDatasetStore } from './store/datasetStore';

export default function App() {
  const { initialized, error, loadDataset } = useDatasetStore();

  React.useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  return (
    <div className="app-root">
      <TopBar />
      {!initialized ? (
        <div className="center">{error ? `Failed to load dataset: ${error}` : 'Loading dataset...'}</div>
      ) : (
        <div className="content">
          <div className="left-pane">
            <LoadoutBuilder />
          </div>
          <div className="right-pane">
            <div className="right-grid">
              <SummaryCards />
              <SkillCheckCard />
              <AssumptionsPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}