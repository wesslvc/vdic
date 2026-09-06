"use client";

const SYMBOLS = ["+", "-", "→", "←", "↔"];

export function SymbolButtons({ onInsert }: { onInsert: (symbol: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SYMBOLS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onInsert(s)}
          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
