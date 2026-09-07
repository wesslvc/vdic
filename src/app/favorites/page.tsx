"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { effectiveLectureId, allFavoriteWords } from "@/lib/derived";
import { toggleFavorite, useProgress } from "@/lib/progressStore";
import { StudySession } from "@/components/StudySession";
import { useMounted } from "@/hooks/useMounted";

export default function FavoritesPage() {
  const mounted = useMounted();
  const progress = useProgress();
  const [mode, setMode] = useState<"browse" | "study">("browse");

  const words = useMemo(() => (mounted ? allFavoriteWords(progress) : []), [mounted, progress]);

  if (mode === "study") {
    return (
      <div>
        <button onClick={() => setMode("browse")} className="mb-4 text-sm text-neutral-500">
          ← 그만하기
        </button>
        <StudySession
          words={words}
          sessionLabel="즐겨찾기"
          mode="favorites"
          onFinish={() => setMode("browse")}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold">즐겨찾기</h1>
      <p className="mt-1 text-sm text-neutral-500">
        직접 별표한 단어들이에요. 맞혀도 오답노트처럼 자동으로 사라지지 않고, 별표를 눌러서
        빼야만 없어져요.
      </p>

      {!mounted ? null : words.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          아직 즐겨찾기한 단어가 없어요. 단어 목록이나 학습 중에 ☆를 눌러 추가하세요.
        </div>
      ) : (
        <>
          <button
            onClick={() => setMode("study")}
            className="mt-4 w-full rounded-xl bg-amber-500 py-3.5 font-semibold text-white"
          >
            즐겨찾기 {words.length}개 테스트하기
          </button>
          <ul className="mt-6 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {words.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{w.term}</p>
                  <p className="truncate text-sm text-neutral-500">{w.meaning}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(w.id)}
                  className="shrink-0 text-lg text-amber-500"
                  aria-label="즐겨찾기 해제"
                >
                  ★
                </button>
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
