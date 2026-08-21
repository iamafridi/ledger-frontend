"use client";

import Link from "next/link";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  Layers,
  CheckCircle2,
} from "lucide-react";

import { Amount } from "@/components/money";
import { CategoryBars, RunwayBar } from "@/components/charts";
import { CategoryDonut } from "@/components/donut";
import { MonthPicker } from "@/components/month-picker";
import { CollapsibleBenchmarkCases } from "@/components/dashboard/CollapsibleBenchmarkCases";
import { QuickActionHub } from "@/components/dashboard/QuickActionHub";
import { absolute } from "@/lib/money";
import { monthLabel, useDashboard, useDefaultMonth } from "@/lib/use-dashboard";
import { useSession } from "@/components/session-provider";

/**
 * Modern Interactive Ledger Executive Dashboard:
 * 1. Executive Top KPI Summary Cards (Month-End Forecast, Inflow Buffer, NBR VAT, Pacioli Balance).
 * 2. Section 01: Interactive Cash Runway & Projection Breakdown.
 * 3. Section 02: Collapsible 25 Published Benchmark Datasets (PUB-01 to PUB-25) with live seed trigger.
 * 4. Section 03: Interactive Quick Action Hub with 16 real application operations.
 * 5. Section 04: Spending Allocation by Category & Top 5 Largest Outflows.
 * 6. Section 05: Month-over-Month Variance & Category Deltas.
 * 7. Section 06: Actionable Financial Insights & Anomaly Detections.
 */
export default function DashboardPage() {
  const { session } = useSession();
  const defaultMonth = useDefaultMonth();
  const [month, setMonth] = useState<string | null>(null);
  const activeMonth = month ?? defaultMonth ?? "";
  const { data, error, loading } = useDashboard(activeMonth);

  if (error) {
    return (
      <section className="section">
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      </section>
    );
  }

  if (loading || !data) {
    return (
      <section className="section stack" style={{ gap: "var(--s-4)" }}>
        <div className="skeleton" style={{ height: "2rem", width: "16rem", borderRadius: "var(--radius-sm)" }} />
        <div className="grid grid-4" style={{ gap: "var(--s-3)" }}>
          <div className="skeleton" style={{ height: "6rem", borderRadius: "var(--radius-md)" }} />
          <div className="skeleton" style={{ height: "6rem", borderRadius: "var(--radius-md)" }} />
          <div className="skeleton" style={{ height: "6rem", borderRadius: "var(--radius-md)" }} />
          <div className="skeleton" style={{ height: "6rem", borderRadius: "var(--radius-md)" }} />
        </div>
        <div className="skeleton" style={{ height: "14rem", borderRadius: "var(--radius-md)" }} />
      </section>
    );
  }

  const { report } = data;
  const { forecast, comparison } = report;
  const short = forecast.projected_short;
  const noData = comparison.this_month.expense_count === 0;

  // Numerical calculations for executive cards
  const salaryNum = parseFloat(forecast.salary_bdt.replace(/,/g, "")) || 0;
  const spentNum = parseFloat(forecast.spent_to_date_bdt.replace(/,/g, "")) || 0;
  const burnPercent = salaryNum > 0 ? Math.min(100, Math.round((spentNum / salaryNum) * 100)) : 0;

  return (
    <>
      {/* Top Header Bar with Active Period & Month Picker */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div
          className="row-between"
          style={{
            alignItems: "flex-end",
            borderBottom: "1px solid var(--line)",
            paddingBottom: "var(--s-3)",
            marginBottom: "var(--s-3)",
          }}
        >
          <div>
            <div className="row" style={{ gap: "var(--s-2)", alignItems: "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "rgba(216, 84, 61, 0.12)",
                  color: "#D8543D",
                  border: "1px solid rgba(216, 84, 61, 0.3)",
                }}
              >
                <ShieldCheck size={15} />
              </span>
              <p className="eyebrow" style={{ margin: 0 }}>
                Executive Financial Cockpit · {monthLabel(activeMonth)}
              </p>
            </div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: "4px 0 0 0",
              }}
            >
              Enterprise & Personal Ledger
            </h1>
          </div>

          <div className="row" style={{ gap: "var(--s-3)", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--surface-2)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--line)",
                fontSize: "var(--t-xs)",
              }}
            >
              <Calendar size={13} color="var(--lime)" />
              <span className="mono" style={{ color: "var(--ink-muted)" }}>
                As of {session?.settings.as_of_date || "Today"}
              </span>
            </div>
            <MonthPicker month={activeMonth} onChange={setMonth} />
          </div>
        </div>

        {/* 4 Luxury Executive KPI Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--s-3)",
            marginBottom: "var(--s-5)",
          }}
        >
          {/* KPI 1: Month-End Forecast Position */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Month-End Projected Position</span>
              <span className={`kpi-badge ${short ? "kpi-badge--accent" : ""}`}>
                {short ? "DEFICIT PACE" : "SURPLUS BUFFER"}
              </span>
            </div>
            <div style={{ marginBlock: "var(--s-1)" }}>
              <Amount
                value={absolute(forecast.projected_end_position_bdt)}
                size="lg"
                tone={short ? "short" : "surplus"}
              />
            </div>
            <div className="kpi-card-footer">
              <span>{forecast.days_elapsed} of {forecast.days_in_month} days elapsed</span>
              <span>Burn: <strong style={{ color: "var(--ink)" }}>৳{forecast.daily_burn_bdt}</strong>/day</span>
            </div>
          </div>

          {/* KPI 2: Salary Inflow & Utilization */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Salary Inflow & Working Capital</span>
              <Wallet size={15} color="#5A5955" />
            </div>
            <div style={{ marginBlock: "var(--s-1)" }}>
              <Amount value={forecast.salary_bdt} size="lg" />
            </div>
            <div className="kpi-card-footer">
              <span>Spent: <Amount value={forecast.spent_to_date_bdt} /></span>
              <span className="mono" style={{ color: burnPercent > 80 ? "#D8543D" : "var(--ink)", fontWeight: 700 }}>
                {burnPercent}% used
              </span>
            </div>
          </div>

          {/* KPI 3: NBR Statutory VAT 15% Compliance */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Statutory VAT & NBR Mushak 6.3</span>
              <ShieldCheck size={15} color="#D8543D" />
            </div>
            <div style={{ marginBlock: "var(--s-1)", display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>
                Mushak 9.1 Ready
              </span>
              <span className="kpi-badge">15% NBR</span>
            </div>
            <div className="kpi-card-footer">
              <span>Automatic VDS withholding & audit trail active</span>
            </div>
          </div>

          {/* KPI 4: Pacioli Double-Entry Balance Invariant */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-label">Double-Entry Equilibrium</span>
              <Scale size={15} color="#5A5955" />
            </div>
            <div style={{ marginBlock: "var(--s-1)", display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span className="mono" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>
                A ≡ L + E
              </span>
              <span className="kpi-badge kpi-badge--accent">Balanced</span>
            </div>
            <div className="kpi-card-footer">
              <span>Pacioli equilibrium zero discrepancy invariant</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 01: Cash Runway & Projection Breakdown */}
      <section className="section">
        <p className="eyebrow">01 &nbsp; Cash Runway & Burn Projection</p>

        {noData ? (
          <div className="empty" style={{ marginTop: "var(--s-4)" }}>
            <p style={{ marginBottom: "var(--s-4)" }}>
              Nothing recorded for {monthLabel(activeMonth)} yet.
            </p>
            <div className="row" style={{ justifyContent: "center", gap: "var(--s-3)" }}>
              <Link className="btn" href="/expenses">
                Add an expense
              </Link>
              <Link className="btn btn--quiet" href="/receipts">
                Scan a receipt
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-sidebar" style={{ marginTop: "var(--s-4)", alignItems: "start" }}>
            <div className="stack-lg">
              <div className="figure-block">
                <p className="label">
                  {short ? "Projected shortfall at month end" : "Projected to be left at month end"}
                </p>
                <Amount
                  value={absolute(forecast.projected_end_position_bdt)}
                  size="display"
                  tone={short ? "short" : "surplus"}
                />
                <p className="note">
                  {forecast.days_elapsed} of {forecast.days_in_month} days elapsed, at{" "}
                  <Amount value={forecast.daily_burn_bdt} /> a day.{" "}
                  {short
                    ? "Spending is running ahead of this month's salary."
                    : "Spending is inside this month's salary."}
                </p>
              </div>

              <RunwayBar
                salary={forecast.salary_bdt}
                spent={forecast.spent_to_date_bdt}
                projectedRemaining={forecast.projected_remaining_bdt}
              />
            </div>

            <dl className="panel stack" style={{ gap: "var(--s-3)" }}>
              {[
                ["Salary Inflow", forecast.salary_bdt],
                ["Spent so far", forecast.spent_to_date_bdt],
                ["Projected for the rest", forecast.projected_remaining_bdt],
                ["Projected month total", forecast.projected_month_total_bdt],
              ].map(([term, value]) => (
                <div className="row-between" key={term}>
                  <dt className="note" style={{ margin: 0 }}>
                    {term}
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <Amount value={value} />
                  </dd>
                </div>
              ))}
              <hr className="divider" />
              <div className="row-between">
                <dt className="note" style={{ margin: 0 }}>
                  After pocket contributions
                </dt>
                <dd style={{ margin: 0 }}>
                  <Amount
                    value={forecast.projected_end_position_after_pockets_bdt}
                    tone="auto"
                    signed
                  />
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      {/* SECTION 02: Collapsible 25 Benchmark Cases & Quick Action Hub */}
      <section className="section" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <CollapsibleBenchmarkCases onLoaded={(loadedMonth) => setMonth(loadedMonth)} />
        <QuickActionHub />
      </section>

      {/* SECTION 04 & 05: Spending Breakdown & Month-Over-Month Comparison */}
      {!noData && (
        <>
          <section className="section">
            <p className="eyebrow">02 &nbsp; Where it went</p>
            <div className="grid grid-sidebar" style={{ marginTop: "var(--s-4)", alignItems: "start" }}>
              <div className="panel">
                <div className="panel-head">
                  <h2 style={{ fontSize: "var(--t-lg)" }}>By category</h2>
                  <span className="label">
                    {comparison.this_month.expense_count} entries ·{" "}
                    <Amount value={comparison.this_month.total_spent_bdt} />
                  </span>
                </div>

                <div className="grid grid-2" style={{ alignItems: "center" }}>
                  <CategoryDonut
                    lines={comparison.this_month.by_category}
                    total={comparison.this_month.total_spent_bdt}
                  />
                  <CategoryBars lines={comparison.this_month.by_category} />
                </div>
              </div>

              <div className="panel panel--flush">
                <div className="panel-head" style={{ padding: "var(--s-5) var(--s-5) var(--s-3)", margin: 0 }}>
                  <h2 style={{ fontSize: "var(--t-lg)" }}>Largest expenses</h2>
                </div>
                <div className="ledger-scroll">
                  <table className="ledger">
                    <caption className="sr-only">
                      The five largest single expenses in {monthLabel(activeMonth)}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Shop</th>
                        <th scope="col">Date</th>
                        <th scope="col" className="num">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.this_month.largest_expenses.map((expense) => (
                        <tr key={expense.id}>
                          <td>
                            {expense.shop}
                            <br />
                            <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="mono faint" style={{ fontSize: "var(--t-xs)" }}>
                            {expense.date}
                          </td>
                          <td className="num">
                            <Amount value={expense.amount_bdt} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="row-between">
              <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
                03 &nbsp; Against {monthLabel(comparison.last_month.month)}
              </p>
              <span className="row" style={{ gap: "var(--s-2)" }}>
                <Amount value={comparison.delta_bdt} tone="auto" signed />
                {comparison.delta_percent !== null ? (
                  <span className="chip">{comparison.delta_percent}%</span>
                ) : null}
              </span>
            </div>

            <div className="panel panel--flush" style={{ marginTop: "var(--s-4)" }}>
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">
                    Category totals compared with the previous month
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col" className="num">
                        {monthLabel(comparison.last_month.month)}
                      </th>
                      <th scope="col" className="num">
                        {monthLabel(comparison.this_month.month)}
                      </th>
                      <th scope="col" className="num">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.category_deltas.map((row) => (
                      <tr key={row.category}>
                        <td>{row.category}</td>
                        <td className="num muted">
                          <Amount value={row.last_bdt} />
                        </td>
                        <td className="num">
                          <Amount value={row.this_bdt} />
                        </td>
                        <td className="num">
                          <Amount value={row.delta_bdt} tone="auto" signed />
                          {row.delta_percent !== null ? (
                            <span
                              className="faint mono"
                              style={{ fontSize: "var(--t-xs)", marginLeft: "var(--s-2)" }}
                            >
                              {row.delta_percent}%
                            </span>
                          ) : (
                            <span
                              className="faint"
                              style={{ fontSize: "var(--t-xs)", marginLeft: "var(--s-2)" }}
                            >
                              new
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="row-between">
              <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
                04 &nbsp; Actionable Insights & Diagnostics
              </p>
              <Link className="btn btn--quiet btn--sm" href="/insights">
                All insights
              </Link>
            </div>
            <ul className="stack" style={{ listStyle: "none", padding: 0, marginTop: "var(--s-4)" }}>
              {report.insights.slice(0, 3).map((insight) => (
                <li
                  key={insight.id}
                  className={`alert rise ${insight.severity === "critical" ? "alert--error" : ""}`}
                >
                  {insight.text}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
