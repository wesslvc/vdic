"use client";

import { useMemo } from "react";
import { useProgress } from "@/lib/progressStore";
import { useMounted } from "@/hooks/useMounted";
import { daysAgo, formatDateLabel, todayStr } from "@/lib/date";
import type { SessionLogEntry } from "@/lib/types";

export default function HistoryPage() {
  const mounted = useMounted();
  const progress = useProgress();

  const byDate = useMemo(() => {
    const map = new Map<string, SessionLogEntry[]>();
    for (const s of progress.sessionLog) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return map;
  }, [progress.sessionLog]);

  const heatDays = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const date = daysAgo(i);
      const count = (byDate.get(date) ?? []).reduce((sum, s) => sum + s.count, 0);
      days.push({ date, count });
    }
    return days;
  }, [byDate]);

  const maxCount = Math.max(1, ...heatDays.map((d) => d.count));
  const today = todayStr();

  const dates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1));

  return (
    <div>
      <h1 className="text-xl font-extrabold">학습 기록</h1>
      <p className="mt-1 text-sm text-neutral-500">
        날짜별로 학습한 단어 수와 정답률을 확인할 수 있어요.
      </p>

      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="mb-2 text-xs font-semibold text-neutral-500">최근 12주</p>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {heatDays.map((d) => {
            const intensity = d.count === 0 ? 0 : Math.min(4, Math.ceil((d.count / maxCount) * 4));
            const colors = [
              "bg-neutral-100 dark:bg-neutral-800",
              "bg-emerald-200 dark:bg-emerald-950",
              "bg-emerald-300 dark:bg-emerald-900",
              "bg-emerald-500 dark:bg-emerald-700",
              "bg-emerald-600 dark:bg-emerald-500",
            ];
            return (
              <div
                key={d.date}
                title={`${d.date} · ${d.count}개`}
                className={`h-3 w-3 rounded-sm ${colors[intensity]} ${
                  d.date === today ? "ring-1 ring-neutral-400" : ""
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {!mounted ? null : dates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
            아직 학습 기록이 없어요. 강의를 학습해보세요!
          </div>
        ) : (
          dates.map((date) => {
            const entries = byDate.get(date)!;
            const totalCount = entries.reduce((s, e) => s + e.count, 0);
            const totalCorrect = entries.reduce((s, e) => s + e.correctCount, 0);
            return (
              <div key={date}>
                <p className="mb-1.5 text-sm font-semibold">
                  {formatDateLabel(date)}{" "}
                  <span className="font-normal text-neutral-400">
                    · {totalCount}개 중 {totalCorrect}개 정답
                  </span>
                </p>
                <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                  {entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span>
                        {e.lectureLabel}
                        <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                          {e.mode === "wrong-note" ? "오답노트" : e.mode === "favorites" ? "즐겨찾기" : "학습"}
                        </span>
                      </span>
                      <span className="text-neutral-500">
                        {e.correctCount}/{e.count} 정답
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
