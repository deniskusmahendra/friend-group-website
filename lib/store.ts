// Data layer: Firestore when NEXT_PUBLIC_FIREBASE_* env vars are set,
// otherwise localStorage (each browser keeps its own data).
// update() accepts dotted keys, e.g. { "rsvp.denis": "going" }.

import type { CollectionName, Collections, NewDoc } from "@/lib/types";

export type Unsubscribe = () => void;

export interface Store {
  shared: boolean;
  subscribe<C extends CollectionName>(
    col: C,
    onData: (rows: Collections[C][]) => void,
    onError: (err: Error) => void,
  ): Unsubscribe;
  add<C extends CollectionName>(col: C, data: NewDoc<C>): Promise<string>;
  update(col: CollectionName, id: string, patch: Record<string, unknown>): Promise<void>;
  remove(col: CollectionName, id: string): Promise<void>;
  /** Creates or deep-merges into a document with a known id (nested maps are merged, not replaced) */
  merge(col: CollectionName, id: string, patch: Record<string, unknown>): Promise<void>;
  /** Writes a whole document under a known id (restoring a backup) */
  put(col: CollectionName, id: string, data: Record<string, unknown>): Promise<void>;
}

// Must be referenced literally so Next.js can inline them into the client bundle.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

async function createFirebaseStore(): Promise<Store> {
  // Loaded on demand so local mode doesn't download the Firebase SDK
  const [{ initializeApp, getApps }, fs] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore"),
  ]);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const db = fs.getFirestore(app);

  return {
    shared: true,
    subscribe(col, onData, onError) {
      return fs.onSnapshot(
        fs.collection(db, col),
        (snap) => onData(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Collections[typeof col])),
        onError,
      );
    },
    async add(col, data) {
      const ref = await fs.addDoc(fs.collection(db, col), { ...data, createdAt: Date.now() });
      return ref.id;
    },
    async update(col, id, patch) {
      await fs.updateDoc(fs.doc(db, col, id), patch);
    },
    async remove(col, id) {
      await fs.deleteDoc(fs.doc(db, col, id));
    },
    async merge(col, id, patch) {
      await fs.setDoc(fs.doc(db, col, id), patch, { merge: true });
    },
    async put(col, id, data) {
      await fs.setDoc(fs.doc(db, col, id), data);
    },
  };
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function deepMerge(target: Record<string, unknown>, patch: Record<string, unknown>) {
  for (const [k, v] of Object.entries(patch)) {
    target[k] = isPlainObject(v) && isPlainObject(target[k]) ? deepMerge(target[k], v) : v;
  }
  return target;
}

function createLocalStore(): Store {
  const key = (col: CollectionName) => `gang:data:${col}`;
  const listeners = new Map<CollectionName, Set<(rows: unknown[]) => void>>();

  const read = (col: CollectionName): Record<string, unknown>[] => {
    try {
      return JSON.parse(localStorage.getItem(key(col)) ?? "[]");
    } catch {
      return [];
    }
  };
  const emit = (col: CollectionName) => {
    const rows = read(col);
    listeners.get(col)?.forEach((cb) => cb(rows));
  };
  const write = (col: CollectionName, rows: unknown[]) => {
    localStorage.setItem(key(col), JSON.stringify(rows));
    emit(col);
  };

  // Keep other tabs in sync
  window.addEventListener("storage", (e) => {
    const col = e.key?.match(/^gang:data:(.+)$/)?.[1] as CollectionName | undefined;
    if (col) emit(col);
  });

  const setPath = (obj: Record<string, unknown>, path: string, value: unknown) => {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts.slice(0, -1)) cur = (cur[p] ??= {}) as Record<string, unknown>;
    cur[parts.at(-1)!] = value;
  };

  return {
    shared: false,
    subscribe(col, onData) {
      const cb = onData as (rows: unknown[]) => void;
      if (!listeners.has(col)) listeners.set(col, new Set());
      listeners.get(col)!.add(cb);
      cb(read(col));
      return () => void listeners.get(col)?.delete(cb);
    },
    async add(col, data) {
      const id = crypto.randomUUID();
      write(col, [...read(col), { ...data, id, createdAt: Date.now() }]);
      return id;
    },
    async update(col, id, patch) {
      write(
        col,
        read(col).map((row) => {
          if (row.id !== id) return row;
          const copy = structuredClone(row);
          for (const [k, v] of Object.entries(patch)) setPath(copy, k, v);
          return copy;
        }),
      );
    },
    async remove(col, id) {
      write(col, read(col).filter((row) => row.id !== id));
    },
    async merge(col, id, patch) {
      const rows = read(col);
      const row = rows.find((r) => r.id === id);
      if (!row) return write(col, [...rows, { ...patch, id }]);
      write(col, rows.map((r) => (r === row ? deepMerge(structuredClone(row), patch) : r)));
    },
    async put(col, id, data) {
      write(col, [...read(col).filter((row) => row.id !== id), { ...data, id }]);
    },
  };
}

export type StoreStatus = "local" | "shared" | "failed";

let storePromise: Promise<{ store: Store; status: StoreStatus }> | null = null;

/** Browser-only. Resolves once; every caller shares the same store. */
export function getStore() {
  storePromise ??= isFirebaseConfigured
    ? createFirebaseStore()
        .then((store) => ({ store, status: "shared" as const }))
        .catch((err) => {
          console.error("Firebase failed to load, falling back to local mode", err);
          return { store: createLocalStore(), status: "failed" as const };
        })
    : Promise.resolve({ store: createLocalStore(), status: "local" as const });
  return storePromise;
}
