"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { api, ApiError } from "@/lib/api";
import { CATEGORIES, type ExpenseRegister } from "@/lib/types";

/**
 * The expense register (plan §6, Phase 4).
 *
 * The expenses screen answers "what did I spend this month?"; this one answers
 * "what have I spent on transport since March?" — a filtered window over the
 * same rows with the category totals beside them, which is the plan's register
 * brief.
 *
 * One deliberate boundary, kept from Phase 0: the register reads the caller's
 * own expenses (`uid`-scoped, like every read in the expenses module). A
 * business's spend against suppliers lives on the bills screen; this is the
 * personal side of the same ledger, and the two stay separate so nobody's
 * groceries appear on somebody else's screen.
 *
 * The rows and the totals come from one API response, so the two cannot
 * disagree; nothing is summed here.
 */

export default function ExpenseRegisterPage() {
  const { can } = useSession();
  const canWrite = can("expenses.write");

  const [register, setRegister] = useState<ExpenseRegister | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (from) query.set("from", from);
      if (to) query.set("to", to);
      if (category) query.set("category", category);
      const data = await api<{ register: ExpenseRegister }>(`/expenses/register?${query.toString()}`);
      setRegister(data.register);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the register.");
    } finally {
      setLoading(false);
    }
  }, [from, to, category]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Expenses · Register
          </p>
          <nav className="row" style={{ gap: "var(--s-3)" }}>
            <Link className="btn btn--sm btn--quiet" href="/expenses">
              This month
            </Link>
          </nav>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          Your spending over a window, with the category totals beside it. Filters combine; leave the
          dates blank for everything. Business purchases from suppliers live on the purchases screen —
          this register is the personal side of the same books.
        </p>

        {error ? (
          <p className="alert alert--error" role="alert" style={{ marginTop: "var(--s-4)" }}>
            {error}
          </p>
        ) : null}
      </section>

      <section className="section">
        <div className="row-between">
          <div className="row" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="register-from">
                From
              </label>
              <input id="register-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="register-to">
                To
              </label>
              <input id="register-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
            <div className="field" style={{ margin: 0, minWidth: "12rem" }}>
              <label className="label" htmlFor="register-category">
                Category
              </label>
              <select id="register-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All categories</option>
                {CATEGORIES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row" style={{ gap: "var(--s-3)" }}>
            <p className="label" style={{ margin: 0 }}>
              Total
            </p>
            <Amount value={register?.total_bdt ?? "0.00"} size="lg" />
          </div>
        </div>

        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-4)", alignItems: "start" }}>
          <div className="panel panel--flush">
            {loading ? (
              <div className="stack" style={{ padding: "var(--s-5)" }}>
                {[0, 1, 2, 3, 4].map((row) => (
                  <div className="skeleton" key={row} style={{ height: "2rem" }} />
                ))}
              </div>
            ) : !register || register.expenses.length === 0 ? (
              <div className="empty">
                <p style={{ margin: 0 }}>Nothing matches those filters.</p>
              </div>
            ) : (
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Expense register</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Where</th>
                      <th scope="col">Category</th>
                      <th scope="col">Note</th>
                      <th scope="col" className="text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {register.expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="mono nowrap" style={{ fontSize: "var(--t-xs)" }}>
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
                        </td>
                        <td className="muted">{expense.category}</td>
                        <td className="muted">
                          {expense.attachment_url ? (
                            <a
                              className="chip"
                              href={expense.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              title="The scanned document, in object storage"
                            >
                              attachment
                            </a>
                          ) : null}{" "}
                          {expense.note}
                        </td>
                        <td className="text-right nowrap">
                          <Amount value={expense.amount_bdt} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>By category</h2>
            </div>

            {!register || register.category_totals.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Nothing to total yet.
              </p>
            ) : (
              <div className="stack">
                <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
                  {register.category_totals.map((row) => (
                    <div className="row-between" style={{ gap: "var(--s-3)" }} key={row.category}>
                      <dt className="label" style={{ margin: 0 }}>
                        {row.category}{" "}
                        <span className="faint" style={{ fontWeight: 400 }}>
                          ×{row.count}
                        </span>
                      </dt>
                      <dd style={{ margin: 0 }}>
                        <Amount value={row.total_bdt} size="sm" />
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                  Totals come from the same rows as the table, in one read — they cannot drift from it.
                  Each category posts to its mapped expense account, which is what keeps this register
                  and the trial balance agreeing.
                </p>
                {canWrite ? (
                  <Link className="btn btn--sm btn--quiet" href="/expenses">
                    Add or correct an expense
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
