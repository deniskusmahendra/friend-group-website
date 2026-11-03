"use client";

import { useSyncExternalStore } from "react";
import { getStore, type StoreStatus } from "@/lib/store";
import { purgeExpired } from "@/lib/trash";
import type { CollectionName, Collections } from "@/lib/types";

/** rows = live documents; trashed = ones in Trash (deletedAt set) */
type Snapshot<T> = { rows: T[]; trashed: T[]; loading: boolean; error: Error | null };

const LOADING: Snapshot<never> = { rows: [], trashed: [], loading: true, error: null };

// One live subscription per collection, shared by every component and kept
// open for the whole visit, so switching pages shows data instantly.
const snapshots = new Map<CollectionName, Snapshot<unknown>>();
const listeners = new Map<CollectionName, Set<() => void>>();
const started = new Set<CollectionName>();

function start(col: CollectionName) {
  if (started.has(col)) return;
  started.add(col);
  const notify = () => listeners.get(col)?.forEach((l) => l());
  getStore().then(({ store }) =>
    store.subscribe(
      col,
      (all) => {
        const rows = all.filter((r) => !r.deletedAt);
        const trashed = all.filter((r) => r.deletedAt);
        snapshots.set(col, { rows, trashed, loading: false, error: null });
        notify();
        purgeExpired(col, trashed);
      },
      (error) => {
        console.error(`[${col}]`, error);
        snapshots.set(col, { ...(snapshots.get(col) ?? LOADING), loading: false, error });
        notify();
      },
    ),
  );
}

export function useCollection<C extends CollectionName>(col: C) {
  return useSyncExternalStore(
    (listener) => {
      if (!listeners.has(col)) listeners.set(col, new Set());
      listeners.get(col)!.add(listener);
      start(col);
      return () => void listeners.get(col)!.delete(listener);
    },
    () => (snapshots.get(col) ?? LOADING) as Snapshot<Collections[C]>,
    () => LOADING as Snapshot<Collections[C]>,
  );
}

let status: StoreStatus | null = null;
const statusListeners = new Set<() => void>();

/** null until the store has loaded */
export function useStoreStatus() {
  return useSyncExternalStore(
    (listener) => {
      statusListeners.add(listener);
      getStore().then((s) => {
        status = s.status;
        statusListeners.forEach((l) => l());
      });
      return () => void statusListeners.delete(listener);
    },
    () => status,
    () => null,
  );
}
