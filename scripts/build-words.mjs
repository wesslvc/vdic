// Parses data/raw-vocab.txt (alternating term/meaning lines) into data/words.json,
// grouped into 23 lecture units using the word-count ranges from the course listing.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(path.join(__dirname, "../data/raw-vocab.txt"), "utf-8");

const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

if (lines.length % 2 !== 0) {
  console.warn(`Warning: odd number of lines (${lines.length}) - last line may be unpaired.`);
}

const entries = [];
for (let i = 0; i < lines.length - 1; i += 2) {
  entries.push({ term: lines[i], meaning: lines[i + 1] });
}

// Word-count per lecture, derived from the course's numbered ranges (1-9, 10-17, 18-28,
// ... 307-325 for lectures 1-22; lecture 23's own range wasn't legible, so it's guessed
// at ~20 like its neighbors). Because related/synonym words in these notes are grouped
// together under one numbered slot, this note set has more entries (449) than the
// course's 325ish numbered slots - so every lecture's base count is scaled up by the
// same ratio rather than dumping the entire surplus into one lecture. This is only an
// initial guess; use the app's "강의 재배정" editor to correct any lecture's boundaries.
const baseCounts = [9, 8, 11, 11, 9, 10, 15, 16, 17, 16, 16, 22, 14, 14, 17, 15, 15, 15, 16, 20, 20, 19, 20];
const scale = entries.length / baseCounts.reduce((a, b) => a + b, 0);
const counts = baseCounts.map((c) => Math.max(1, Math.round(c * scale)));
// Fix up rounding drift on the last lecture so counts sum exactly to entries.length.
const drift = entries.length - counts.reduce((a, b) => a + b, 0);
counts[counts.length - 1] += drift;

const chapters = [
  { through: 2, name: "챕터 01 · 안 헷갈려?" },
  { through: 6, name: "챕터 02 · 제대로 아니?" },
  { through: 11, name: "챕터 03 · 다 아니?" },
  { through: 14, name: "챕터 04 · 반드시 알아야 할 숙어" },
  { through: 15, name: "챕터 05 · 관계를 주는 단어" },
  { through: 18, name: "챕터 06 · 초기본 단어의 본질과 확장" },
  { through: 23, name: "챕터 07 · 이걸 외워?" },
];
function chapterName(lectureNo) {
  return chapters.find((c) => lectureNo <= c.through)?.name ?? "";
}

const lectures = [];
let cursor = 0;
for (let lecNo = 1; lecNo <= 23; lecNo++) {
  const count = lecNo < 23 ? counts[lecNo - 1] : entries.length - cursor;
  const slice = entries.slice(cursor, cursor + count);
  lectures.push({
    id: lecNo,
    title: `${lecNo}강`,
    subtitle: chapterName(lecNo),
    words: slice.map((w, idx) => ({
      id: `${lecNo}-${idx + 1}`,
      term: w.term,
      meaning: w.meaning,
    })),
  });
  cursor += count;
}

writeFileSync(
  path.join(__dirname, "../src/data/words.json"),
  JSON.stringify({ lectures }, null, 2) + "\n"
);

console.log(`Parsed ${entries.length} word entries into ${lectures.length} lectures.`);
lectures.forEach((l) => console.log(`  ${l.title} (${l.subtitle}) - ${l.words.length} words`));
