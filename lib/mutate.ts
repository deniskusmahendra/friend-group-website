"use client";

import { toast } from "sonner";
import { getStore, type Store } from "@/lib/store";

/** Runs a write against the store with toast feedback. Resolves to true on success. */
export async function mutate(fn: (store: Store) => Promise<unknown>, success?: string) {
  try {
    const { store } = await getStore();
    await fn(store);
    if (success) toast.success(success);
    return true;
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong. Try again?");
    return false;
  }
}
