import React from 'react';
import { useLoadoutStore } from '@/store/loadoutStore';
import { expectedHyperfocusStacks } from '@/lib/calc/utils';

export default function SkillCheckCard() {
  const { greatPercent, goodPercent, failPercent, setSkillPercents, stakeOutEnabled, setStakeOutEnabled, pingMs, setPingMs, hyperfocusEnabled } = useLoadoutStore();
  const sum = greatPercent + goodPercent + failPercent;

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const onChange = (g: number, gd: number, f: number) => {
    const total = g + gd + f;
    if (total === 100) setSkillPercents(g, gd, f);
  };

  const expStacks = expectedHyperfocusStacks((greatPercent / 100));

  return (
    <div className="card">
      <div className="section-title">Skill Checks</div>
      <div className="grid cols-2">
        <div>
          <div className="small">Great %: {greatPercent}%</div>
          <input className="slider" type="range" min={0} max={100} step={1} value={greatPercent} onChange={e => onChange(clamp(Number(e.target.value)), goodPercent, failPercent)} />
        </div>
        <div>
          <div className="small">Good %: {goodPercent}%</div>
          <input className="slider" type="range" min={0} max={100} step={1} value={goodPercent} onChange={e => onChange(greatPercent, clamp(Number(e.target.value)), failPercent)} />
        </div>
        <div>
          <div className="small">Fail %: {failPercent}%</div>
          <input className="slider" type="range" min={0} max={100} step={1} value={failPercent} onChange={e => onChange(greatPercent, goodPercent, clamp(Number(e.target.value)))} />
        </div>
        <div className="small">Sum: {sum}% (must be 100%)</div>
      </div>
      <div className="split">
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={stakeOutEnabled} onChange={e => setStakeOutEnabled(e.target.checked)} />
          Stake Out enabled
        </label>
        <StakeOutTokens />
        <label className="row" style={{ gap: 8 }}>
          Ping/Input lag (ms)
          <input className="input" type="number" value={pingMs} onChange={e => setPingMs(Number(e.target.value))} style={{ width: 100 }} />
        </label>
      </div>
      <div className="row" style={{ gap: 12, marginTop: 8 }}>
        <div className="badge">Hyperfocus</div>
        <div className="small">Enabled: {hyperfocusEnabled ? 'Yes' : 'No'}</div>
        <div className="small">Expected stacks: {expStacks.toFixed(2)}</div>
      </div>
    </div>
  );
}

function StakeOutTokens() {
  const { stakeOutTokens, setStakeOutTokens, stakeOutEnabled } = useLoadoutStore();
  if (!stakeOutEnabled) return null;
  return (
    <label className="row" style={{ gap: 8 }}>
      Tokens
      <input className="input" type="number" value={stakeOutTokens} min={0} max={8} onChange={e => setStakeOutTokens(Number(e.target.value))} style={{ width: 80 }} />
    </label>
  );
}