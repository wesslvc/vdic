"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAllWords, getLectures } from "@/lib/catalog";
import { effectiveLectureId, lectureProgress, overallStats } from "@/lib/derived";
import { useProgress } from "@/lib/progressStore";
import { LectureCard } from "@/components/LectureCard";
import { useMounted } from "@/hooks/useMounted";

export default function Home() {
  const mounted = useMounted();
  const progress = useProgress();
  const lectures = getLectures();
  const stats = overallStats(progress);
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return getAllWords()
      .filter((w) => w.term.toLowerCase().includes(q) || w.meaning.includes(q))
      .slice(0, 20);
  }, [query]);

  return (
    <div>
      <section className="mb-6 grid grid-cols-3 gap-3">
        <StatBox label="전체 단어" value={stats.totalWords} />
        <StatBox label="외운 단어" value={mounted ? stats.mastered : 0} accent="text-emerald-600 dark:text-emerald-400" />
        <StatBox label="오답노트" value={mounted ? stats.wrongCount : 0} accent="text-rose-600 dark:text-rose-400" />
      </section>

      {mounted && stats.wrongCount > 0 && (
        <Link
          href="/wrong"
          className="mb-6 flex items-center justify-between rounded-2xl bg-rose-600 px-5 py-4 text-white shadow-sm"
        >
          <div>
            <p className="font-bold">오답노트 테스트하기</p>
            <p className="text-sm text-rose-100">틀린 단어 {stats.wrongCount}개가 기다리고 있어요</p>
          </div>
          <span className="text-2xl">→</span>
        </Link>
      )}

      <div className="mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="단어 검색 (영어 또는 한글 뜻)"
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        {searchResults.length > 0 && (
          <div className="mt-2 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {searchResults.map((w) => {
              const lecId = effectiveLectureId(w.id, progress);
              return (
                <Link
                  key={w.id}
                  href={`/lecture/${lecId}`}
                  className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <span className="font-medium">{w.term}</span>
                  <span className="text-neutral-500">
                    {w.meaning.length > 20 ? w.meaning.slice(0, 20) + "…" : w.meaning}
                  </span>
                  <span className="ml-2 shrink-0 text-xs text-neutral-400">{lecId}강</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-neutral-500">강의 목록</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {lectures.map((l) => (
          <LectureCard
            key={l.id}
            id={l.id}
            title={l.title}
            subtitle={l.subtitle}
            progress={mounted ? lectureProgress(l.id, progress) : { total: l.words.length, attempted: 0, mastered: 0, wrongCount: 0, lastStudiedAt: null }}
          />
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <p className={`text-2xl font-extrabold ${accent ?? ""}`}>{value}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
    </div>
  );
}
