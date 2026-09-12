"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Amount } from "@/components/money";
import { api, ApiError } from "@/lib/api";
import {
  AGING_BUCKET_FIELD,
  type ApAgingReport,
  type Party,
  type SupplierPosition,
  type SupplierStatement,
} from "@/lib/types";

/**
 * Payables — what we owe, how late it is, and where a supplier's balance came
 * from.
 *
 * The mirror of the receivables screen. Every figure is derived by the API from
 * the same bills, payments and debit notes the ledger was posted from; nothing
 * is totalled here. The aging buckets are counted from each bill's **due date**,
 * falling back to its own date when none was agreed.
 *
 * The column vocabulary is the statement's own, and it is the mirror of the
 * customer statement's: a bill lands in **Billed to us** (it grows what we owe)
 * and a payment or debit note lands in **Settled**. The balance runs as the
 * amount we owe, positively — reading it with the columns reversed is the
 * mistake this screen exists to prevent.
 */

const today = (): string => new Date().toISOString().slice(0, 10);

export default function PayablesPage() {
  const [report, setReport] = useState<ApAgingReport | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [asOf, setAsOf] = useState(today());
  const [partyId, setPartyId] = useState("");
  const [statement, setStatement] = useState<SupplierStatement | null>(null);
  const [position, setPosition] = useState<SupplierPosition | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAging = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ as_of: asOf });
      if (partyId) query.set("party_id", partyId);
      const data = await api<ApAgingReport>(`/purchases/aging?${query.toString()}`);
      setReport(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the aging report.");
    } finally {
      setLoading(false);
    }
  }, [asOf, partyId]);

  useEffect(() => {
    void loadAging();
  }, [loadAging]);

  useEffect(() => {
    api<{ parties: Party[] }>("/parties")
      .then((data) => setParties(data.parties))
      .catch(() => setParties([]));
  }, []);

  useEffect(() => {
    if (!partyId) {
      setStatement(null);
      setPosition(null);
      return;
    }
    let cancelled = false;
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);

    Promise.all([
      api<{ statement: SupplierStatement }>(`/purchases/suppliers/${partyId}/statement?${query.toString()}`),
      api<{ position: SupplierPosition }>(`/purchases/suppliers/${partyId}/position`),
    ])
      .then(([statementData, positionData]) => {
        if (cancelled) return;
        setStatement(statementData.statement);
        setPosition(positionData.position);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setStatement(null);
        setPosition(null);
        setError(caught instanceof ApiError ? caught.message : "Could not load that statement.");
      });

    return () => {
      cancelled = true;
    };
  }, [partyId, from, to]);

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            04 &nbsp; Purchases · Payables
          </p>
          <nav className="row" style={{ gap: "var(--s-3)" }}>
            <Link className="btn btn--sm btn--quiet" href="/purchases">
              Bills
            </Link>
            <Link className="btn btn--sm btn--quiet" href="/purchases/payments">
              Payments
            </Link>
          </nav>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          What is still owed to suppliers, aged from each bill&rsquo;s due date. Everything here is derived
          from the posted documents, so the total ties to the Accounts Payable line in the chart.
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
              <label className="label" htmlFor="ap-aging-date">
                As at
              </label>
              <input id="ap-aging-date" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} />
            </div>
            <div className="field" style={{ margin: 0, minWidth: "16rem" }}>
              <label className="label" htmlFor="ap-aging-party">
                Supplier
              </label>
              <select id="ap-aging-party" value={partyId} onChange={(event) => setPartyId(event.target.value)}>
                <option value="">All suppliers</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.code} · {party.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row" style={{ gap: "var(--s-3)" }}>
            <p className="label" style={{ margin: 0 }}>
              Total owed
            </p>
            <Amount value={report?.totals.total_bdt ?? "0.00"} size="lg" />
          </div>
        </div>

        <div className="panel panel--flush" style={{ marginTop: "var(--s-4)" }}>
          {loading ? (
            <div className="stack" style={{ padding: "var(--s-5)" }}>
              {[0, 1, 2].map((row) => (
                <div className="skeleton" key={row} style={{ height: "2rem" }} />
              ))}
            </div>
          ) : !report || report.parties.length === 0 ? (
            <div className="empty">
              <p style={{ margin: 0 }}>Nothing is outstanding{asOf !== today() ? ` as at ${asOf}` : ""}.</p>
            </div>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Accounts payable aging</caption>
                <thead>
                  <tr>
                    <th scope="col">Supplier</th>
                    {report.buckets.map((bucket) => (
                      <th key={bucket.key} scope="col" className="text-right">
                        {bucket.label}
                      </th>
                    ))}
                    <th scope="col" className="text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.parties.map((row) => (
                    <tr key={row.party_id}>
                      <td>
                        <span className="mono">{row.party_code}</span> {row.party_name}
                        <span className="faint" style={{ marginLeft: "var(--s-2)" }}>
                          {row.bill_count} open
                        </span>
                      </td>
                      {report.buckets.map((bucket) => {
                        const field = AGING_BUCKET_FIELD[bucket.key as keyof typeof AGING_BUCKET_FIELD];
                        const value = row[field] as string;
                        return (
                          <td key={bucket.key} className="text-right nowrap">
                            {value === "0.00" ? <span className="faint">—</span> : <Amount value={value} size="sm" />}
                          </td>
                        );
                      })}
                      <td className="text-right nowrap">
                        <Amount value={row.total_bdt} size="sm" />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="label">Total</td>
                    {report.buckets.map((bucket) => {
                      const field = AGING_BUCKET_FIELD[bucket.key as keyof typeof AGING_BUCKET_FIELD];
                      const value = report.totals[field] as string;
                      return (
                        <td key={bucket.key} className="text-right nowrap">
                          <Amount value={value} size="sm" />
                        </td>
                      );
                    })}
                    <td className="text-right nowrap">
                      <Amount value={report.totals.total_bdt} size="sm" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {report && report.bills.length > 0 ? (
          <details style={{ marginTop: "var(--s-5)" }}>
            <summary className="label" style={{ cursor: "pointer" }}>
              The bills these totals were summed from ({report.bills.length})
            </summary>
            <div className="panel panel--flush" style={{ marginTop: "var(--s-3)" }}>
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Open bills</caption>
                  <thead>
                    <tr>
                      <th scope="col">Bill</th>
                      <th scope="col">Supplier</th>
                      <th scope="col">Date</th>
                      <th scope="col">Due</th>
                      <th scope="col">Days late</th>
                      <th scope="col" className="text-right">
                        Outstanding
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bills.map((bill) => (
                      <tr key={bill.id}>
                        <td className="mono nowrap">{bill.doc_no}</td>
                        <td>{bill.party_name || bill.party_code}</td>
                        <td className="muted nowrap">{bill.date}</td>
                        <td className="muted nowrap">{bill.due_date}</td>
                        <td className="muted nowrap">{bill.days_overdue > 0 ? `${bill.days_overdue}` : "—"}</td>
                        <td className="text-right nowrap">
                          <Amount value={bill.outstanding_bdt} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        ) : null}
      </section>

      <section className="section">
        <div className="row-between">
          <p className="label" style={{ margin: 0 }}>
            Supplier statement
          </p>
          <div className="row" style={{ gap: "var(--s-3)" }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="supplier-from">
                From
              </label>
              <input id="supplier-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="supplier-to">
                To
              </label>
              <input id="supplier-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-4)", alignItems: "start" }}>
          <div className="panel panel--flush">
            {!partyId ? (
              <div className="empty">
                <p style={{ margin: 0 }}>Pick a supplier above to read their statement.</p>
              </div>
            ) : !statement ? (
              <div className="empty">
                <p style={{ margin: 0 }}>Loading statement…</p>
              </div>
            ) : (
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Statement of account</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Document</th>
                      <th scope="col">Detail</th>
                      <th scope="col" className="text-right">
                        Billed to us
                      </th>
                      <th scope="col" className="text-right">
                        Settled
                      </th>
                      <th scope="col" className="text-right">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="muted">
                        Opening balance
                      </td>
                      <td className="text-right nowrap">
                        <Amount value={statement.opening_bdt} size="sm" />
                      </td>
                    </tr>
                    {statement.movements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="muted">
                          Nothing moved in that period.
                        </td>
                      </tr>
                    ) : (
                      statement.movements.map((movement, index) => (
                        <tr key={`${movement.date}-${movement.doc_no}-${index}`}>
                          <td className="muted nowrap">{movement.date}</td>
                          <td className="mono nowrap">{movement.doc_no ?? "—"}</td>
                          <td>
                            {movement.type === "BILL" ? "Bill" : movement.type === "PAYMENT" ? "Payment made" : "Debit note"}
                            <span className="faint" style={{ marginLeft: "var(--s-2)" }}>
                              {movement.description}
                            </span>
                          </td>
                          <td className="text-right nowrap">
                            {movement.credit_bdt === "0.00" ? (
                              <span className="faint">—</span>
                            ) : (
                              <Amount value={movement.credit_bdt} size="sm" />
                            )}
                          </td>
                          <td className="text-right nowrap">
                            {movement.debit_bdt === "0.00" ? (
                              <span className="faint">—</span>
                            ) : (
                              <Amount value={movement.debit_bdt} size="sm" />
                            )}
                          </td>
                          <td className="text-right nowrap">
                            <Amount value={movement.balance_bdt} size="sm" />
                          </td>
                        </tr>
                      ))
                    )}
                    <tr>
                      <td colSpan={5} className="label">
                        Closing balance
                      </td>
                      <td className="text-right nowrap">
                        <Amount value={statement.closing_bdt} size="lg" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Supplier position</h2>
            </div>

            {!position ? (
              <p className="muted" style={{ margin: 0 }}>
                Pick a supplier to see what we owe and how much of it is late.
              </p>
            ) : (
              <div className="stack">
                <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
                  <Row label="Balance owed" value={position.balance_bdt} />
                  <Row label="Prepaid with them" value={position.prepaid_bdt} />
                  <Row label="Overdue" value={position.overdue_bdt} />
                  <Row
                    label="Oldest overdue"
                    value={position.oldest_overdue_days > 0 ? `${position.oldest_overdue_days} days` : "—"}
                  />
                  <Row label="Open bills" value={String(position.open_bill_count)} />
                </dl>

                <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                  The balance is what we owe less any prepayment we are holding with them, which is the
                  figure a payment run clears.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const money = /^-?\d+\.\d{2}$/.test(value);
  return (
    <div className="row-between" style={{ gap: "var(--s-3)" }}>
      <dt className="label" style={{ margin: 0 }}>
        {label}
      </dt>
      <dd className="muted" style={{ margin: 0, textAlign: "right" }}>
        {money ? <Amount value={value} size="sm" /> : value}
      </dd>
    </div>
  );
}
