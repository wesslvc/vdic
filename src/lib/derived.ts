import { getLecture, getLectures, getWordCatalogLecture, wordIndex } from "./catalog";
import type { ProgressData, Word } from "./types";

export function effectiveLectureId(wordId: string, progress: ProgressData): number {
  return progress.lectureOverrides[wordId] ?? getWordCatalogLecture(wordId);
}

/** Words currently assigned to a lecture, accounting for manual reassignment overrides. */
export function wordsForLecture(lectureId: number, progress: ProgressData): Word[] {
  const catalogWords = getLecture(lectureId)?.words ?? [];
  const movedIn: Word[] = [];
  for (const [wordId, overrideLecture] of Object.entries(progress.lectureOverrides)) {
    if (overrideLecture === lectureId) {
      const w = wordIndex[wordId];
      const catalogOwner = getWordCatalogLecture(wordId);
      if (w && catalogOwner !== lectureId) movedIn.push(w);
    }
  }
  const movedOutIds = new Set(
    Object.entries(progress.lectureOverrides)
      .filter(([, l]) => l !== lectureId)
      .map(([id]) => id)
  );
  const stayed = catalogWords.filter((w) => !movedOutIds.has(w.id));
  return [...stayed, ...movedIn];
}

export type LectureProgress = {
  total: number;
  attempted: number;
  mastered: number;
  wrongCount: number;
  lastStudiedAt: string | null;
};

export function lectureProgress(lectureId: number, progress: ProgressData): LectureProgress {
  const words = wordsForLecture(lectureId, progress);
  let attempted = 0;
  let mastered = 0;
  let wrongCount = 0;
  let lastStudiedAt: string | null = null;
  for (const w of words) {
    const stat = progress.wordStats[w.id];
    if (!stat || stat.seen === 0) continue;
    attempted++;
    if (stat.lastResult === "correct") mastered++;
    if (stat.lastResult === "wrong") wrongCount++;
    if (stat.lastReviewedAt && (!lastStudiedAt || stat.lastReviewedAt > lastStudiedAt)) {
      lastStudiedAt = stat.lastReviewedAt;
    }
  }
  return { total: words.length, attempted, mastered, wrongCount, lastStudiedAt };
}

export function allWrongWords(progress: ProgressData): Word[] {
  const result: Word[] = [];
  for (const [wordId, stat] of Object.entries(progress.wordStats)) {
    if (stat.lastResult === "wrong") {
      const w = wordIndex[wordId];
      if (w) result.push(w);
    }
  }
  return result;
}

export type OverallStats = {
  totalWords: number;
  attempted: number;
  mastered: number;
  wrongCount: number;
  studyDays: number;
};

export function overallStats(progress: ProgressData): OverallStats {
  const lectures = getLectures();
  let attempted = 0;
  let mastered = 0;
  let wrongCount = 0;
  for (const w of Object.values(progress.wordStats)) {
    if (w.seen === 0) continue;
    attempted++;
    if (w.lastResult === "correct") mastered++;
    if (w.lastResult === "wrong") wrongCount++;
  }
  const totalWords = lectures.reduce((sum, l) => sum + l.words.length, 0);
  const studyDays = new Set(progress.sessionLog.map((s) => s.date)).size;
  return { totalWords, attempted, mastered, wrongCount, studyDays };
}
