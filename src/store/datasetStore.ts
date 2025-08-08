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

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function absol(url: string): string {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return `https://deadbydaylight.wiki.gg${url}`;
}

function parseListWithImages(html: string): { id: string; name: string; icon?: string }[] {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const root = dom.querySelector('.mw-parser-output') || dom.body;
  const results: { id: string; name: string; icon?: string }[] = [];
  root.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    const title = a.getAttribute('title') || a.textContent || '';
    const name = title.trim();
    if (!name) return;
    // Skip non-content anchors
    if (name.length < 2) return;
    const icon = img ? absol(img.getAttribute('src') || '') : undefined;
    results.push({ id: normalizeId(name), name, icon });
  });
  // Deduplicate by id, prefer entries with icons
  const map = new Map<string, { id: string; name: string; icon?: string }>();
  for (const r of results) {
    const ex = map.get(r.id);
    if (!ex || (!ex.icon && r.icon)) map.set(r.id, r);
  }
  return Array.from(map.values());
}

async function scrapeWiki(): Promise<{ ds: CompiledDataset; meta: DatasetMeta }> {
  const base = 'https://deadbydaylight.wiki.gg';
  const [perksHtml, killersHtml, survivorsHtml, itemsHtml, offeringsHtml, addonsHtml] = await Promise.all([
    fetchText(`${base}/wiki/Perk`),
    fetchText(`${base}/wiki/Killers`),
    fetchText(`${base}/wiki/Survivors`),
    fetchText(`${base}/wiki/Item`),
    fetchText(`${base}/wiki/Offering`),
    // Add-ons may be split; try a category page. If it 404s, we catch later.
    fetchText(`${base}/wiki/Add-ons`).catch(() => ''),
  ]);

  const perkEntries = parseListWithImages(perksHtml);
  const killerEntries = parseListWithImages(killersHtml).map(e => ({ ...e, name: e.name.startsWith('The ') ? e.name : `The ${e.name}` }));
  const survivorEntries = parseListWithImages(survivorsHtml);
  const itemEntries = parseListWithImages(itemsHtml);
  const offeringEntries = parseListWithImages(offeringsHtml);
  const addonEntries = addonsHtml ? parseListWithImages(addonsHtml) : [];

  const characters = [
    ...killerEntries.map(k => ({ type: 'character', id: `killer_${k.id}`, name: k.name, icon: k.icon, role: 'killer' })),
    ...survivorEntries.map(s => ({ type: 'character', id: `survivor_${s.id}`, name: s.name, icon: s.icon, role: 'survivor' })),
  ] as any[];

  const ds: CompiledDataset = {
    version: 'wiki-scrape',
    characters,
    items: itemEntries.map(i => ({ type: 'item', id: i.id, name: i.name, icon: i.icon })) as any[],
    addons: addonEntries.map(a => ({ type: 'addon', id: a.id, name: a.name, icon: a.icon })) as any[],
    perks: perkEntries.map(p => ({ type: 'perk', id: p.id, name: p.name, icon: p.icon })) as any[],
    offerings: offeringEntries.map(o => ({ type: 'offering', id: o.id, name: o.name, icon: o.icon })) as any[],
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
      const { ds, meta } = await scrapeWiki();
      saveCompiledDataset(ds, meta);
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