"use client";

import { useCallback, useEffect, useState } from "react";

import { Amount } from "@/components/money";
import { ExpenseForm, emptyDraft, type ExpenseDraft } from "@/components/expense-form";
import { Modal } from "@/components/ui/modal";
import { LedgerSync } from "@/components/ledger-sync";
import { MonthPicker } from "@/components/month-picker";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import { monthLabel, useDefaultMonth } from "@/lib/use-dashboard";
import type { Expense } from "@/lib/types";

/**
 * Rows per page.
 *
 * The published cases carry 41–61 expenses across two months, so a real month
 * lands somewhere around twenty-five. Twenty keeps a page inside one screen on a
 * laptop without making the paging feel constant.
 */
const PAGE_SIZE = 20;

export default function ExpensesPage() {
  const defaultMonth = useDefaultMonth();
  const [month, setMonth] = useState<string | null>(null);
  const activeMonth = month ?? defaultMonth ?? "";
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft(""));
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { expenses: rows } = await api<{ expenses: Expense[] }>(`/expenses?month=${activeMonth}`);
      setExpenses(rows);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load your expenses.");
    } finally {
      setLoading(false);
    }
  }, [activeMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  // A month change must reset the page, or switching from a month with four
  // pages to one with a single page lands on an empty page 4.
  useEffect(() => {
    setPage(1);
  }, [activeMonth]);

  const pageCount = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  // Deleting the last row on the final page would otherwise strand the view on a
  // page that no longer exists, so the current page is clamped on every render.
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = expenses.slice(start, start + PAGE_SIZE);

  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await api(`/expenses/${pendingDelete.id}`, { method: "DELETE" });
      setExpenses((current) => current.filter((expense) => expense.id !== pendingDelete.id));
      toast.success("Expense Deleted", `Removed expense record for ${pendingDelete.shop}`);
      setPendingDelete(null);
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : "Could not delete that expense.";
      setError(message);
      toast.error("Deletion Failed", message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Expenses · {monthLabel(activeMonth)}
          </p>
          <div className="row" style={{ gap: "var(--s-3)" }}>
            <MonthPicker month={activeMonth} onChange={setMonth} />
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => {
                setDraft(emptyDraft(`${activeMonth}-01`));
                setAdding((open) => !open);
              }}
            >
              {adding ? "Close" : "Add expense"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="alert alert--error" role="alert" style={{ marginTop: "var(--s-3)" }}>
            {error}
          </p>
        ) : null}

        {/* Reports and repairs any expense that never reached the general
            ledger, so the dashboard and the books cannot disagree unnoticed. */}
        <LedgerSync onRepaired={() => void load()} />

        {adding ? (
          <div className="panel" style={{ marginTop: "var(--s-4)" }}>
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>New expense</h2>
            </div>
            <ExpenseForm
              draft={draft}
              onDraftChange={setDraft}
              source="manual"
              onSaved={(expense) => {
                setExpenses([expense, ...expenses]);
                setAdding(false);
                setDraft(emptyDraft(`${activeMonth}-01`));
                toast.success(`Added expense: ${expense.shop} (৳${expense.amount_bdt})`);
              }}
            />
          </div>
        ) : null}

        <div style={{ marginTop: "var(--s-4)" }}>
        {loading ? (
          <div className="stack">
            {[0, 1, 2, 3].map((row) => (
              <div className="skeleton" key={row} style={{ height: "2.5rem" }} />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty">
            <p style={{ margin: 0 }}>No expenses recorded for {monthLabel(activeMonth)}.</p>
          </div>
        ) : (
          <div className="panel panel--flush">
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Expenses recorded in {monthLabel(activeMonth)}</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Shop</th>
                    <th scope="col">Category</th>
                    <th scope="col" className="num">
                      Amount
                    </th>
                    <th scope="col" className="shrink">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((expense) => (
                    <tr key={expense.id}>
                      <td className="mono faint nowrap" style={{ fontSize: "var(--t-xs)" }}>
                        {expense.date}
                      </td>
                      <td>
                        {expense.shop}
                        {expense.source === "receipt" ? (
                          <span className="chip" style={{ marginLeft: "var(--s-2)" }}>
                            receipt
                          </span>
                        ) : null}
                        {expense.journal_entry_id ? null : (
                          <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                            not in the books
                          </span>
                        )}
                        {expense.note ? (
                          <>
                            <br />
                            <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
                              {expense.note}
                            </span>
                          </>
                        ) : null}
                      </td>
                      <td className="muted">{expense.category}</td>
                      <td className="num">
                        <Amount value={expense.amount_bdt} />
                      </td>
                      <td className="shrink">
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => setPendingDelete(expense)}
                          aria-label={`Delete expense for ${expense.shop} on ${expense.date}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 ? (
              <nav className="pager" aria-label="Expense pages">
                <p className="label pager-count">
                  {start + 1}&ndash;{Math.min(start + PAGE_SIZE, expenses.length)} of{" "}
                  {expenses.length}
                </p>

                <div className="row" style={{ gap: "var(--s-2)" }}>
                  <button
                    type="button"
                    className="btn btn--quiet btn--sm"
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage === 1}
                  >
                    Previous
                  </button>

                  {/* Numbered pages, but only while the count stays legible.
                      Past that, the position readout above carries the meaning
                      and a page-number strip would just wrap onto three lines. */}
                  {pageCount <= 7 ? (
                    <div className="row" style={{ gap: "var(--s-1)" }}>
                      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                        <button
                          type="button"
                          key={number}
                          className={`btn btn--sm pager-page ${number === safePage ? "" : "btn--quiet"}`}
                          onClick={() => setPage(number)}
                          aria-current={number === safePage ? "page" : undefined}
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="label mono">
                      {safePage} / {pageCount}
                    </span>
                  )}

                  <button
                    type="button"
                    className="btn btn--quiet btn--sm"
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage === pageCount}
                  >
                    Next
                  </button>
                </div>
              </nav>
            ) : null}
          </div>
        )}
        </div>
      </section>

      {/* Confirmation Dialog for Safe Expense Deletion (AUD-UX-01) */}
      <Modal
        isOpen={pendingDelete !== null}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        eyebrow="Confirm Deletion"
        title="Delete Expense Record?"
        description="This action removes the expense entry from your operational ledger. This action cannot be undone."
        maxWidth="28rem"
      >
        {pendingDelete && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
            <div
              style={{
                padding: "var(--s-3)",
                backgroundColor: "var(--surface-2)",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "var(--t-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Merchant / Vendor:</span>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{pendingDelete.shop}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Date:</span>
                <span className="mono">{pendingDelete.date}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ink-muted)" }}>Category:</span>
                <span>{pendingDelete.category}</span>
              </div>
              {pendingDelete.note ? (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Note:</span>
                  <span style={{ fontStyle: "italic", color: "var(--ink-muted)" }}>{pendingDelete.note}</span>
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "6px",
                  borderTop: "1px solid var(--line)",
                  fontWeight: 700,
                }}
              >
                <span>Amount:</span>
                <span className="mono" style={{ color: "#D8543D" }}>
                  <Amount value={pendingDelete.amount_bdt} />
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--s-2)",
                paddingTop: "var(--s-3)",
                borderTop: "1px solid var(--line)",
              }}
            >
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => void confirmDelete()}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
