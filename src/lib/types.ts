export type Word = {
  id: string;
  term: string;
  meaning: string;
};

export type Lecture = {
  id: number;
  title: string;
  subtitle: string;
  words: Word[];
};

export type Catalog = {
  lectures: Lecture[];
};

export type WordStat = {
  seen: number;
  correct: number;
  wrong: number;
  lastResult: "correct" | "wrong" | null;
  lastReviewedAt: string | null;
};

export type SessionLogEntry = {
  id: string;
  date: string;
  timestamp: string;
  lectureLabel: string;
  mode: "study" | "wrong-note" | "favorites";
  count: number;
  correctCount: number;
};

/** A word added by hand through the app, not from the source notes. */
export type CustomWord = {
  id: string;
  term: string;
  meaning: string;
  lectureId: number;
};

export type ProgressData = {
  version: 1;
  wordStats: Record<string, WordStat>;
  lectureOverrides: Record<string, number>;
  meaningOverrides: Record<string, string>;
  nuanceNotes: Record<string, string>;
  memos: Record<string, string>;
  favorites: Record<string, true>;
  customWords: Record<string, CustomWord>;
  sessionLog: SessionLogEntry[];
};
