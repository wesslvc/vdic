"use client";

const NUANCE_SYMBOLS = ["+", "-", "→", "←", "↔"];
const RELATION_SYMBOLS = ["A", "→", "←", "↔", ">", "<", "B"];

export function SymbolButtons({
  onInsert,
  variant = "nuance",
}: {
  onInsert: (symbol: string) => void;
  variant?: "nuance" | "relation";
}) {
  const symbols = variant === "relation" ? RELATION_SYMBOLS : NUANCE_SYMBOLS;
  return (
    <div className="flex flex-wrap gap-1.5">
      {symbols.map((s) => (
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
