"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { api, ApiError } from "@/lib/api";
import { addMoney, toCanonical } from "@/lib/money";
import type { CatalogTaxRate, DocumentWarning, OutstandingBill, Party, Payment } from "@/lib/types";

/**
 * Payments — money leaving (plan §6, Phase 4).
 *
 * A payment is money *to a supplier*, not a settlement *of a bill*, and this
 * screen is built that way: you enter the amount that left, and the bills it
 * settles are a second decision.
 *
 * **Oldest-first is the default**, and the picker shows exactly what that
 * default would do before you accept it — the same rule the receipts screen
 * uses, on the same reasoning: the oldest debt is the one about to cost a late
 * charge or a supplier's patience.
 *
 * Overpayment is not an error here. Whatever no bill claims becomes a
 * **prepayment**, and the screen says so in as many words before you save.
 *
 * **Withholding** (plan §6 Phase 7) sits on this form because that is where it
 * happens: the supplier's account still settles in full, but part of the money
 * goes to the tax office instead of to them. The screen states the three figures
 * separately — settled, withheld, cash out — so nobody has to work out which of
 * them the bank statement will show.
 */
interface AllocationDraft {
  bill_id: string;
  amount_bdt: string;
}

interface WithholdingDraft {
  tax_code: string;
  amount_bdt: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

export default function PurchasesPaymentsPage() {
  const { can } = useSession();
  const canWrite = can("purchases.write");

  const [parties, setParties] = useState<Party[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [open, setOpen] = useState<OutstandingBill[]>([]);

  const [partyId, setPartyId] = useState("");
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<"CASH" | "BANK">("BANK");
  const [accountCode, setAccountCode] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [withholdingRates, setWithholdingRates] = useState<CatalogTaxRate[]>([]);
  const [withholdings, setWithholdings] = useState<WithholdingDraft[]>([]);

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
      const [partyRows, paymentRows, rateRows] = await Promise.all([
        api<{ parties: Party[] }>("/parties"),
        api<{ payments: Payment[] }>("/purchases/payments?limit=50"),
        api<{ tax_rates: CatalogTaxRate[] }>("/catalogs/tax-rates"),
      ]);
      setParties(partyRows.parties.filter((party) => party.kind !== "CUSTOMER"));
      setPayments(paymentRows.payments);
      // Only withholding rates can be deducted here; the server refuses a VAT
      // code on a payment, so the form does not offer one.
      setWithholdingRates(rateRows.tax_rates.filter((rate) => rate.kind === "WITHHOLDING"));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The supplier's open bills, oldest first — the same order the API's
  // oldest-first default will apply them in.
  useEffect(() => {
    if (!partyId) {
      setOpen([]);
      return;
    }
    let cancelled = false;
    api<{ bills: OutstandingBill[] }>(`/purchases/outstanding?party_id=${partyId}`)
      .then((data) => {
        if (!cancelled) setOpen(data.bills);
      })
      .catch(() => {
        if (!cancelled) setOpen([]);
      });
    return () => {
      cancelled = true;
    };
  }, [partyId]);

  const paymentAmount = toCanonical(amount);

  /** What oldest-first would do with this amount. Derived, not stored: the
   *  amount changes and the plan changes with it. */
  const autoPlan = useMemo(() => {
    if (!paymentAmount.ok) return [];
    let remaining = paymentAmount.value;
    const plan: { bill: OutstandingBill; amount_bdt: string }[] = [];

    for (const bill of open) {
      if (Number(remaining) <= 0) break;
      const take = Number(bill.outstanding_bdt) <= Number(remaining) ? bill.outstanding_bdt : remaining;
      plan.push({ bill, amount_bdt: take });
      remaining = addMoney([remaining, `-${take}`]);
    }
    return plan;
  }, [open, paymentAmount]);

  const plan =
    mode === "auto"
      ? autoPlan
      : manual
          .map((row) => ({
            bill: open.find((bill) => bill.id === row.bill_id),
            amount_bdt: toCanonical(row.amount_bdt).ok
              ? (toCanonical(row.amount_bdt) as { ok: true; value: string }).value
              : "0.00",
          }))
          .filter((row): row is { bill: OutstandingBill; amount_bdt: string } => Boolean(row.bill));

  const allocated = addMoney(plan.map((row) => row.amount_bdt));
  const prepaid = paymentAmount.ok ? addMoney([paymentAmount.value, `-${allocated}`]) : "0.00";

  const overAllocated = paymentAmount.ok ? Number(allocated) > Number(paymentAmount.value) : false;
  const overSettled = plan.some((row) => Number(row.amount_bdt) > Number(row.bill?.outstanding_bdt ?? "0"));

  // Withholding is a caption on the arithmetic, not a computation: the amounts
  // are typed, summed and subtracted here only to show what will leave the bank.
  const withheld = addMoney(
    withholdings
      .map((row) => toCanonical(row.amount_bdt))
      .filter((row): row is { ok: true; value: string } => row.ok)
      .map((row) => row.value),
  );
  const cash = paymentAmount.ok ? addMoney([paymentAmount.value, `-${withheld}`]) : "0.00";
  const overWithheld = paymentAmount.ok ? Number(withheld) > Number(paymentAmount.value) : false;
  const nothingToPay = paymentAmount.ok && Number(withheld) > 0 && Number(cash) <= 0;

  const ready =
    canWrite &&
    Boolean(partyId) &&
    paymentAmount.ok &&
    Number(paymentAmount.value) > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !overAllocated &&
    !overSettled &&
    !overWithheld &&
    !nothingToPay;

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!ready || !paymentAmount.ok) return;

    setError(null);
    setNotice(null);
    setWarnings([]);
    setBusy(true);

    try {
      const { payment, warnings: advice } = await api<{ payment: Payment; warnings: DocumentWarning[] }>(
        "/purchases/payments",
        {
          method: "POST",
          body: {
            party_id: partyId,
            date,
            method,
            account_code: accountCode,
            amount_bdt: paymentAmount.value,
            memo,
            withholdings: withholdings
              .map((row) => ({ tax_code: row.tax_code, amount_bdt: toCanonical(row.amount_bdt) }))
              .filter((row): row is { tax_code: string; amount_bdt: { ok: true; value: string } } =>
                Boolean(row.tax_code) && row.amount_bdt.ok,
              )
              .map((row) => ({ tax_code: row.tax_code, amount_bdt: row.amount_bdt.value })),
            allocations:
              mode === "manual" && plan.length
                ? plan.map((row) => ({ bill_id: row.bill!.id, amount_bdt: row.amount_bdt }))
                : [],
          },
        },
      );

      setPayments((rows) => [payment, ...rows]);
      setWarnings(advice);
      setNotice(
        `${payment.doc_no} recorded — ${payment.allocated_bdt} applied` +
          (payment.unallocated_bdt !== "0.00" ? `, ${payment.unallocated_bdt} held as a prepayment` : "") +
          (payment.withheld_bdt !== "0.00" ? `, ${payment.withheld_bdt} withheld for the tax office` : "") +
          ".",
      );
      setAmount("");
      setMemo("");
      setManual([]);
      setMode("auto");
      setWithholdings([]);

      // The bills it settled have all moved, so the picker is re-read rather
      // than adjusted locally.
      if (partyId) {
        const refreshed = await api<{ bills: OutstandingBill[] }>(`/purchases/outstanding?party_id=${partyId}`);
        setOpen(refreshed.bills);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not record that payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            04 &nbsp; Purchases · Payments
          </p>
          <nav className="row" style={{ gap: "var(--s-3)" }}>
            <Link className="btn btn--sm btn--quiet" href="/purchases">
              Bills
            </Link>
            <Link className="btn btn--sm btn--quiet" href="/purchases/payables">
              Payables
            </Link>
          </nav>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          Money that has gone out to suppliers. Enter what was paid, and the bills it settles — oldest
          first unless you say otherwise. Anything no bill claims is held as a prepayment, which will
          settle their next one.
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
              <h2 style={{ fontSize: "var(--t-lg)" }}>Record a payment</h2>
            </div>

            <form className="stack" onSubmit={submit} noValidate>
              <div className="grid grid-3">
                <div className="field">
                  <label className="label" htmlFor="payment-party">
                    Supplier
                  </label>
                  <select
                    id="payment-party"
                    value={partyId}
                    onChange={(event) => {
                      setPartyId(event.target.value);
                      setManual([]);
                    }}
                  >
                    <option value="">— pick a supplier —</option>
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.code} · {party.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="payment-date">
                    Date paid
                  </label>
                  <input id="payment-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </div>

                <div className="field">
                  <label className="label" htmlFor="payment-amount">
                    Amount
                  </label>
                  <input
                    id="payment-amount"
                    className="mono"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="payment-method">
                    Paid from
                  </label>
                  <select
                    id="payment-method"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as "CASH" | "BANK")}
                  >
                    <option value="BANK">Bank transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="payment-account">
                    From account <span className="faint">optional</span>
                  </label>
                  <input
                    id="payment-account"
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
                  <label className="label" htmlFor="payment-memo">
                    Memo <span className="faint">optional</span>
                  </label>
                  <input
                    id="payment-memo"
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
                        plan.length ? plan.map((row) => ({ bill_id: row.bill!.id, amount_bdt: row.amount_bdt })) : [],
                      );
                    }}
                  >
                    Choose bills
                  </button>
                </div>
              </div>

              {!partyId ? (
                <p className="muted" style={{ margin: 0 }}>
                  Pick the supplier first — the bills this can settle are theirs.
                </p>
              ) : open.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  This supplier has no open bills, so the whole payment will be held as a prepayment.
                </p>
              ) : (
                <div className="ledger-scroll">
                  <table className="ledger">
                    <caption className="sr-only">Open bills for this supplier, oldest first</caption>
                    <thead>
                      <tr>
                        <th scope="col">Bill</th>
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
                      {open.map((bill) => {
                        const row = plan.find((entry) => entry.bill?.id === bill.id);
                        return (
                          <tr key={bill.id}>
                            <td className="mono nowrap">
                              {bill.doc_no}
                              {bill.days_overdue > 0 ? (
                                <span className="chip chip--high" style={{ marginLeft: "var(--s-2)" }}>
                                  {bill.days_overdue}d late
                                </span>
                              ) : null}
                            </td>
                            <td className="muted nowrap">{bill.date}</td>
                            <td className="muted nowrap">{bill.due_date}</td>
                            <td className="text-right nowrap">
                              <Amount value={bill.outstanding_bdt} size="sm" />
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
                                  aria-label={`Amount applied to ${bill.doc_no}`}
                                  value={row?.amount_bdt ?? ""}
                                  placeholder="0.00"
                                  inputMode="decimal"
                                  style={{ width: "8rem", textAlign: "right" }}
                                  onChange={(event) => {
                                    const next = manual.filter((entry) => entry.bill_id !== bill.id);
                                    next.push({ bill_id: bill.id, amount_bdt: event.target.value });
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

              {withholdingRates.length > 0 ? (
                <div className="stack" style={{ gap: "var(--s-2)" }}>
                  <p className="label" style={{ margin: 0 }}>
                    Withholding{" "}
                    <span className="faint">optional — tax owed to the office, not the supplier</span>
                  </p>

                  {withholdings.length === 0 ? (
                    <p className="muted" style={{ margin: 0 }}>
                      None. Add one if this payment is subject to source tax, VDS or AIT.
                    </p>
                  ) : (
                    <div className="stack" style={{ gap: "var(--s-2)" }}>
                      {withholdings.map((row, index) => (
                        <div
                          className="row"
                          style={{ gap: "var(--s-3)", alignItems: "flex-end" }}
                          key={`withholding-${index}`}
                        >
                          <div className="field" style={{ margin: 0, maxWidth: "18rem" }}>
                            <label className="label" htmlFor={`withholding-code-${index}`}>
                              Rate
                            </label>
                            <select
                              id={`withholding-code-${index}`}
                              value={row.tax_code}
                              onChange={(event) => {
                                const next = [...withholdings];
                                next[index] = { ...row, tax_code: event.target.value };
                                setWithholdings(next);
                              }}
                            >
                              <option value="">— pick a rate —</option>
                              {withholdingRates.map((rate) => (
                                <option key={rate.code} value={rate.code}>
                                  {rate.code} · {rate.name} ({rate.rate_percent}%)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field" style={{ margin: 0, maxWidth: "12rem" }}>
                            <label className="label" htmlFor={`withholding-amount-${index}`}>
                              Amount
                            </label>
                            <input
                              id={`withholding-amount-${index}`}
                              className="mono"
                              inputMode="decimal"
                              value={row.amount_bdt}
                              onChange={(event) => {
                                const next = [...withholdings];
                                next[index] = { ...row, amount_bdt: event.target.value };
                                setWithholdings(next);
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn--sm btn--quiet"
                            onClick={() => setWithholdings(withholdings.filter((_, i) => i !== index))}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="row">
                    <button
                      type="button"
                      className="btn btn--sm btn--quiet"
                      onClick={() => setWithholdings([...withholdings, { tax_code: "", amount_bdt: "" }])}
                    >
                      Add withholding
                    </button>
                  </div>
                </div>
              ) : null}

              <dl className="stack" style={{ gap: "var(--s-2)", margin: 0, alignItems: "flex-end" }}>
                <div className="row-between" style={{ gap: "var(--s-4)", minWidth: "16rem" }}>
                  <dt className="label" style={{ margin: 0 }}>
                    Settles
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <Amount value={paymentAmount.ok ? paymentAmount.value : "0.00"} size="sm" />
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
                    Prepayment
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <Amount value={prepaid} size="sm" />
                  </dd>
                </div>
                {withheld !== "0.00" ? (
                  <>
                    <div className="row-between" style={{ gap: "var(--s-4)", minWidth: "16rem" }}>
                      <dt className="label" style={{ margin: 0 }}>
                        Withheld
                      </dt>
                      <dd style={{ margin: 0 }}>
                        <Amount value={withheld} size="sm" />
                      </dd>
                    </div>
                    <div className="row-between" style={{ gap: "var(--s-4)", minWidth: "16rem" }}>
                      <dt className="label" style={{ margin: 0 }}>
                        Cash out
                      </dt>
                      <dd style={{ margin: 0 }}>
                        <Amount value={cash} size="lg" />
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>

              {overAllocated ? (
                <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
                  You have applied {allocated} of a {paymentAmount.ok ? paymentAmount.value : "0.00"} payment.
                </p>
              ) : null}
              {overSettled ? (
                <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
                  One of the bills is being settled for more than it is owed.
                </p>
              ) : null}
              {overWithheld ? (
                <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
                  Withholding {withheld} is more than the {paymentAmount.ok ? paymentAmount.value : "0.00"} this
                  payment settles.
                </p>
              ) : null}
              {nothingToPay ? (
                <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
                  Withholding covers the whole payment, so no money would move. Reduce the withholding or the amount.
                </p>
              ) : null}

              <div className="row">
                <button className="btn" type="submit" disabled={!ready || busy}>
                  {busy ? "Recording…" : "Record payment"}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="row-between">
          <p className="label" style={{ margin: 0 }}>
            Recent payments
          </p>
          <p className="label" style={{ margin: 0 }}>
            {payments.length} shown
          </p>
        </div>

        <div className="panel panel--flush" style={{ marginTop: "var(--s-4)" }}>
          {loading ? (
            <div className="stack" style={{ padding: "var(--s-5)" }}>
              {[0, 1, 2].map((row) => (
                <div className="skeleton" key={row} style={{ height: "2rem" }} />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="empty">
              <p style={{ margin: 0 }}>No payments recorded yet.</p>
            </div>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Payments</caption>
                <thead>
                  <tr>
                    <th scope="col">Number</th>
                    <th scope="col">Supplier</th>
                    <th scope="col">Date</th>
                    <th scope="col">Method</th>
                    <th scope="col" className="text-right">
                      Amount
                    </th>
                    <th scope="col" className="text-right">
                      Applied
                    </th>
                    <th scope="col" className="text-right">
                      Withheld
                    </th>
                    <th scope="col" className="text-right">
                      Prepayment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="mono nowrap">{payment.doc_no}</td>
                      <td>{payment.party_name || payment.party_code}</td>
                      <td className="muted nowrap">{payment.date}</td>
                      <td className="muted nowrap">{payment.method === "BANK" ? "Bank" : "Cash"}</td>
                      <td className="text-right nowrap">
                        <Amount value={payment.amount_bdt} size="sm" />
                      </td>
                      <td className="text-right nowrap">
                        <Amount value={payment.allocated_bdt} size="sm" />
                      </td>
                      <td className="text-right nowrap">
                        <Amount value={payment.withheld_bdt} size="sm" />
                      </td>
                      <td className="text-right nowrap">
                        <Amount value={payment.unallocated_bdt} size="sm" />
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
