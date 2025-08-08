import type { CompiledDataset, DatasetMeta } from '@/lib/types';

const DS_KEY = 'dbd_compiled_dataset_v1';
const META_KEY = 'dbd_dataset_meta_v1';

export function saveCompiledDataset(ds: CompiledDataset, meta: DatasetMeta) {
  try {
    localStorage.setItem(DS_KEY, JSON.stringify(ds));
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {}
}

export function loadCompiledDataset(): { ds: CompiledDataset | null; meta: DatasetMeta | null } {
  try {
    const dsRaw = localStorage.getItem(DS_KEY);
    const metaRaw = localStorage.getItem(META_KEY);
    return { ds: dsRaw ? JSON.parse(dsRaw) : null, meta: metaRaw ? JSON.parse(metaRaw) : null };
  } catch {
    return { ds: null, meta: null };
  }
}

export function clearCompiledDataset() {
  try {
    localStorage.removeItem(DS_KEY);
    localStorage.removeItem(META_KEY);
  } catch {}
}