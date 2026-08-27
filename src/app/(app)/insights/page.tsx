"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Clock, ShieldCheck, DollarSign, Activity, AlertTriangle, Layers } from "lucide-react";

import { Amount } from "@/components/money";
import { DeltaBars, PaceDial } from "@/components/charts-extra";
import { CategoryDonut } from "@/components/donut";
import { MonthPicker } from "@/components/month-picker";
import { absolute } from "@/lib/money";
import { monthLabel, useDashboard, useDefaultMonth } from "@/lib/use-dashboard";
import { api } from "@/lib/api";

interface ReceivablesAgingData {
  aging?: {
    totals?: {
      total_bdt?: string;
      current_bdt?: string;
      days_1_30_bdt?: string;
      days_31_60_bdt?: string;
      days_61_90_bdt?: string;
      days_90_plus_bdt?: string;
    };
  };
  open_invoices_count?: number;
}

interface BankingTreasuryData {
  total_balance_bdt?: string;
}

export default function InsightsPage() {
  const defaultMonth = useDefaultMonth();
  const [month, setMonth] = useState<string | null>(null);
  const activeMonth = month ?? defaultMonth ?? "";
  const { data, error, loading } = useDashboard(activeMonth);

  const [activeTab, setActiveTab] = useState<"PERSONAL" | "BUSINESS">("BUSINESS");
  const [, setBizLoading] = useState(false);
  const [receivables, setReceivables] = useState<ReceivablesAgingData | null>(null);
  const [treasury, setTreasury] = useState<BankingTreasuryData | null>(null);

  useEffect(() => {
    let alive = true;
    setBizLoading(true);
    Promise.all([
      api<ReceivablesAgingData>("/sales/receivables").catch(() => null),
      api<BankingTreasuryData>("/banking").catch(() => null),
    ])
      .then(([rec, trs]) => {
        if (!alive) return;
        setReceivables(rec);
        setTreasury(trs);
      })
      .finally(() => {
        if (alive) setBizLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

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
      <section className="section stack">
        <div className="skeleton" style={{ height: "9rem" }} />
        <div className="skeleton" style={{ height: "5rem" }} />
        <div className="skeleton" style={{ height: "5rem" }} />
      </section>
    );
  }

  const { forecast, insights, comparison } = data.report;
  const short = forecast.projected_short;
  const empty = comparison.this_month.expense_count === 0;

  const severityCount = {
    critical: insights.filter((i) => i.severity === "critical").length,
    warning: insights.filter((i) => i.severity === "warning").length,
    info: insights.filter((i) => i.severity === "info").length,
  };

  // Business analytics derivations
  const totalReceivables = receivables?.aging?.totals?.total_bdt ? parseFloat(receivables.aging.totals.total_bdt) : 0;
  const overdueReceivables =
    receivables?.aging?.totals
      ? parseFloat(receivables.aging.totals.days_1_30_bdt || "0") +
        parseFloat(receivables.aging.totals.days_31_60_bdt || "0") +
        parseFloat(receivables.aging.totals.days_61_90_bdt || "0") +
        parseFloat(receivables.aging.totals.days_90_plus_bdt || "0")
      : 0;

  const cashAvailable = treasury?.total_balance_bdt ? parseFloat(treasury.total_balance_bdt) : 0;
  const dailyBurn = parseFloat(forecast.daily_burn_bdt) || 1;
  const runwayDays = Math.round(cashAvailable / Math.max(dailyBurn, 1));
  const runwayMonths = (runwayDays / 30).toFixed(1);

  // DSO Approximation based on recent period sales
  const dsoDays = totalReceivables > 0 ? Math.min(Math.round((totalReceivables / (dailyBurn * 30 || 1)) * 30), 120) : 0;

  return (
    <>
      {/* ---------------------------------------------------------------- Header */}
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Financial Health &amp; Deterministic Insights · {monthLabel(activeMonth)}
          </p>
          <MonthPicker month={activeMonth} onChange={setMonth} />
        </div>

        {/* Mode Switcher */}
        <div style={{ display: "flex", gap: "var(--s-2)", borderBottom: "1px solid var(--line)", paddingBottom: "var(--s-3)", marginTop: "var(--s-3)" }}>
          <button
            onClick={() => setActiveTab("BUSINESS")}
            className={`btn btn--sm ${activeTab === "BUSINESS" ? "" : "btn--quiet"}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}
          >
            <Activity size={15} />
            <span>Business Financial Analytics &amp; DSO</span>
          </button>
          <button
            onClick={() => setActiveTab("PERSONAL")}
            className={`btn btn--sm ${activeTab === "PERSONAL" ? "" : "btn--quiet"}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}
          >
            <DollarSign size={15} />
            <span>Personal Cashflow Insights</span>
          </button>
        </div>

        {/* ---------------------------------------------------------------- BUSINESS INSIGHTS */}
        {activeTab === "BUSINESS" && (
          <div className="stack" style={{ gap: "var(--s-4)", marginTop: "var(--s-3)" }}>
          {/* Key Health Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "var(--s-3)",
            }}
          >
            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-card-label">Days Sales Outstanding</span>
                <Clock size={16} color="#5A5955" />
              </div>
              <div style={{ marginBlock: "var(--s-1)" }}>
                <span className="kpi-card-value">{dsoDays}</span>
                <span style={{ fontSize: "var(--t-sm)", color: "var(--ink-muted)", marginLeft: "4px" }}>days</span>
              </div>
              <div className="kpi-card-footer">
                <span className={`kpi-badge ${dsoDays > 45 ? "kpi-badge--accent" : ""}`}>
                  {dsoDays <= 45 ? "Optimal collection pace" : "Collection lag observed"}
                </span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-card-label">Cash Runway</span>
                <ShieldCheck size={16} color="#D8543D" />
              </div>
              <div style={{ marginBlock: "var(--s-1)" }}>
                <span className="kpi-card-value">{runwayMonths}</span>
                <span style={{ fontSize: "var(--t-sm)", color: "var(--ink-muted)", marginLeft: "4px" }}>months</span>
              </div>
              <div className="kpi-card-footer">
                <span>Treasury liquidity: <Amount value={treasury?.total_balance_bdt || "0.00"} /></span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-card-label">Outstanding AR</span>
                <TrendingUp size={16} color="#5A5955" />
              </div>
              <div style={{ marginBlock: "var(--s-1)" }}>
                <span className="kpi-card-value">
                  <Amount value={receivables?.aging?.totals?.total_bdt || "0.00"} />
                </span>
              </div>
              <div className="kpi-card-footer">
                <span>{receivables?.open_invoices_count || 0} open unpaid invoices</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-header">
                <span className="kpi-card-label">Overdue Risk Exposure</span>
                <AlertTriangle size={16} color="#D8543D" />
              </div>
              <div style={{ marginBlock: "var(--s-1)" }}>
                <span className="kpi-card-value">
                  <Amount value={overdueReceivables.toFixed(2)} />
                </span>
              </div>
              <div className="kpi-card-footer">
                <span className={`kpi-badge ${overdueReceivables > 0 ? "kpi-badge--accent" : ""}`}>
                  {totalReceivables > 0
                    ? `${((overdueReceivables / totalReceivables) * 100).toFixed(0)}% past due terms`
                    : "No overdue balance"}
                </span>
              </div>
            </div>
          </div>

          {/* Aging Heatmap Breakdown */}
          {receivables?.aging?.totals && (
            <div className="panel stack" style={{ gap: "var(--s-3)" }}>
              <div className="row-between">
                <p className="label" style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}>
                  <Layers size={15} color="#D8543D" />
                  <span>Receivables Aging Maturity Heatmap</span>
                </p>
                <span className="note">Terms: Net 30 standard</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "var(--s-3)",
                }}
              >
                <div className="panel panel--sunk" style={{ padding: "var(--s-3)" }}>
                  <span className="label" style={{ fontSize: "0.6875rem" }}>Current (Not Due)</span>
                  <p style={{ margin: "6px 0 0 0", fontWeight: 700, fontSize: "1.1rem" }}>
                    <Amount value={receivables.aging.totals.current_bdt || "0.00"} />
                  </p>
                </div>
                <div className="panel panel--sunk" style={{ padding: "var(--s-3)" }}>
                  <span className="label" style={{ fontSize: "0.6875rem" }}>1–30 Days Overdue</span>
                  <p style={{ margin: "6px 0 0 0", fontWeight: 700, fontSize: "1.1rem" }}>
                    <Amount value={receivables.aging.totals.days_1_30_bdt || "0.00"} />
                  </p>
                </div>
                <div className="panel panel--sunk" style={{ padding: "var(--s-3)" }}>
                  <span className="label" style={{ fontSize: "0.6875rem" }}>31–60 Days Overdue</span>
                  <p style={{ margin: "6px 0 0 0", fontWeight: 700, fontSize: "1.1rem" }}>
                    <Amount value={receivables.aging.totals.days_31_60_bdt || "0.00"} />
                  </p>
                </div>
                <div className="panel panel--sunk" style={{ padding: "var(--s-3)" }}>
                  <span className="label" style={{ fontSize: "0.6875rem" }}>61–90 Days Overdue</span>
                  <p style={{ margin: "6px 0 0 0", fontWeight: 700, fontSize: "1.1rem" }}>
                    <Amount value={receivables.aging.totals.days_61_90_bdt || "0.00"} />
                  </p>
                </div>
                <div
                  className="panel"
                  style={{
                    padding: "var(--s-3)",
                    borderColor: "rgba(216, 84, 61, 0.3)",
                    background: "rgba(216, 84, 61, 0.04)",
                  }}
                >
                  <span className="label" style={{ fontSize: "0.6875rem", color: "#D8543D" }}>90+ Days (High Risk)</span>
                  <p style={{ margin: "6px 0 0 0", fontWeight: 800, fontSize: "1.1rem", color: "#D8543D" }}>
                    <Amount value={receivables.aging.totals.days_90_plus_bdt || "0.00"} />
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Business Deterministic Narrative Points */}
          <div className="panel stack" style={{ gap: "var(--s-3)" }}>
            <p className="label">Diagnostic Ledger Findings</p>
            <div className="stack" style={{ gap: "var(--s-2)" }}>
              <div
                className="panel panel--sunk"
                style={{
                  padding: "var(--s-3)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--s-3)",
                }}
              >
                <ShieldCheck size={18} color="#D8543D" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "var(--t-sm)", lineHeight: 1.5 }}>
                  <strong>Treasury Adequacy:</strong> Your liquid treasury of{" "}
                  <Amount value={treasury?.total_balance_bdt || "0.00"} /> across mapped bank accounts provides
                  approximately <strong>{runwayMonths} months</strong> of runway at the current daily burn rate of{" "}
                  <Amount value={forecast.daily_burn_bdt} />/day.
                </div>
              </div>

              <div
                className="panel panel--sunk"
                style={{
                  padding: "var(--s-3)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--s-3)",
                }}
              >
                <Clock size={18} color="#5A5955" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "var(--t-sm)", lineHeight: 1.5 }}>
                  <strong>Working Capital Velocity:</strong> Trade receivables represent{" "}
                  <Amount value={receivables?.aging?.totals?.total_bdt || "0.00"} /> with a DSO of{" "}
                  <strong>{dsoDays} days</strong>.{" "}
                  {overdueReceivables > 0
                    ? `Prompt collection of the ${((overdueReceivables / totalReceivables) * 100).toFixed(
                        0,
                      )}% overdue receivables would immediately enhance treasury cash buffer.`
                    : "No overdue customer balances are currently observed."}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- PERSONAL INSIGHTS */}
        {activeTab === "PERSONAL" && (
          <div style={{ marginTop: "var(--s-3)" }}>
            {empty ? (
              <div className="empty">
                <p style={{ margin: 0 }}>Record some expenses and the personal insights will appear here.</p>
              </div>
            ) : (
              <div className="panel panel--hero">
                <div className="grid grid-sidebar" style={{ alignItems: "center" }}>
                  <div className="stack">
                    <p className="label">
                      {short ? "Projected shortfall at month end" : "Projected to be left at month end"}
                    </p>
                    <Amount
                      value={absolute(forecast.projected_end_position_bdt)}
                      size="display"
                      tone={short ? "short" : "surplus"}
                    />
                    <p className="note" style={{ maxWidth: "48ch" }}>
                      {insights[0]?.text}
                    </p>

                    <div className="row" style={{ marginTop: "var(--s-2)" }}>
                      <span className="chip">{insights.length} insights</span>
                      {severityCount.critical > 0 ? (
                        <span className="chip chip--short">{severityCount.critical} critical</span>
                      ) : null}
                      {severityCount.warning > 0 ? (
                        <span className="chip">{severityCount.warning} warning</span>
                      ) : null}
                      <span className="chip chip--ok">{severityCount.info} informational</span>
                    </div>
                  </div>

                  <div className="pace-card">
                    <PaceDial
                      daysElapsed={forecast.days_elapsed}
                      daysInMonth={forecast.days_in_month}
                      spent={forecast.spent_to_date_bdt}
                      salary={forecast.salary_bdt}
                    />
                  </div>
                </div>
              </div>
            )}

            {!empty && (
              <>
                {/* Written insights */}
                <div style={{ marginTop: "var(--s-4)" }}>
                  <div className="stack">
                    {insights.map((item, idx) => (
                      <article
                        key={item.id}
                        className={`panel ${item.severity === "critical" ? "panel--accent" : ""}`}
                      >
                        <div className="row-between" style={{ alignItems: "baseline" }}>
                          <p className="label">
                            0{idx + 1} &nbsp; {item.severity.toUpperCase()}
                          </p>
                        </div>
                        <p className="insight-text" style={{ marginTop: "var(--s-2)" }}>
                          {item.text}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                {/* Working shown */}
                <div style={{ marginTop: "var(--s-4)" }}>
                  <div className="grid grid-2">
                    <div className="panel">
                      <p className="label">Month-over-month movement</p>
                      <div style={{ marginTop: "var(--s-3)" }}>
                        <DeltaBars comparison={comparison} />
                      </div>
                    </div>

                    <div className="panel">
                      <p className="label">Spend by category</p>
                      <div style={{ marginTop: "var(--s-3)" }}>
                        <CategoryDonut
                          lines={comparison.this_month.by_category}
                          total={comparison.this_month.total_spent_bdt}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Forecast Ledger */}
                <div style={{ marginTop: "var(--s-4)" }}>
                  <div className="panel">
                    <p className="label">Deterministic forecast math</p>
                    <dl className="stack" style={{ marginTop: "var(--s-3)" }}>
                      {[
                        ["Days in month", String(forecast.days_in_month)],
                        ["Days elapsed", String(forecast.days_elapsed)],
                        ["Days remaining", String(forecast.days_remaining)],
                      ].map(([term, value]) => (
                        <div className="row-between" key={term}>
                          <dt className="note" style={{ margin: 0 }}>
                            {term}
                          </dt>
                          <dd className="mono" style={{ margin: 0 }}>
                            {value}
                          </dd>
                        </div>
                      ))}
                      <hr className="divider" />
                      {[
                        ["Spent to date", forecast.spent_to_date_bdt],
                        ["Daily pace", forecast.daily_burn_bdt],
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
                          {short ? "Projected shortfall" : "Projected surplus"}
                        </dt>
                        <dd style={{ margin: 0 }}>
                          <Amount value={forecast.projected_end_position_bdt} tone="auto" signed />
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}
