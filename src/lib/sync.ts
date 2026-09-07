"use client";

import { RAW_OVERRIDES_URL } from "./syncConfig";

const SECRET_KEY = "vdic:sync-secret";

export function getSyncSecret(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SECRET_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setSyncSecret(secret: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SECRET_KEY, secret);
  } catch {
    // ignore
  }
}

export function isSyncConfigured(): boolean {
  return getSyncSecret().length > 0;
}

export type OverridesBundle = {
  meaningOverrides: Record<string, string>;
  nuanceNotes: Record<string, string>;
  lectureOverrides: Record<string, number>;
};

/** Pushes local overrides to GitHub (fire-and-forget from callers). No-op if no secret is set. */
export async function pushOverrides(
  overrides: OverridesBundle
): Promise<{ ok: boolean; error?: string }> {
  const secret = getSyncSecret();
  if (!secret) return { ok: false, error: "no-secret" };
  try {
    const res = await fetch("/api/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-edit-secret": secret },
      body: JSON.stringify(overrides),
    });
    if (!res.ok) return { ok: false, error: await res.text() };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Fetches the shared overrides file from GitHub (public repo, no auth needed to read). */
export async function pullOverrides(): Promise<OverridesBundle | null> {
  try {
    const res = await fetch(`${RAW_OVERRIDES_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      meaningOverrides: data.meaningOverrides ?? {},
      nuanceNotes: data.nuanceNotes ?? {},
      lectureOverrides: data.lectureOverrides ?? {},
    };
  } catch {
    return null;
  }
}
