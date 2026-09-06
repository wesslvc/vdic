"use client";

import { useMemo, useState } from "react";
import type { Word } from "@/lib/types";
import { logSession, recordAnswer } from "@/lib/progressStore";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function StudySession({
  words,
  sessionLabel,
  mode,
  onFinish,
}: {
  words: Word[];
  sessionLabel: string;
  mode: "study" | "wrong-note";
  onFinish: () => void;
}) {
  const [direction, setDirection] = useState<"en-ko" | "ko-en">("en-ko");
  const [order] = useState(() => shuffle(words));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ correct: number; wrong: number }>({
    correct: 0,
    wrong: 0,
  });
  const [done, setDone] = useState(false);

  const current = order[index];
  const isLast = index === order.length - 1;
  const progressPct = useMemo(
    () => Math.round((index / Math.max(order.length, 1)) * 100),
    [index, order.length]
  );

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

  function grade(correct: boolean) {
    recordAnswer(current.id, correct);
    setResults((r) => ({
      correct: r.correct + (correct ? 1 : 0),
      wrong: r.wrong + (correct ? 0 : 1),
    }));
    if (isLast) {
      logSession({
        lectureLabel: sessionLabel,
        mode,
        count: order.length,
        correctCount: results.correct + (correct ? 1 : 0),
      });
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
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
          onClick={() => setDirection((d) => (d === "en-ko" ? "ko-en" : "en-ko"))}
          className="shrink-0 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
        >
          {direction === "en-ko" ? "영→한" : "한→영"}
        </button>
      </div>

      <button
        onClick={() => setRevealed((v) => !v)}
        className="flex min-h-[220px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900"
      >
        <span className="whitespace-pre-line text-2xl font-bold leading-snug">{front}</span>
        {revealed ? (
          <span className="whitespace-pre-line text-lg text-neutral-600 dark:text-neutral-400">
            {back}
          </span>
        ) : (
          <span className="text-sm text-neutral-400">탭해서 뜻 보기</span>
        )}
      </button>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          disabled={!revealed}
          onClick={() => grade(false)}
          className="rounded-xl bg-rose-100 py-3.5 font-semibold text-rose-700 disabled:opacity-40 dark:bg-rose-950 dark:text-rose-400"
        >
          몰랐어요
        </button>
        <button
          disabled={!revealed}
          onClick={() => grade(true)}
          className="rounded-xl bg-emerald-100 py-3.5 font-semibold text-emerald-700 disabled:opacity-40 dark:bg-emerald-950 dark:text-emerald-400"
        >
          알고 있었어요
        </button>
      </div>
    </div>
  );
}
