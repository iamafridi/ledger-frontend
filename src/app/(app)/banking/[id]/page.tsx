"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { api, ApiError } from "@/lib/api";
import {
  STATEMENT_LINE_STATUS_LABEL,
  type Account,
  type BankAccount,
  type BookMovementRow,
  type ReconciliationSummary,
  type ReconciliationWorkspace,
  type StatementImportSummary,
  type StatementLineWithSuggestions,
} from "@/lib/types";

/**
 * The reconciliation workspace — the phase's exit gate, on screen.
 *
 * The walk is printed in full rather than reduced to "difference: 1,200". A gap
 * nobody can decompose is a gap nobody can close, so the screen shows the book
 * closing, the items in transit, the bank items not yet booked, anything carried
 * in from an earlier period, and then the one figure that must reach zero: what
 * the matching itself is responsible for.
 *
 * Every decision here is reversible. A match that turns out to be wrong is
 * unmatched; an ignored line is picked back up. Only a correction is sticky, and
 * only because it has posted an entry — void that in the journal and the line
 * returns to the list.
 */
export default function ReconciliationPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [workspace, setWorkspace] = useState<ReconciliationWorkspace | null>(null);
  const [imports, setImports] = useState<StatementImportSummary[]>([]);
  const [chart, setChart] = useState<Account[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filename, setFilename] = useState("");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (from) query.set("from", from);
      if (to) query.set("to", to);
      const suffix = query.toString() === "" ? "" : `?${query.toString()}`;

      const [accountData, workspaceData, importData] = await Promise.all([
        api<{ account: BankAccount }>(`/banking/accounts/${id}`),
        api<ReconciliationWorkspace>(`/banking/accounts/${id}/reconciliation${suffix}`),
        api<{ imports: StatementImportSummary[] }>(`/banking/accounts/${id}/statements`),
      ]);
      setAccount(accountData.account);
      setWorkspace(workspaceData);
      setImports(importData.imports);
      // Seed the window from the statement the first time only, so a user who has
      // narrowed the period is not overruled by a reload.
      if (!from && !to && workspaceData.summary.from) {
        setFrom(workspaceData.summary.from);
        setTo(workspaceData.summary.to);
      }
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load this account.");
    } finally {
      setLoading(false);
    }
  }, [id, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<{ accounts: Account[] }>("/coa")
      .then((data) => setChart(data.accounts))
      .catch(() => setChart([]));
  }, []);

  async function run(work: () => Promise<string | null | void>, done: string): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const remark = await work();
      setNotice(typeof remark === "string" ? remark : done);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  const counters = useMemo(
    () => chart.filter((item) => item.type === "EXPENSE" || item.type === "REVENUE" || item.type === "LIABILITY"),
    [chart],
  );

  const summary = workspace?.summary ?? null;

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 24rem" }}>
            06 &nbsp; Banking · {account ? account.name : "Reconciliation"}
          </p>
          <nav className="row" style={{ gap: "var(--s-3)" }}>
            <Link className="btn btn--sm btn--quiet" href="/banking">
              All accounts
            </Link>
            {account ? (
              <Link className="btn btn--sm btn--quiet" href={`/reports/general-ledger?account_code=${account.account_code}`}>
                Ledger {account.account_code}
              </Link>
            ) : null}
          </nav>
        </div>

        {account ? (
          <p className="muted" style={{ marginTop: "var(--s-3)" }}>
            <span className="mono">{account.account_code}</span> {account.account_name} · book balance{" "}
            <Amount value={account.book_balance_bdt} size="sm" />
            {account.bank_name ? ` · ${account.bank_name}` : ""}
            {account.account_number ? ` ${account.account_number}` : ""}
          </p>
        ) : null}

        {error ? (
          <p className="alert alert--error" role="alert" style={{ marginTop: "var(--s-4)" }}>
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="note" style={{ marginTop: "var(--s-4)" }} role="status">
            {notice}
          </p>
        ) : null}
      </section>

      {/* ── Import ────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="row-between">
          <p className="label" style={{ margin: 0 }}>
            Import a statement
          </p>
          <div className="row" style={{ gap: "var(--s-3)" }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="recon-from">
                From
              </label>
              <input id="recon-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="recon-to">
                To
              </label>
              <input id="recon-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: "var(--s-3)" }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="statement-file">
              Statement CSV — a date column, a description, and an amount (or a debit/credit pair)
            </label>
            <input
              id="statement-file"
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setFilename(file.name);
                setCsv(await file.text());
              }}
            />
          </div>

          <p className="note" style={{ margin: "var(--s-2) 0 0" }}>
            {csv === ""
              ? "Nothing chosen yet. The file is read in the browser and parsed by the API — no upload directory, no copy left behind."
              : `${filename || "statement.csv"} — ${csv.split("\n").filter(Boolean).length} rows`}
          </p>

          <div className="row" style={{ justifyContent: "flex-end", marginTop: "var(--s-3)" }}>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy || csv === ""}
              onClick={() =>
                run(async () => {
                  const result = await api<{
                    import: StatementImportSummary;
                    duplicates: number;
                    warnings: string[];
                  }>(`/banking/accounts/${id}/statements`, {
                    method: "POST",
                    body: { filename, csv },
                  });
                  setCsv("");
                  setFilename("");
                  const parts = [
                    `${result.import.imported_count} lines imported`,
                    result.duplicates > 0 ? `${result.duplicates} already seen and skipped` : null,
                    ...result.warnings,
                  ].filter(Boolean);
                  return parts.join(" · ");
                }, "Statement imported.")
              }
            >
              Import
            </button>
          </div>
        </div>

        {imports.length > 0 ? (
          <details style={{ marginTop: "var(--s-3)" }}>
            <summary className="label" style={{ cursor: "pointer" }}>
              Imported statements ({imports.length})
            </summary>
            <div className="panel panel--flush" style={{ marginTop: "var(--s-3)" }}>
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Statement imports</caption>
                  <thead>
                    <tr>
                      <th scope="col">File</th>
                      <th scope="col">Period</th>
                      <th scope="col" className="text-right">
                        Rows
                      </th>
                      <th scope="col" className="text-right">
                        Skipped
                      </th>
                      <th scope="col" className="text-right">
                        Open
                      </th>
                      <th scope="col">Imported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((batch) => (
                      <tr key={batch.id}>
                        <td>{batch.filename || "statement.csv"}</td>
                        <td className="muted nowrap">
                          {batch.period_from || "—"} → {batch.period_to || "—"}
                        </td>
                        <td className="text-right nowrap">{batch.line_count}</td>
                        <td className="text-right nowrap">
                          {batch.duplicate_count === 0 ? <span className="faint">—</span> : batch.duplicate_count}
                        </td>
                        <td className="text-right nowrap">
                          {batch.open_count === 0 ? <span className="faint">—</span> : batch.open_count}
                        </td>
                        <td className="muted nowrap">{batch.imported_at.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        ) : null}
      </section>

      {/* ── The walk ──────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="row-between">
          <p className="label" style={{ margin: 0 }}>
            Book vs bank {summary ? `${summary.from} → ${summary.to}` : ""}
          </p>
          {summary ? (
            <span className={summary.reconciled ? "note" : "alert alert--error"} style={{ margin: 0 }}>
              {summary.reconciled
                ? summary.outstanding_book_count > 0
                  ? `Reconciled · ${summary.outstanding_book_count} item(s) still in transit`
                  : "Reconciled — nothing unexplained"
                : `${summary.unrecorded_bank_count} statement line(s) undecided · ${summary.outstanding_book_count} in transit · ${summary.unexplained_bdt} unexplained`}
            </span>
          ) : null}
        </div>

        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-3)", alignItems: "start" }}>
          <div className="panel">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>The walk</h2>
            </div>
            {!summary ? (
              <p className="muted" style={{ margin: 0 }}>
                {loading ? "Loading…" : "Nothing to reconcile yet."}
              </p>
            ) : (
              <div className="stack">
                <WalkRow label="Book closing balance" value={summary.book_closing_bdt} strong />
                <WalkRow label="Less: in the books, not on the statement" value={summary.outstanding_book_bdt} note={`${summary.outstanding_book_count} item(s)`} />
                <WalkRow label="Plus: on the statement, not in the books" value={summary.unrecorded_bank_bdt} note={`${summary.unrecorded_bank_count} item(s)`} />
                <WalkRow label="Less: carried in from before this period" value={summary.opening_difference_bdt} note={summary.opening_basis === "statement" ? "bank opening read from the file" : "no printed balance — assumed equal to the books"} />
                <div className="row-between" style={{ borderTop: "1px solid var(--line)", paddingTop: "var(--s-2)" }}>
                  <span className="label" style={{ margin: 0 }}>
                    Unexplained
                  </span>
                  <Amount value={summary.unexplained_bdt} size="lg" />
                </div>
                <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                  The unexplained figure is zero exactly when every matched pair agrees on its amount. It is not a
                  rounding allowance: a match between two different amounts shows up here.
                </p>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Both sides</h2>
            </div>
            {!summary ? (
              <p className="muted" style={{ margin: 0 }}>
                {loading ? "Loading…" : "Nothing to reconcile yet."}
              </p>
            ) : (
              <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
                <WalkRow label="Book opening" value={summary.book_opening_bdt} />
                <WalkRow label="Book movement" value={summary.book_movement_bdt} />
                <WalkRow label="Statement movement" value={summary.statement_movement_bdt} />
                <WalkRow label="Bank opening" value={summary.bank_opening_bdt} />
                <WalkRow label="Bank closing" value={summary.bank_closing_bdt} />
                <WalkRow label="Raw difference" value={summary.difference_bdt} />
                <WalkRow label="Matched on the books" value={summary.matched_book_bdt} note={`${summary.matched_count} pair(s)`} />
                <WalkRow label="Matched on the statement" value={summary.matched_statement_bdt} />
                <WalkRow label="Posted as corrections" value={summary.corrected_bdt} note={`${summary.corrected_count} line(s)`} />
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* ── Statement lines ───────────────────────────────────────────────── */}
      <section className="section">
        <p className="label" style={{ margin: 0 }}>
          Statement lines
        </p>
        <div className="panel panel--flush" style={{ marginTop: "var(--s-3)" }}>
          {!workspace || workspace.statement_lines.length === 0 ? (
            <div className="empty">
              <p style={{ margin: 0 }}>No statement lines in this window. Import a statement above.</p>
            </div>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Statement lines</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Description</th>
                    <th scope="col">Reference</th>
                    <th scope="col" className="text-right">
                      Out
                    </th>
                    <th scope="col" className="text-right">
                      In
                    </th>
                    <th scope="col" className="text-right">
                      Balance
                    </th>
                    <th scope="col">State</th>
                    <th scope="col"> </th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.statement_lines.map((line) => (
                    <StatementRow
                      key={line.id}
                      line={line}
                      counters={counters}
                      busy={busy}
                      onMatch={(journalLineId) =>
                        run(async () => {
                          const result = await api<{ summary: ReconciliationSummary }>(
                            `/banking/statement-lines/${line.id}/match`,
                            { method: "POST", body: { journal_line_id: journalLineId } },
                          );
                          return result.summary.unexplained_bdt === "0.00"
                            ? "Matched — nothing unexplained."
                            : `Matched, but the two amounts differ, so ${result.summary.unexplained_bdt} is now unexplained.`;
                        }, "Matched.")
                      }
                      onUnmatch={() =>
                        run(async () => {
                          await api(`/banking/statement-lines/${line.id}/unmatch`, { method: "POST", body: {} });
                        }, "Line set back to undecided.")
                      }
                      onIgnore={(note) =>
                        run(async () => {
                          await api(`/banking/statement-lines/${line.id}/ignore`, {
                            method: "POST",
                            body: { note },
                          });
                        }, "Line ignored.")
                      }
                      onCorrect={(counterAccountCode, memo) =>
                        run(async () => {
                          await api(`/banking/statement-lines/${line.id}/correct`, {
                            method: "POST",
                            body: { counter_account_code: counterAccountCode, memo },
                          });
                        }, "Correction posted.")
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── The book side ─────────────────────────────────────────────────── */}
      <section className="section">
        <p className="label" style={{ margin: 0 }}>
          What the books show
        </p>
        <div className="panel panel--flush" style={{ marginTop: "var(--s-3)" }}>
          {!workspace || workspace.book_movements.length === 0 ? (
            <div className="empty">
              <p style={{ margin: 0 }}>Nothing posted to this account in the window.</p>
            </div>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Book movements</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Entry</th>
                    <th scope="col">Detail</th>
                    <th scope="col" className="text-right">
                      Out
                    </th>
                    <th scope="col" className="text-right">
                      In
                    </th>
                    <th scope="col" className="text-right">
                      Balance
                    </th>
                    <th scope="col">On the statement</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.book_movements.map((movement) => (
                    <BookRow key={movement.line_id} movement={movement} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* ── Rows ────────────────────────────────────────────────────────────────── */

function WalkRow({
  label,
  value,
  note,
  strong,
}: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div className="row-between" style={{ gap: "var(--s-3)" }}>
      <span className="label" style={{ margin: 0 }}>
        {label}
        {note ? (
          <span className="faint" style={{ marginLeft: "var(--s-2)", fontWeight: 400 }}>
            {note}
          </span>
        ) : null}
      </span>
      <span style={{ textAlign: "right" }}>
        <Amount value={value} size={strong ? "lg" : "sm"} />
      </span>
    </div>
  );
}

function StatementRow({
  line,
  counters,
  busy,
  onMatch,
  onUnmatch,
  onIgnore,
  onCorrect,
}: {
  line: StatementLineWithSuggestions;
  counters: Account[];
  busy: boolean;
  onMatch: (journalLineId: string) => void;
  onUnmatch: () => void;
  onIgnore: (note: string) => void;
  onCorrect: (counterAccountCode: string, memo: string) => void;
}) {
  const [note, setNote] = useState("");
  const [counter, setCounter] = useState("");
  const [memo, setMemo] = useState("");

  return (
    <>
      <tr>
        <td className="muted nowrap">{line.date}</td>
        <td>{line.description || <span className="faint">—</span>}</td>
        <td className="muted nowrap">{line.reference || <span className="faint">—</span>}</td>
        <td className="text-right nowrap">
          {line.direction === "OUT" ? <Amount value={line.amount_bdt} size="sm" /> : <span className="faint">—</span>}
        </td>
        <td className="text-right nowrap">
          {line.direction === "IN" ? <Amount value={line.amount_bdt} size="sm" /> : <span className="faint">—</span>}
        </td>
        <td className="text-right nowrap">
          {line.balance_bdt === "" ? <span className="faint">—</span> : <Amount value={line.balance_bdt} size="sm" />}
        </td>
        <td className="nowrap">
          {STATEMENT_LINE_STATUS_LABEL[line.status]}
          {line.status === "MATCHED" && line.matched_entry_no ? (
            <span className="mono faint" style={{ marginLeft: "var(--s-2)" }}>
              {line.matched_entry_no}
            </span>
          ) : null}
          {line.status === "CORRECTED" && line.counter_account_code ? (
            <span className="mono faint" style={{ marginLeft: "var(--s-2)" }}>
              {line.counter_account_code}
            </span>
          ) : null}
          {line.note ? (
            <span className="faint" style={{ marginLeft: "var(--s-2)" }}>
              {line.note}
            </span>
          ) : null}
        </td>
        <td className="nowrap">
          {line.status === "MATCHED" || line.status === "IGNORED" ? (
            <button type="button" className="btn btn--sm btn--quiet" disabled={busy} onClick={onUnmatch}>
              Undo
            </button>
          ) : null}
        </td>
      </tr>
      {line.status === "UNMATCHED" ? (
        <tr>
          <td colSpan={8} style={{ background: "var(--surface-2, transparent)" }}>
            <div className="stack" style={{ gap: "var(--s-3)" }}>
              {line.suggestions.length === 0 ? (
                <p className="note" style={{ margin: 0 }}>
                  Nothing in the books looks like this within a week either way. Post a correction, or ignore it.
                </p>
              ) : (
                <div className="ledger-scroll">
                  <table className="ledger">
                    <caption className="sr-only">Suggested matches</caption>
                    <thead>
                      <tr>
                        <th scope="col">Entry</th>
                        <th scope="col">Date</th>
                        <th scope="col">Detail</th>
                        <th scope="col" className="text-right">
                          Amount
                        </th>
                        <th scope="col">Why</th>
                        <th scope="col"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {line.suggestions.map((suggestion) => (
                        <tr key={suggestion.journal_line_id}>
                          <td className="mono nowrap">{suggestion.entry_no ?? "draft"}</td>
                          <td className="muted nowrap">{suggestion.date}</td>
                          <td>{suggestion.description}</td>
                          <td className="text-right nowrap">
                            <Amount value={suggestion.amount_bdt} size="sm" />
                            {!suggestion.amount_matches ? (
                              <span className="faint" style={{ marginLeft: "var(--s-2)" }}>
                                differs
                              </span>
                            ) : null}
                          </td>
                          <td className="faint">{suggestion.reasons.join(" · ")}</td>
                          <td className="nowrap">
                            <button
                              type="button"
                              className="btn btn--sm"
                              disabled={busy}
                              onClick={() => onMatch(suggestion.journal_line_id)}
                            >
                              Match
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="row" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
                <div className="field" style={{ margin: 0, flex: "1 1 14rem" }}>
                  <label className="label" htmlFor={`counter-${line.id}`}>
                    Post it as a correction to
                  </label>
                  <select id={`counter-${line.id}`} value={counter} onChange={(event) => setCounter(event.target.value)}>
                    <option value="">Choose an account…</option>
                    {counters.map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} · {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ margin: 0, flex: "1 1 14rem" }}>
                  <label className="label" htmlFor={`memo-${line.id}`}>
                    Correction memo
                  </label>
                  <input
                    id={`memo-${line.id}`}
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    placeholder="Bank charge, interest, fee…"
                  />
                </div>
                <div className="row" style={{ gap: "var(--s-2)", alignItems: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    disabled={busy || counter === ""}
                    onClick={() => onCorrect(counter, memo.trim())}
                  >
                    Post correction
                  </button>
                </div>
              </div>

              <div className="row" style={{ gap: "var(--s-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div className="field" style={{ margin: 0, flex: "1 1 18rem" }}>
                  <label className="label" htmlFor={`note-${line.id}`}>
                    Or ignore it — say why
                  </label>
                  <input
                    id={`note-${line.id}`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Already recorded elsewhere, informational line…"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn--quiet"
                  disabled={busy || note.trim().length < 3}
                  onClick={() => onIgnore(note.trim())}
                >
                  Ignore
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function BookRow({ movement }: { movement: BookMovementRow }) {
  return (
    <tr>
      <td className="muted nowrap">{movement.date}</td>
      <td className="mono nowrap">{movement.entry_no ?? "—"}</td>
      <td>{movement.description}</td>
      <td className="text-right nowrap">
        {movement.direction === "OUT" ? <Amount value={movement.amount_bdt} size="sm" /> : <span className="faint">—</span>}
      </td>
      <td className="text-right nowrap">
        {movement.direction === "IN" ? <Amount value={movement.amount_bdt} size="sm" /> : <span className="faint">—</span>}
      </td>
      <td className="text-right nowrap">
        <Amount value={movement.balance_bdt} size="sm" />
      </td>
      <td className="muted nowrap">
        {movement.matched ? "Matched" : <span className="faint">In transit</span>}
      </td>
    </tr>
  );
}
