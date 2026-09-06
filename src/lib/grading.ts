// Suffix stripping so typed answers only need to match the *meaning*, not the exact
// grammatical ending (조사/어미) - e.g. "지키다" should match a candidate "지킨다" or "지켜서".
// Longest suffixes first so a long match is tried before a shorter one it contains.
const KOREAN_SUFFIXES = [
  "스러워하다", "스러워하는", "스러운", "스럽게", "스럽다", "스런",
  "되어지다", "되어진", "되는것", "되는거", "된다는", "되었다", "되어서", "되는", "된다", "되어", "됨",
  "시키다", "시키는", "시킨다", "시켜서", "시킴",
  "하는것", "하는거", "한다는", "했다는", "하다가", "해지다", "해지는", "해서", "하는", "했다", "한다", "하게", "하며", "하고", "하지만", "함",
  "적으로", "적인", "적",
  "는것", "는거", "라는", "라고", "다는", "다고",
  "이다", "인것", "인데", "이며", "이고", "임",
  "한", "해", "히", "음",
  "은", "는", "이", "가", "을", "를", "의", "도", "만", "와", "과", "랑",
  "에서", "에게", "한테", "께서", "처럼", "까지", "마저", "조차", "이나", "이라도",
  "에", "께", "나", "라도", "이라", "라",
];

function stripKoreanSuffix(word: string): string {
  for (const suf of KOREAN_SUFFIXES) {
    if (word.length > suf.length + 1 && word.endsWith(suf)) {
      return word.slice(0, -suf.length);
    }
  }
  return word;
}

function normalize(str: string): string {
  return str
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase()
    .replace(/<->|<=>/g, "↔")
    .replace(/->|=>/g, "→")
    .replace(/<-|<=/g, "←");
}

/** Splits a raw meaning/term field into separate acceptable answers. */
export function splitCandidates(raw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of raw) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts
    .map((p) => p.replace(/\([^)]*\)/g, "").trim())
    .map((p) => p.replace(/[.]+$/, "").trim())
    .filter((p) => p.length > 0);
}

/** True if `userInput` matches any accepted sense of `rawAnswer`, ignoring particles/endings. */
export function isAnswerCorrect(userInput: string, rawAnswer: string): boolean {
  const userNorm = normalize(userInput);
  if (!userNorm) return false;
  const userStem = stripKoreanSuffix(userNorm);

  for (const candidate of splitCandidates(rawAnswer)) {
    const candNorm = normalize(candidate);
    if (!candNorm) continue;
    if (userNorm === candNorm) return true;
    const candStem = stripKoreanSuffix(candNorm);
    if (userStem === candStem) return true;
    if (userStem.length >= 2 && candNorm.includes(userStem)) return true;
    if (candStem.length >= 2 && userNorm.includes(candStem)) return true;
  }
  return false;
}
