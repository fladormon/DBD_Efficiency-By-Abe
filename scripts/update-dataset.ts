#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import fetch from 'node-fetch';
import { datasetSchema } from '../src/lib/schema';

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

type InternalEntity = {
  type: 'perk'|'addon'|'item'|'offering'|'character';
  id: string;
  name: string;
  description?: string;
  rarity?: any;
  icon?: string;
  role?: 'survivor'|'killer';
  rules?: any[];
};

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

async function readSources(): Promise<z.infer<typeof SourceSchema>[]> {
  const raw = await fs.readFile(sourcesPath, 'utf-8');
  const json = JSON.parse(raw);
  const arr = z.array(SourceSchema).parse(json);
  return arr;
}

async function downloadIcon(id: string, url: string) {
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

function extFromUrl(url: string) {
  const u = new URL(url);
  const name = u.pathname.split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot) : '.png';
}

function mapTechialArray(kind: 'perks'|'addons'|'items'|'offerings'|'characters', arr: any[]): InternalEntity[] {
  const roleFor = (entry: any): 'survivor'|'killer'|undefined => {
    const r = (entry.role || entry.side || entry.type || '').toString().toLowerCase();
    if (r.includes('survivor')) return 'survivor';
    if (r.includes('killer')) return 'killer';
    return undefined;
  };
  return arr.map((e: any) => {
    const id = (e.id || e._id || e.slug || (e.name ? e.name.toLowerCase().replace(/[^a-z0-9]+/g,'_') : undefined)) as string;
    const name = (e.name || e.perkName || e.displayName || e.title || '').toString();
    const description = (e.description || e.desc || e.perkDesc || e.text || '').toString();
    const icon = e.icon || e.image || e.iconPath || e.iconUrl;
    const rarity = e.rarity || e.tier || e.color || undefined;
    const role = roleFor(e);
    const base: InternalEntity = {
      type: kind === 'perks' ? 'perk' : kind === 'addons' ? 'addon' : kind === 'items' ? 'item' : kind === 'offerings' ? 'offering' : 'character',
      id,
      name,
      description,
      rarity,
      icon,
      role,
      rules: [],
    };
    if (base.type === 'item') {
      // Attempt to map charges fields if present
      (base as any).charges = e.charges || e.maxCharges || undefined;
      (base as any).chargeRate = e.chargeRate || undefined;
    }
    if (base.type === 'addon') {
      (base as any).ownerItemType = e.item || e.parentItem || undefined;
    }
    return base;
  }).filter(e => e.id && e.name);
}

async function update() {
  await ensureDirs();
  let merged: any = {
    version: '0.0.0',
    characters: [] as InternalEntity[],
    items: [] as InternalEntity[],
    addons: [] as InternalEntity[],
    perks: [] as InternalEntity[],
    offerings: [] as InternalEntity[],
  };
  const sources = await readSources();
  for (const s of sources) {
    try {
      const res = await fetch(s.url);
      if (!res.ok) throw new Error(`fetch failed ${res.status}`);
      const data = await res.json();
      if (s.kind === 'dataset') {
        const parsed = datasetSchema.safeParse(data);
        if (parsed.success) {
          const ds = parsed.data;
          merged = {
            version: ds.version,
            characters: uniqById([...merged.characters, ...ds.characters]),
            items: uniqById([...merged.items, ...ds.items]),
            addons: uniqById([...merged.addons, ...ds.addons]),
            perks: uniqById([...merged.perks, ...ds.perks]),
            offerings: uniqById([...merged.offerings, ...ds.offerings]),
          };
          const all = [...ds.characters, ...ds.items, ...ds.addons, ...ds.perks, ...ds.offerings];
          await Promise.all(all.map(async (e) => {
            if (e.icon && /^https?:/i.test(e.icon)) await downloadIcon(e.id, e.icon);
          }));
        } else {
          console.warn(`Source ${s.name} (dataset) schema mismatch; skipping.`);
        }
      } else {
        // Assume array of entries for the given kind
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        const mapped = mapTechialArray(s.kind as any, arr);
        const withLocalIcons = await Promise.all(mapped.map(async e => {
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
      }
    } catch (err) {
      console.warn(`Failed to process source ${s.name}:`, (err as Error).message);
    }
  }

  // Normalize icon paths to public assets
  const normalizeIconPath = (e: any) => {
    if (e.icon && /^https?:/i.test(e.icon) === false) return e;
    const ext = e.icon ? extFromUrl(e.icon) : '.png';
    return { ...e, icon: `/assets/icons/${e.id}${ext}` };
  };

  const dsOut = {
    version: merged.version || '0.0.0',
    characters: merged.characters.map(normalizeIconPath),
    items: merged.items.map(normalizeIconPath),
    addons: merged.addons.map(normalizeIconPath),
    perks: merged.perks.map(normalizeIconPath),
    offerings: merged.offerings.map(normalizeIconPath),
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
}

function uniqById<T extends { id: string }>(arr: T[]): T[] {
  const map = new Map<string, T>();
  for (const x of arr) {
    if (!x?.id) continue;
    map.set(x.id, x);
  }
  return Array.from(map.values());
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});