"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { api, ApiError } from "@/lib/api";
import { addMoney, toCanonical } from "@/lib/money";
import type { DocumentWarning, OutstandingInvoice, Party, Receipt } from "@/lib/types";

/**
 * Receipts — money arriving (plan §6, Phase 3).
 *
 * A receipt is money *from a customer*, not a payment *of an invoice*, and this
 * screen is built that way: you enter the amount that arrived, and the invoices
 * it settles are a second decision.
 *
 * **Oldest-first is the default**, and the picker shows exactly what that
 * default would do before you accept it: each open invoice appears with the
 * amount that would be applied to it, oldest at the top. Switching to manual
 * allocation is one click, because "take this specific invoice out of the
 * payment" is a real thing to want — but the default is the one a credit
 * controller would have chosen anyway.
 *
 * Overpayment is not an error here. Whatever no invoice claims becomes the
 * customer's advance, and the screen says so in as many words before you save.
 */
interface AllocationDraft {
  invoice_id: string;
  amount_bdt: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

export default function SalesReceiptsPage() {
  const { can } = useSession();
  const canWrite = can("sales.write");

  const [parties, setParties] = useState<Party[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [open, setOpen] = useState<OutstandingInvoice[]>([]);

  const [partyId, setPartyId] = useState("");
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<"CASH" | "BANK">("BANK");
  const [accountCode, setAccountCode] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manual, setManual] = useState<AllocationDraft[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<DocumentWarning[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [partyRows, receiptRows] = await Promise.all([
        api<{ parties: Party[] }>("/parties"),
        api<{ receipts: Receipt[] }>("/sales/receipts?limit=50"),
      ]);
      setParties(partyRows.parties.filter((party) => party.kind !== "SUPPLIER"));
      setReceipts(receiptRows.receipts);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load receipts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The customer's open invoices, oldest first — the same order the API's
  // oldest-first default will apply them in.
  useEffect(() => {
    if (!partyId) {
      setOpen([]);
      return;
    }
    let cancelled = false;
    api<{ invoices: OutstandingInvoice[] }>(`/sales/outstanding?party_id=${partyId}`)
      .then((data) => {
        if (!cancelled) setOpen(data.invoices);
      })
      .catch(() => {
        if (!cancelled) setOpen([]);
      });
    return () => {
      cancelled = true;
    };
  }, [partyId]);

  const receiptAmount = toCanonical(amount);

  /** What oldest-first would do with this amount. Derived, not stored: the
   *  amount changes and the plan changes with it. */
  const autoPlan = useMemo(() => {
    if (!receiptAmount.ok) return [];
    let remaining = receiptAmount.value;
    const plan: { invoice: OutstandingInvoice; amount_bdt: string }[] = [];

    for (const invoice of open) {
      if (Number(remaining) <= 0) break;
      const take = Number(invoice.outstanding_bdt) <= Number(remaining) ? invoice.outstanding_bdt : remaining;
      plan.push({ invoice, amount_bdt: take });
      remaining = addMoney([remaining, `-${take}`]);
    }
    return plan;
  }, [open, receiptAmount]);

  const plan = mode === "auto" ? autoPlan : manual.map((row) => ({
    invoice: open.find((invoice) => invoice.id === row.invoice_id),
    amount_bdt: toCanonical(row.amount_bdt).ok ? (toCanonical(row.amount_bdt) as { ok: true; value: string }).value : "0.00",
  })).filter((row): row is { invoice: OutstandingInvoice; amount_bdt: string } => Boolean(row.invoice));

  const allocated = addMoney(plan.map((row) => row.amount_bdt));
  const advance = receiptAmount.ok ? addMoney([receiptAmount.value, `-${allocated}`]) : "0.00";

  const overAllocated = receiptAmount.ok ? Number(allocated) > Number(receiptAmount.value) : false;
  const overdrawn = plan.some(
    (row) => Number(row.amount_bdt) > Number(row.invoice?.outstanding_bdt ?? "0"),
  );

  const ready =
    canWrite &&
    Boolean(partyId) &&
    receiptAmount.ok &&
    Number(receiptAmount.value) > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !overAllocated &&
    !overdrawn;

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!ready || !receiptAmount.ok) return;

    setError(null);
    setNotice(null);
    setWarnings([]);
    setBusy(true);

    try {
      const { receipt, warnings: advice } = await api<{ receipt: Receipt; warnings: DocumentWarning[] }>(
        "/sales/receipts",
        {
          method: "POST",
          body: {
            party_id: partyId,
            date,
            method,
            account_code: accountCode,
            amount_bdt: receiptAmount.value,
            memo,
            allocations:
              mode === "manual" && plan.length
                ? plan.map((row) => ({ invoice_id: row.invoice!.id, amount_bdt: row.amount_bdt }))
                : [],
          },
        },
      );

      setReceipts((rows) => [receipt, ...rows]);
      setWarnings(advice);
      setNotice(
        `${receipt.doc_no} recorded — ${receipt.allocated_bdt} applied` +
          (receipt.unallocated_bdt !== "0.00" ? `, ${receipt.unallocated_bdt} held as an advance.` : "."),
      );
      setAmount("");
      setMemo("");
      setManual([]);
      setMode("auto");

      // The invoices it settled have all moved, so the picker is re-read rather
      // than adjusted locally.
      if (partyId) {
        const refreshed = await api<{ invoices: OutstandingInvoice[] }>(`/sales/outstanding?party_id=${partyId}`);
        setOpen(refreshed.invoices);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not record that receipt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            04 &nbsp; Sales · Receipts
          </p>
          <nav className="row" style={{ gap: "var(--s-3)" }}>
            <Link className="btn btn--sm btn--quiet" href="/sales">
              Invoices
            </Link>
            <Link className="btn btn--sm btn--quiet" href="/sales/receivables">
              Receivables
            </Link>
          </nav>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          Money that has arrived. Enter what came in, and the invoices it settles — oldest first unless you
          say otherwise. Anything no invoice claims becomes the customer&rsquo;s advance, which will settle
          their next one.
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
        {warnings.map((warning) => (
          <p className="alert alert--ok" role="status" key={warning.code} style={{ marginTop: "var(--s-2)" }}>
            {warning.message}
          </p>
        ))}
      </section>

      {canWrite ? (
        <section className="section">
          <div className="panel">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Record a receipt</h2>
            </div>

            <form className="stack" onSubmit={submit} noValidate>
              <div className="grid grid-3">
                <div className="field">
                  <label className="label" htmlFor="receipt-party">
                    Customer
                  </label>
                  <select
                    id="receipt-party"
                    value={partyId}
                    onChange={(event) => {
                      setPartyId(event.target.value);
                      setManual([]);
                    }}
                  >
                    <option value="">— pick a customer —</option>
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.code} · {party.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="receipt-date">
                    Date received
                  </label>
                  <input
                    id="receipt-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="receipt-amount">
                    Amount
                  </label>
                  <input
                    id="receipt-amount"
                    className="mono"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="receipt-method">
                    Received as
                  </label>
                  <select
                    id="receipt-method"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as "CASH" | "BANK")}
                  >
                    <option value="BANK">Bank transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="receipt-account">
                    Into account <span className="faint">optional</span>
                  </label>
                  <input
                    id="receipt-account"
                    className="mono"
                    value={accountCode}
                    onChange={(event) => setAccountCode(event.target.value)}
                    placeholder={method === "BANK" ? "1010" : "1000"}
                  />
                  <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                    Blank uses the conventional account for the method.
                  </p>
                </div>

                <div className="field">
                  <label className="label" htmlFor="receipt-memo">
                    Memo <span className="faint">optional</span>
                  </label>
                  <input
                    id="receipt-memo"
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    placeholder="Cheque 004512"
                  />
                </div>
              </div>

              <div className="row-between">
                <p className="label" style={{ margin: 0 }}>
                  Apply to
                </p>
                <div className="row" style={{ gap: "var(--s-2)" }}>
                  <button
                    type="button"
                    className={`btn btn--sm ${mode === "auto" ? "" : "btn--quiet"}`}
                    onClick={() => setMode("auto")}
                  >
                    Oldest first
                  </button>
                  <button
                    type="button"
                    className={`btn btn--sm ${mode === "manual" ? "" : "btn--quiet"}`}
                    onClick={() => {
                      setMode("manual");
                      setManual(
                        plan.length
                          ? plan.map((row) => ({ invoice_id: row.invoice!.id, amount_bdt: row.amount_bdt }))
                          : [],
                      );
                    }}
                  >
                    Choose invoices
                  </button>
                </div>
              </div>

              {!partyId ? (
                <p className="muted" style={{ margin: 0 }}>
                  Pick the customer first — the invoices this can settle are theirs.
                </p>
              ) : open.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  This customer has no open invoices, so the whole receipt will be held as an advance.
                </p>
              ) : (
                <div className="ledger-scroll">
                  <table className="ledger">
                    <caption className="sr-only">Open invoices for this customer, oldest first</caption>
                    <thead>
                      <tr>
                        <th scope="col">Invoice</th>
                        <th scope="col">Date</th>
                        <th scope="col">Due</th>
                        <th scope="col" className="text-right">
                          Outstanding
                        </th>
                        <th scope="col" className="text-right">
                          Applying
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {open.map((invoice) => {
                        const row = plan.find((entry) => entry.invoice?.id === invoice.id);
                        return (
                          <tr key={invoice.id}>
                            <td className="mono nowrap">
                              {invoice.doc_no}
                              {invoice.days_overdue > 0 ? (
                                <span className="chip chip--high" style={{ marginLeft: "var(--s-2)" }}>
                                  {invoice.days_overdue}d late
                                </span>
                              ) : null}
                            </td>
                            <td className="muted nowrap">{invoice.date}</td>
                            <td className="muted nowrap">{invoice.due_date}</td>
                            <td className="text-right nowrap">
                              <Amount value={invoice.outstanding_bdt} size="sm" />
                            </td>
                            <td className="text-right nowrap">
                              {mode === "auto" ? (
                                row ? (
                                  <Amount value={row.amount_bdt} size="sm" />
                                ) : (
                                  <span className="muted">—</span>
                                )
                              ) : (
                                <input
                                  className="mono"
                                  aria-label={`Amount applied to ${invoice.doc_no}`}
                                  value={row?.amount_bdt ?? ""}
                                  placeholder="0.00"
                                  inputMode="decimal"
                                  style={{ width: "8rem", textAlign: "right" }}
                                  onChange={(event) => {
                                    const next = manual.filter((entry) => entry.invoice_id !== invoice.id);
                                    next.push({ invoice_id: invoice.id, amount_bdt: event.target.value });
                                    setManual(next);
                                  }}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <dl className="stack" style={{ gap: "var(--s-2)", margin: 0, alignItems: "flex-end" }}>
                <div className="row-between" style={{ gap: "var(--s-4)", minWidth: "16rem" }}>
                  <dt className="label" style={{ margin: 0 }}>
                    Received
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <Amount value={receiptAmount.ok ? receiptAmount.value : "0.00"} size="sm" />
                  </dd>
                </div>
                <div className="row-between" style={{ gap: "var(--s-4)", minWidth: "16rem" }}>
                  <dt className="label" style={{ margin: 0 }}>
                    Applied
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <Amount value={allocated} size="sm" />
                  </dd>
                </div>
                <div className="row-between" style={{ gap: "var(--s-4)", minWidth: "16rem" }}>
                  <dt className="label" style={{ margin: 0 }}>
                    Advance
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <Amount value={advance} size="lg" />
                  </dd>
                </div>
              </dl>

              {overAllocated ? (
                <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
                  You have applied {allocated} of a {receiptAmount.ok ? receiptAmount.value : "0.00"} receipt.
                </p>
              ) : null}
              {overdrawn ? (
                <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
                  One of the invoices is being paid more than it is owed.
                </p>
              ) : null}

              <div className="row">
                <button className="btn" type="submit" disabled={!ready || busy}>
                  {busy ? "Recording…" : "Record receipt"}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="row-between">
          <p className="label" style={{ margin: 0 }}>
            Recent receipts
          </p>
          <p className="label" style={{ margin: 0 }}>
            {receipts.length} shown
          </p>
        </div>

        <div className="panel panel--flush" style={{ marginTop: "var(--s-4)" }}>
          {loading ? (
            <div className="stack" style={{ padding: "var(--s-5)" }}>
              {[0, 1, 2].map((row) => (
                <div className="skeleton" key={row} style={{ height: "2rem" }} />
              ))}
            </div>
          ) : receipts.length === 0 ? (
            <div className="empty">
              <p style={{ margin: 0 }}>No receipts recorded yet.</p>
            </div>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Receipts</caption>
                <thead>
                  <tr>
                    <th scope="col">Number</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Date</th>
                    <th scope="col">Method</th>
                    <th scope="col" className="text-right">
                      Amount
                    </th>
                    <th scope="col" className="text-right">
                      Applied
                    </th>
                    <th scope="col" className="text-right">
                      Advance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="mono nowrap">{receipt.doc_no}</td>
                      <td>{receipt.party_name || receipt.party_code}</td>
                      <td className="muted nowrap">{receipt.date}</td>
                      <td className="muted nowrap">{receipt.method === "BANK" ? "Bank" : "Cash"}</td>
                      <td className="text-right nowrap">
                        <Amount value={receipt.amount_bdt} size="sm" />
                      </td>
                      <td className="text-right nowrap">
                        <Amount value={receipt.allocated_bdt} size="sm" />
                      </td>
                      <td className="text-right nowrap">
                        <Amount value={receipt.unallocated_bdt} size="sm" />
                      </td>
                    </tr>
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
