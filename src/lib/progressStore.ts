"use client";

import { useSyncExternalStore } from "react";
import type { ProgressData, SessionLogEntry, WordStat } from "./types";
import { todayStr } from "./date";

const STORAGE_KEY = "vdic:progress:v1";

function emptyData(): ProgressData {
  return {
    version: 1,
    wordStats: {},
    lectureOverrides: {},
    sessionLog: [],
  };
}

function loadFromStorage(): ProgressData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      wordStats: parsed.wordStats ?? {},
      lectureOverrides: parsed.lectureOverrides ?? {},
      sessionLog: Array.isArray(parsed.sessionLog) ? parsed.sessionLog : [],
    };
  } catch {
    return emptyData();
  }
}

let state: ProgressData = emptyData();
let hydrated = false;
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    state = loadFromStorage();
    hydrated = true;
  }
}

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable - ignore, in-memory state still works this session
  }
}

function setState(next: ProgressData) {
  state = next;
  persist();
  emit();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        state = loadFromStorage();
        callback();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(callback);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(callback);
}

function getSnapshot(): ProgressData {
  ensureHydrated();
  return state;
}

function getServerSnapshot(): ProgressData {
  return emptyData();
}

export function useProgress(): ProgressData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const defaultWordStat: WordStat = {
  seen: 0,
  correct: 0,
  wrong: 0,
  lastResult: null,
  lastReviewedAt: null,
};

export function getWordStat(wordId: string): WordStat {
  ensureHydrated();
  return state.wordStats[wordId] ?? defaultWordStat;
}

export function recordAnswer(wordId: string, correct: boolean) {
  ensureHydrated();
  const prev = state.wordStats[wordId] ?? { ...defaultWordStat };
  const next: WordStat = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    lastResult: correct ? "correct" : "wrong",
    lastReviewedAt: new Date().toISOString(),
  };
  setState({
    ...state,
    wordStats: { ...state.wordStats, [wordId]: next },
  });
}

export function moveWordToLecture(wordId: string, lectureId: number, catalogLectureId: number) {
  ensureHydrated();
  const overrides = { ...state.lectureOverrides };
  if (lectureId === catalogLectureId) {
    delete overrides[wordId];
  } else {
    overrides[wordId] = lectureId;
  }
  setState({ ...state, lectureOverrides: overrides });
}

export function logSession(entry: Omit<SessionLogEntry, "id" | "date" | "timestamp">) {
  ensureHydrated();
  const full: SessionLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: todayStr(),
    timestamp: new Date().toISOString(),
  };
  setState({ ...state, sessionLog: [full, ...state.sessionLog] });
}

export function resetProgress() {
  setState(emptyData());
}

export function exportProgressJSON(): string {
  ensureHydrated();
  return JSON.stringify(state, null, 2);
}

export function importProgressJSON(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, error: "잘못된 파일 형식입니다." };
    }
    setState({
      version: 1,
      wordStats: parsed.wordStats ?? {},
      lectureOverrides: parsed.lectureOverrides ?? {},
      sessionLog: Array.isArray(parsed.sessionLog) ? parsed.sessionLog : [],
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "파일을 읽을 수 없습니다." };
  }
}
