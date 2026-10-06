"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Save, Filter, TrendingUp, TrendingDown, Layers, BarChart3 } from "lucide-react";

import { toast } from "@/components/toast-provider";
import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { api, ApiError } from "@/lib/api";
import type { Account, Budget, BudgetVarianceResult, Segment } from "@/lib/types";

export default function BudgetsPage() {
  const { can } = useSession();
  const canWrite = can("budgets.write");

  const [activeTab, setActiveTab] = useState<"MATRIX" | "VARIANCE">("VARIANCE");
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7)); // e.g. "2026-07"
  const [selectedSegment, setSelectedSegment] = useState<string>("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [varianceData, setVarianceData] = useState<BudgetVarianceResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Matrix editing state
  const [matrixValues, setMatrixValues] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const segParam = selectedSegment ? `&segment_id=${encodeURIComponent(selectedSegment)}` : "";
      const [accRes, segRes, bgtRes, varRes] = await Promise.all([
        api<{ accounts: Account[] }>("/coa"),
        api<{ segments: Segment[] }>("/segments").catch(() => ({ segments: [] })),
        api<{ budgets: Budget[] }>(`/budgets?period_key=${currentPeriod}${segParam}`).catch(() => ({ budgets: [] })),
        api<BudgetVarianceResult>(`/budgets/variance?period_key=${currentPeriod}${segParam}`).catch(() => null),
      ]);

      const revExpAccs = (accRes.accounts || []).filter(
        (a) => a.is_active && (a.type === "REVENUE" || a.type === "EXPENSE"),
      );

      setAccounts(revExpAccs);
      setSegments(segRes.segments || []);
      setBudgets(bgtRes.budgets || []);
      setVarianceData(varRes);

      // Populate matrix
      const initialMap: Record<string, string> = {};
      for (const b of bgtRes.budgets || []) {
        initialMap[b.account_code] = b.budget_bdt;
      }
      setMatrixValues(initialMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }, [currentPeriod, selectedSegment]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleBudgetChange = (accountCode: string, value: string) => {
    setMatrixValues((prev) => ({
      ...prev,
      [accountCode]: value,
    }));
  };

  const handleSaveMatrix = async () => {
    setBusy(true);
    setError(null);
    try {
      const entries = Object.entries(matrixValues)
        .filter(([_, val]) => val && parseFloat(val) >= 0)
        .map(([code, val]) => {
          const num = parseFloat(val) || 0;
          return {
            account_code: code,
            period_key: currentPeriod,
            segment_id: selectedSegment,
            budget_bdt: num.toFixed(2),
            notes: "",
          };
        });

      await api("/budgets/bulk", {
        method: "PUT",
        body: { entries },
      });

      setNotice("Budgets saved successfully.");
      toast.success("Budgets Saved", `Financial targets updated for period ${currentPeriod}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budgets");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ gap: "var(--s-3)" }}>
      {/* Header */}
      <div className="row-between" style={{ alignItems: "flex-start", gap: "var(--s-3)", borderBottom: "1px solid var(--line)", paddingBottom: "var(--s-3)" }}>
        <div>
          <h1 style={{ fontSize: "var(--t-2xl)", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.03em" }}>
            Budgets &amp; Variance Analysis
          </h1>
          <p className="note" style={{ margin: 0, maxWidth: "56ch" }}>
            Establish financial targets per account and compare planned budgets against posted ledger actuals.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
            <span className="label" style={{ margin: 0 }}>Period:</span>
            <input
              type="month"
              value={currentPeriod}
              onChange={(e) => setCurrentPeriod(e.target.value)}
              className="input"
              style={{ fontSize: "var(--t-xs)", padding: "4px 8px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
            <span className="label" style={{ margin: 0 }}>Segment:</span>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="input"
              style={{ fontSize: "var(--t-xs)", padding: "4px 8px" }}
            >
              <option value="">All Segments</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert--error" role="alert" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", textDecoration: "underline", fontSize: "var(--t-xs)" }}>
            Dismiss
          </button>
        </div>
      )}
      {notice && (
        <div className="alert" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", textDecoration: "underline", fontSize: "var(--t-xs)" }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "var(--s-2)", borderBottom: "1px solid var(--line)", paddingBottom: "var(--s-3)" }}>
        <button
          onClick={() => setActiveTab("VARIANCE")}
          className={`btn btn--sm ${activeTab === "VARIANCE" ? "" : "btn--quiet"}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}
        >
          <BarChart3 size={15} />
          <span>Budget vs. Actual Variance</span>
        </button>
        <button
          onClick={() => setActiveTab("MATRIX")}
          className={`btn btn--sm ${activeTab === "MATRIX" ? "" : "btn--quiet"}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}
        >
          <Layers size={15} />
          <span>Budget Entry Table</span>
        </button>
      </div>

      {/* Tab: Variance Report */}
      {activeTab === "VARIANCE" && (
        <div className="stack" style={{ gap: "var(--s-4)" }}>
          {/* Summary Cards */}
          {varianceData && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "var(--s-3)",
              }}
            >
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-card-label">Total Planned Budget</span>
                  <span className="kpi-badge">Target</span>
                </div>
                <div style={{ marginBlock: "var(--s-1)" }}>
                  <span className="kpi-card-value font-mono">
                    <Amount value={varianceData.totals.budget_bdt} />
                  </span>
                </div>
                <div className="kpi-card-footer">
                  <span>Planned allocation for period</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-card-label">Total Actual Incurred</span>
                  <span className="kpi-badge">Posted</span>
                </div>
                <div style={{ marginBlock: "var(--s-1)" }}>
                  <span className="kpi-card-value font-mono">
                    <Amount value={varianceData.totals.actual_bdt} />
                  </span>
                </div>
                <div className="kpi-card-footer">
                  <span>Actual posted ledger entries</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-card-label">Net Variance</span>
                  <span className={`kpi-badge ${parseFloat(varianceData.totals.variance_bdt) < 0 ? "kpi-badge--accent" : ""}`}>
                    {parseFloat(varianceData.totals.variance_bdt) >= 0 ? "Surplus" : "Deficit"}
                  </span>
                </div>
                <div style={{ marginBlock: "var(--s-1)" }}>
                  <span
                    className="kpi-card-value font-mono"
                    style={{
                      color: parseFloat(varianceData.totals.variance_bdt) < 0 ? "#D8543D" : "var(--ink)",
                    }}
                  >
                    <Amount value={varianceData.totals.variance_bdt} />
                  </span>
                </div>
                <div className="kpi-card-footer">
                  <span>Target vs incurred difference</span>
                </div>
              </div>
            </div>
          )}

          {/* Variance Table */}
          <div className="panel panel--flush">
            {loading ? (
              <div style={{ padding: "var(--s-6)", textAlign: "center", color: "var(--ink-muted)", fontSize: "var(--t-sm)" }}>
                Computing variance...
              </div>
            ) : !varianceData || varianceData.rows.length === 0 ? (
              <div className="empty" style={{ padding: "var(--s-6)" }}>
                No budget records for period {currentPeriod}.
              </div>
            ) : (
              <div className="ledger-scroll" tabIndex={0} role="region" aria-label="Budget variance table" style={{ overflowX: "auto" }}>
                <table className="ledger" style={{ width: "100%", fontSize: "var(--t-xs)", textAlign: "left" }}>
                  <thead>
                    <tr>
                      <th scope="col" style={{ padding: "10px 14px" }}>Account</th>
                      <th scope="col" style={{ padding: "10px 14px" }}>Type</th>
                      <th scope="col" style={{ padding: "10px 14px", textAlign: "right" }}>Budget (BDT)</th>
                      <th scope="col" style={{ padding: "10px 14px", textAlign: "right" }}>Actual (BDT)</th>
                      <th scope="col" style={{ padding: "10px 14px", textAlign: "right" }}>Variance</th>
                      <th scope="col" style={{ padding: "10px 14px", textAlign: "right" }}>Variance %</th>
                      <th scope="col" style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {varianceData.rows.map((row) => (
                      <tr key={row.account_code}>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                          {row.account_code} - {row.account_name}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span className="chip" style={{ fontSize: "0.6875rem" }}>
                            {row.account_type}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace" }}>
                          <Amount value={row.budget_bdt} />
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace" }}>
                          <Amount value={row.actual_bdt} />
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: row.is_favorable ? "var(--ink)" : "#D8543D",
                          }}
                        >
                          <Amount value={row.variance_bdt} />
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", color: "var(--ink-muted)" }}>
                          {row.variance_pct}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span className={`kpi-badge ${row.is_favorable ? "" : "kpi-badge--accent"}`}>
                            {row.is_favorable ? "Favorable" : "Unfavorable"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Matrix Entry Table */}
      {activeTab === "MATRIX" && (
        <div className="stack" style={{ gap: "var(--s-4)" }}>
          <div className="row-between">
            <span className="note" style={{ fontSize: "var(--t-xs)" }}>
              Editing budget targets for period: <strong style={{ color: "var(--ink)" }}>{currentPeriod}</strong>
            </span>
            {canWrite && (
              <button
                type="button"
                disabled={busy}
                onClick={handleSaveMatrix}
                className="btn btn--sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}
              >
                <Save size={14} />
                <span>{busy ? "Saving..." : "Save Budgets"}</span>
              </button>
            )}
          </div>

          <div className="panel panel--flush">
            <div className="ledger-scroll" tabIndex={0} role="region" aria-label="Budget target matrix table" style={{ overflowX: "auto" }}>
              <table className="ledger" style={{ width: "100%", fontSize: "var(--t-xs)", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ padding: "10px 14px" }}>Account Code</th>
                    <th scope="col" style={{ padding: "10px 14px" }}>Account Name</th>
                    <th scope="col" style={{ padding: "10px 14px" }}>Type</th>
                    <th scope="col" style={{ padding: "10px 14px", textAlign: "right" }}>Target Budget (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.code}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700 }}>{acc.code}</td>
                      <td style={{ padding: "10px 14px" }}>{acc.name}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span className="chip" style={{ fontSize: "0.6875rem" }}>
                          {acc.type}
                        </span>
                      </td>
                      <td style={{ padding: "8px 14px", textAlign: "right" }}>
                        <input
                          type="text"
                          id={`budget-${acc.code}`}
                          placeholder="0.00"
                          aria-label={`Target budget for ${acc.code} ${acc.name} in BDT`}
                          value={matrixValues[acc.code] ?? ""}
                          onChange={(e) => handleBudgetChange(acc.code, e.target.value)}
                          className="input"
                          style={{
                            width: "140px",
                            padding: "4px 8px",
                            fontSize: "var(--t-xs)",
                            textAlign: "right",
                            fontFamily: "monospace",
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
