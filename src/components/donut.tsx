"use client";

/**
 * Category shares as a donut.
 *
 * Built from stroke-dasharray on concentric circles rather than from arc paths:
 * one circle per slice, each dashed to its own share and rotated to start where
 * the previous one ended. Fewer moving parts than path arithmetic, and it
 * animates for free because a dash length is a single animatable number.
 *
 * The float that sets each dash is geometry only. Every printed figure is the
 * canonical string the engine produced.
 */
import { useState } from "react";

import { Amount } from "./money";
import { categoryColour } from "./charts";
import { formatMoney, toChartWidth } from "@/lib/money";
import type { CategoryLine } from "@/lib/types";

export function CategoryDonut({ lines, total }: { lines: CategoryLine[]; total: string }) {
  const [active, setActive] = useState<number | null>(null);

  if (lines.length === 0) return null;

  const size = 200;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const grand = Math.max(
    lines.reduce((sum, line) => sum + toChartWidth(line.total_bdt), 0),
    0.0001,
  );

  let offset = 0;
  const slices = lines.map((line, index) => {
    const share = toChartWidth(line.total_bdt) / grand;
    const slice = { line, index, share, start: offset };
    offset += share;
    return slice;
  });

  const shown = active === null ? null : slices[active];

  return (
    <div
      className="chart-group"
      onMouseLeave={() => setActive(null)}
      style={{ display: "grid", gap: "var(--s-4)" }}
    >
      <div className="donut-wrap">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Category shares: ${lines
            .map((line) => `${line.category} ${line.share_percent} percent`)
            .join(", ")}`}
          style={{ maxWidth: "100%" }}
        >
          {/* Track, so a month with one category still reads as a ring. */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={stroke}
          />

          {slices.map(({ line, index, share, start }) => {
            const on = active === index;
            return (
              <circle
                key={line.category}
                className="donut-seg"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={categoryColour(index)}
                strokeWidth={on ? stroke + 6 : stroke}
                strokeDasharray={`${(share * circumference).toFixed(2)} ${circumference.toFixed(2)}`}
                strokeDashoffset={(-start * circumference).toFixed(2)}
                // -90deg puts the first slice at twelve o'clock, which is where
                // a reader expects a series to begin.
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                opacity={active === null || on ? 1 : 0.35}
                tabIndex={0}
                role="button"
                aria-label={`${line.category}: ${formatMoney(line.total_bdt)}, ${line.share_percent} percent`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              />
            );
          })}
        </svg>

        <div className="donut-centre">
          {shown ? (
            <>
              <p className="label" style={{ marginBottom: "var(--s-1)" }}>
                {shown.line.category}
              </p>
              <Amount value={shown.line.total_bdt} size="lg" />
              <p className="faint mono" style={{ fontSize: "var(--t-xs)" }}>
                {shown.line.share_percent}%
              </p>
            </>
          ) : (
            <>
              <p className="label" style={{ marginBottom: "var(--s-1)" }}>
                Total
              </p>
              <Amount value={total} size="lg" />
              <p className="faint mono" style={{ fontSize: "var(--t-xs)" }}>
                {lines.length} {lines.length === 1 ? "category" : "categories"}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="row" style={{ gap: "var(--s-2)", justifyContent: "center" }}>
        {lines.map((line, index) => (
          <button
            type="button"
            key={line.category}
            className={`legend-item datum ${active === index ? "is-active" : ""}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
          >
            <span
              className="swatch"
              style={{ background: categoryColour(index) }}
              aria-hidden="true"
            />
            <span style={{ fontSize: "var(--t-xs)" }}>{line.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
