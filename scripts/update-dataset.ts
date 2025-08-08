#!/usr/bin/env ts-node
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import fetch from 'node-fetch';
import { datasetSchema } from '../src/lib/schema';

const sourcesPath = path.resolve(__dirname, '../data/sources.json');
const compiledDir = path.resolve(__dirname, '../data/compiled');
const iconsDir = path.resolve(__dirname, '../assets/icons');
const metaPath = path.join(compiledDir, 'meta/version.json');
const datasetPath = path.join(compiledDir, 'dataset.json');

const SourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
});

async function ensureDirs() {
  await fs.mkdir(compiledDir, { recursive: true });
  await fs.mkdir(iconsDir, { recursive: true });
  await fs.mkdir(path.dirname(metaPath), { recursive: true });
}

async function readSources(): Promise<{ name: string; url: string }[]> {
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
    const out = path.join(iconsDir, `${id}${extFromUrl(url)}`);
    await fs.writeFile(out, buf);
  } catch {}
}

function extFromUrl(url: string) {
  const u = new URL(url);
  const name = u.pathname.split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot) : '.png';
}

async function update() {
  await ensureDirs();
  let merged: any = {
    version: '0.0.0',
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
      // Expect a dataset-like format or map to internal
      const parsed = datasetSchema.safeParse(data);
      if (parsed.success) {
        const ds = parsed.data;
        merged = {
          version: ds.version,
          characters: [...merged.characters, ...ds.characters],
          items: [...merged.items, ...ds.items],
          addons: [...merged.addons, ...ds.addons],
          perks: [...merged.perks, ...ds.perks],
          offerings: [...merged.offerings, ...ds.offerings],
        };
        // download icons if provided
        const all = [...ds.characters, ...ds.items, ...ds.addons, ...ds.perks, ...ds.offerings];
        await Promise.all(all.map(async (e) => {
          if (e.icon && /^https?:/i.test(e.icon)) await downloadIcon(e.id, e.icon);
        }));
      } else {
        console.warn(`Source ${s.name} is not in expected schema; skipping.`);
      }
    } catch (err) {
      console.warn(`Failed to process source ${s.name}:`, (err as Error).message);
    }
  }
  // Save dataset
  await fs.writeFile(datasetPath, JSON.stringify(merged, null, 2), 'utf-8');
  const meta = { version: merged.version || '0.0.0', lastUpdated: new Date().toISOString() };
  await fs.mkdir(path.dirname(metaPath), { recursive: true });
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  console.log('Dataset updated.');
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});