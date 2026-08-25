"use client";

/**
 * Charts, drawn as ruled bars and hand-built SVG.
 *
 * No charting library. Every mark here is a rectangle or a polyline over values
 * the engine already computed, and a library would add ~50kB, its own colour
 * opinions, and a second place for number formatting to drift from the rest of
 * the app.
 *
 * Four constraints shape all of them:
 *
 *   1. A float may set a width or a coordinate and nothing else. Every printed
 *      figure is the canonical string from the API, never a number derived from
 *      one.
 *   2. Colour is never the only signal: every series is labelled, and every
 *      chart carries a text equivalent for assistive technology.
 *   3. Interaction works from the keyboard as well as the pointer. Each datum is
 *      a real focusable control, so tabbing reveals the same detail hovering
 *      does — a tooltip that only responds to a mouse is decoration, not
 *      information.
 *   4. Detail on demand: the resting state stays quiet, and exact figures appear
 *      when something is pointed at or focused.
 */
import { useId, useState } from "react";

import { Amount } from "./money";
import { formatMoney, toChartWidth } from "@/lib/money";
import type { CategoryLine } from "@/lib/types";

const CATEGORY_VARS = [
  "--cat-1", "--cat-2", "--cat-3", "--cat-4", "--cat-5",
  "--cat-6", "--cat-7", "--cat-8", "--cat-9", "--cat-10",
];

export function categoryColour(index: number): string {
  return `var(${CATEGORY_VARS[index % CATEGORY_VARS.length]})`;
}

/* -------------------------------------------------------------------------- */

/**
 * Spending by category.
 *
 * Each row is a button: hovering or focusing it dims the others and reveals the
 * exact total, the share and the transaction count. Dimming the rest rather than
 * brightening the target keeps the comparison intact — the point of the chart is
 * the relative lengths, and those stay readable while one row is emphasised.
 */
export function CategoryBars({ lines }: { lines: CategoryLine[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (lines.length === 0) {
    return <p className="empty">Nothing recorded this month yet.</p>;
  }

  const widest = Math.max(...lines.map((line) => toChartWidth(line.total_bdt)), 1);

  return (
    <div
      className={`chart-group ${active ? "is-focused" : ""}`}
      onMouseLeave={() => setActive(null)}
      role="img"
      aria-label={`Spending by category: ${lines
        .map((line) => `${line.category}, ${formatMoney(line.total_bdt)}, ${line.share_percent} percent`)
        .join("; ")}`}
    >
      {lines.map((line, index) => {
        const on = active === line.category;
        return (
          <button
            type="button"
            className={`bar-row datum ${on ? "is-active" : ""}`}
            key={line.category}
            onMouseEnter={() => setActive(line.category)}
            onFocus={() => setActive(line.category)}
            onBlur={() => setActive(null)}
            aria-label={`${line.category}: ${formatMoney(line.total_bdt)}, ${line.share_percent} percent of the month, ${line.count} ${line.count === 1 ? "transaction" : "transactions"}`}
          >
            <span className="note bar-label">{line.category}</span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{
                  width: `${(toChartWidth(line.total_bdt) / widest) * 100}%`,
                  background: categoryColour(index),
                }}
              />
            </span>
            <span className="nowrap bar-value">
              <Amount value={line.total_bdt} />
              <span className="faint mono bar-share">{line.share_percent}%</span>
            </span>

            <span className="datum-detail" aria-hidden="true">
              {line.count} {line.count === 1 ? "transaction" : "transactions"} ·{" "}
              {line.share_percent}% of the month
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The month's runway: what is already spent, what the pace projects on top, and
 * what is left of the salary — three segments of one bar, because "will this
 * reach the end of the month" is a question about one length.
 *
 * The legend entries and the segments are the same control, so pointing at
 * either highlights both.
 */
export function RunwayBar({
  salary,
  spent,
  projectedRemaining,
}: {
  salary: string;
  spent: string;
  projectedRemaining: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  const salaryWidth = toChartWidth(salary);
  const spentWidth = toChartWidth(spent);
  const projectedWidth = toChartWidth(projectedRemaining);

  // When the projection overruns the salary the bar scales to the projection, so
  // the overrun shows as a proportion rather than being clipped out of sight.
  const scale = Math.max(salaryWidth, spentWidth + projectedWidth, 1);
  const pct = (value: number) => `${Math.max((value / scale) * 100, 0)}%`;
  const leftOver = Math.max(salaryWidth - spentWidth - projectedWidth, 0);

  const segments = [
    { key: "spent", label: "Spent", value: spent, width: spentWidth, fill: "var(--lime)", note: "already recorded this month" },
    { key: "projected", label: "Projected", value: projectedRemaining, width: projectedWidth, fill: "var(--up)", note: "expected over the remaining days, at the current pace" },
    { key: "left", label: "Unspent", value: formatMoney(String(leftOver.toFixed(2)), { symbol: false }), width: leftOver, fill: "transparent", note: "salary not yet accounted for" },
  ];

  return (
    <div className={`chart-group ${active ? "is-focused" : ""}`} onMouseLeave={() => setActive(null)}>
      <div
        className="runway"
        role="img"
        aria-label={`Of a ${formatMoney(salary)} salary, ${formatMoney(spent)} is spent and ${formatMoney(projectedRemaining)} more is projected for the rest of the month.`}
      >
        {segments.map((segment) => (
          <button
            type="button"
            key={segment.key}
            className={`runway-seg datum ${active === segment.key ? "is-active" : ""}`}
            style={{
              width: pct(segment.width),
              background: segment.fill,
              opacity: 1,
            }}
            onMouseEnter={() => setActive(segment.key)}
            onFocus={() => setActive(segment.key)}
            onBlur={() => setActive(null)}
            aria-label={`${segment.label}: ${segment.note}`}
            tabIndex={segment.width > 0 ? 0 : -1}
          />
        ))}
      </div>

      <div className="runway-legend">
        {[
          { key: "spent", label: "Spent", value: spent, swatch: "var(--lime)" },
          { key: "projected", label: "Projected", value: projectedRemaining, swatch: "var(--up)" },
          { key: "salary", label: "Salary", value: salary, swatch: "transparent" },
        ].map((item) => (
          <button
            type="button"
            className={`legend-item datum ${active === item.key ? "is-active" : ""}`}
            key={item.label}
            onMouseEnter={() => setActive(item.key)}
            onFocus={() => setActive(item.key)}
            onBlur={() => setActive(null)}
          >
            <span
              className="swatch"
              style={{
                background: item.swatch,
                border: item.swatch === "transparent" ? "1px solid var(--line-firm)" : "none",
                opacity: 1,
              }}
              aria-hidden="true"
            />
            <span className="label">{item.label}</span>
            <Amount value={item.value} />
          </button>
        ))}
      </div>

      <p className="chart-readout" aria-live="polite">
        {active === "spent" && "Already recorded this month."}
        {active === "projected" && "Expected over the remaining days, at the current daily pace."}
        {active === "left" && "Salary not yet accounted for."}
        {active === "salary" && "The month's salary, the length everything else is measured against."}
        {!active && "Point at a segment for what it covers."}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The DPS balance curve, drawn from the schedule the engine produced.
 *
 * Two lines: the balance, and the same contributions with no interest. The band
 * between them is the interest, shaded because over a short term the two curves
 * sit within a couple of percent of each other and would read as one line —
 * which would make the chart say nothing about the quantity the panel is about.
 * The axes stay honest: no truncated baseline, no exaggerated scale.
 *
 * Hovering or focusing a month draws a guide and reports that month's figures.
 */
export function DpsCurve({
  schedule,
}: {
  schedule: Array<{
    month_index: number;
    closing_balance_bdt: string;
    deposit_bdt: string;
    interest_bdt: string;
  }>;
}) {
  const [active, setActive] = useState<number | null>(null);
  const clipId = useId();

  if (schedule.length < 2) return null;

  const width = 520;
  const height = 130;
  const peak = Math.max(...schedule.map((row) => toChartWidth(row.closing_balance_bdt)), 1);

  const x = (index: number) => (index / (schedule.length - 1)) * width;
  const y = (value: number) => height - (value / peak) * height;
  const point = (index: number, value: number) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`;

  const balancePoints = schedule.map((row, index) =>
    point(index, toChartWidth(row.closing_balance_bdt)),
  );
  const deposit = toChartWidth(schedule[0]?.deposit_bdt ?? "0.00");
  const plainPoints = schedule.map((_, index) => point(index, deposit * (index + 1)));

  const gain = `${plainPoints.join(" ")} ${[...balancePoints].reverse().join(" ")}`;
  const last = schedule[schedule.length - 1];
  const shown = active === null ? null : schedule[active];

  return (
    <figure className="dps-figure" onMouseLeave={() => setActive(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="dps-svg"
        role="img"
        aria-label={`Balance over ${schedule.length} months, reaching ${formatMoney(last?.closing_balance_bdt ?? "0.00")} against ${formatMoney((deposit * schedule.length).toFixed(2))} deposited.`}
      >
        <clipPath id={clipId}>
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>

        <g clipPath={`url(#${clipId})`}>
          <polygon points={gain} fill="var(--lime)" opacity="0.16" />
          <polyline
            points={plainPoints.join(" ")}
            fill="none"
            stroke="var(--line-firm)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={balancePoints.join(" ")}
            fill="none"
            stroke="var(--lime)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {active !== null ? (
            <>
              <line
                x1={x(active)}
                x2={x(active)}
                y1="0"
                y2={height}
                stroke="var(--ink-muted)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={x(active)}
                cy={y(toChartWidth(schedule[active]?.closing_balance_bdt ?? "0.00"))}
                r="3.5"
                fill="var(--lime)"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
        </g>
      </svg>

      {/* One invisible hit target per month, sitting over the plot. Buttons
          rather than SVG hover areas so the series is reachable by keyboard. */}
      <div className="dps-hits">
        {schedule.map((row, index) => (
          <button
            type="button"
            key={row.month_index}
            className={`dps-hit ${active === index ? "is-active" : ""}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            aria-label={`Month ${row.month_index}: deposit ${formatMoney(row.deposit_bdt)}, interest ${formatMoney(row.interest_bdt)}, balance ${formatMoney(row.closing_balance_bdt)}`}
          />
        ))}
      </div>

      <figcaption className="chart-readout" aria-live="polite">
        {shown ? (
          <>
            <strong className="mono">Month {shown.month_index}</strong> · interest{" "}
            <Amount value={shown.interest_bdt} /> · balance{" "}
            <Amount value={shown.closing_balance_bdt} />
          </>
        ) : (
          <>Point at the curve for a month&rsquo;s figures. The shaded band is the interest.</>
        )}
      </figcaption>
    </figure>
  );
}
