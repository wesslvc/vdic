import { getAllWords, getLectures, getWordCatalogLecture, wordIndex } from "./catalog";
import type { ProgressData, Word } from "./types";

export type StudyWord = Word & { nuance?: string; memo?: string };

export function effectiveMeaning(word: Word, progress: ProgressData): string {
  return progress.meaningOverrides[word.id] ?? word.meaning;
}

export function effectiveTerm(word: Word, progress: ProgressData): string {
  return progress.termOverrides[word.id] ?? word.term;
}

export function toStudyWord(word: Word, progress: ProgressData): StudyWord {
  const nuance = progress.nuanceNotes[word.id];
  const memo = progress.memos[word.id];
  return {
    ...word,
    term: effectiveTerm(word, progress),
    meaning: effectiveMeaning(word, progress),
    ...(nuance ? { nuance } : {}),
    ...(memo ? { memo } : {}),
  };
}

/** Looks a word up by id, whether it's from the source notes or added by hand. */
export function getWordById(wordId: string, progress: ProgressData): Word | undefined {
  return wordIndex[wordId] ?? progress.customWords[wordId];
}

/** All words - the source notes plus anything the user added by hand. */
export function getAllWordsWithCustom(progress: ProgressData): Word[] {
  return [...getAllWords(), ...Object.values(progress.customWords)];
}

export function effectiveLectureId(wordId: string, progress: ProgressData): number {
  if (progress.lectureOverrides[wordId] != null) return progress.lectureOverrides[wordId];
  const custom = progress.customWords[wordId];
  if (custom) return custom.lectureId;
  return getWordCatalogLecture(wordId);
}

/** Words currently assigned to a lecture, accounting for manual reassignment, custom additions,
 * and meaning/nuance/memo edits. */
export function wordsForLecture(lectureId: number, progress: ProgressData): StudyWord[] {
  return getAllWordsWithCustom(progress)
    .filter((w) => effectiveLectureId(w.id, progress) === lectureId)
    .map((w) => toStudyWord(w, progress));
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

export function allWrongWords(progress: ProgressData): StudyWord[] {
  const result: StudyWord[] = [];
  for (const [wordId, stat] of Object.entries(progress.wordStats)) {
    if (stat.lastResult === "wrong") {
      const w = getWordById(wordId, progress);
      if (w) result.push(toStudyWord(w, progress));
    }
  }
  return result;
}

export type OverallStats = {
  totalWords: number;
  attempted: number;
  mastered: number;
  wrongCount: number;
  favoriteCount: number;
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
  const totalWords =
    lectures.reduce((sum, l) => sum + l.words.length, 0) + Object.keys(progress.customWords).length;
  const studyDays = new Set(progress.sessionLog.map((s) => s.date)).size;
  const favoriteCount = Object.keys(progress.favorites).length;
  return { totalWords, attempted, mastered, wrongCount, favoriteCount, studyDays };
}

/** Words the user starred, regardless of current right/wrong status - only removed by hand. */
export function allFavoriteWords(progress: ProgressData): StudyWord[] {
  const result: StudyWord[] = [];
  for (const wordId of Object.keys(progress.favorites)) {
    const w = getWordById(wordId, progress);
    if (w) result.push(toStudyWord(w, progress));
  }
  return result;
}
