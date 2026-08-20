"use client";

import { monthLabel } from "@/lib/use-dashboard";

/** Step a YYYY-MM key without constructing a Date, for the same timezone reason
 *  the engine avoids Date entirely. */
function shift(month: string, by: number): string {
  const [year, index] = month.split("-").map(Number) as [number, number];
  const zero = year * 12 + (index - 1) + by;
  return `${String(Math.floor(zero / 12)).padStart(4, "0")}-${String((zero % 12) + 1).padStart(2, "0")}`;
}

export function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="row" style={{ gap: "var(--s-2)" }}>
      <button
        type="button"
        className="btn btn--quiet btn--sm"
        onClick={() => onChange(shift(month, -1))}
        aria-label={`Go to ${monthLabel(shift(month, -1))}`}
      >
        ←
      </button>
      <span className="label" style={{ minWidth: "9ch", textAlign: "center" }}>
        {monthLabel(month)}
      </span>
      <button
        type="button"
        className="btn btn--quiet btn--sm"
        onClick={() => onChange(shift(month, 1))}
        aria-label={`Go to ${monthLabel(shift(month, 1))}`}
      >
        →
      </button>
    </div>
  );
}
