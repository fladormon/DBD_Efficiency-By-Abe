import React from 'react';
import { useDatasetStore } from '@/store/datasetStore';
import { useLoadoutStore } from '@/store/loadoutStore';

export default function LoadoutBuilder() {
  const { role, setRole, selectedCharacterId, setCharacterId, itemId, setItemId, addonIds, setAddonIds, perkIds, setPerkIds, offeringId, setOfferingId } = useLoadoutStore();
  const { characters, items, addons, perks, offerings } = useDatasetStore();

  const [search, setSearch] = React.useState('');

  const filterByRole = <T extends { role?: string; name: string }>(arr: T[]) =>
    arr.filter(x => (!x.role || x.role === role) && x.name.toLowerCase().includes(search.toLowerCase()));

  const Dropdown = ({ label, list, selected, onSelect, includeNone = true }: { label: string; list: { id: string; name: string }[]; selected: string | null; onSelect: (id: string | null) => void; includeNone?: boolean }) => (
    <div className="card">
      <div className="section-title">{label}</div>
      <select value={selected ?? ''} onChange={e => onSelect(e.target.value || null)} style={{ width: '100%' }}>
        {includeNone && <option value="">None</option>}
        {list.map(x => (
          <option key={x.id} value={x.id}>{x.name}</option>
        ))}
      </select>
    </div>
  );

  const MultiSelectLimited = ({ label, list, selected, limit, onChange }: { label: string; list: { id: string; name: string }[]; selected: string[]; limit: number; onChange: (ids: string[]) => void; }) => {
    const toggle = (id: string) => {
      const isSelected = selected.includes(id);
      if (isSelected) onChange(selected.filter(x => x !== id));
      else if (selected.length < limit) onChange([...selected, id]);
    };
    return (
      <div className="card">
        <div className="section-title">{label} ({selected.length}/{limit})</div>
        <div className="grid">
          {list.map(x => (
            <label key={x.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{x.name}</span>
              <input type="checkbox" checked={selected.includes(x.id)} onChange={() => toggle(x.id)} disabled={!selected.includes(x.id) && selected.length >= limit} />
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="section-title">Loadout Builder</div>
        <div className="row" style={{ gap: 8 }}>
          <button className="button" onClick={() => setRole('survivor')} disabled={role==='survivor'}>Survivor</button>
          <button className="button" onClick={() => setRole('killer')} disabled={role==='killer'}>Killer</button>
        </div>
      </div>

      <input className="input" placeholder="Search (filters by name)" value={search} onChange={e => setSearch(e.target.value)} />

      <Dropdown label="Character" list={filterByRole(characters)} selected={selectedCharacterId} onSelect={setCharacterId} includeNone={true} />
      {role === 'survivor' && <Dropdown label="Item" list={filterByRole(items)} selected={itemId} onSelect={setItemId} includeNone={true} />}
      <MultiSelectLimited label="Add-ons" list={filterByRole(addons)} selected={addonIds} limit={2} onChange={setAddonIds} />
      <MultiSelectLimited label="Perks" list={filterByRole(perks)} selected={perkIds} limit={4} onChange={setPerkIds} />
      <Dropdown label="Offering" list={filterByRole(offerings)} selected={offeringId} onSelect={setOfferingId} includeNone={true} />
    </div>
  );
}