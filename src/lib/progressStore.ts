"use client";

import { useSyncExternalStore } from "react";
import type { CustomWord, ProgressData, SessionLogEntry, WordStat } from "./types";
import { todayStr } from "./date";
import { pullOverrides, pushOverrides } from "./sync";

const STORAGE_KEY = "vdic:progress:v1";

function emptyData(): ProgressData {
  return {
    version: 1,
    wordStats: {},
    lectureOverrides: {},
    meaningOverrides: {},
    termOverrides: {},
    nuanceNotes: {},
    memos: {},
    favorites: {},
    customWords: {},
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
      meaningOverrides: parsed.meaningOverrides ?? {},
      termOverrides: parsed.termOverrides ?? {},
      nuanceNotes: parsed.nuanceNotes ?? {},
      memos: parsed.memos ?? {},
      favorites: parsed.favorites ?? {},
      customWords: parsed.customWords ?? {},
      sessionLog: Array.isArray(parsed.sessionLog) ? parsed.sessionLog : [],
    };
  } catch {
    return emptyData();
  }
}

let state: ProgressData = emptyData();
let hydrated = false;
const listeners = new Set<() => void>();

/** Fills in words the local copy has no entry for; never touches a word already set locally. */
function preferLocal<T extends Record<string, unknown>>(remote: T, local: T): T {
  return { ...remote, ...local };
}

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    state = loadFromStorage();
    hydrated = true;
    pullOverrides().then((remote) => {
      if (!remote) return;
      setState({
        ...state,
        meaningOverrides: preferLocal(remote.meaningOverrides, state.meaningOverrides),
        termOverrides: preferLocal(remote.termOverrides, state.termOverrides),
        nuanceNotes: preferLocal(remote.nuanceNotes, state.nuanceNotes),
        lectureOverrides: preferLocal(remote.lectureOverrides, state.lectureOverrides),
        memos: preferLocal(remote.memos, state.memos),
        customWords: preferLocal(remote.customWords, state.customWords),
      });
    });
  }
}

function syncPush() {
  pushOverrides({
    meaningOverrides: state.meaningOverrides,
    termOverrides: state.termOverrides,
    nuanceNotes: state.nuanceNotes,
    lectureOverrides: state.lectureOverrides,
    memos: state.memos,
    customWords: state.customWords,
  });
}

/** Manually push the current word edits to GitHub, for a "지금 동기화" button with visible feedback. */
export function syncNow() {
  ensureHydrated();
  return pushOverrides({
    meaningOverrides: state.meaningOverrides,
    termOverrides: state.termOverrides,
    nuanceNotes: state.nuanceNotes,
    lectureOverrides: state.lectureOverrides,
    memos: state.memos,
    customWords: state.customWords,
  });
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
  syncPush();
}

export function setMeaningOverride(wordId: string, meaning: string, catalogMeaning: string) {
  ensureHydrated();
  const overrides = { ...state.meaningOverrides };
  const trimmed = meaning.trim();
  if (!trimmed || trimmed === catalogMeaning) {
    delete overrides[wordId];
  } else {
    overrides[wordId] = trimmed;
  }
  setState({ ...state, meaningOverrides: overrides });
  syncPush();
}

export function setTermOverride(wordId: string, term: string, catalogTerm: string) {
  ensureHydrated();
  const overrides = { ...state.termOverrides };
  const trimmed = term.trim();
  if (!trimmed || trimmed === catalogTerm) {
    delete overrides[wordId];
  } else {
    overrides[wordId] = trimmed;
  }
  setState({ ...state, termOverrides: overrides });
  syncPush();
}

export function setNuanceNote(wordId: string, nuance: string) {
  ensureHydrated();
  const notes = { ...state.nuanceNotes };
  const trimmed = nuance.trim();
  if (!trimmed) {
    delete notes[wordId];
  } else {
    notes[wordId] = trimmed;
  }
  setState({ ...state, nuanceNotes: notes });
  syncPush();
}

/** A free-text note shown alongside the answer every time, regardless of right/wrong - not quizzed. */
export function setMemo(wordId: string, memo: string) {
  ensureHydrated();
  const memos = { ...state.memos };
  const trimmed = memo.trim();
  if (!trimmed) {
    delete memos[wordId];
  } else {
    memos[wordId] = trimmed;
  }
  setState({ ...state, memos });
  syncPush();
}

export function isFavorite(wordId: string): boolean {
  ensureHydrated();
  return !!state.favorites[wordId];
}

export function toggleFavorite(wordId: string) {
  ensureHydrated();
  const favorites = { ...state.favorites };
  if (favorites[wordId]) {
    delete favorites[wordId];
  } else {
    favorites[wordId] = true;
  }
  setState({ ...state, favorites });
}

/** Adds a word the user typed in themselves. Returns the new word's id. */
export function addCustomWord(term: string, meaning: string, lectureId: number): string {
  ensureHydrated();
  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const word: CustomWord = { id, term: term.trim(), meaning: meaning.trim(), lectureId };
  setState({ ...state, customWords: { ...state.customWords, [id]: word } });
  syncPush();
  return id;
}

export function deleteCustomWord(id: string) {
  ensureHydrated();
  const customWords = { ...state.customWords };
  delete customWords[id];
  setState({ ...state, customWords });
  syncPush();
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

/** Clears study stats and the session log, but keeps word edits (meaning/nuance/memo/lecture
 * reassignment/custom words) intact - those are corrections to the data itself, not progress. */
export function resetStudyProgress() {
  setState({ ...state, wordStats: {}, sessionLog: [] });
}

/** Wipes everything, including word edits. Rarely what you want - see resetStudyProgress. */
export function resetEverything() {
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
      meaningOverrides: parsed.meaningOverrides ?? {},
      termOverrides: parsed.termOverrides ?? {},
      nuanceNotes: parsed.nuanceNotes ?? {},
      memos: parsed.memos ?? {},
      favorites: parsed.favorites ?? {},
      customWords: parsed.customWords ?? {},
      sessionLog: Array.isArray(parsed.sessionLog) ? parsed.sessionLog : [],
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "파일을 읽을 수 없습니다." };
  }
}
