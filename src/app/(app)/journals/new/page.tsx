"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import { addMoney, toCanonical } from "@/lib/money";
import { useSession } from "@/components/session-provider";
import type { Account, JournalEntry } from "@/lib/types";

/**
 * Write a journal entry by hand.
 *
 * This is the one screen where a person produces the raw material of the whole
 * system, so it is also the screen that has to make double-entry legible: the
 * debit and credit totals move as you type, and the form says plainly whether
 * the entry balances before it lets you post it. The API would refuse an
 * unbalanced entry anyway — showing the problem while you are still looking at
 * it is the difference between a rule and a reprimand.
 *
 * Amount arithmetic lives in `lib/money.ts#addMoney`: exact integer paisa, used
 * here for a live total that is never posted, because the API recomputes both
 * totals from the lines it receives.
 *
 * A line carries ONE side. Typing a debit clears the credit on that line, which
 * mirrors what the posting engine will accept rather than letting someone build
 * a line it is going to reject.
 */
const TODAY = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

interface DraftLine {
  key: number;
  account_code: string;
  debit: string;
  credit: string;
  memo: string;
}

let nextKey = 1;
const newLine = (): DraftLine => ({ key: nextKey++, account_code: "", debit: "", credit: "", memo: "" });

export default function NewJournalEntryPage() {
  const router = useRouter();
  const { can } = useSession();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(TODAY());
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newLine(), newLine()]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api<{ accounts: Account[] }>("/coa")
      .then((result) => {
        if (alive) setAccounts(result.accounts);
      })
      .catch(() => {
        if (alive) setError("Could not load the chart of accounts.");
      });
    return () => {
      alive = false;
    };
  }, []);

  /**
   * Live totals.
   *
   * Each side is only counted once it parses, so a half-typed "1." never nudges
   * the total to something wrong — it simply is not in the sum yet, which is
   * also what the person typing it expects.
   */
  const totals = useMemo(() => {
    const debits: string[] = [];
    const credits: string[] = [];
    for (const line of lines) {
      const debit = line.debit.trim() ? toCanonical(line.debit) : null;
      const credit = line.credit.trim() ? toCanonical(line.credit) : null;
      if (debit?.ok) debits.push(debit.value);
      if (credit?.ok) credits.push(credit.value);
    }
    const debitTotal = addMoney(debits);
    const creditTotal = addMoney(credits);
    return {
      debitTotal,
      creditTotal,
      difference: addMoney([debitTotal, `-${creditTotal}`]),
      balanced: debitTotal === creditTotal && debitTotal !== "0.00",
    };
  }, [lines]);

  function setLine(key: number, patch: Partial<DraftLine>) {
    setLines((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  /**
   * The lines as the API should receive them.
   *
   * Completely blank rows are dropped — a form that starts with two empty rows
   * would otherwise always have one to spare. A row that was started and left
   * incomplete is NOT dropped: it becomes an error naming the row, because
   * silently discarding something someone typed is how a figure goes missing.
   */
  function collect(): { ok: true; lines: Array<Record<string, string>> } | { ok: false; problem: string } {
    const used = lines.filter(
      (line) => line.account_code || line.debit.trim() || line.credit.trim() || line.memo.trim(),
    );

    if (used.length < 2) {
      return { ok: false, problem: "A journal entry needs at least two lines." };
    }

    const payload: Array<Record<string, string>> = [];
    for (const [index, line] of used.entries()) {
      if (!line.account_code) {
        return { ok: false, problem: `Line ${index + 1} needs an account.` };
      }

      const debit = line.debit.trim() ? toCanonical(line.debit) : null;
      const credit = line.credit.trim() ? toCanonical(line.credit) : null;

      if (debit && !debit.ok) return { ok: false, problem: `Line ${index + 1} debit: ${debit.reason}` };
      if (credit && !credit.ok) return { ok: false, problem: `Line ${index + 1} credit: ${credit.reason}` };

      const debitValue = debit?.ok ? debit.value : "0.00";
      const creditValue = credit?.ok ? credit.value : "0.00";

      if (debitValue === "0.00" && creditValue === "0.00") {
        return { ok: false, problem: `Line ${index + 1} has no amount.` };
      }

      payload.push({
        account_code: line.account_code,
        // Only the side in use is sent. The API stores the other as "0.00" and
        // refuses a line carrying both, so there is nothing to gain by sending it.
        ...(debitValue !== "0.00" ? { debit_bdt: debitValue } : {}),
        ...(creditValue !== "0.00" ? { credit_bdt: creditValue } : {}),
        ...(line.memo.trim() ? { memo: line.memo.trim() } : {}),
      });
    }

    return { ok: true, lines: payload };
  }

  async function submit(asDraft: boolean) {
    setError(null);

    if (description.trim().length < 2) {
      setError("Describe what this entry is for.");
      return;
    }

    const collected = collect();
    if (!collected.ok) {
      setError(collected.problem);
      return;
    }

    if (!asDraft && !totals.balanced) {
      setError(
        `Debits ${totals.debitTotal} and credits ${totals.creditTotal} have to be the same before this can post.`,
      );
      return;
    }

    setBusy(true);
    try {
      const { entry } = await api<{ entry: JournalEntry }>(`/journals${asDraft ? "?draft=true" : ""}`, {
        method: "POST",
        body: { date, description: description.trim(), lines: collected.lines },
      });
      toast.success(asDraft ? "Journal draft saved" : `Posted entry ${entry.entry_no ?? ""}`);
      router.push(`/journals?posted=${entry.entry_no ?? "draft"}`);
    } catch (caught) {
      const msg = caught instanceof ApiError ? caught.message : "Could not save that entry.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!can("journals.write")) {
    return (
      <section className="section">
        <div className="empty">
          <p style={{ margin: 0 }}>Your role can read the journal but not write to it.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            03 &nbsp; New journal entry
          </p>
          <Link className="btn btn--quiet btn--sm" href="/journals">
            Back to the journal
          </Link>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          Debit one account and credit another by the same amount. Nothing is saved as a real entry until it
          balances — a draft may be saved earlier, and it will not carry an entry number until it is posted.
        </p>

        {error ? (
          <p className="alert alert--error" role="alert" style={{ marginTop: "var(--s-4)" }}>
            {error}
          </p>
        ) : null}

        <div className="grid grid-2" style={{ marginTop: "var(--s-5)" }}>
          <div className="field">
            <label className="label" htmlFor="entry-date">
              Date
            </label>
            <input
              id="entry-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
              The month this date falls in must have an open period.
            </span>
          </div>

          <div className="field">
            <label className="label" htmlFor="entry-description">
              Description
            </label>
            <input
              id="entry-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Cash sales for the day"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="panel panel--flush">
          <div className="ledger-scroll">
            <table className="ledger">
              <caption className="sr-only">Lines of this journal entry</caption>
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
                  <th scope="col" className="shrink">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.key}>
                    <td style={{ minWidth: "16rem" }}>
                      <select
                        aria-label={`Account for line ${index + 1}`}
                        value={line.account_code}
                        onChange={(event) => setLine(line.key, { account_code: event.target.value })}
                      >
                        <option value="">Choose an account…</option>
                        {accounts.map((account) => (
                          <option key={account.code} value={account.code}>
                            {account.code} — {account.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        aria-label={`Memo for line ${index + 1}`}
                        value={line.memo}
                        onChange={(event) => setLine(line.key, { memo: event.target.value })}
                        placeholder="optional"
                      />
                    </td>
                    <td className="num">
                      <input
                        aria-label={`Debit for line ${index + 1}`}
                        inputMode="decimal"
                        value={line.debit}
                        onChange={(event) =>
                          // Typing on one side clears the other, so a line can
                          // never carry both — the state the engine rejects.
                          setLine(line.key, { debit: event.target.value, credit: "" })
                        }
                        placeholder="0.00"
                        style={{ textAlign: "right" }}
                      />
                    </td>
                    <td className="num">
                      <input
                        aria-label={`Credit for line ${index + 1}`}
                        inputMode="decimal"
                        value={line.credit}
                        onChange={(event) => setLine(line.key, { debit: "", credit: event.target.value })}
                        placeholder="0.00"
                        style={{ textAlign: "right" }}
                      />
                    </td>
                    <td className="shrink">
                      <button
                        type="button"
                        className="btn btn--quiet btn--sm"
                        disabled={lines.length <= 2}
                        onClick={() => setLines((rows) => rows.filter((row) => row.key !== line.key))}
                        aria-label={`Remove line ${index + 1}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>
                    Total
                  </th>
                  <td className="num">
                    <Amount value={totals.debitTotal} size="sm" />
                  </td>
                  <td className="num">
                    <Amount value={totals.creditTotal} size="sm" />
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="pager">
            <div className="row" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={() => setLines((rows) => [...rows, newLine()])}
              >
                Add a line
              </button>

              {/* The balance readout is the whole point of this form, so it
                  states the difference rather than only a colour. */}
              {totals.balanced ? (
                <span className="chip chip--ok" role="status">
                  balanced
                </span>
              ) : (
                <span className="chip chip--short" role="status">
                  out by <Amount value={totals.difference} size="sm" />
                </span>
              )}
            </div>

            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                disabled={busy}
                onClick={() => void submit(true)}
              >
                Save as draft
              </button>
              <button
                type="button"
                className="btn btn--sm"
                disabled={busy || !totals.balanced}
                onClick={() => void submit(false)}
              >
                {busy ? "Working…" : "Post entry"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
