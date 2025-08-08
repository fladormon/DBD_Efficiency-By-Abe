import React from 'react';
import { useLoadoutStore } from '@/store/loadoutStore';
import { expectedHyperfocusStacks } from '@/lib/calc/utils';

type LockKey = 'great' | 'good' | 'fail' | null;

export default function SkillCheckCard() {
  const { greatPercent, goodPercent, failPercent, setSkillPercents, stakeOutEnabled, setStakeOutEnabled, pingMs, setPingMs, hyperfocusEnabled } = useLoadoutStore();
  const [locked, setLocked] = React.useState<LockKey>(null);

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const rebalance = (changedKey: 'great' | 'good' | 'fail', newValue: number) => {
    const vals = { great: greatPercent, good: goodPercent, fail: failPercent };
    vals[changedKey] = clamp(newValue);
    const total = vals.great + vals.good + vals.fail;
    if (total === 100) {
      setSkillPercents(vals.great, vals.good, vals.fail);
      return;
    }
    const delta = 100 - total; // amount to distribute to others
    const keys: ('great'|'good'|'fail')[] = ['great','good','fail'];
    const others = keys.filter(k => k !== changedKey && k !== locked);
    if (others.length === 0) {
      // if both others are locked or only one slider unlocked, push into the only other unlocked slot
      const other = keys.find(k => k !== changedKey) as 'great'|'good'|'fail';
      vals[other] = clamp(vals[other] + delta);
    } else {
      // distribute proportionally across unlocked others
      const sumUnlocked = others.reduce((a, k) => a + vals[k], 0) || 1;
      for (const k of others) {
        const share = (vals[k] / sumUnlocked) * delta;
        vals[k] = clamp(vals[k] + share);
      }
    }
    // normalize tiny float errors
    const finalTotal = vals.great + vals.good + vals.fail;
    const fix = 100 - finalTotal;
    if (Math.abs(fix) > 0.001) {
      const fallback = keys.find(k => k !== locked) as 'great'|'good'|'fail';
      vals[fallback] = clamp(vals[fallback] + fix);
    }
    setSkillPercents(Math.round(vals.great), Math.round(vals.good), Math.round(vals.fail));
  };

  const expStacks = expectedHyperfocusStacks((greatPercent / 100)); // displayed raw; deterministic uses ping/stakeout-adjusted

  return (
    <div className="card">
      <div className="section-title">Skill Checks</div>
      <div className="grid cols-2">
        <SliderRow label="Great %" value={greatPercent} onChange={v => rebalance('great', v)} locked={locked==='great'} onToggleLock={() => setLocked(locked==='great'?null:'great')} />
        <SliderRow label="Good %" value={goodPercent} onChange={v => rebalance('good', v)} locked={locked==='good'} onToggleLock={() => setLocked(locked==='good'?null:'good')} />
        <SliderRow label="Fail %" value={failPercent} onChange={v => rebalance('fail', v)} locked={locked==='fail'} onToggleLock={() => setLocked(locked==='fail'?null:'fail')} />
        <div className="small">Sum: {greatPercent + goodPercent + failPercent}% (must be 100%)</div>
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

function SliderRow({ label, value, locked, onChange, onToggleLock }: { label: string; value: number; locked: boolean; onChange: (v: number) => void; onToggleLock: () => void; }) {
  return (
    <div>
      <div className="row" style={{ gap: 8, justifyContent: 'space-between' }}>
        <div className="small">{label}: {value}%</div>
        <label className="small row" style={{ gap: 6 }}>
          <input type="checkbox" checked={locked} onChange={onToggleLock} /> lock
        </label>
      </div>
      <input className="slider" type="range" min={0} max={100} step={1} value={value} onChange={e => !locked && onChange(Number(e.target.value))} />
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