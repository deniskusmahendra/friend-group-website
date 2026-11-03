"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * false while React is hydrating this component, true afterwards.
 * Use it to keep browser-only values (like localStorage) out of the first render,
 * even inside Suspense boundaries that hydrate after their parents.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
