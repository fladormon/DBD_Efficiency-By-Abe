'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { z } = require('zod');

const repoRoot = path.resolve(__dirname, '..');
const sourcesPath = path.resolve(repoRoot, 'data/sources.json');
const compiledDir = path.resolve(repoRoot, 'data/compiled');
const publicCompiledDir = path.resolve(repoRoot, 'public/data/compiled');
const iconsDir = path.resolve(repoRoot, 'assets/icons');
const publicIconsDir = path.resolve(repoRoot, 'public/assets/icons');
const metaPath = path.join(compiledDir, 'meta/version.json');
const publicMetaPath = path.join(publicCompiledDir, 'meta/version.json');
const datasetPath = path.join(compiledDir, 'dataset.json');
const publicDatasetPath = path.join(publicCompiledDir, 'dataset.json');

const SourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  kind: z.enum(['dataset','perks','addons','items','offerings','characters']).default('dataset')
});

async function ensureDirs() {
  await Promise.all([
    fs.mkdir(compiledDir, { recursive: true }),
    fs.mkdir(publicCompiledDir, { recursive: true }),
    fs.mkdir(iconsDir, { recursive: true }),
    fs.mkdir(publicIconsDir, { recursive: true }),
    fs.mkdir(path.dirname(metaPath), { recursive: true }),
    fs.mkdir(path.dirname(publicMetaPath), { recursive: true }),
  ]);
}

async function readSources() {
  const raw = await fs.readFile(sourcesPath, 'utf-8');
  const json = JSON.parse(raw);
  const arr = z.array(SourceSchema).parse(json);
  return arr;
}

async function downloadIcon(id, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = extFromUrl(url);
    const fileName = `${id}${ext}`;
    const out = path.join(iconsDir, fileName);
    const outPublic = path.join(publicIconsDir, fileName);
    await fs.writeFile(out, buf);
    await fs.writeFile(outPublic, buf);
  } catch {}
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const name = u.pathname.split('/').pop() || '';
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot) : '.png';
  } catch {
    return '.png';
  }
}

function firstArrayIn(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 3) return [];
  if (Array.isArray(obj)) return obj;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    const found = firstArrayIn(v, depth + 1);
    if (Array.isArray(found) && found.length) return found;
  }
  return [];
}

function pickIcon(entry) {
  const icon = entry.icon || entry.image || entry.iconPath || entry.iconUrl || null;
  if (!icon) return null;
  if (typeof icon === 'string') return icon;
  if (typeof icon === 'object') {
    // try common nested fields
    return icon.portrait || icon.preview_portrait || icon.shop_background || icon.store || icon.small || icon.large || null;
  }
  return null;
}

function mapTechialArray(kind, arr) {
  const roleFor = (entry) => {
    const r = ((entry.role || entry.side || entry.type || entry.category || '') + '').toLowerCase();
    if (r.includes('survivor')) return 'survivor';
    if (r.includes('killer')) return 'killer';
    // Guess by kind for characters endpoint
    if (kind === 'characters') {
      const name = (entry.name || entry.full_name || '') + '';
      if (/^the\s/i.test(name)) return 'killer';
      return 'survivor';
    }
    return undefined;
  };
  return arr.map((e) => {
    const id = (e.id || e._id || e.slug || (e.perk_tag || e.name_tag) || (e.name ? e.name.toLowerCase().replace(/[^a-z0-9]+/g,'_') : undefined));
    const name = (e.name || e.perk_name || e.displayName || e.title || '') + '';
    const description = (e.description || e.desc || e.perkDesc || e.text || '') + '';
    const iconRaw = pickIcon(e);
    const rarity = e.rarity || e.tier || e.color || undefined;
    const role = roleFor(e);
    const base = {
      type: kind === 'perks' ? 'perk' : kind === 'addons' ? 'addon' : kind === 'items' ? 'item' : kind === 'offerings' ? 'offering' : 'character',
      id,
      name,
      description,
      rarity,
      icon: iconRaw,
      role,
      rules: [],
    };
    if (base.type === 'item') {
      base.charges = e.charges || e.maxCharges || undefined;
      base.chargeRate = e.chargeRate || undefined;
    }
    if (base.type === 'addon') {
      base.ownerItemType = e.item || e.parentItem || undefined;
    }
    return base;
  }).filter(e => e.id && e.name);
}

function uniqById(arr) {
  const map = new Map();
  for (const x of arr) {
    if (!x?.id) continue;
    map.set(x.id, x);
  }
  return Array.from(map.values());
}

(async function update() {
  await ensureDirs();
  let merged = {
    version: '0.0.1',
    characters: [],
    items: [],
    addons: [],
    perks: [],
    offerings: [],
  };
  const sources = await readSources();
  for (const s of sources) {
    try {
      const res = await fetch(s.url);
      if (!res.ok) throw new Error(`fetch failed ${res.status}`);
      const data = await res.json();
      const arr = firstArrayIn(data);
      const mapped = mapTechialArray(s.kind, arr);
      const withLocalIcons = await Promise.all(mapped.map(async (e) => {
        if (e.icon && /^https?:/i.test(e.icon)) await downloadIcon(e.id, e.icon);
        const ext = e.icon ? extFromUrl(e.icon) : '.png';
        const localIcon = `/assets/icons/${e.id}${ext}`;
        return { ...e, icon: localIcon };
      }));
      if (s.kind === 'perks') merged.perks = uniqById([...(merged.perks || []), ...withLocalIcons]);
      if (s.kind === 'addons') merged.addons = uniqById([...(merged.addons || []), ...withLocalIcons]);
      if (s.kind === 'items') merged.items = uniqById([...(merged.items || []), ...withLocalIcons]);
      if (s.kind === 'offerings') merged.offerings = uniqById([...(merged.offerings || []), ...withLocalIcons]);
      if (s.kind === 'characters') merged.characters = uniqById([...(merged.characters || []), ...withLocalIcons]);
    } catch (err) {
      console.warn(`Failed to process source ${s.name}:`, (err && err.message) || err);
    }
  }

  const dsOut = {
    version: merged.version || '0.0.1',
    characters: merged.characters,
    items: merged.items,
    addons: merged.addons,
    perks: merged.perks,
    offerings: merged.offerings,
  };

  await fs.writeFile(datasetPath, JSON.stringify(dsOut, null, 2), 'utf-8');
  await fs.mkdir(path.dirname(publicDatasetPath), { recursive: true });
  await fs.writeFile(publicDatasetPath, JSON.stringify(dsOut, null, 2), 'utf-8');

  const meta = { version: dsOut.version, lastUpdated: new Date().toISOString() };
  await fs.mkdir(path.dirname(metaPath), { recursive: true });
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  await fs.mkdir(path.dirname(publicMetaPath), { recursive: true });
  await fs.writeFile(publicMetaPath, JSON.stringify(meta, null, 2), 'utf-8');

  console.log('Dataset updated and mirrored to public/.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});