"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after client-side hydration, to safely gate localStorage-derived UI. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
