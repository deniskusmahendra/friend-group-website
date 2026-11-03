"use client";

import { toast } from "sonner";
import { getStore, type Store } from "@/lib/store";
import { collectionNames, type CollectionName, type Collections } from "@/lib/types";
import type { MemberId } from "@/content/members";

// Deleting moves things to Trash (sets deletedAt). They can be restored for
// TRASH_DAYS days; after that the next visitor's browser removes them for good.

export const TRASH_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export const daysLeft = (deletedAt: number, now: number) =>
  Math.max(0, Math.ceil((deletedAt + TRASH_DAYS * DAY - now) / DAY));

/** Moves documents to Trash, with an Undo button on the toast. Resolves to true on success. */
export async function moveToTrash(col: CollectionName, ids: string | string[], me: MemberId, label: string) {
  const list = [ids].flat();
  try {
    const { store } = await getStore();
    const deletedAt = Date.now();
    await Promise.all(list.map((id) => store.update(col, id, { deletedAt, deletedBy: me })));
    toast.success(`${label} deleted`, {
      description: `You can restore ${list.length > 1 ? "them" : "it"} from Trash for ${TRASH_DAYS} days.`,
      action: { label: "Undo", onClick: () => void restoreFromTrash(col, list) },
    });
    return true;
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong. Try again?");
    return false;
  }
}

export async function restoreFromTrash(col: CollectionName, ids: string | string[]) {
  try {
    const { store } = await getStore();
    await Promise.all([ids].flat().map((id) => store.update(col, id, { deletedAt: null, deletedBy: null })));
    toast.success("Restored ↩️");
    return true;
  } catch (err) {
    console.error(err);
    toast.error("Couldn't restore it. Try again?");
    return false;
  }
}

/** Removes a document for good. Uploaded photos also lose their file in Blob storage. */
async function deleteForever(store: Store, col: CollectionName, row: Collections[CollectionName]) {
  if (col === "photos" && "src" in row) {
    const res = await fetch("/api/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: row.src }),
    });
    // 400 = not a Blob file (nothing to remove); anything else, try again next visit
    if (!res.ok && res.status !== 400) throw new Error(`Photo file delete failed (${res.status})`);
  }
  await store.remove(col, row.id);
}

const purging = new Set<string>();

/** Deletes trashed documents older than TRASH_DAYS. Called whenever a collection updates. */
export function purgeExpired<C extends CollectionName>(col: C, trashed: Collections[C][]) {
  const cutoff = Date.now() - TRASH_DAYS * DAY;
  for (const row of trashed) {
    const key = `${col}/${row.id}`;
    if (!row.deletedAt || row.deletedAt > cutoff || purging.has(key)) continue;
    purging.add(key);
    getStore()
      .then(({ store }) => deleteForever(store, col, row))
      .catch((err) => console.error(`[trash] couldn't purge ${key}`, err));
  }
}

// ---- Backups ----------------------------------------------------------------

type Backup = { app: "gang"; version: 1; exportedAt: string; data: Partial<Record<CollectionName, unknown[]>> };

/** Current contents of a collection, including Trash */
function readOnce<C extends CollectionName>(store: Store, col: C) {
  return new Promise<Collections[C][]>((resolve, reject) => {
    let done = false;
    const unsub = store.subscribe(
      col,
      (rows) => {
        if (done) return;
        done = true;
        resolve(rows);
        // Deferred: the local store answers before subscribe() has returned
        queueMicrotask(() => unsub());
      },
      reject,
    );
  });
}

/** Downloads everything (Trash included) as a JSON file */
export async function downloadBackup() {
  const { store } = await getStore();
  const data: Backup["data"] = {};
  for (const col of collectionNames) data[col] = await readOnce(store, col);

  const backup: Backup = { app: "gang", version: 1, exportedAt: new Date().toISOString(), data };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `gang-backup-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Adds back everything in a backup file that's missing now (deleted for good).
 * Things that still exist, even in Trash, are left as they are. Returns how many were added.
 */
export async function restoreBackup(file: File) {
  const backup = JSON.parse(await file.text()) as Backup;
  if (backup?.app !== "gang" || typeof backup.data !== "object") throw new Error("Not a GANG backup file");

  const { store } = await getStore();
  let added = 0;
  for (const col of collectionNames) {
    const rows = backup.data[col];
    if (!Array.isArray(rows)) continue;
    const existing = new Set((await readOnce(store, col)).map((r) => r.id));
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      // Restored items come back live, even if they were in Trash when backed up
      const { id, ...data } = row as Record<string, unknown>;
      if (typeof id !== "string" || !id || existing.has(id)) continue;
      delete data.deletedAt;
      delete data.deletedBy;
      await store.put(col, id, data);
      added++;
    }
  }
  return added;
}
