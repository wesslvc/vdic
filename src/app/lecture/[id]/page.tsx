"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getLecture, getLectures, getWordCatalogLecture } from "@/lib/catalog";
import { lectureProgress, wordsForLecture } from "@/lib/derived";
import { getWordStat, moveWordToLecture, useProgress } from "@/lib/progressStore";
import { StudySession } from "@/components/StudySession";
import { useMounted } from "@/hooks/useMounted";

export default function LecturePage() {
  const params = useParams<{ id: string }>();
  const lectureId = Number(params.id);
  const mounted = useMounted();
  const progress = useProgress();
  const [mode, setMode] = useState<"browse" | "study">("browse");

  const lecture = getLecture(lectureId);
  const allLectures = getLectures();
  const words = useMemo(() => wordsForLecture(lectureId, progress), [lectureId, progress]);
  const prog = lectureProgress(lectureId, progress);

  if (!lecture) {
    return <p className="text-neutral-500">강의를 찾을 수 없어요.</p>;
  }

  if (mode === "study") {
    return (
      <div>
        <button
          onClick={() => setMode("browse")}
          className="mb-4 text-sm text-neutral-500"
        >
          ← 그만하기
        </button>
        <StudySession
          words={words}
          sessionLabel={`${lecture.title} 학습`}
          mode="study"
          onFinish={() => setMode("browse")}
        />
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="text-sm text-neutral-500">
        ← 강의 목록
      </Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold">{lecture.title}</h1>
          <p className="text-sm text-neutral-500">{lecture.subtitle}</p>
        </div>
        <div className="text-right text-sm text-neutral-500">
          <p>
            {mounted ? prog.mastered : 0}/{prog.total} 완료
          </p>
          {mounted && prog.wrongCount > 0 && (
            <p className="text-rose-600 dark:text-rose-400">오답 {prog.wrongCount}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => setMode("study")}
        className="mt-4 w-full rounded-xl bg-neutral-900 py-3.5 font-semibold text-white dark:bg-white dark:text-neutral-900"
      >
        이 강의 학습하기 ({words.length}개)
      </button>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-neutral-500">단어 목록</h2>
      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        {words.map((w) => {
          const stat = mounted ? getWordStat(w.id) : null;
          const catalogLec = getWordCatalogLecture(w.id);
          return (
            <li key={w.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{w.term}</p>
                <p className="truncate text-sm text-neutral-500">{w.meaning}</p>
              </div>
              {stat?.lastResult === "wrong" && (
                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                  오답
                </span>
              )}
              {stat?.lastResult === "correct" && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  완료
                </span>
              )}
              <select
                value={lectureId}
                onChange={(e) => moveWordToLecture(w.id, Number(e.target.value), catalogLec)}
                className="shrink-0 rounded-lg border border-neutral-300 bg-white px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                title="단어를 다른 강의로 재배정"
              >
                {allLectures.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id}강
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
