"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StudyWord } from "@/lib/derived";
import { logSession, recordAnswer, toggleFavorite, useProgress } from "@/lib/progressStore";
import { isAnswerCorrect, isRelationExpression } from "@/lib/grading";
import { SymbolButtons } from "@/components/SymbolButtons";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "meaning" | "nuance" | "reveal";

export function StudySession({
  words,
  sessionLabel,
  mode,
  onFinish,
}: {
  words: StudyWord[];
  sessionLabel: string;
  mode: "study" | "wrong-note" | "favorites";
  onFinish: () => void;
}) {
  const progress = useProgress();
  const [direction, setDirection] = useState<"en-ko" | "ko-en">("en-ko");
  const [order] = useState(() => shuffle(words));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("meaning");
  const [meaningInput, setMeaningInput] = useState("");
  const [nuanceInput, setNuanceInput] = useState("");
  const [meaningCorrect, setMeaningCorrect] = useState(false);
  const [nuanceCorrect, setNuanceCorrect] = useState<boolean | null>(null);
  const [overallCorrect, setOverallCorrect] = useState(false);
  const [results, setResults] = useState<{ correct: number; wrong: number }>({
    correct: 0,
    wrong: 0,
  });
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = order[index];
  const isLast = index === order.length - 1;
  const progressPct = useMemo(
    () => Math.round((index / Math.max(order.length, 1)) * 100),
    [index, order.length]
  );
  const askNuance = direction === "en-ko" && !!current?.nuance;

  useEffect(() => {
    if (phase === "meaning" || phase === "nuance") {
      inputRef.current?.focus();
    }
  }, [phase, index]);

  useEffect(() => {
    if (phase !== "reveal") return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        proceed();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (order.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
        학습할 단어가 없어요.
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-3 text-xl font-bold">{sessionLabel} 완료!</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          총 {order.length}개 중{" "}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {results.correct}개 정답
          </span>
          ,{" "}
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            {results.wrong}개 오답
          </span>
        </p>
        <button
          onClick={onFinish}
          className="mt-6 rounded-full bg-neutral-900 px-6 py-2.5 font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          확인
        </button>
      </div>
    );
  }

  const front = direction === "en-ko" ? current.term : current.meaning;
  const back = direction === "en-ko" ? current.meaning : current.term;
  const relationAnswer = isRelationExpression(back);

  function resetCard() {
    setMeaningInput("");
    setNuanceInput("");
    setNuanceCorrect(null);
    setPhase("meaning");
  }

  function submitMeaning() {
    const ok = isAnswerCorrect(meaningInput, back);
    setMeaningCorrect(ok);
    if (askNuance) {
      setPhase("nuance");
    } else {
      setOverallCorrect(ok);
      setPhase("reveal");
    }
  }

  function submitNuance() {
    const ok = isAnswerCorrect(nuanceInput, current.nuance ?? "");
    setNuanceCorrect(ok);
    setOverallCorrect(meaningCorrect && ok);
    setPhase("reveal");
  }

  function proceed() {
    recordAnswer(current.id, overallCorrect);
    const newResults = {
      correct: results.correct + (overallCorrect ? 1 : 0),
      wrong: results.wrong + (overallCorrect ? 0 : 1),
    };
    setResults(newResults);
    if (isLast) {
      logSession({
        lectureLabel: sessionLabel,
        mode,
        count: order.length,
        correctCount: newResults.correct,
      });
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      resetCard();
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-neutral-900 transition-all dark:bg-white"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">
            {index + 1} / {order.length}
          </p>
        </div>
        <button
          onClick={() => toggleFavorite(current.id)}
          className={`shrink-0 text-xl ${
            progress.favorites[current.id] ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600"
          }`}
          aria-label="즐겨찾기"
        >
          {progress.favorites[current.id] ? "★" : "☆"}
        </button>
        <button
          onClick={() => {
            setDirection((d) => (d === "en-ko" ? "ko-en" : "en-ko"));
          }}
          disabled={phase !== "meaning"}
          className="shrink-0 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-400"
        >
          {direction === "en-ko" ? "영→한" : "한→영"}
        </button>
      </div>

      <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <span className="whitespace-pre-line text-2xl font-bold leading-snug">{front}</span>

        {phase === "meaning" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMeaning();
            }}
            className="w-full max-w-xs"
          >
            <input
              ref={inputRef}
              value={meaningInput}
              onChange={(e) => setMeaningInput(e.target.value)}
              placeholder={direction === "en-ko" ? "뜻을 입력하세요" : "영어 단어를 입력하세요"}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-center text-lg dark:border-neutral-700 dark:bg-neutral-800"
            />
            {relationAnswer && (
              <div className="mt-2.5 flex justify-center">
                <SymbolButtons
                  variant="relation"
                  onInsert={(s) => setMeaningInput((v) => v + s)}
                />
              </div>
            )}
          </form>
        )}

        {phase === "nuance" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitNuance();
            }}
            className="w-full max-w-xs"
          >
            <p className="mb-2 text-sm text-neutral-500">이 단어의 뉘앙스/관계는?</p>
            <input
              ref={inputRef}
              value={nuanceInput}
              onChange={(e) => setNuanceInput(e.target.value)}
              placeholder="예: +, -, A->B"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-center text-lg dark:border-neutral-700 dark:bg-neutral-800"
            />
            <div className="mt-2.5 flex justify-center">
              <SymbolButtons onInsert={(s) => setNuanceInput((v) => v + s)} />
            </div>
          </form>
        )}

        {phase === "reveal" && (
          <div className="w-full space-y-2">
            <span className="block whitespace-pre-line text-lg text-neutral-600 dark:text-neutral-400">
              {back}
            </span>
            {current.nuance && (
              <span className="block whitespace-pre-line text-sm text-neutral-400">
                뉘앙스: {current.nuance}
              </span>
            )}
            {current.memo && (
              <span className="block whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                📝 {current.memo}
              </span>
            )}
            <p className="text-sm text-neutral-400">
              내 답: {meaningInput || "(빈 답)"}
              {askNuance && ` · ${nuanceInput || "(빈 답)"}`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {askNuance && (
                <>
                  <Badge ok={meaningCorrect} label={`뜻 ${meaningCorrect ? "정답" : "오답"}`} />
                  <Badge ok={!!nuanceCorrect} label={`뉘앙스 ${nuanceCorrect ? "정답" : "오답"}`} />
                </>
              )}
              <Badge ok={overallCorrect} label={overallCorrect ? "종합 정답" : "종합 오답"} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        {phase === "meaning" && (
          <button
            onClick={submitMeaning}
            className="w-full rounded-xl bg-neutral-900 py-3.5 font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            확인
          </button>
        )}
        {phase === "nuance" && (
          <button
            onClick={submitNuance}
            className="w-full rounded-xl bg-neutral-900 py-3.5 font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            확인
          </button>
        )}
        {phase === "reveal" && (
          <div className="space-y-2">
            <button
              onClick={() => setOverallCorrect((v) => !v)}
              className="w-full rounded-xl border border-neutral-300 py-2.5 text-sm text-neutral-500 dark:border-neutral-700"
            >
              {overallCorrect ? "아니에요, 사실 틀렸어요" : "아니에요, 사실 맞았어요"}
            </button>
            <button
              onClick={proceed}
              className="w-full rounded-xl bg-neutral-900 py-3.5 font-semibold text-white dark:bg-white dark:text-neutral-900"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
        ok
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
      }`}
    >
      {label}
    </span>
  );
}
