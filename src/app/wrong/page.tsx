"use client";

import { useMemo, useState } from "react";
import { effectiveLectureId, allWrongWords } from "@/lib/derived";
import { useProgress } from "@/lib/progressStore";
import { StudySession } from "@/components/StudySession";
import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";

export default function WrongNotePage() {
  const mounted = useMounted();
  const progress = useProgress();
  const [mode, setMode] = useState<"browse" | "study">("browse");

  const words = useMemo(() => (mounted ? allWrongWords(progress) : []), [mounted, progress]);

  if (mode === "study") {
    return (
      <div>
        <button onClick={() => setMode("browse")} className="mb-4 text-sm text-neutral-500">
          ← 그만하기
        </button>
        <StudySession
          words={words}
          sessionLabel="오답노트"
          mode="wrong-note"
          onFinish={() => setMode("browse")}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold">오답노트</h1>
      <p className="mt-1 text-sm text-neutral-500">
        가장 최근에 틀린 단어들만 모아서 다시 테스트해요. 맞히면 목록에서 사라져요.
      </p>

      {!mounted ? null : words.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          오답이 없어요. 훌륭해요! 🎉
        </div>
      ) : (
        <>
          <button
            onClick={() => setMode("study")}
            className="mt-4 w-full rounded-xl bg-rose-600 py-3.5 font-semibold text-white"
          >
            오답 {words.length}개 테스트하기
          </button>
          <ul className="mt-6 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {words.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{w.term}</p>
                  <p className="truncate text-sm text-neutral-500">{w.meaning}</p>
                </div>
                <Link
                  href={`/lecture/${effectiveLectureId(w.id, progress)}`}
                  className="shrink-0 text-xs text-neutral-400"
                >
                  {effectiveLectureId(w.id, progress)}강 →
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
