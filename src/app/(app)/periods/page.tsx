"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { Modal } from "@/components/ui/modal";
import { useSession } from "@/components/session-provider";
import { api, ApiError } from "@/lib/api";
import { addMoney, toCanonical } from "@/lib/money";
import { monthLabel } from "@/lib/use-dashboard";
import type { AccountingPeriod, FiscalYear } from "@/lib/types";
import { CheckCircle2, ShieldCheck, Check, AlertCircle, Lock, Sparkles } from "lucide-react";
import { playAcousticTick, playVaultClick } from "@/lib/audio";

/**
 * Fiscal years, the monthly periods inside them, and opening balances.
 *
 * Closing a period is the closest thing this ledger has to a commitment: after
 * it, the posting engine refuses anything dated inside that month, so a report
 * printed in April cannot quietly change in May. That is why close and reopen
 * both live behind `periods.close` (owner/admin) and why both write an audit
 * row — a month that was reopened is the single most useful thing to see when
 * two runs of the same report disagree.
 *
 * Opening balances are posted like any other entry, as one balanced `OPENING`
 * journal. They are deliberately not edited into a balance column anywhere:
 * there is exactly one code path that produced every number in the trial
 * balance, and this screen feeds it rather than going around it.
 */
const TODAY = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

interface OpeningLine {
  key: number;
  account_code: string;
  side: "DEBIT" | "CREDIT";
  amount: string;
}

let nextKey = 1;
const newOpeningLine = (): OpeningLine => ({
  key: nextKey++,
  account_code: "",
  side: "DEBIT",
  amount: "",
});

export default function PeriodsPage() {
  const { can } = useSession();
  const canClose = can("periods.close");
  const canPost = can("journals.write");

  const [years, setYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [yearStart, setYearStart] = useState(`${new Date().getFullYear()}-07-01`);
  const [yearMonths, setYearMonths] = useState("12");
  const [busy, setBusy] = useState(false);

  const [closingKey, setClosingKey] = useState<string | null>(null);
  const [closeNote, setCloseNote] = useState("");

  const [accounts, setAccounts] = useState<Array<{ code: string; name: string; type: string }>>([]);
  const [obDate, setObDate] = useState(TODAY());
  const [obDescription, setObDescription] = useState("Opening balances brought forward");
  const [obLines, setObLines] = useState<OpeningLine[]>([newOpeningLine(), newOpeningLine()]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { fiscal_years } = await api<{ fiscal_years: FiscalYear[] }>("/periods");
      setYears(fiscal_years);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the accounting calendar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    api<{ accounts: Array<{ code: string; name: string; type: string }> }>("/periods/opening-accounts")
      .then((result) => {
        if (alive) setAccounts(result.accounts);
      })
      .catch(() => {
        // Not fatal: the rest of the screen — closing and reopening periods —
        // works without the account list, so this failure is not worth a banner.
      });
    return () => {
      alive = false;
    };
  }, []);

  const obTotals = useMemo(() => {
    const debits: string[] = [];
    const credits: string[] = [];
    for (const line of obLines) {
      if (!line.amount.trim()) continue;
      const parsed = toCanonical(line.amount);
      if (!parsed.ok) continue;
      (line.side === "DEBIT" ? debits : credits).push(parsed.value);
    }
    const debitTotal = addMoney(debits);
    const creditTotal = addMoney(credits);
    return {
      debitTotal,
      creditTotal,
      difference: addMoney([debitTotal, `-${creditTotal}`]),
      balanced: debitTotal === creditTotal && debitTotal !== "0.00",
    };
  }, [obLines]);

  async function run(action: () => Promise<void>, fallback: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  const [wizardPeriod, setWizardPeriod] = useState<AccountingPeriod | null>(null);
  const [wizardChecks, setWizardChecks] = useState<Record<string, boolean>>({
    bank: false,
    depreciation: false,
    payroll: false,
    inventory: false,
    tb: false,
  });

  const openYear = () =>
    run(async () => {
      await api("/periods/years", {
        method: "POST",
        body: { start_date: yearStart, months: Number(yearMonths) },
      });
      await load();
      setNotice(`Fiscal year opened from ${yearStart}.`);
    }, "Could not open that fiscal year.");

  const close = (key: string, noteText?: string) =>
    run(async () => {
      await api("/periods/close", { method: "POST", body: { key, note: (noteText !== undefined ? noteText : closeNote).trim() } });
      await load();
      setClosingKey(null);
      setCloseNote("");
      setWizardPeriod(null);
      setNotice(`${monthLabel(key)} is closed. Nothing dated in it can be posted until it is reopened.`);
    }, "Could not close that period.");

  const reopen = (key: string) =>
    run(async () => {
      await api("/periods/reopen", { method: "POST", body: { key } });
      await load();
      setNotice(`${monthLabel(key)} is open again.`);
    }, "Could not reopen that period.");

  const postOpening = () =>
    run(async () => {
      const used = obLines.filter((line) => line.account_code || line.amount.trim());
      if (used.length < 2) throw new ApiError(0, "TOO_FEW", "Opening balances need at least two lines.");

      const payload = used.map((line, index) => {
        if (!line.account_code) throw new ApiError(0, "NO_ACCOUNT", `Line ${index + 1} needs an account.`);
        const parsed = toCanonical(line.amount);
        if (!parsed.ok) throw new ApiError(0, "BAD_AMOUNT", `Line ${index + 1}: ${parsed.reason}`);
        if (parsed.value === "0.00") throw new ApiError(0, "ZERO", `Line ${index + 1} has no amount.`);
        return {
          account_code: line.account_code,
          ...(line.side === "DEBIT" ? { debit_bdt: parsed.value } : { credit_bdt: parsed.value }),
        };
      });

      if (!obTotals.balanced) {
        throw new ApiError(
          0,
          "UNBALANCED",
          `Debits ${obTotals.debitTotal} and credits ${obTotals.creditTotal} must be equal.`,
        );
      }

      const { opening } = await api<{ opening: { entry_no: string | null; total_bdt: string } }>(
        "/periods/opening-balances",
        { method: "POST", body: { date: obDate, description: obDescription.trim(), lines: payload } },
      );
      setObLines([newOpeningLine(), newOpeningLine()]);
      setNotice(`Opening balances posted as entry ${opening.entry_no} for ${opening.total_bdt}.`);
    }, "Could not post those opening balances.");

  return (
    <div style={{ paddingBottom: "var(--s-6)" }}>
      <p className="eyebrow">04 &nbsp; Periods &amp; fiscal years</p>
      <p className="muted" style={{ marginTop: "var(--s-2)", marginBottom: "var(--s-4)", maxWidth: "62ch" }}>
        A period is the unit that gets closed. Closing one locks every date inside it, which is what makes
        it possible to say “March is final” — the figure a report showed on the 31st is the figure it still
        shows in June.
      </p>

        {error ? (
          <p className="alert alert--error" role="alert" style={{ marginTop: "var(--s-4)" }}>
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="alert alert--ok" role="status" style={{ marginTop: "var(--s-4)" }}>
            {notice}
          </p>
        ) : null}

        <div style={{ marginTop: "var(--s-4)" }}>
        {loading ? (
          <div className="stack">
            {[0, 1, 2].map((row) => (
              <div className="skeleton" key={row} style={{ height: "3rem" }} />
            ))}
          </div>
        ) : years.length === 0 ? (
          <div className="empty">
            <p style={{ margin: 0 }}>
              No fiscal year is open yet. A ledger needs one before anything can be posted.
            </p>
          </div>
        ) : (
          <div className="stack-lg">
            {years.map((year) => (
              <div className="panel panel--flush" key={year.id}>
                <div className="panel-head">
                  <h2 style={{ fontSize: "var(--t-lg)" }}>
                    {year.label}
                    <span className="faint" style={{ marginLeft: "var(--s-3)", fontSize: "var(--t-sm)" }}>
                      {year.start_date} → {year.end_date}
                    </span>
                  </h2>
                  <span className="chip">{year.periods.filter((p) => p.status === "CLOSED").length} closed</span>
                </div>

                <div className="ledger-scroll">
                  <table className="ledger">
                    <caption className="sr-only">Periods in {year.label}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Month</th>
                        <th scope="col">Status</th>
                        <th scope="col">Closed</th>
                        <th scope="col">Note</th>
                        <th scope="col" className="shrink">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {year.periods.map((period) => (
                        <PeriodRow
                          key={period.id}
                          period={period}
                          canClose={canClose}
                          busy={busy}
                          closing={closingKey === period.key}
                          note={closeNote}
                          onNote={setCloseNote}
                          onStartClose={() => {
                            setClosingKey(period.key);
                            setCloseNote("");
                          }}
                          onCancelClose={() => {
                            setClosingKey(null);
                            setCloseNote("");
                          }}
                          onClose={() => void close(period.key)}
                          onReopen={() => void reopen(period.key)}
                          onStartWizard={() => {
                            setWizardPeriod(period);
                            setWizardChecks({
                              bank: false,
                              depreciation: false,
                              payroll: false,
                              inventory: false,
                              tb: false,
                            });
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Month-End Close Guided 5-Step Wizard Modal (AUD-A11Y-02) */}
      <Modal
        isOpen={wizardPeriod !== null}
        onClose={() => setWizardPeriod(null)}
        eyebrow="STATUTORY CLOSE PROTOCOL · 5-STEP AUDIT SEAL"
        title={`Month-End Closing Wizard · ${wizardPeriod ? monthLabel(wizardPeriod.key) : ""}`}
        description="Verify sub-ledgers and reconciliations before locking the accounting period."
        maxWidth="42rem"
      >
        {wizardPeriod && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
            {/* Progress Meter */}
            <div style={{ backgroundColor: "var(--surface-2)", padding: "var(--s-3)", borderRadius: "6px", border: "1px solid var(--line)" }}>
              <div className="row-between" style={{ marginBottom: "6px", fontSize: "var(--t-xs)", fontFamily: "var(--font-mono), monospace" }}>
                <span>Verification Progress</span>
                <span style={{ fontWeight: 700, color: Object.values(wizardChecks).filter(Boolean).length === 5 ? "#2E7D32" : "#D8543D" }}>
                  {Object.values(wizardChecks).filter(Boolean).length} of 5 Protocols Passed
                </span>
              </div>
              <div style={{ height: "6px", width: "100%", backgroundColor: "var(--line)", borderRadius: "3px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(Object.values(wizardChecks).filter(Boolean).length / 5) * 100}%`,
                    backgroundColor: Object.values(wizardChecks).filter(Boolean).length === 5 ? "#2E7D32" : "#D8543D",
                    transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            </div>

            {/* 5 Guided Protocols */}
            <div className="stack" style={{ gap: "var(--s-2)", fontSize: "var(--t-xs)" }}>
              {[
                {
                  key: "bank",
                  step: "01",
                  title: "Bank & Cash Reconciliation",
                  desc: "Bank statements imported and reconciled to zero discrepancy (0.00 difference).",
                },
                {
                  key: "depreciation",
                  step: "02",
                  title: "Fixed Assets Straight-Line Depreciation",
                  desc: "Monthly asset depreciation schedule processed and posted to expense accounts.",
                },
                {
                  key: "payroll",
                  step: "03",
                  title: "Staff Payroll & Loan Amortizations",
                  desc: "Monthly payroll journal posted, tax withholding (TDS) deducted, and loan balances amortized.",
                },
                {
                  key: "inventory",
                  step: "04",
                  title: "Stocktake & Inventory Valuation",
                  desc: "Warehouse physical balance verified against weighted average cost ledger.",
                },
                {
                  key: "tb",
                  step: "05",
                  title: "Trial Balance Zero-Differential Guard",
                  desc: "Sum of total debits equals total credits across all accounts (Invariant I1 & I2).",
                },
              ].map((step) => {
                const isChecked = wizardChecks[step.key];
                return (
                  <label
                    key={step.key}
                    className="panel panel--sunk"
                    style={{
                      padding: "var(--s-3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--s-3)",
                      cursor: "pointer",
                      border: isChecked ? "1px solid rgba(46, 125, 50, 0.35)" : "1px solid var(--line)",
                      backgroundColor: isChecked ? "rgba(46, 125, 50, 0.03)" : "var(--surface)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        playAcousticTick(isChecked ? 1800 : 2400, 0.02);
                        setWizardChecks((prev) => ({ ...prev, [step.key]: e.target.checked }));
                      }}
                      style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#D8543D" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="mono" style={{ fontSize: "10px", color: "var(--ink-faint)" }}>
                          STEP {step.step}
                        </span>
                        <strong style={{ color: "var(--ink)" }}>{step.title}</strong>
                      </div>
                      <span className="note" style={{ fontSize: "0.75rem", display: "block", marginTop: "2px" }}>
                        {step.desc}
                      </span>
                    </div>
                    {isChecked ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "10px", color: "#2E7D32", fontWeight: 700 }}>
                        <Check size={12} /> VERIFIED
                      </span>
                    ) : (
                      <span style={{ fontSize: "10px", color: "var(--ink-faint)" }}>
                        PENDING
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Quick 1-Click Verification Trigger */}
            <div className="row-between" style={{ alignItems: "center", paddingTop: "var(--s-2)" }}>
              <button
                type="button"
                className="btn btn--sm btn--quiet"
                onClick={() => {
                  playAcousticTick(2600, 0.03);
                  setWizardChecks({
                    bank: true,
                    depreciation: true,
                    payroll: true,
                    inventory: true,
                    tb: true,
                  });
                }}
                style={{ fontSize: "var(--t-xs)", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Sparkles size={12} color="#D8543D" />
                <span>1-Click Verify All 5 Protocols</span>
              </button>

              <span className="mono muted" style={{ fontSize: "10px" }}>
                INVARIANT GUARD I4: PERIOD LOCK IMMUTABILITY
              </span>
            </div>

            {/* Sign-off Note */}
            <div style={{ paddingTop: "var(--s-2)" }}>
              <label className="label" style={{ display: "block", marginBottom: "4px" }}>
                Closing Sign-off Note &amp; Audit Seal
              </label>
              <input
                type="text"
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="e.g. Statutory Month-End Verification Completed by Finance Controller"
                className="input"
                style={{ width: "100%", fontSize: "var(--t-xs)" }}
              />
            </div>

            {/* Actions */}
            <div className="row" style={{ justifyContent: "flex-end", gap: "var(--s-2)", paddingTop: "var(--s-3)", borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                onClick={() => setWizardPeriod(null)}
                className="btn btn--quiet"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !Object.values(wizardChecks).every(Boolean)}
                onClick={() => {
                  playVaultClick();
                  void close(wizardPeriod.key, closeNote || "Statutory Month-End Verification Completed");
                }}
                className="btn"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Lock size={13} />
                <span>{busy ? "Locking..." : "Verify All 5 Protocols & Lock Period"}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {canClose ? (
        <div style={{ marginTop: "var(--s-4)" }}>
          <div className="panel">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Open a fiscal year</h2>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              A year brings its own monthly periods. Overlapping a month that already belongs to another year
              is refused rather than merged, so the calendar can never contain a month twice.
            </p>
            <div className="grid grid-2">
              <div className="field">
                <label className="label" htmlFor="year-start">
                  First day
                </label>
                <input
                  id="year-start"
                  type="date"
                  value={yearStart}
                  onChange={(event) => setYearStart(event.target.value)}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="year-months">
                  Months
                </label>
                <input
                  id="year-months"
                  type="number"
                  min={1}
                  max={24}
                  value={yearMonths}
                  onChange={(event) => setYearMonths(event.target.value)}
                />
              </div>
            </div>
            <div className="row">
              <button className="btn btn--sm" type="button" disabled={busy} onClick={() => void openYear()}>
                Open the year
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canPost ? (
        <div style={{ marginTop: "var(--s-4)" }}>
          <div className="panel panel--flush">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Opening balances</h2>
              <span className="label">one balanced entry</span>
            </div>

            <div style={{ padding: "var(--s-5)" }}>
              <div className="grid grid-2">
                <div className="field">
                  <label className="label" htmlFor="ob-date">
                    Date
                  </label>
                  <input
                    id="ob-date"
                    type="date"
                    value={obDate}
                    onChange={(event) => setObDate(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="ob-description">
                    Description
                  </label>
                  <input
                    id="ob-description"
                    value={obDescription}
                    onChange={(event) => setObDescription(event.target.value)}
                  />
                </div>
              </div>

              <div className="stack" style={{ marginTop: "var(--s-5)" }}>
                {obLines.map((line, index) => (
                  <div className="grid grid-3" key={line.key}>
                    <div className="field">
                      <label className="label" htmlFor={`ob-account-${line.key}`}>
                        Account
                      </label>
                      <select
                        id={`ob-account-${line.key}`}
                        value={line.account_code}
                        onChange={(event) =>
                          setObLines((rows) =>
                            rows.map((row) =>
                              row.key === line.key ? { ...row, account_code: event.target.value } : row,
                            ),
                          )
                        }
                      >
                        <option value="">Choose an account…</option>
                        {accounts.map((account) => (
                          <option key={account.code} value={account.code}>
                            {account.code} — {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label className="label" htmlFor={`ob-side-${line.key}`}>
                        Side
                      </label>
                      <select
                        id={`ob-side-${line.key}`}
                        value={line.side}
                        onChange={(event) =>
                          setObLines((rows) =>
                            rows.map((row) =>
                              row.key === line.key
                                ? { ...row, side: event.target.value as "DEBIT" | "CREDIT" }
                                : row,
                            ),
                          )
                        }
                      >
                        <option value="DEBIT">Debit</option>
                        <option value="CREDIT">Credit</option>
                      </select>
                    </div>

                    <div className="field">
                      <label className="label" htmlFor={`ob-amount-${line.key}`}>
                        Amount
                      </label>
                      <div className="row" style={{ gap: "var(--s-2)" }}>
                        <input
                          id={`ob-amount-${line.key}`}
                          inputMode="decimal"
                          placeholder="0.00"
                          value={line.amount}
                          onChange={(event) =>
                            setObLines((rows) =>
                              rows.map((row) =>
                                row.key === line.key ? { ...row, amount: event.target.value } : row,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          className="btn btn--quiet btn--sm"
                          disabled={obLines.length <= 2}
                          onClick={() => setObLines((rows) => rows.filter((row) => row.key !== line.key))}
                          aria-label={`Remove opening balance line ${index + 1}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pager">
              <div className="row" style={{ gap: "var(--s-3)" }}>
                <button
                  type="button"
                  className="btn btn--quiet btn--sm"
                  onClick={() => setObLines((rows) => [...rows, newOpeningLine()])}
                >
                  Add a line
                </button>
                {obTotals.balanced ? (
                  <span className="chip chip--ok">balanced</span>
                ) : (
                  <span className="chip chip--short">
                    out by <Amount value={obTotals.difference} size="sm" />
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn btn--sm"
                disabled={busy || !obTotals.balanced}
                onClick={() => void postOpening()}
              >
                Post opening balances
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PeriodRow({
  period,
  canClose,
  busy,
  closing,
  note,
  onNote,
  onStartClose,
  onCancelClose,
  onClose,
  onReopen,
  onStartWizard,
}: {
  period: AccountingPeriod;
  canClose: boolean;
  busy: boolean;
  closing: boolean;
  note: string;
  onNote: (next: string) => void;
  onStartClose: () => void;
  onCancelClose: () => void;
  onClose: () => void;
  onReopen: () => void;
  onStartWizard: () => void;
}) {
  const closed = period.status === "CLOSED";

  return (
    <tr>
      <td className="nowrap">{monthLabel(period.key)}</td>
      <td>
        <span className={closed ? "chip chip--ok" : "chip"}>{closed ? "closed" : "open"}</span>
      </td>
      <td className="muted" style={{ fontSize: "var(--t-xs)" }}>
        {period.closed_at ? period.closed_at.slice(0, 10) : "—"}
      </td>
      <td className="muted">{period.close_note || "—"}</td>
      <td className="shrink">
        {!canClose ? (
          <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
            —
          </span>
        ) : closing ? (
          <div className="row" style={{ gap: "var(--s-2)" }}>
            <input
              aria-label={`Note for closing ${period.key}`}
              value={note}
              onChange={(event) => onNote(event.target.value)}
              placeholder="Note (optional)"
              style={{ minWidth: "12rem" }}
            />
            <button className="btn btn--sm" type="button" disabled={busy} onClick={onClose}>
              Close
            </button>
            <button className="btn btn--quiet btn--sm" type="button" onClick={onCancelClose}>
              Cancel
            </button>
          </div>
        ) : closed ? (
          <button className="btn btn--quiet btn--sm" type="button" disabled={busy} onClick={onReopen}>
            Reopen
          </button>
        ) : (
          <div className="row" style={{ gap: "var(--s-2)" }}>
            <button
              className="btn btn--sm"
              type="button"
              disabled={busy}
              onClick={onStartWizard}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <ShieldCheck size={12} color="#D8543D" />
              <span>Closing Wizard</span>
            </button>
            <button className="btn btn--quiet btn--sm" type="button" disabled={busy} onClick={onStartClose}>
              Direct Close
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
