import Link from "next/link";
import type { LectureProgress } from "@/lib/derived";

export function LectureCard({
  id,
  title,
  subtitle,
  progress,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  id: number;
  title: string;
  subtitle: string;
  progress: LectureProgress;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}) {
  const pct = progress.total ? Math.round((progress.mastered / progress.total) * 100) : 0;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          {selectMode && (
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
                selected
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {selected ? "✓" : ""}
            </span>
          )}
          <div>
            <p className="font-bold">{title}</p>
            <p className="text-xs text-neutral-500">{subtitle}</p>
          </div>
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
    </>
  );

  const className = `block w-full rounded-2xl border p-4 text-left shadow-sm transition active:scale-[0.99] ${
    selected
      ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800"
      : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
  }`;

  if (selectMode) {
    return (
      <button type="button" onClick={() => onToggleSelect?.(id)} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/lecture/${id}`} className={className}>
      {inner}
    </Link>
  );
}
