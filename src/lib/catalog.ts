import raw from "@/data/words.json";
import type { Catalog, Lecture, Word } from "./types";

export const catalog = raw as Catalog;

export function getLectures(): Lecture[] {
  return catalog.lectures;
}

export function getLecture(id: number): Lecture | undefined {
  return catalog.lectures.find((l) => l.id === id);
}

export function getAllWords(): Word[] {
  return catalog.lectures.flatMap((l) => l.words);
}

const catalogLectureByWordId: Record<string, number> = Object.fromEntries(
  catalog.lectures.flatMap((l) => l.words.map((w) => [w.id, l.id]))
);

export function getWordCatalogLecture(wordId: string): number {
  return catalogLectureByWordId[wordId];
}

export const wordIndex: Record<string, Word> = Object.fromEntries(
  getAllWords().map((w) => [w.id, w])
);

export const totalWordCount = getAllWords().length;
