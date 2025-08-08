import React from 'react';
import { useDatasetStore } from '@/store/datasetStore';
import { useLoadoutStore } from '@/store/loadoutStore';
import Icon from './Icon';

export default function LoadoutBuilder() {
  const { role, setRole, selectedCharacterId, setCharacterId, itemId, setItemId, addonIds, setAddonIds, perkIds, setPerkIds, offeringId, setOfferingId } = useLoadoutStore();
  const { characters, items, addons, perks, offerings } = useDatasetStore();

  const roleToggle = (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <div className="section-title">Loadout Builder</div>
      <div className="row" style={{ gap: 8 }}>
        <button className="button" onClick={() => setRole('survivor')} disabled={role==='survivor'}>Survivor</button>
        <button className="button" onClick={() => setRole('killer')} disabled={role==='killer'}>Killer</button>
      </div>
    </div>
  );

  const buildSelector = (label: string, list: { id: string; name: string; icon?: string; role?: string }[], selected: string | null, onSelect: (id: string | null) => void) => (
    <div className="card">
      <div className="section-title">{label}</div>
      <div className="grid cols-4">
        <div className="icon" onClick={() => onSelect(null)} title="None">—</div>
        {list.filter(x => !x.role || x.role===role).map(x => (
          <div key={x.id} className="row" style={{ gap: 6 }}>
            <button className="button" onClick={() => onSelect(x.id)} style={{ width: '100%' }} title={x.name}>
              <Icon src={x.icon} alt={x.name} />
            </button>
          </div>
        ))}
      </div>
      <div className="small">Selected: {selected ?? 'None'}</div>
    </div>
  );

  const buildMultiSelector = (label: string, list: { id: string; name: string; icon?: string; role?: string }[], selected: string[], limit: number, onChange: (ids: string[]) => void) => (
    <div className="card">
      <div className="section-title">{label} ({selected.length}/{limit})</div>
      <div className="grid cols-4">
        {list.filter(x => !x.role || x.role===role).map(x => {
          const isSelected = selected.includes(x.id);
          const canAdd = !isSelected && selected.length < limit;
          return (
            <button key={x.id} className="button" disabled={!isSelected && !canAdd} onClick={() => {
              if (isSelected) onChange(selected.filter(id => id !== x.id));
              else onChange([...selected, x.id]);
            }} title={x.name}>
              <Icon src={x.icon} alt={x.name} />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="grid" style={{ gap: 12 }}>
      {roleToggle}
      {buildSelector('Character', characters, selectedCharacterId, setCharacterId)}
      {role === 'survivor' && buildSelector('Item', items, itemId, setItemId)}
      {buildMultiSelector('Add-ons', addons, addonIds, 2, setAddonIds)}
      {buildMultiSelector('Perks', perks, perkIds, 4, setPerkIds)}
      {buildSelector('Offering', offerings, offeringId, setOfferingId)}
    </div>
  );
}