"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import {
  PURCHASE_EDITOR_DEFAULTS,
  PurchaseLineEditor,
  LineTable,
  emptyLine,
  lineFromStored,
  previewTotals,
  toRequestLine,
  type StoredLine,
} from "@/components/purchases/document-lines";
import { api, ApiError } from "@/lib/api";
import { addMoney, toCanonical } from "@/lib/money";
import {
  BILL_STATUSES,
  BILL_STATUS_LABEL,
  type Account,
  type Bill,
  type BillStatus,
  type CatalogTaxRate,
  type DebitNote,
  type DocumentWarning,
  type Item,
  type OrgProfile,
  type Party,
} from "@/lib/types";
import { DemoSeederBanner } from "@/components/demo-seeder-banner";

/**
 * Purchases — bill → payment → debit note (plan §6, Phase 4).
 *
 * The mirror of the sales screen, and it inherits the same three refusals:
 *
 *   1. **It never edits an issued bill.** A draft is edited; an issued one is
 *      voided and re-entered. The number on the supplier's document has to keep
 *      matching our record of it.
 *   2. **It never sets a paid status.** Status is derived from the payments and
 *      debit notes pointed at the bill.
 *   3. **It never discards an issued bill.** Only a draft can be discarded; an
 *      issued one is voided, which leaves both it and its reversing entry in the
 *      record.
 *
 * What is *not* mirrored is the party filter: a bill goes to a supplier, so a
 * customer-only party is not offered here rather than refused later.
 */

interface Draft {
  party_id: string;
  date: string;
  due_date: string;
  memo: string;
  lines: ReturnType<typeof emptyLine>[];
}

const today = (): string => new Date().toISOString().slice(0, 10);

const emptyDraft = (): Draft => ({
  party_id: "",
  date: today(),
  due_date: "",
  memo: "",
  lines: [emptyLine()],
});

export default function PurchasesPage() {
  const { can } = useSession();
  const canWrite = can("purchases.write");

  const [bills, setBills] = useState<Bill[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [taxRates, setTaxRates] = useState<CatalogTaxRate[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<DocumentWarning[]>([]);
  const [busy, setBusy] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"ALL" | BillStatus>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editing, setEditing] = useState<"none" | "create" | "edit">("none");
  const [printing, setPrinting] = useState<OrgProfile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billRows, partyRows, itemRows, rateRows, accountRows] = await Promise.all([
        api<{ bills: Bill[] }>("/purchases/bills?limit=200"),
        api<{ parties: Party[] }>("/parties"),
        api<{ items: Item[] }>("/items"),
        api<{ tax_rates: CatalogTaxRate[] }>("/catalogs/tax-rates"),
        api<{ accounts: Account[] }>("/coa"),
      ]);
      setBills(billRows.bills);
      // A purchase document comes from a supplier, so a customer-only party is
      // not a possible choice here rather than a mistake to be refused later.
      setParties(partyRows.parties.filter((party) => party.kind !== "CUSTOMER"));
      setItems(itemRows.items);
      setTaxRates(rateRows.tax_rates.filter((rate) => rate.is_active));
      setAccounts(accountRows.accounts);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load purchases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = bills.find((row) => row.id === selectedId) ?? null;

  const visible = useMemo(
    () => (statusFilter === "ALL" ? bills : bills.filter((row) => row.status === statusFilter)),
    [bills, statusFilter],
  );

  const outstandingTotal = useMemo(
    () =>
      addMoney(
        bills
          .filter((row) => row.status !== "VOID" && row.status !== "DRAFT")
          .map((row) => row.outstanding_bdt),
      ),
    [bills],
  );

  function replace(next: Bill): void {
    setBills((rows) => {
      const exists = rows.some((row) => row.id === next.id);
      if (!exists) return [next, ...rows];
      return rows.map((row) => (row.id === next.id ? next : row));
    });
  }

  function startCreate(): void {
    setDraft(emptyDraft());
    setEditing("create");
    setSelectedId(null);
    setNotice(null);
    setWarnings([]);
    setPrinting(null);
  }

  function startEdit(bill: Bill): void {
    setDraft({
      party_id: bill.party_id,
      date: bill.date,
      due_date: bill.due_date,
      memo: bill.memo,
      lines: bill.lines.length ? bill.lines.map((line) => lineFromStored(line)) : [emptyLine()],
    });
    setEditing("edit");
    setNotice(null);
    setWarnings([]);
    setPrinting(null);
  }

  /** The draft is only sent when every line can be totalled, so the API is never
   *  asked to guess what a half-typed price meant. */
  function readyToSend(): string | null {
    if (!draft.party_id) return "Pick the supplier this bill is from.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return "Give the bill a date.";
    if (draft.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(draft.due_date))
      return "Give the due date in full, or leave it blank.";
    for (const [index, line] of draft.lines.entries()) {
      if (!toCanonical(line.unit_price_bdt).ok) return `Line ${index + 1} needs a unit price.`;
      if (toCanonical(line.discount_bdt || "0").ok === false)
        return `Line ${index + 1} has a discount that is not a number.`;
      if (!/^\d+(\.\d{1,3})?$/.test(line.qty.trim())) return `Line ${index + 1} needs a quantity.`;
    }
    const totals = previewTotals(draft.lines, taxRates);
    if (!totals.complete) return "One of the lines is still incomplete.";
    return null;
  }

  async function saveDraft(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const problem = readyToSend();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(true);

    const body = {
      party_id: draft.party_id,
      date: draft.date,
      due_date: draft.due_date,
      memo: draft.memo,
      lines: draft.lines.map(toRequestLine),
    };

    try {
      if (editing === "edit" && selected) {
        const { bill } = await api<{ bill: Bill }>(`/purchases/bills/${selected.id}`, {
          method: "PATCH",
          body,
        });
        replace(bill);
        setSelectedId(bill.id);
        setNotice("Draft updated — still no number claimed, still nothing posted.");
      } else {
        const { bill } = await api<{ bill: Bill }>("/purchases/bills", { method: "POST", body });
        replace(bill);
        setSelectedId(bill.id);
        setNotice("Draft saved. It claims no number until you issue it.");
      }
      setEditing("none");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save that bill.");
    } finally {
      setBusy(false);
    }
  }

  async function issue(bill: Bill): Promise<void> {
    setError(null);
    setNotice(null);
    setWarnings([]);
    setBusy(true);
    try {
      const result = await api<{ bill: Bill; warnings: DocumentWarning[] }>(
        `/purchases/bills/${bill.id}/issue`,
        { method: "POST" },
      );
      replace(result.bill);
      setSelectedId(result.bill.id);
      setWarnings(result.warnings);
      setNotice(`Issued as ${result.bill.doc_no} — the payable is now in the books.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not issue that bill.");
    } finally {
      setBusy(false);
    }
  }

  async function discard(bill: Bill): Promise<void> {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await api<{ discarded: boolean }>(`/purchases/bills/${bill.id}`, { method: "DELETE" });
      setBills((rows) => rows.filter((row) => row.id !== bill.id));
      setSelectedId(null);
      setNotice("Draft discarded. It never claimed a number, so the sequence has no gap.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not discard that draft.");
    } finally {
      setBusy(false);
    }
  }

  async function preview(bill: Bill): Promise<void> {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { document } = await api<{ document: { org: OrgProfile; bill: Bill } }>(
        `/purchases/bills/${bill.id}/print`,
      );
      setPrinting(document.org);
      replace(document.bill);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not prepare that preview.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            04 &nbsp; Purchases
          </p>
          <nav className="row" style={{ gap: "var(--s-3)" }}>
            <Link className="btn btn--sm btn--quiet" href="/purchases/payments">
              Payments
            </Link>
            <Link className="btn btn--sm btn--quiet" href="/purchases/payables">
              Payables
            </Link>
            {canWrite ? (
              <button type="button" className="btn btn--sm" onClick={startCreate}>
                New bill
              </button>
            ) : null}
          </nav>
        </div>

        <div className="row-between" style={{ marginTop: "var(--s-3)" }}>
          <p className="muted" style={{ margin: 0, maxWidth: "62ch" }}>
            What you owe suppliers. A draft claims no number and posts nothing; issuing claims the next
            number and credits Accounts Payable; payments and debit notes settle it.
          </p>
          <div className="row" style={{ gap: "var(--s-2)" }}>
            <p className="label" style={{ margin: 0 }}>
              Still owed
            </p>
            <Amount value={outstandingTotal} size="lg" />
          </div>
        </div>

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
          <p
            className="alert alert--ok"
            role="status"
            key={warning.code}
            style={{ marginTop: "var(--s-2)", borderColor: "var(--line-firm)" }}
          >
            <strong>Due date:</strong> {warning.message}
          </p>
        ))}

        {editing !== "none" ? (
          <div className="panel" style={{ marginTop: "var(--s-3)", marginBottom: "var(--s-4)" }}>
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>{editing === "edit" ? "Edit draft" : "New bill"}</h2>
            </div>

            <form className="stack" onSubmit={saveDraft} noValidate>
              <div className="grid grid-3">
                <div className="field">
                  <label className="label" htmlFor="bill-party">
                    Supplier
                  </label>
                  <select
                    id="bill-party"
                    value={draft.party_id}
                    onChange={(event) => setDraft({ ...draft, party_id: event.target.value })}
                    required
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
                  <label className="label" htmlFor="bill-date">
                    Date
                  </label>
                  <input
                    id="bill-date"
                    type="date"
                    value={draft.date}
                    onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                    required
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="bill-due">
                    Due <span className="faint">optional</span>
                  </label>
                  <input
                    id="bill-due"
                    type="date"
                    value={draft.due_date}
                    onChange={(event) => setDraft({ ...draft, due_date: event.target.value })}
                  />
                  <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                    Blank means payable on the bill date — that is what aging measures from.
                  </p>
                </div>

                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label className="label" htmlFor="bill-memo">
                    Memo <span className="faint">optional</span>
                  </label>
                  <input
                    id="bill-memo"
                    value={draft.memo}
                    onChange={(event) => setDraft({ ...draft, memo: event.target.value })}
                    placeholder="June stock purchase"
                  />
                </div>
              </div>

              <PurchaseLineEditor
                lines={draft.lines}
                onChange={(lines) => setDraft({ ...draft, lines })}
                items={items}
                taxRates={taxRates}
                accounts={accounts}
                {...PURCHASE_EDITOR_DEFAULTS}
              />

              <div className="row" style={{ gap: "var(--s-3)" }}>
                <button className="btn" type="submit" disabled={busy}>
                  {busy ? "Saving…" : editing === "edit" ? "Save draft" : "Create draft"}
                </button>
                <button
                  type="button"
                  className="btn btn--quiet"
                  disabled={busy}
                  onClick={() => setEditing("none")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="row-between" style={{ marginTop: "var(--s-3)" }}>
          <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
            {(["ALL", ...BILL_STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn--sm ${statusFilter === status ? "" : "btn--quiet"}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" ? "All" : BILL_STATUS_LABEL[status]}
              </button>
            ))}
          </div>
          <p className="label" style={{ margin: 0 }}>
            {visible.length} bills
          </p>
        </div>

        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-3)", alignItems: "start" }}>
          <div className="panel panel--flush">
            {loading ? (
              <div className="stack" style={{ padding: "var(--s-5)" }}>
                {[0, 1, 2, 3, 4].map((row) => (
                  <div className="skeleton" key={row} style={{ height: "2rem" }} />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="empty stack" style={{ alignItems: "center", gap: "var(--s-3)", padding: "var(--s-5)" }}>
                <p style={{ margin: 0 }}>
                  {bills.length === 0
                    ? "No bills yet. Enter one from a supplier and issue it when it is ready."
                    : "Nothing matches that filter."}
                </p>
                {bills.length === 0 && (
                  <DemoSeederBanner sectionName="Purchases" onSeeded={load} compact={true} />
                )}
              </div>
            ) : (
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Bills</caption>
                  <thead>
                    <tr>
                      <th scope="col">Number</th>
                      <th scope="col">Supplier</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-right">
                        Total
                      </th>
                      <th scope="col" className="text-right">
                        Outstanding
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((bill) => (
                      <tr
                        key={bill.id}
                        className={bill.id === selectedId ? "is-selected" : undefined}
                        onClick={() => {
                          setSelectedId(bill.id);
                          setPrinting(null);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="mono nowrap">{bill.doc_no ?? "draft"}</td>
                        <td>{bill.party_name || bill.party_code}</td>
                        <td className="muted nowrap">{bill.date}</td>
                        <td className="nowrap">
                          {BILL_STATUS_LABEL[bill.status]}
                          {bill.is_overdue ? (
                            <span className="chip chip--high" style={{ marginLeft: "var(--s-2)" }}>
                              {bill.days_overdue}d late
                            </span>
                          ) : null}
                        </td>
                        <td className="text-right nowrap">
                          <Amount value={bill.total_bdt} size="sm" />
                        </td>
                        <td className="text-right nowrap">
                          <Amount value={bill.outstanding_bdt} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <BillDetail
            bill={selected}
            canWrite={canWrite}
            busy={busy}
            taxRates={taxRates}
            onEdit={startEdit}
            onIssue={issue}
            onDiscard={discard}
            onPreview={preview}
            onVoid={async (bill, reason) => {
              setError(null);
              setNotice(null);
              setBusy(true);
              try {
                const { bill: updated } = await api<{ bill: Bill }>(`/purchases/bills/${bill.id}/void`, {
                  method: "POST",
                  body: { reason },
                });
                replace(updated);
                setNotice(`${updated.doc_no} voided, and its entry reversed. The number is not reissued.`);
              } catch (caught) {
                setError(caught instanceof ApiError ? caught.message : "Could not void that bill.");
              } finally {
                setBusy(false);
              }
            }}
            onDebitNote={async (bill, body) => {
              setError(null);
              setNotice(null);
              setBusy(true);
              try {
                const { debit_note } = await api<{ debit_note: DebitNote }>("/purchases/debit-notes", {
                  method: "POST",
                  body,
                });
                const refreshed = await api<{ bill: Bill }>(`/purchases/bills/${bill.id}`);
                replace(refreshed.bill);
                setNotice(`${debit_note.doc_no} issued for ${debit_note.total_bdt} against ${bill.doc_no}.`);
                return true;
              } catch (caught) {
                setError(caught instanceof ApiError ? caught.message : "Could not raise that debit note.");
                return false;
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      </section>

      {printing && selected ? (
        <section className="section">
          <div className="panel" id="print-preview">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Print preview</h2>
              <div className="row" style={{ gap: "var(--s-2)" }}>
                <button type="button" className="btn btn--sm" onClick={() => window.print()}>
                  Print
                </button>
                <button type="button" className="btn btn--sm btn--quiet" onClick={() => setPrinting(null)}>
                  Close
                </button>
              </div>
            </div>

            <div className="stack">
              <div className="row-between">
                <div className="stack" style={{ gap: "var(--s-1)" }}>
                  <p className="label" style={{ margin: 0 }}>
                    Recorded by
                  </p>
                  <p className="serif" style={{ margin: 0, fontSize: "var(--t-lg)" }}>
                    {printing.name}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    {printing.address || "—"}
                  </p>
                  {printing.bin ? (
                    <p className="mono muted" style={{ margin: 0 }}>
                      BIN/TIN {printing.bin}
                    </p>
                  ) : null}
                </div>
                <div className="stack" style={{ gap: "var(--s-1)", textAlign: "right" }}>
                  <p className="label" style={{ margin: 0 }}>
                    Purchase bill
                  </p>
                  <p className="mono" style={{ margin: 0, fontSize: "var(--t-lg)" }}>
                    {selected.doc_no}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    Dated {selected.date}
                    {selected.due_date ? ` · due ${selected.due_date}` : ""}
                  </p>
                </div>
              </div>

              <div className="divider" />

              <div className="stack" style={{ gap: "var(--s-1)" }}>
                <p className="label" style={{ margin: 0 }}>
                  Supplier
                </p>
                <p style={{ margin: 0 }}>{selected.party_name}</p>
                <p className="mono muted" style={{ margin: 0 }}>
                  {selected.party_code}
                </p>
              </div>

              <LineTable lines={selected.lines as StoredLine[]} />

              <dl className="stack" style={{ gap: "var(--s-2)", margin: 0, alignItems: "flex-end" }}>
                <SummaryRow label="Subtotal" value={selected.subtotal_bdt} />
                <SummaryRow label="Discount" value={selected.discount_total_bdt} />
                <SummaryRow label="Input VAT" value={selected.tax_total_bdt} />
                <SummaryRow label="Total" value={selected.total_bdt} strong />
              </dl>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="row-between" style={{ gap: "var(--s-4)", minWidth: "14rem" }}>
      <dt className="label" style={{ margin: 0 }}>
        {label}
      </dt>
      <dd style={{ margin: 0 }}>
        <Amount value={value} size={strong ? "lg" : "sm"} />
      </dd>
    </div>
  );
}

/**
 * The selected bill, and every action the API will actually accept for it. The
 * buttons are filtered by status rather than offered and then refused.
 */
function BillDetail({
  bill,
  canWrite,
  busy,
  taxRates,
  onEdit,
  onIssue,
  onDiscard,
  onPreview,
  onVoid,
  onDebitNote,
}: {
  bill: Bill | null;
  canWrite: boolean;
  busy: boolean;
  taxRates: CatalogTaxRate[];
  onEdit: (bill: Bill) => void;
  onIssue: (bill: Bill) => Promise<void>;
  onDiscard: (bill: Bill) => Promise<void>;
  onPreview: (bill: Bill) => Promise<void>;
  onVoid: (bill: Bill, reason: string) => Promise<void>;
  onDebitNote: (bill: Bill, body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState<{ date: string; reason: string; lines: ReturnType<typeof emptyLine>[] } | null>(
    null,
  );

  useEffect(() => {
    setVoiding(false);
    setReason("");
    setNote(null);
  }, [bill?.id]);

  if (!bill) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Bill</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pick a bill to see its lines, what has settled it, and what can be done next.
        </p>
      </div>
    );
  }

  const isDraft = bill.status === "DRAFT";
  const isVoid = bill.status === "VOID";

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>
          <span className="mono">{bill.doc_no ?? "draft"}</span> {bill.party_name}
        </h2>
        <span className="label" style={{ margin: 0 }}>
          {BILL_STATUS_LABEL[bill.status]}
        </span>
      </div>

      <div className="stack">
        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
          <SummaryRow label="Date" value={bill.date} />
          <SummaryRow label="Due" value={bill.due_date || `${bill.date} (on issue)`} />
          <SummaryRow label="Total" value={bill.total_bdt} />
          <SummaryRow label="Settled" value={addMoney([bill.paid_bdt, bill.debited_bdt])} />
          <SummaryRow label="Outstanding" value={bill.outstanding_bdt} strong />
        </dl>

        {bill.paid_bdt !== "0.00" || bill.debited_bdt !== "0.00" ? (
          <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
            Settled by {bill.paid_bdt} in payments and {bill.debited_bdt} in debit notes.
          </p>
        ) : null}

        {isVoid ? (
          <p className="alert alert--error" role="status" style={{ margin: 0 }}>
            Voided: {bill.void_reason}
          </p>
        ) : null}

        <LineTable lines={bill.lines as StoredLine[]} />

        {!canWrite ? (
          <p className="muted" style={{ margin: 0 }}>
            Your role can read payables but not change them.
          </p>
        ) : (
          <div className="stack" style={{ gap: "var(--s-3)" }}>
            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              {isDraft ? (
                <>
                  <button className="btn btn--sm" type="button" disabled={busy} onClick={() => void onIssue(bill)}>
                    Issue
                  </button>
                  <button className="btn btn--sm btn--quiet" type="button" disabled={busy} onClick={() => onEdit(bill)}>
                    Edit
                  </button>
                  <button
                    className="btn btn--sm btn--danger"
                    type="button"
                    disabled={busy}
                    onClick={() => void onDiscard(bill)}
                  >
                    Discard
                  </button>
                </>
              ) : null}

              {!isDraft && !isVoid ? (
                <>
                  <button
                    className="btn btn--sm btn--quiet"
                    type="button"
                    disabled={busy}
                    onClick={() => void onPreview(bill)}
                  >
                    Print preview
                  </button>
                  <button
                    className="btn btn--sm btn--quiet"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setNote(
                        note
                          ? null
                          : { date: bill.date, reason: "", lines: bill.lines.map((line) => lineFromStored(line)) },
                      )
                    }
                  >
                    {note ? "Close debit note" : "Raise debit note"}
                  </button>
                  <button className="btn btn--sm btn--danger" type="button" disabled={busy} onClick={() => setVoiding(!voiding)}>
                    {voiding ? "Close" : "Void"}
                  </button>
                </>
              ) : null}
            </div>

            {voiding ? (
              <div className="panel panel--sunk">
                <div className="field">
                  <label className="label" htmlFor="bill-void-reason">
                    Why is this bill being voided?
                  </label>
                  <input
                    id="bill-void-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Entered against the wrong supplier"
                  />
                  <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                    Required, and kept. The entry is reversed rather than deleted, so the number stays
                    visible with the reason beside it.
                  </p>
                </div>
                <div className="row" style={{ marginTop: "var(--s-3)" }}>
                  <button
                    className="btn btn--sm btn--danger"
                    type="button"
                    disabled={busy || reason.trim().length < 3}
                    onClick={() => void onVoid(bill, reason.trim())}
                  >
                    Void {bill.doc_no}
                  </button>
                </div>
              </div>
            ) : null}

            {note ? (
              <DebitNoteForm
                bill={bill}
                draft={note}
                taxRates={taxRates}
                busy={busy}
                onChange={setNote}
                onSubmit={async () => {
                  const totals = previewTotals(note.lines, taxRates);
                  if (!totals.complete) return;
                  if (note.reason.trim().length < 3) return;
                  const done = await onDebitNote(bill, {
                    bill_id: bill.id,
                    date: note.date,
                    reason: note.reason.trim(),
                    lines: note.lines.map(toRequestLine),
                  });
                  if (done) setNote(null);
                }}
                preview={previewTotals(note.lines, taxRates)}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/** The debit note form: the bill's own lines, ready to be trimmed down to what
 *  the supplier actually gave back. */
function DebitNoteForm({
  bill,
  draft,
  taxRates,
  busy,
  onChange,
  onSubmit,
  preview,
}: {
  bill: Bill;
  draft: { date: string; reason: string; lines: ReturnType<typeof emptyLine>[] };
  taxRates: CatalogTaxRate[];
  busy: boolean;
  onChange: (next: { date: string; reason: string; lines: ReturnType<typeof emptyLine>[] }) => void;
  onSubmit: () => Promise<void>;
  preview: ReturnType<typeof previewTotals>;
}) {
  const exceeds = Number(preview.total) > Number(bill.outstanding_bdt);
  const ready = draft.reason.trim().length >= 3 && preview.complete && !exceeds && Number(preview.total) > 0;

  return (
    <div className="panel panel--sunk">
      <div className="panel-head">
        <h3 style={{ fontSize: "var(--t-base)" }}>Debit note against {bill.doc_no}</h3>
      </div>

      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          {bill.outstanding_bdt} of this bill is still outstanding, and that is the most that can be
          debited. Anything beyond it is a prepayment, which a payment records.
        </p>

        <div className="grid grid-2">
          <div className="field">
            <label className="label" htmlFor="debit-date">
              Date
            </label>
            <input
              id="debit-date"
              type="date"
              value={draft.date}
              onChange={(event) => onChange({ ...draft, date: event.target.value })}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="debit-reason">
              Why is this debit being raised?
            </label>
            <input
              id="debit-reason"
              value={draft.reason}
              onChange={(event) => onChange({ ...draft, reason: event.target.value })}
              placeholder="Two units delivered damaged"
            />
          </div>
        </div>

        <PurchaseLineEditor
          lines={draft.lines}
          onChange={(lines) => onChange({ ...draft, lines })}
          items={[]}
          taxRates={taxRates}
          accounts={[]}
          {...PURCHASE_EDITOR_DEFAULTS}
        />

        {exceeds ? (
          <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
            That is more than the {bill.outstanding_bdt} still owed on this bill.
          </p>
        ) : null}

        <div className="row">
          <button className="btn btn--sm" type="button" disabled={busy || !ready} onClick={() => void onSubmit()}>
            Issue debit note
          </button>
        </div>
      </div>
    </div>
  );
}
