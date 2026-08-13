"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";

import { Amount } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { useSession } from "@/components/session-provider";
import { api, ApiError } from "@/lib/api";
import { monthLabel, useDefaultMonth } from "@/lib/use-dashboard";
import type { JournalEntry, JournalSummary } from "@/lib/types";

/**
 * The journal register — every entry the books contain, newest first.
 *
 * This is the one screen where the ledger's two governing rules are visible at
 * once. A draft has no number (numbers are claimed at post, never at draft) and
 * a posted entry cannot be edited, so the only actions offered on one are
 * "post" for a draft and "void" for anything that has already been issued.
 * Voiding asks for a reason and the API answers with a reversal rather than an
 * edit, which is what keeps a printed report from silently changing.
 *
 * Entries in this list include voids, on purpose. A voided entry and its
 * reversal net to zero in every report, but they stay in the register so that
 * "this was cancelled, and here is why" remains answerable.
 */
const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "POSTED", label: "Posted" },
  { value: "DRAFT", label: "Drafts" },
  { value: "VOID", label: "Voided" },
] as const;

const CHIP: Record<string, string> = {
  POSTED: "chip chip--ok",
  DRAFT: "chip chip--medium",
  VOID: "chip chip--short",
};

export default function JournalsPage() {
  const { can } = useSession();
  const canWrite = can("journals.write");
  const defaultMonth = useDefaultMonth();

  const [month, setMonth] = useState<string | null>(null);
  const activeMonth = month ?? defaultMonth ?? "";
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<JournalSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<JournalEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!activeMonth) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ month: activeMonth });
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      const result = await api<{ entries: JournalSummary[]; total: number }>(
        `/journals?${params.toString()}`,
      );
      setEntries(result.entries);
      setTotal(result.total);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the journal.");
    } finally {
      setLoading(false);
    }
  }, [activeMonth, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  // Collapse the open entry whenever the list underneath it is replaced —
  // leaving a detail panel bound to an entry the filter no longer shows is the
  // kind of stale screen that makes people distrust a ledger.
  useEffect(() => {
    setOpenId(null);
    setDetail(null);
    setVoiding(false);
    setReason("");
  }, [activeMonth]);

  async function open(id: string) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    setVoiding(false);
    setReason("");
    try {
      const { entry } = await api<{ entry: JournalEntry }>(`/journals/${id}`);
      setDetail(entry);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not open that entry.");
      setOpenId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function act(run: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await run();
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            03 &nbsp; Journal · {monthLabel(activeMonth)}
          </p>
          <div className="row" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
            {/* Held back until the month is resolved: a picker stepped from an
                empty key would build a "NaN-NaN" destination. */}
            {activeMonth ? <MonthPicker month={activeMonth} onChange={setMonth} /> : null}
            {canWrite ? (
              <Link className="btn btn--sm" href="/journals/new">
                New entry
              </Link>
            ) : null}
          </div>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          Every amount in this ledger was written by one of these entries. Debits and credits always add up
          to the same total, which is why the trial balance balances without anyone checking it.
        </p>

        {error ? (
          <p className="alert alert--error" role="alert" style={{ marginTop: "var(--s-4)" }}>
            {error}
          </p>
        ) : null}

        <div className="grid grid-3" style={{ marginTop: "var(--s-5)" }}>
          <div className="field">
            <label className="label" htmlFor="journal-status">
              Status
            </label>
            <select
              id="journal-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ gridColumn: "span 2" }}>
            <label className="label" htmlFor="journal-search">
              Description contains
            </label>
            <input
              id="journal-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rent, opening balance, reversal…"
            />
          </div>
        </div>

        <div style={{ marginTop: "var(--s-4)" }}>
        {loading ? (
          <div className="stack">
            {[0, 1, 2, 3, 4].map((row) => (
              <div className="skeleton" key={row} style={{ height: "2.5rem" }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="empty">
            <p style={{ margin: 0 }}>No entries in {monthLabel(activeMonth)} match those filters.</p>
          </div>
        ) : (
          <div className="panel panel--flush">
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Journal entries in {monthLabel(activeMonth)}</caption>
                <thead>
                  <tr>
                    <th scope="col">Entry</th>
                    <th scope="col">Date</th>
                    <th scope="col">Description</th>
                    <th scope="col">Source</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="num">
                      Amount
                    </th>
                    <th scope="col" className="shrink">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <Fragment key={entry.id}>
                      <tr key={entry.id} className={entry.id === openId ? "is-selected" : undefined}>
                        <td className="mono nowrap">{entry.entry_no ?? "—"}</td>
                        <td className="mono faint nowrap" style={{ fontSize: "var(--t-xs)" }}>
                          {entry.date}
                        </td>
                        <td>
                          {entry.description}
                          {entry.status === "VOID" && entry.void_reason ? (
                            <>
                              <br />
                              <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
                                Voided — {entry.void_reason}
                              </span>
                            </>
                          ) : null}
                        </td>
                        <td className="muted nowrap" style={{ fontSize: "var(--t-xs)" }}>
                          {entry.source.toLowerCase()}
                        </td>
                        <td>
                          <span className={CHIP[entry.status] ?? "chip"}>{entry.status.toLowerCase()}</span>
                        </td>
                        <td className="num">
                          <Amount value={entry.total_bdt} />
                        </td>
                        <td className="shrink">
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => void open(entry.id)}
                            aria-expanded={entry.id === openId}
                          >
                            {entry.id === openId ? "Close" : `${entry.line_count} lines`}
                          </button>
                        </td>
                      </tr>

                      {entry.id === openId ? (
                        <tr key={`${entry.id}-detail`}>
                          <td colSpan={7} style={{ background: "var(--surface)" }}>
                            {detailLoading ? (
                              <p className="label" style={{ margin: 0 }}>
                                Loading the lines…
                              </p>
                            ) : detail ? (
                              <EntryDetail
                                entry={detail}
                                canWrite={canWrite}
                                busy={busy}
                                voiding={voiding}
                                reason={reason}
                                onReason={setReason}
                                onStartVoid={() => setVoiding(true)}
                                onCancelVoid={() => {
                                  setVoiding(false);
                                  setReason("");
                                }}
                                onPost={() =>
                                  void act(async () => {
                                    await api(`/journals/${detail.id}/post`, { method: "POST" });
                                    setOpenId(null);
                                    setDetail(null);
                                  })
                                }
                                onDiscard={() =>
                                  void act(async () => {
                                    await api(`/journals/${detail.id}`, { method: "DELETE" });
                                    setOpenId(null);
                                    setDetail(null);
                                  })
                                }
                                onVoid={() =>
                                  void act(async () => {
                                    await api(`/journals/${detail.id}/void`, {
                                      method: "POST",
                                      body: { reason: reason.trim() },
                                    });
                                    setVoiding(false);
                                    setReason("");
                                    // Re-read the entry rather than trusting the
                                    // response: the original's status and its
                                    // reversal link were written by the server.
                                    const { entry: fresh } = await api<{ entry: JournalEntry }>(
                                      `/journals/${detail.id}`,
                                    );
                                    setDetail(fresh);
                                  })
                                }
                              />
                            ) : (
                              <p className="muted" style={{ margin: 0 }}>
                                That entry disappeared.
                              </p>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <p className="label pager-count">
                {entries.length} of {total} entries
              </p>
            </div>
          </div>
        )}
        </div>
      </section>
    </>
  );
}

function EntryDetail({
  entry,
  canWrite,
  busy,
  voiding,
  reason,
  onReason,
  onStartVoid,
  onCancelVoid,
  onPost,
  onDiscard,
  onVoid,
}: {
  entry: JournalEntry;
  canWrite: boolean;
  busy: boolean;
  voiding: boolean;
  reason: string;
  onReason: (next: string) => void;
  onStartVoid: () => void;
  onCancelVoid: () => void;
  onPost: () => void;
  onDiscard: () => void;
  onVoid: () => void;
}) {
  return (
    <div className="stack" style={{ padding: "var(--s-4) 0" }}>
      <div className="ledger-scroll">
        <table className="ledger">
          <caption className="sr-only">Lines of entry {entry.entry_no ?? "draft"}</caption>
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">Memo</th>
              <th scope="col" className="num">
                Debit
              </th>
              <th scope="col" className="num">
                Credit
              </th>
            </tr>
          </thead>
          <tbody>
            {entry.lines.map((line) => (
              <tr key={line.id}>
                <td>
                  <span className="mono">{line.account_code}</span> {line.account_name}
                </td>
                <td className="muted">{line.memo || "—"}</td>
                <td className="num">{line.debit_bdt === "0.00" ? <span className="faint">—</span> : <Amount value={line.debit_bdt} size="sm" />}</td>
                <td className="num">{line.credit_bdt === "0.00" ? <span className="faint">—</span> : <Amount value={line.credit_bdt} size="sm" />}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Total
              </th>
              <td className="num">
                <Amount value={entry.total_bdt} size="sm" />
              </td>
              <td className="num">
                <Amount value={entry.total_bdt} size="sm" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="row-between" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
        <p className="label" style={{ margin: 0 }}>
          {entry.status === "DRAFT"
            ? "Draft — no entry number has been issued yet."
            : entry.status === "POSTED"
              ? `Posted ${entry.posted_at ? entry.posted_at.slice(0, 10) : ""}`
              : `Voided — ${entry.void_reason}`}
          {entry.reverses_entry_id ? " · this is the reversing entry." : ""}
        </p>

        {canWrite ? (
          <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
            {entry.status === "DRAFT" ? (
              <>
                <button className="btn btn--sm" type="button" disabled={busy} onClick={onPost}>
                  Post entry
                </button>
                <button className="btn btn--quiet btn--sm" type="button" disabled={busy} onClick={onDiscard}>
                  Discard draft
                </button>
              </>
            ) : null}

            {entry.status === "POSTED" && !voiding ? (
              <button className="btn btn--quiet btn--sm" type="button" disabled={busy} onClick={onStartVoid}>
                Void with a reversal
              </button>
            ) : null}

            {entry.status === "POSTED" && voiding ? (
              <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
                <input
                  aria-label="Reason for voiding"
                  value={reason}
                  onChange={(event) => onReason(event.target.value)}
                  placeholder="Why is this being voided?"
                  style={{ minWidth: "16rem" }}
                />
                <button
                  className="btn btn--danger btn--sm"
                  type="button"
                  disabled={busy || reason.trim().length < 3}
                  onClick={onVoid}
                >
                  {busy ? "Voiding…" : "Void it"}
                </button>
                <button className="btn btn--quiet btn--sm" type="button" onClick={onCancelVoid}>
                  Cancel
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
