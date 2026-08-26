"use client";

/**
 * The second set of charts: comparison, pace, progress and rate preview.
 *
 * Same rules as charts.tsx — floats set geometry only, every figure printed is
 * the canonical string, colour is never the sole signal, and every datum is a
 * real focusable control so a keyboard gets what a pointer gets.
 */
import { useState } from "react";

import { Amount } from "./money";
import { formatMoney, toChartWidth } from "@/lib/money";
import type { MonthComparison } from "@/lib/types";

/* -------------------------------------------------------------------------- */

/**
 * Category movement as a diverging bar chart, zero in the middle.
 *
 * A table of deltas makes you read every number to find the big movers. On a
 * diverging axis the big movers are the long bars, and direction is a side — you
 * see the shape of the month before reading a single figure.
 */
export function DeltaBars({ comparison }: { comparison: MonthComparison }) {
  const [active, setActive] = useState<string | null>(null);

  const rows = comparison.category_deltas;
  if (rows.length === 0) return null;

  const widest = Math.max(...rows.map((row) => Math.abs(toChartWidth(row.delta_bdt))), 1);

  return (
    <div
      className={`chart-group ${active ? "is-focused" : ""}`}
      onMouseLeave={() => setActive(null)}
      role="img"
      aria-label={`Category movement against the previous month: ${rows
        .map(
          (row) =>
            `${row.category} ${toChartWidth(row.delta_bdt) >= 0 ? "up" : "down"} ${formatMoney(row.delta_bdt)}`,
        )
        .join("; ")}`}
    >
      {rows.map((row) => {
        const delta = toChartWidth(row.delta_bdt);
        const up = delta > 0;
        const share = (Math.abs(delta) / widest) * 50; // half the track per side
        return (
          <button
            type="button"
            key={row.category}
            className={`diverge-row datum ${active === row.category ? "is-active" : ""}`}
            onMouseEnter={() => setActive(row.category)}
            onFocus={() => setActive(row.category)}
            onBlur={() => setActive(null)}
            aria-label={`${row.category}: ${up ? "up" : "down"} ${formatMoney(row.delta_bdt)}, from ${formatMoney(row.last_bdt)} to ${formatMoney(row.this_bdt)}`}
          >
            <span className="note diverge-label">{row.category}</span>

            <span className="diverge-track">
              <span className="diverge-axis" aria-hidden="true" />
              <span
                className="diverge-fill"
                style={{
                  width: `${share}%`,
                  [up ? "left" : "right"]: "50%",
                  background: up ? "var(--up)" : "var(--lime)",
                }}
              />
            </span>

            <span className={`nowrap mono diverge-value ${up ? "is-short" : "is-surplus"}`}>
              {up ? "+" : "−"}
              {formatMoney(row.delta_bdt, { symbol: true }).replace("-", "")}
            </span>
          </button>
        );
      })}

      <p className="chart-readout" aria-live="polite">
        {active
          ? (() => {
              const row = rows.find((r) => r.category === active);
              if (!row) return null;
              return (
                <>
                  <strong>{row.category}</strong>: {formatMoney(row.last_bdt)} →{" "}
                  {formatMoney(row.this_bdt)}
                  {row.delta_percent !== null ? ` (${row.delta_percent}%)` : " (new this month)"}
                </>
              );
            })()
          : "Bars right of the centre line rose; bars left of it fell."}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The month's pace as an arc: how far through the month you are, against how
 * much of the salary is already committed.
 *
 * Two arcs on one dial answer the only question that matters here — is spending
 * ahead of the calendar? If the money arc is longer than the days arc, it is.
 */
export function PaceDial({
  daysElapsed,
  daysInMonth,
  spent,
  salary,
}: {
  daysElapsed: number;
  daysInMonth: number;
  spent: string;
  salary: string;
}) {
  const size = 180;
  const stroke = 14;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const dayShare = Math.min(daysElapsed / Math.max(daysInMonth, 1), 1);
  const salaryNumber = toChartWidth(salary);
  const moneyShare = salaryNumber > 0 ? Math.min(toChartWidth(spent) / salaryNumber, 1) : 0;
  const ahead = moneyShare > dayShare;

  const arc = (share: number, r: number) =>
    `${(share * 2 * Math.PI * r).toFixed(2)} ${(2 * Math.PI * r).toFixed(2)}`;

  const inner = radius - stroke - 4;

  return (
    <figure className="dial" style={{ margin: 0 }}>
      <div className="donut-wrap">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${daysElapsed} of ${daysInMonth} days elapsed, and ${Math.round(moneyShare * 100)} percent of the salary committed. Spending is ${ahead ? "ahead of" : "behind"} the calendar.`}
        >
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ahead ? "var(--up)" : "var(--lime)"}
              strokeWidth={stroke}
              strokeDasharray={arc(moneyShare, radius)}
              strokeLinecap="round"
            />

            <circle cx={size / 2} cy={size / 2} r={inner} fill="none" stroke="var(--surface-3)" strokeWidth={6} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={inner}
              fill="none"
              stroke="var(--ink-muted)"
              strokeWidth={6}
              strokeDasharray={arc(dayShare, inner)}
              strokeLinecap="round"
            />
          </g>
        </svg>

        <div className="donut-centre">
          <p className="label" style={{ marginBottom: "var(--s-1)" }}>
            Salary used
          </p>
          <p className="mono dial-pct" style={{ color: ahead ? "var(--up)" : "var(--lime)" }}>
            {Math.round(moneyShare * 100)}%
          </p>
          <p className="faint mono" style={{ fontSize: "var(--t-xs)" }}>
            day {daysElapsed}/{daysInMonth}
          </p>
        </div>
      </div>

      <figcaption className="chart-readout" style={{ textAlign: "center" }}>
        {ahead ? (
          <>Spending is running <strong className="is-short">ahead</strong> of the calendar.</>
        ) : (
          <>Spending is <strong className="is-surplus">behind</strong> the calendar — on track.</>
        )}
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */

/** A pocket's progress towards its target, as a labelled meter. */
export function ProgressMeter({
  saved,
  target,
  label,
}: {
  saved: string;
  target: string;
  label: string;
}) {
  const targetNumber = toChartWidth(target);
  const share = targetNumber > 0 ? Math.min(toChartWidth(saved) / targetNumber, 1) : 0;
  const percent = Math.round(share * 100);

  return (
    <div
      role="img"
      aria-label={`${label}: ${formatMoney(saved)} saved of ${formatMoney(target)}, ${percent} percent.`}
    >
      <div className="row-between" style={{ marginBottom: "var(--s-2)" }}>
        <span className="label">{label}</span>
        <span className="mono" style={{ fontSize: "var(--t-xs)" }}>
          {percent}%
        </span>
      </div>
      <span className="bar-track" style={{ height: "10px", display: "block" }}>
        <span className="bar-fill" style={{ width: `${share * 100}%`, background: "var(--lime)" }} />
      </span>
      <div className="row-between" style={{ marginTop: "var(--s-2)" }}>
        <Amount value={saved} />
        <span className="faint">
          of <Amount value={target} />
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Salary history.
 *
 * Three problems this has to solve that a plain column chart does not:
 *
 *   1. **Equal months.** Most people's salary does not change, so scaling from
 *      zero gives a row of identical full-height bars that looks broken. The
 *      scale therefore starts below the lowest figure rather than at zero, and
 *      when every month is identical the chart says so in words instead of
 *      pretending there is a shape to read.
 *   2. **One or two entries.** A new account has a single month. A chart of one
 *      bar is noise, so it degrades to the figure itself.
 *   3. **Reading the actual number.** Each column carries its own amount, so the
 *      chart does not depend on hovering to be useful.
 *
 * The scale is annotated as not starting at zero, because a truncated baseline
 * that is not declared is a misleading chart.
 */
export function SalaryHistory({
  entries,
}: {
  entries: Array<{ month: string; amount_bdt: string }>;
}) {
  const [active, setActive] = useState<number | null>(null);

  if (entries.length === 0) {
    return (
      <div className="empty">
        <p style={{ margin: 0 }}>No salary recorded yet. Set one for this month to begin.</p>
      </div>
    );
  }

  // The API returns newest first; a timeline reads oldest to newest.
  const ordered = [...entries].reverse();
  const values = ordered.map((entry) => toChartWidth(entry.amount_bdt));
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const allEqual = highest === lowest;

  // A floor 15% below the lowest figure, so equal months still show as a row of
  // substantial columns and a real change reads as a clear step.
  const floor = allEqual ? highest * 0.55 : lowest - (highest - lowest) * 0.6;
  const span = Math.max(highest - floor, 1);

  const current = ordered[ordered.length - 1];
  const first = ordered[0];
  const changed = !allEqual && current && first;
  const delta = changed ? toChartWidth(current.amount_bdt) - toChartWidth(first.amount_bdt) : 0;

  const shown = active === null ? null : ordered[active];

  if (ordered.length === 1 && current) {
    return (
      <div className="stack" style={{ gap: "var(--s-2)" }}>
        <p className="label">{current.month}</p>
        <Amount value={current.amount_bdt} size="lg" />
        <p className="note" style={{ fontSize: "var(--t-xs)", margin: 0 }}>
          One month recorded so far. Set a salary for another month and the history appears here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`chart-group ${active !== null ? "is-focused" : ""}`}
      onMouseLeave={() => setActive(null)}
    >
      <div
        className="columns"
        role="img"
        aria-label={`Salary by month: ${ordered.map((e) => `${e.month} ${formatMoney(e.amount_bdt)}`).join(", ")}`}
      >
        {ordered.map((entry, index) => {
          const height = ((toChartWidth(entry.amount_bdt) - floor) / span) * 100;
          const isCurrent = index === ordered.length - 1;
          return (
            <button
              type="button"
              key={entry.month}
              className={`column datum ${active === index ? "is-active" : ""} ${isCurrent ? "is-current" : ""}`}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              aria-label={`${entry.month}: ${formatMoney(entry.amount_bdt)}${isCurrent ? ", the most recent" : ""}`}
            >
              <span className="column-value mono">{splitTaka(entry.amount_bdt)}</span>
              <span
                className="column-fill"
                style={{ height: `${Math.max(height, 12)}%` }}
              />
              <span className="column-tick">{entry.month}</span>
            </button>
          );
        })}
      </div>

      <div className="salary-summary">
        <div>
          <p className="label">Current</p>
          <Amount value={current?.amount_bdt ?? "0.00"} />
        </div>
        <div>
          <p className="label">Months recorded</p>
          <p className="mono salary-stat">{ordered.length}</p>
        </div>
        <div>
          <p className="label">Since {first?.month}</p>
          {changed ? (
            <p className={`mono salary-stat ${delta > 0 ? "is-surplus" : "is-short"}`}>
              {delta > 0 ? "+" : "−"}
              {formatMoney(String(Math.abs(delta).toFixed(2)))}
            </p>
          ) : (
            <p className="mono salary-stat muted">unchanged</p>
          )}
        </div>
      </div>

      <p className="chart-readout" aria-live="polite">
        {shown ? (
          <>
            <strong className="mono">{shown.month}</strong> · <Amount value={shown.amount_bdt} />
          </>
        ) : allEqual ? (
          <>
            The same salary every recorded month. The scale does not start at zero, so equal months
            still read as columns.
          </>
        ) : (
          <>Salary is recorded per month, so each month is measured against its own figure. The
          scale does not start at zero.</>
        )}
      </p>
    </div>
  );
}

/** Thousands-grouped taka with the paisa dropped — a column label has room for
 *  the magnitude, not the precision. The exact figure is in the readout. */
function splitTaka(amount: string): string {
  const [whole = "0"] = amount.split(".");
  return `\u09f3${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/* -------------------------------------------------------------------------- */

/**
 * A preview of what the current DPS rate does to a fixed contribution over time.
 *
 * Purely illustrative and labelled as such — it uses a round ৳5,000 a month so
 * changing the rate shows an immediate, comparable effect. Real pocket figures
 * come from the engine; this is a dial, not a source of truth.
 *
 * The compounding here mirrors the stated rule (deposit, then interest on the
 * new balance, rounded to the paisa each month) but runs in floating point,
 * because its only output is the height of a bar.
 */
export function RatePreview({ ratePercent }: { ratePercent: string }) {
  const [active, setActive] = useState<number | null>(null);

  const monthly = 5000;
  const rate = Number(ratePercent);
  if (!Number.isFinite(rate)) return null;

  const months = 24;
  const points: Array<{ month: number; balance: number; plain: number }> = [];
  let balance = 0;
  for (let i = 1; i <= months; i += 1) {
    balance += monthly;
    balance += Math.round(((balance * rate) / 12 / 100) * 100) / 100;
    points.push({ month: i, balance, plain: monthly * i });
  }

  const width = 520;
  const height = 120;
  const peak = Math.max(...points.map((p) => p.balance), 1);
  const x = (i: number) => (i / (points.length - 1)) * width;
  const y = (v: number) => height - (v / peak) * height;

  const balanceLine = points.map((p, i) => `${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`);
  const plainLine = points.map((p, i) => `${x(i).toFixed(1)},${y(p.plain).toFixed(1)}`);
  const band = `${plainLine.join(" ")} ${[...balanceLine].reverse().join(" ")}`;

  const last = points[points.length - 1];
  const shown = active === null ? null : points[active];

  return (
    <figure className="dps-figure" onMouseLeave={() => setActive(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="dps-svg"
        style={{ height: "120px" }}
        role="img"
        aria-label={`At ${ratePercent} percent, ৳5,000 a month reaches about ৳${Math.round(last?.balance ?? 0).toLocaleString()} after two years, against ৳${(monthly * months).toLocaleString()} deposited.`}
      >
        <polygon points={band} fill="var(--lime)" opacity="0.16" />
        <polyline points={plainLine.join(" ")} fill="none" stroke="var(--line-firm)" strokeWidth="1.5" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        <polyline points={balanceLine.join(" ")} fill="none" stroke="var(--lime)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {active !== null ? (
          <>
            <line x1={x(active)} x2={x(active)} y1="0" y2={height} stroke="var(--ink-muted)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={x(active)} cy={y(points[active]?.balance ?? 0)} r="3.5" fill="var(--lime)" />
          </>
        ) : null}
      </svg>

      <div className="dps-hits">
        {points.map((point, index) => (
          <button
            type="button"
            key={point.month}
            className={`dps-hit ${active === index ? "is-active" : ""}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            aria-label={`Month ${point.month}: about ৳${Math.round(point.balance).toLocaleString()}`}
          />
        ))}
      </div>

      <figcaption className="chart-readout">
        {shown ? (
          <>
            <strong className="mono">Month {shown.month}</strong> · about ৳
            {Math.round(shown.balance).toLocaleString()} against ৳
            {shown.plain.toLocaleString()} deposited
          </>
        ) : (
          <>
            Illustration only: ৳5,000 a month for two years at {ratePercent}%. The shaded band is
            the interest. Pocket figures are computed exactly by the engine.
          </>
        )}
      </figcaption>
    </figure>
  );
}
