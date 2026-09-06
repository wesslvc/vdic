// Parses data/raw-vocab.txt (alternating term/meaning lines) into src/data/words.json,
// grouped into 23 lecture units. Word IDs are stable global sequence numbers (w1, w2, ...)
// based on position in raw-vocab.txt, independent of which lecture a word falls into - so
// re-running this after a boundary correction never orphans a user's saved progress.
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

// The last-word position (1-indexed, inclusive) of each lecture, confirmed against the
// user's real course by matching the lecture's actual last word to its position here.
// A few lectures' last word isn't in this note set at all (the user didn't write it down),
// so those boundaries are only a rough even split of the confirmed range around them -
// marked "guess" below. Update this array (and re-run this script) as more get confirmed.
const LECTURE_END_POSITIONS = [
  31, // 1강 last="terrific" (confirmed)
  50, // 2강 - "carve" not in notes; guessed even split with 3강 over [32,69]
  69, // 3강 last="optional" (confirmed)
  91, // 4강 last="intolerance" (confirmed)
  102, // 5강 last="Presume" (confirmed)
  118, // 6강 last="initiative" (confirmed)
  137, // 7강 last="moter"/motor (confirmed)
  161, // 8강 last="appreciate" (confirmed)
  191, // 9강 last="substantial"/substantially (confirmed)
  222, // 10강 last="pitch" (confirmed)
  247, // 11강 - "code" not in notes; guessed even split with 12강 over [223,273]
  273, // 12강 last="be absorbed in A" (confirmed)
  289, // 13강 last="take over" (confirmed)
  307, // 14강 - "give way to" not in notes; guessed even split with 15강 over [290,325]
  325, // 15강 last="owe A to B" (confirmed)
  343, // 16강 last="socialize" (confirmed)
  362, // 17강 last="pale" (confirmed)
  380, // 18강 last="clear" (confirmed)
  394, // 19강 - "arm" not in notes; guessed even split with 20강 over [381,409]
  409, // 20강 last="perseverance" (confirmed)
  434, // 21강 last="jet lag" (confirmed)
  441, // 22강 - no marker given ("끝까지" = "to the end"); guessed even split of [435,449]
  // 23강 always runs to the end of the list, whatever that is.
];

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

const globalId = (i) => `w${i + 1}`;

const lectures = [];
let cursor = 0;
for (let lecNo = 1; lecNo <= 23; lecNo++) {
  const end = lecNo <= LECTURE_END_POSITIONS.length ? LECTURE_END_POSITIONS[lecNo - 1] : entries.length;
  const slice = entries.slice(cursor, end);
  lectures.push({
    id: lecNo,
    title: `${lecNo}강`,
    subtitle: chapterName(lecNo),
    words: slice.map((w, idx) => ({
      id: globalId(cursor + idx),
      term: w.term,
      meaning: w.meaning,
    })),
  });
  cursor = end;
}

writeFileSync(
  path.join(__dirname, "../src/data/words.json"),
  JSON.stringify({ lectures }, null, 2) + "\n"
);

console.log(`Parsed ${entries.length} word entries into ${lectures.length} lectures.`);
lectures.forEach((l) => console.log(`  ${l.title} (${l.subtitle}) - ${l.words.length} words`));
