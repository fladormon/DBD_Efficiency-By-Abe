import { create } from 'zustand';
import type { CompiledDataset, DatasetMeta, DbdConstants } from '@/lib/types';
import { datasetSchema, metaSchema, constantsSchema } from '@/lib/schema';
import { saveCompiledDataset, loadCompiledDataset } from '@/lib/storage';

export type DatasetState = {
  initialized: boolean;
  error: string | null;
  dataset: CompiledDataset | null;
  characters: { id: string; name: string; icon?: string; role?: string }[];
  items: { id: string; name: string; icon?: string; role?: string }[];
  addons: { id: string; name: string; icon?: string; role?: string }[];
  perks: { id: string; name: string; icon?: string; role?: string }[];
  offerings: { id: string; name: string; icon?: string; role?: string }[];
  meta: DatasetMeta | null;
  constants: DbdConstants | null;
  checkingUpdate: boolean;
  loadDataset: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
};

const DEFAULT_PATHS = {
  dataset: '/data/compiled/dataset.json',
  meta: '/data/compiled/meta/version.json',
  constants: '/data/constants.json',
};

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.text();
}

function extractListFromWiki(html: string, pattern: RegExp): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  const rx = new RegExp(pattern, 'gi');
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html))) {
    const name = (m[1] || m[2] || '').trim();
    if (!name) continue;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    out.push({ id, name });
  }
  return out;
}

async function scrapeWiki(): Promise<{ ds: CompiledDataset; meta: DatasetMeta }> {
  // Basic approach: fetch summary pages and extract names.
  // Perks: /wiki/Perk (table list)
  // Killers: /wiki/Killers, Survivors: /wiki/Survivors
  const [perksHtml, killersHtml, survivorsHtml] = await Promise.all([
    fetchText('https://deadbydaylight.wiki.gg/wiki/Perk'),
    fetchText('https://deadbydaylight.wiki.gg/wiki/Killers'),
    fetchText('https://deadbydaylight.wiki.gg/wiki/Survivors'),
  ]);
  // Extremely conservative regexes to match link titles/captions in tables/lists
  const perks = extractListFromWiki(perksHtml, /title="(?:Hex:\s*)?([^"]+?)"/);
  const killers = extractListFromWiki(killersHtml, /title="The\s([^"]+?)"/);
  const survivors = extractListFromWiki(survivorsHtml, /title="([A-Z][a-z]+\s[A-Z][a-z]+)"/);

  const characters = [
    ...killers.map(k => ({ type: 'character', id: `killer_${k.id}`, name: `The ${k.name}`, role: 'killer' })),
    ...survivors.map(s => ({ type: 'character', id: `survivor_${s.id}`, name: s.name, role: 'survivor' })),
  ] as any[];

  const ds: CompiledDataset = {
    version: 'wiki-scrape',
    characters,
    items: [],
    addons: [],
    perks: perks.map(p => ({ type: 'perk', id: p.id, name: p.name })) as any[],
    offerings: [],
  };
  const meta: DatasetMeta = { version: ds.version, lastUpdated: new Date().toISOString() };
  return { ds, meta };
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  initialized: false,
  error: null,
  dataset: null,
  characters: [],
  items: [],
  addons: [],
  perks: [],
  offerings: [],
  meta: null,
  constants: null,
  checkingUpdate: false,
  loadDataset: async () => {
    try {
      // load from localStorage first
      const fromLocal = loadCompiledDataset();
      const [constRes, dsRes, metaRes] = await Promise.all([
        fetch(DEFAULT_PATHS.constants).then(r => r.json()),
        fromLocal.ds ? Promise.resolve(fromLocal.ds) : fetch(DEFAULT_PATHS.dataset).then(r => r.json()),
        fromLocal.meta ? Promise.resolve(fromLocal.meta) : fetch(DEFAULT_PATHS.meta).then(r => r.json()),
      ]);
      const dataset = datasetSchema.parse(dsRes);
      const meta = metaSchema.parse(metaRes);
      const constants = constantsSchema.parse(constRes);
      set({
        initialized: true,
        error: null,
        dataset,
        characters: dataset.characters,
        items: dataset.items,
        addons: dataset.addons,
        perks: dataset.perks,
        offerings: dataset.offerings,
        meta,
        constants,
      });
    } catch (e) {
      set({ initialized: false, error: (e as Error).message });
    }
  },
  checkForUpdates: async () => {
    set({ checkingUpdate: true });
    try {
      // Scrape the wiki and persist
      const { ds, meta } = await scrapeWiki();
      saveCompiledDataset(ds, meta);
      // reload into store
      set({
        dataset: ds,
        characters: ds.characters,
        items: ds.items,
        addons: ds.addons,
        perks: ds.perks,
        offerings: ds.offerings,
        meta,
        initialized: true,
        error: null,
      });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ checkingUpdate: false });
    }
  },
}));