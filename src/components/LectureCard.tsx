import Link from "next/link";
import type { LectureProgress } from "@/lib/derived";

export function LectureCard({
  id,
  title,
  subtitle,
  progress,
}: {
  id: number;
  title: string;
  subtitle: string;
  progress: LectureProgress;
}) {
  const pct = progress.total ? Math.round((progress.mastered / progress.total) * 100) : 0;
  return (
    <Link
      href={`/lecture/${id}`}
      className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-xs text-neutral-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {progress.wrongCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
              오답 {progress.wrongCount}
            </span>
          )}
          <span className="text-xs text-neutral-400">{progress.total}개</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-neutral-400">
        {pct}% 완료 · {progress.lastStudiedAt ? "학습함" : "미학습"}
      </p>
    </Link>
  );
}
