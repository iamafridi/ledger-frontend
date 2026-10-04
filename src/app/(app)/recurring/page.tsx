"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Play, CheckCircle2, Clock, RotateCcw, AlertTriangle, X, FileText } from "lucide-react";

import { toast } from "@/components/toast-provider";
import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import type { Account, RecurringTemplate, Segment } from "@/lib/types";

export default function RecurringPage() {
  const { can } = useSession();
  const canWrite = can("recurring.write");

  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "ACCRUAL" | "PAUSED">("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [runModalTemplate, setRunModalTemplate] = useState<RecurringTemplate | null>(null);
  const [runDate, setRunDate] = useState(new Date().toISOString().slice(0, 10));

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formFreq, setFormFreq] = useState<"MONTHLY" | "QUARTERLY" | "ANNUAL" | "WEEKLY">("MONTHLY");
  const [formNextDate, setFormNextDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsAccrual, setFormIsAccrual] = useState(false);
  const [formLines, setFormLines] = useState<
    Array<{ account_code: string; debit_bdt: string; credit_bdt: string; memo: string; segment_id: string }>
  >([
    { account_code: "", debit_bdt: "0.00", credit_bdt: "0.00", memo: "", segment_id: "" },
    { account_code: "", debit_bdt: "0.00", credit_bdt: "0.00", memo: "", segment_id: "" },
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tplRes, accRes, segRes] = await Promise.all([
        api<{ templates: RecurringTemplate[] }>("/recurring"),
        api<{ accounts: Account[] }>("/coa"),
        api<{ segments: Segment[] }>("/segments").catch(() => ({ segments: [] })),
      ]);
      setTemplates(tplRes.templates || []);
      setAccounts(accRes.accounts?.filter((a) => a.is_active) || []);
      setSegments(segRes.segments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recurring templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredTemplates = useMemo(() => {
    if (filter === "ALL") return templates;
    if (filter === "ACTIVE") return templates.filter((t) => t.status === "ACTIVE");
    if (filter === "PAUSED") return templates.filter((t) => t.status === "PAUSED");
    if (filter === "ACCRUAL") return templates.filter((t) => t.is_accrual);
    return templates;
  }, [templates, filter]);

  const formDebitsTotal = useMemo(() => {
    return formLines.reduce((sum, l) => sum + (parseFloat(l.debit_bdt) || 0), 0).toFixed(2);
  }, [formLines]);

  const formCreditsTotal = useMemo(() => {
    return formLines.reduce((sum, l) => sum + (parseFloat(l.credit_bdt) || 0), 0).toFixed(2);
  }, [formLines]);

  const isFormBalanced = useMemo(() => {
    const d = parseFloat(formDebitsTotal);
    const c = parseFloat(formCreditsTotal);
    return d > 0 && Math.abs(d - c) < 0.001;
  }, [formDebitsTotal, formCreditsTotal]);

  const handleAddLine = () => {
    setFormLines((prev) => [...prev, { account_code: "", debit_bdt: "0.00", credit_bdt: "0.00", memo: "", segment_id: "" }]);
  };

  const handleRemoveLine = (index: number) => {
    if (formLines.length <= 2) return;
    setFormLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, val: string) => {
    setFormLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: val };
        // If typing debit, zero credit and vice versa
        if (field === "debit_bdt" && parseFloat(val) > 0) updated.credit_bdt = "0.00";
        if (field === "credit_bdt" && parseFloat(val) > 0) updated.debit_bdt = "0.00";
        return updated;
      }),
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormBalanced) {
      setError("Total debits must equal total credits before creating template.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api("/recurring", {
        method: "POST",
        body: {
          template_name: formName,
          description: formDesc,
          frequency: formFreq,
          next_run_date: formNextDate,
          end_date: formEndDate ? formEndDate : null,
          is_accrual: formIsAccrual,
          lines: formLines.filter((l) => l.account_code),
        },
      });
      setNotice("Recurring template created successfully.");
      setCreateModalOpen(false);
      // reset
      setFormName("");
      setFormDesc("");
      setFormLines([
        { account_code: "", debit_bdt: "0.00", credit_bdt: "0.00", memo: "", segment_id: "" },
        { account_code: "", debit_bdt: "0.00", credit_bdt: "0.00", memo: "", segment_id: "" },
      ]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setBusy(false);
    }
  };

  const handleExecuteRun = async () => {
    if (!runModalTemplate) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ entry_no: string; next_run_date: string; reversal_entry_id?: string }>(
        `/recurring/${runModalTemplate.id}/run`,
        {
          method: "POST",
          body: { run_date: runDate },
        },
      );
      setNotice(
        `Journal entry ${res.entry_no} posted successfully! Next run advanced to ${res.next_run_date}.${
          res.reversal_entry_id ? " Auto-reversing entry scheduled." : ""
        }`,
      );
      setRunModalTemplate(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute recurring template");
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
            Recurring Templates &amp; Accruals
          </h1>
          <p className="note" style={{ margin: 0, maxWidth: "56ch" }}>
            Schedule recurring journal entries (rent, retainers, subscriptions) and automated auto-reversing accruals.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}
          >
            <Plus size={16} />
            <span>New Template</span>
          </button>
        )}
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

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--s-3)",
        }}
      >
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Active Templates</span>
            <span className="kpi-badge">Active</span>
          </div>
          <div style={{ marginBlock: "var(--s-1)" }}>
            <span className="kpi-card-value">
              {templates.filter((t) => t.status === "ACTIVE").length}
            </span>
          </div>
          <div className="kpi-card-footer">
            <span>Automated recurring schedules</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Accruals Enabled</span>
            <RotateCcw size={15} color="#D8543D" />
          </div>
          <div style={{ marginBlock: "var(--s-1)" }}>
            <span className="kpi-card-value">
              {templates.filter((t) => t.is_accrual).length}
            </span>
          </div>
          <div className="kpi-card-footer">
            <span>Auto-reversing month start</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Total Runs Executed</span>
            <span className="kpi-badge">History</span>
          </div>
          <div style={{ marginBlock: "var(--s-1)" }}>
            <span className="kpi-card-value">
              {templates.reduce((acc, t) => acc + (t.runs_count || 0), 0)}
            </span>
          </div>
          <div className="kpi-card-footer">
            <span>Posted ledger vouchers</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Next Due</span>
            <Clock size={15} color="#5A5955" />
          </div>
          <div style={{ marginBlock: "var(--s-1)" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>
              {templates.length > 0 ? templates[0]?.next_run_date : "None"}
            </span>
          </div>
          <div className="kpi-card-footer">
            <span>Earliest pending cycle</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "var(--s-2)", borderBottom: "1px solid var(--line)", paddingBottom: "var(--s-3)" }}>
        {(["ALL", "ACTIVE", "ACCRUAL", "PAUSED"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`btn btn--sm ${filter === key ? "" : "btn--quiet"}`}
          >
            {key === "ALL" ? "All Templates" : key.charAt(0) + key.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Templates Table / List */}
      <div className="panel panel--flush">
        {loading ? (
          <div style={{ padding: "var(--s-6)", textAlign: "center", color: "var(--ink-muted)", fontSize: "var(--t-sm)" }}>
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="empty" style={{ padding: "var(--s-6)" }}>
            <FileText size={36} color="#8A8780" style={{ margin: "0 auto var(--s-2) auto" }} />
            <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>No recurring templates found</p>
            <p className="note" style={{ margin: 0 }}>Create templates for monthly rent, payroll accruals, or retainers.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredTemplates.map((t, idx) => (
              <div
                key={t.id}
                style={{
                  padding: "var(--s-4)",
                  borderBottom: idx === filteredTemplates.length - 1 ? "none" : "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--s-3)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "42rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink)" }}>{t.template_name}</span>
                    <span className="chip" style={{ fontSize: "0.6875rem" }}>{t.frequency}</span>
                    {t.is_accrual && (
                      <span className="kpi-badge kpi-badge--accent">
                        <RotateCcw size={12} /> Auto-Reversing Accrual
                      </span>
                    )}
                    <span className={`chip ${t.status === "ACTIVE" ? "chip--ok" : ""}`} style={{ fontSize: "0.6875rem" }}>
                      {t.status}
                    </span>
                  </div>
                  {t.description && <p className="note" style={{ margin: 0 }}>{t.description}</p>}
                  <div style={{ fontSize: "var(--t-xs)", color: "var(--ink-muted)", display: "flex", gap: "var(--s-4)", flexWrap: "wrap" }}>
                    <span>Next run: <strong style={{ color: "var(--ink)" }}>{t.next_run_date}</strong></span>
                    <span>Runs completed: <strong style={{ color: "var(--ink)" }}>{t.runs_count}</strong></span>
                    <span>Total Entry Amount: <strong style={{ color: "var(--ink)" }}><Amount value={t.total_debit_bdt} /></strong></span>
                  </div>
                </div>

                <div>
                  {canWrite && t.status === "ACTIVE" && (
                    <button
                      onClick={() => {
                        setRunModalTemplate(t);
                        setRunDate(t.next_run_date || new Date().toISOString().slice(0, 10));
                      }}
                      className="btn btn--sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-1)" }}
                    >
                      <Play size={13} />
                      <span>Post / Run Now</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run Confirmation Modal */}
      <Modal
        isOpen={!!runModalTemplate}
        onClose={() => setRunModalTemplate(null)}
        title="Post Recurring Entry"
        eyebrow="Recurring Execution"
        maxWidth="32rem"
      >
        {runModalTemplate && (
          <div className="stack" style={{ gap: "var(--s-3)", fontSize: "var(--t-sm)" }}>
            <p className="note" style={{ margin: 0 }}>
              You are about to post a journal entry for template <strong>{runModalTemplate.template_name}</strong>.
            </p>

            <div>
              <label className="label" style={{ display: "block", marginBottom: "4px" }}>Execution Posting Date</label>
              <input
                type="date"
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                className="input"
                style={{ width: "100%" }}
              />
            </div>

            {runModalTemplate.is_accrual && (
              <div className="panel panel--sunk" style={{ padding: "var(--s-3)", fontSize: "var(--t-xs)", color: "var(--ink)" }}>
                <strong>Note:</strong> This is an accrual template. A mirrored auto-reversing entry will automatically be generated for the start of the next month.
              </div>
            )}

            <div className="row" style={{ justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                onClick={() => setRunModalTemplate(null)}
                className="btn btn--quiet"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleExecuteRun}
                className="btn"
              >
                {busy ? "Posting..." : "Confirm & Post"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Template Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="New Recurring Template"
        eyebrow="Recurring Schedule"
        maxWidth="44rem"
      >
        <form onSubmit={handleCreateSubmit} className="stack" style={{ gap: "var(--s-3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "4px" }}>Template Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Office Rent, Cloud Subscriptions"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="input"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "4px" }}>Frequency *</label>
              <select
                value={formFreq}
                onChange={(e) => setFormFreq(e.target.value as RecurringTemplate["frequency"])}
                className="input"
                style={{ width: "100%" }}
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUAL">Annual</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)" }}>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "4px" }}>First / Next Run Date *</label>
              <input
                type="date"
                required
                value={formNextDate}
                onChange={(e) => setFormNextDate(e.target.value)}
                className="input"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "4px" }}>End Date (Optional)</label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="input"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div>
            <label className="label" style={{ display: "block", marginBottom: "4px" }}>Description / Notes</label>
            <input
              type="text"
              placeholder="Memo or context for this entry"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="input"
              style={{ width: "100%" }}
            />
          </div>

          <div className="panel panel--sunk" style={{ padding: "var(--s-3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: "var(--t-sm)", display: "block" }}>Auto-Reversing Accrual</span>
              <span className="note" style={{ fontSize: "var(--t-xs)" }}>Automatically post a reversing entry on the 1st of the next month.</span>
            </div>
            <input
              type="checkbox"
              checked={formIsAccrual}
              onChange={(e) => setFormIsAccrual(e.target.checked)}
              style={{ width: "18px", height: "18px" }}
            />
          </div>

          {/* Lines Editor */}
          <div className="stack" style={{ gap: "var(--s-2)", paddingTop: "var(--s-2)" }}>
            <div className="row-between">
              <span className="label">Journal Lines</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="btn btn--sm btn--quiet"
                style={{ padding: "2px 8px" }}
              >
                + Add Line
              </button>
            </div>

            <div className="stack" style={{ gap: "var(--s-2)" }}>
              {formLines.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "4fr 2fr 2fr 3fr 1fr",
                    gap: "var(--s-2)",
                    alignItems: "center",
                    padding: "var(--s-2)",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <select
                    value={line.account_code}
                    onChange={(e) => handleLineChange(idx, "account_code", e.target.value)}
                    className="input"
                    style={{ fontSize: "var(--t-xs)", padding: "4px 8px" }}
                    aria-label={`Line ${idx + 1} Account`}
                    required
                  >
                    <option value="">Select Account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.code}>
                        {a.code} - {a.name} ({a.type})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Debit (BDT)"
                    aria-label={`Line ${idx + 1} Debit in BDT`}
                    value={line.debit_bdt}
                    onChange={(e) => handleLineChange(idx, "debit_bdt", e.target.value)}
                    className="input"
                    style={{ fontSize: "var(--t-xs)", padding: "4px 8px", textAlign: "right", fontFamily: "monospace" }}
                  />

                  <input
                    type="text"
                    placeholder="Credit (BDT)"
                    aria-label={`Line ${idx + 1} Credit in BDT`}
                    value={line.credit_bdt}
                    onChange={(e) => handleLineChange(idx, "credit_bdt", e.target.value)}
                    className="input"
                    style={{ fontSize: "var(--t-xs)", padding: "4px 8px", textAlign: "right", fontFamily: "monospace" }}
                  />

                  <select
                    value={line.segment_id}
                    onChange={(e) => handleLineChange(idx, "segment_id", e.target.value)}
                    className="input"
                    style={{ fontSize: "var(--t-xs)", padding: "4px 8px" }}
                    aria-label={`Line ${idx + 1} Segment`}
                  >
                    <option value="">No Segment</option>
                    {segments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} ({s.type})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={formLines.length <= 2}
                    onClick={() => handleRemoveLine(idx)}
                    aria-label={`Remove line ${idx + 1}`}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#D8543D", opacity: formLines.length <= 2 ? 0.3 : 1 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Live Balance Totals */}
            <div
              className="row-between"
              style={{
                padding: "var(--s-2) var(--s-3)",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                fontSize: "var(--t-xs)",
                fontFamily: "monospace",
              }}
            >
              <div style={{ display: "flex", gap: "var(--s-4)" }}>
                <span>Total Debits: <strong>{formDebitsTotal}</strong></span>
                <span>Total Credits: <strong>{formCreditsTotal}</strong></span>
              </div>
              <div>
                {isFormBalanced ? (
                  <span style={{ color: "var(--ink)", fontWeight: 700 }}>Balanced</span>
                ) : (
                  <span style={{ color: "#D8543D", fontWeight: 700 }}>Unbalanced</span>
                )}
              </div>
            </div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn btn--quiet"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !isFormBalanced}
              className="btn"
            >
              {busy ? "Creating..." : "Save Template"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
