import { create } from 'zustand';
import type { CompiledDataset, DatasetMeta, DbdConstants } from '@/lib/types';
import { z } from 'zod';
import { datasetSchema, metaSchema, constantsSchema } from '@/lib/schema';

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
      const [dsRes, metaRes, constRes] = await Promise.all([
        fetch(DEFAULT_PATHS.dataset),
        fetch(DEFAULT_PATHS.meta),
        fetch(DEFAULT_PATHS.constants),
      ]);
      const [dsJson, metaJson, constJson] = await Promise.all([
        dsRes.json(),
        metaRes.json(),
        constRes.json(),
      ]);
      const dataset = datasetSchema.parse(dsJson);
      const meta = metaSchema.parse(metaJson);
      const constants = constantsSchema.parse(constJson);
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
      // In-app updater could be implemented here using Tauri APIs to fetch and write files.
      // For now, reloading dataset simulates fetching latest compiled files.
      await get().loadDataset();
    } finally {
      set({ checkingUpdate: false });
    }
  },
}));