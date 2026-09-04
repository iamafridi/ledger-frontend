"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import {
  LineEditor,
  LineTable,
  emptyLine,
  lineFromStored,
  previewTotals,
  toRequestLine,
  type DraftLine,
} from "@/components/sales/document-lines";
import { api, ApiError } from "@/lib/api";
import { addMoney, toCanonical } from "@/lib/money";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABEL,
  type Account,
  type CatalogTaxRate,
  type CreditNote,
  type DocumentWarning,
  type Invoice,
  type InvoiceStatus,
  type Item,
  type OrgProfile,
  type Party,
} from "@/lib/types";
import { DemoSeederBanner } from "@/components/demo-seeder-banner";
import { Mushak63ChallanModal } from "@/components/sales/mushak-6-3-challan";

/**
 * Sales — invoice → receipt → credit note (plan §6, Phase 3).
 *
 * Three things this screen refuses to do, each for the same reason:
 *
 *   1. **It never edits an issued invoice.** A draft is edited; an issued one is
 *      voided and re-raised. The number on the customer's copy has to keep
 *      meaning exactly what it says.
 *   2. **It never sets a paid status.** Status is derived from the receipts and
 *      credit notes pointed at the invoice, so there is no control here that
 *      could make the status and the ledger disagree.
 *   3. **It never discards an issued invoice.** Only a draft can be discarded;
 *      an issued one is voided, which leaves both it and its reversing entry in
 *      the record.
 *
 * The credit-limit and due-date warnings the API returns are shown where the
 * action happened rather than in a banner that could belong to any of them: a
 * warning about a customer's exposure is useless a screen later.
 */

interface Draft {
  party_id: string;
  date: string;
  due_date: string;
  memo: string;
  lines: DraftLine[];
}

const today = (): string => new Date().toISOString().slice(0, 10);

const emptyDraft = (): Draft => ({
  party_id: "",
  date: today(),
  due_date: "",
  memo: "",
  lines: [emptyLine()],
});

export default function SalesPage() {
  const { can } = useSession();
  const canWrite = can("sales.write");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [taxRates, setTaxRates] = useState<CatalogTaxRate[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<DocumentWarning[]>([]);
  const [busy, setBusy] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"ALL" | InvoiceStatus>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editing, setEditing] = useState<"none" | "create" | "edit">("none");
  const [printing, setPrinting] = useState<OrgProfile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoiceRows, partyRows, itemRows, rateRows, accountRows] = await Promise.all([
        api<{ invoices: Invoice[] }>("/sales/invoices?limit=200"),
        api<{ parties: Party[] }>("/parties"),
        api<{ items: Item[] }>("/items"),
        api<{ tax_rates: CatalogTaxRate[] }>("/catalogs/tax-rates"),
        api<{ accounts: Account[] }>("/coa"),
      ]);
      setInvoices(invoiceRows.invoices);
      // A sales document goes to a customer, so a supplier-only party is not a
      // possible choice here rather than a mistake to be refused later.
      setParties(partyRows.parties.filter((party) => party.kind !== "SUPPLIER"));
      setItems(itemRows.items);
      setTaxRates(rateRows.tax_rates.filter((rate) => rate.is_active));
      // Only revenue accounts can hold a sale, and only an active one can be
      // posted to — the picker offers exactly those.
      setAccounts(accountRows.accounts.filter((account) => account.type === "REVENUE" && account.is_active));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load sales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = invoices.find((row) => row.id === selectedId) ?? null;

  const visible = useMemo(
    () => (statusFilter === "ALL" ? invoices : invoices.filter((row) => row.status === statusFilter)),
    [invoices, statusFilter],
  );

  const outstandingTotal = useMemo(
    () => addMoney(invoices.filter((row) => row.status !== "VOID" && row.status !== "DRAFT").map((row) => row.outstanding_bdt)),
    [invoices],
  );

  function replace(next: Invoice): void {
    setInvoices((rows) => {
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

  function startEdit(invoice: Invoice): void {
    setDraft({
      party_id: invoice.party_id,
      date: invoice.date,
      due_date: invoice.due_date,
      memo: invoice.memo,
      lines: invoice.lines.length ? invoice.lines.map((line) => lineFromStored(line)) : [emptyLine()],
    });
    setEditing("edit");
    setNotice(null);
    setWarnings([]);
    setPrinting(null);
  }

  /** The draft is only sent when every line can be totalled, so the API is never
   *  asked to guess what a half-typed price meant. */
  function readyToSend(): string | null {
    if (!draft.party_id) return "Pick the customer this is being issued to.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return "Give the document a date.";
    if (draft.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(draft.due_date)) return "Give the due date in full, or leave it blank.";
    for (const [index, line] of draft.lines.entries()) {
      if (!toCanonical(line.unit_price_bdt).ok) return `Line ${index + 1} needs a unit price.`;
      if (toCanonical(line.discount_bdt || "0").ok === false) return `Line ${index + 1} has a discount that is not a number.`;
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
        const { invoice } = await api<{ invoice: Invoice }>(`/sales/invoices/${selected.id}`, {
          method: "PATCH",
          body,
        });
        replace(invoice);
        setSelectedId(invoice.id);
        setNotice(`Draft updated — still no number claimed, still nothing posted.`);
      } else {
        const { invoice } = await api<{ invoice: Invoice }>("/sales/invoices", { method: "POST", body });
        replace(invoice);
        setSelectedId(invoice.id);
        setNotice("Draft saved. It claims no number until you issue it.");
      }
      setEditing("none");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save that invoice.");
    } finally {
      setBusy(false);
    }
  }

  async function issue(invoice: Invoice): Promise<void> {
    setError(null);
    setNotice(null);
    setWarnings([]);
    setBusy(true);
    try {
      const result = await api<{ invoice: Invoice; warnings: DocumentWarning[] }>(
        `/sales/invoices/${invoice.id}/issue`,
        { method: "POST" },
      );
      replace(result.invoice);
      setSelectedId(result.invoice.id);
      setWarnings(result.warnings);
      setNotice(`Issued as ${result.invoice.doc_no} — the receivable is now in the books.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not issue that invoice.");
    } finally {
      setBusy(false);
    }
  }

  async function discard(invoice: Invoice): Promise<void> {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await api<{ discarded: boolean }>(`/sales/invoices/${invoice.id}`, { method: "DELETE" });
      setInvoices((rows) => rows.filter((row) => row.id !== invoice.id));
      setSelectedId(null);
      setNotice("Draft discarded. It never claimed a number, so the sequence has no gap.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not discard that draft.");
    } finally {
      setBusy(false);
    }
  }

  async function preview(invoice: Invoice): Promise<void> {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { document } = await api<{ document: { org: OrgProfile; invoice: Invoice } }>(
        `/sales/invoices/${invoice.id}/print`,
      );
      setPrinting(document.org);
      replace(document.invoice);
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
            04 &nbsp; Sales
          </p>
          <nav className="row" style={{ gap: "var(--s-3)" }}>
            <Link className="btn btn--sm btn--quiet" href="/sales/receipts">
              Receipts
            </Link>
            <Link className="btn btn--sm btn--quiet" href="/sales/receivables">
              Receivables
            </Link>
            {canWrite ? (
              <button type="button" className="btn btn--sm" onClick={startCreate}>
                New invoice
              </button>
            ) : null}
          </nav>
        </div>

        <div className="row-between" style={{ marginTop: "var(--s-3)" }}>
          <p className="muted" style={{ margin: 0, maxWidth: "62ch" }}>
            What customers owe you. A draft claims no number and posts nothing; issuing claims the next
            number and debits Accounts Receivable; receipts and credit notes settle it.
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
            <strong>{warning.code === "CREDIT_LIMIT" ? "Credit limit" : "Due date"}:</strong> {warning.message}
          </p>
        ))}

        {editing !== "none" ? (
          <div className="panel" style={{ marginTop: "var(--s-3)", marginBottom: "var(--s-4)" }}>
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>
                {editing === "edit" ? "Edit draft" : "New invoice"}
              </h2>
            </div>

            <form className="stack" onSubmit={saveDraft} noValidate>
              <div className="grid grid-3">
                <div className="field">
                  <label className="label" htmlFor="invoice-party">
                    Customer
                  </label>
                  <select
                    id="invoice-party"
                    value={draft.party_id}
                    onChange={(event) => setDraft({ ...draft, party_id: event.target.value })}
                    required
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
                  <label className="label" htmlFor="invoice-date">
                    Date
                  </label>
                  <input
                    id="invoice-date"
                    type="date"
                    value={draft.date}
                    onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                    required
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="invoice-due">
                    Due <span className="faint">optional</span>
                  </label>
                  <input
                    id="invoice-due"
                    type="date"
                    value={draft.due_date}
                    onChange={(event) => setDraft({ ...draft, due_date: event.target.value })}
                  />
                  <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                    Blank means due on the invoice date — that is what aging measures from.
                  </p>
                </div>

                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label className="label" htmlFor="invoice-memo">
                    Memo <span className="faint">optional</span>
                  </label>
                  <input
                    id="invoice-memo"
                    value={draft.memo}
                    onChange={(event) => setDraft({ ...draft, memo: event.target.value })}
                    placeholder="March supply"
                  />
                </div>
              </div>

              <LineEditor
                lines={draft.lines}
                onChange={(lines) => setDraft({ ...draft, lines })}
                items={items}
                taxRates={taxRates}
                accounts={accounts}
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
            {(["ALL", ...INVOICE_STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn--sm ${statusFilter === status ? "" : "btn--quiet"}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" ? "All" : INVOICE_STATUS_LABEL[status]}
              </button>
            ))}
          </div>
          <p className="label" style={{ margin: 0 }}>
            {visible.length} invoices
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
                  {invoices.length === 0
                    ? "No invoices yet. Raise one for a customer and issue it when it is ready."
                    : "Nothing matches that filter."}
                </p>
                {invoices.length === 0 && (
                  <DemoSeederBanner sectionName="Sales" onSeeded={load} compact={true} />
                )}
              </div>
            ) : (
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Invoices</caption>
                  <thead>
                    <tr>
                      <th scope="col">Number</th>
                      <th scope="col">Customer</th>
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
                    {visible.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={invoice.id === selectedId ? "is-selected" : undefined}
                        onClick={() => {
                          setSelectedId(invoice.id);
                          setPrinting(null);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="mono nowrap">{invoice.doc_no ?? "draft"}</td>
                        <td>{invoice.party_name || invoice.party_code}</td>
                        <td className="muted nowrap">{invoice.date}</td>
                        <td className="nowrap">
                          {INVOICE_STATUS_LABEL[invoice.status]}
                          {invoice.is_overdue ? (
                            <span className="chip chip--high" style={{ marginLeft: "var(--s-2)" }}>
                              {invoice.days_overdue}d late
                            </span>
                          ) : null}
                        </td>
                        <td className="text-right nowrap">
                          <Amount value={invoice.total_bdt} size="sm" />
                        </td>
                        <td className="text-right nowrap">
                          <Amount value={invoice.outstanding_bdt} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <InvoiceDetail
            invoice={selected}
            canWrite={canWrite}
            busy={busy}
            taxRates={taxRates}
            onEdit={startEdit}
            onIssue={issue}
            onDiscard={discard}
            onPreview={preview}
            onVoid={async (invoice, reason) => {
              setError(null);
              setNotice(null);
              setBusy(true);
              try {
                const { invoice: updated } = await api<{ invoice: Invoice }>(
                  `/sales/invoices/${invoice.id}/void`,
                  { method: "POST", body: { reason } },
                );
                replace(updated);
                setNotice(`${updated.doc_no} voided, and its entry reversed. The number is not reissued.`);
              } catch (caught) {
                setError(caught instanceof ApiError ? caught.message : "Could not void that invoice.");
              } finally {
                setBusy(false);
              }
            }}
            onCreditNote={async (invoice, body) => {
              setError(null);
              setNotice(null);
              setBusy(true);
              try {
                const { credit_note } = await api<{ credit_note: CreditNote }>("/sales/credit-notes", {
                  method: "POST",
                  body,
                });
                const refreshed = await api<{ invoice: Invoice }>(`/sales/invoices/${invoice.id}`);
                replace(refreshed.invoice);
                setNotice(`${credit_note.doc_no} issued for ${credit_note.total_bdt} against ${invoice.doc_no}.`);
                return true;
              } catch (caught) {
                setError(caught instanceof ApiError ? caught.message : "Could not raise that credit note.");
                return false;
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      </section>

      {printing && selected ? (
        <Mushak63ChallanModal
          invoice={selected}
          org={printing}
          onClose={() => setPrinting(null)}
        />
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
 * The selected invoice, and every action the API will actually accept for it.
 *
 * The buttons are filtered by status rather than offered and then refused: a
 * draft can be edited, issued or discarded; an issued invoice can be printed,
 * credited or voided; neither can be put into PARTIALLY_PAID by hand.
 */
function InvoiceDetail({
  invoice,
  canWrite,
  busy,
  taxRates,
  onEdit,
  onIssue,
  onDiscard,
  onPreview,
  onVoid,
  onCreditNote,
}: {
  invoice: Invoice | null;
  canWrite: boolean;
  busy: boolean;
  taxRates: CatalogTaxRate[];
  onEdit: (invoice: Invoice) => void;
  onIssue: (invoice: Invoice) => Promise<void>;
  onDiscard: (invoice: Invoice) => Promise<void>;
  onPreview: (invoice: Invoice) => Promise<void>;
  onVoid: (invoice: Invoice, reason: string) => Promise<void>;
  onCreditNote: (invoice: Invoice, body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState<{ date: string; reason: string; lines: DraftLine[] } | null>(null);

  useEffect(() => {
    setVoiding(false);
    setReason("");
    setNote(null);
  }, [invoice?.id]);

  if (!invoice) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Invoice</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pick an invoice to see its lines, what has settled it, and what can be done next.
        </p>
      </div>
    );
  }

  const isDraft = invoice.status === "DRAFT";
  const isVoid = invoice.status === "VOID";

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>
          <span className="mono">{invoice.doc_no ?? "draft"}</span> {invoice.party_name}
        </h2>
        <span className="label" style={{ margin: 0 }}>
          {INVOICE_STATUS_LABEL[invoice.status]}
        </span>
      </div>

      <div className="stack">
        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
          <SummaryRow label="Date" value={invoice.date} />
          <SummaryRow label="Due" value={invoice.due_date || `${invoice.date} (on issue)`} />
          <SummaryRow label="Total" value={invoice.total_bdt} />
          <SummaryRow label="Settled" value={addMoney([invoice.paid_bdt, invoice.credited_bdt])} />
          <SummaryRow label="Outstanding" value={invoice.outstanding_bdt} strong />
        </dl>

        {invoice.paid_bdt !== "0.00" || invoice.credited_bdt !== "0.00" ? (
          <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
            Settled by {invoice.paid_bdt} in receipts and {invoice.credited_bdt} in credit notes.
          </p>
        ) : null}

        {isVoid ? (
          <p className="alert alert--error" role="status" style={{ margin: 0 }}>
            Voided: {invoice.void_reason}
          </p>
        ) : null}

        <LineTable lines={invoice.lines} />

        {!canWrite ? (
          <p className="muted" style={{ margin: 0 }}>
            Your role can read receivables but not change them.
          </p>
        ) : (
          <div className="stack" style={{ gap: "var(--s-3)" }}>
            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              {isDraft ? (
                <>
                  <button className="btn btn--sm" type="button" disabled={busy} onClick={() => void onIssue(invoice)}>
                    Issue
                  </button>
                  <button className="btn btn--sm btn--quiet" type="button" disabled={busy} onClick={() => onEdit(invoice)}>
                    Edit
                  </button>
                  <button className="btn btn--sm btn--danger" type="button" disabled={busy} onClick={() => void onDiscard(invoice)}>
                    Discard
                  </button>
                </>
              ) : null}

              {!isDraft && !isVoid ? (
                <>
                  <button className="btn btn--sm" type="button" disabled={busy} onClick={() => void onPreview(invoice)}>
                    Print Mushak 6.3 Challan
                  </button>
                  <button
                    className="btn btn--sm btn--quiet"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setNote(
                        note
                          ? null
                          : { date: invoice.date, reason: "", lines: invoice.lines.map((line) => lineFromStored(line)) },
                      )
                    }
                  >
                    {note ? "Close credit note" : "Raise credit note"}
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
                  <label className="label" htmlFor="void-reason">
                    Why is this invoice being voided?
                  </label>
                  <input
                    id="void-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Raised against the wrong customer"
                  />
                  <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                    Required, and kept. The entry is reversed rather than deleted, so the voucher number
                    stays visible with the reason beside it.
                  </p>
                </div>
                <div className="row" style={{ marginTop: "var(--s-3)" }}>
                  <button
                    className="btn btn--sm btn--danger"
                    type="button"
                    disabled={busy || reason.trim().length < 3}
                    onClick={() => void onVoid(invoice, reason.trim())}
                  >
                    Void {invoice.doc_no}
                  </button>
                </div>
              </div>
            ) : null}

            {note ? (
              <CreditNoteForm
                invoice={invoice}
                draft={note}
                taxRates={taxRates}
                busy={busy}
                onChange={setNote}
                onSubmit={async () => {
                  const totals = previewTotals(note.lines, taxRates);
                  if (!totals.complete) return;
                  if (note.reason.trim().length < 3) return;
                  const done = await onCreditNote(invoice, {
                    invoice_id: invoice.id,
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

/** The credit note form: the invoice's own lines, ready to be trimmed down to
 *  what is actually being given back. */
function CreditNoteForm({
  invoice,
  draft,
  taxRates,
  busy,
  onChange,
  onSubmit,
  preview,
}: {
  invoice: Invoice;
  draft: { date: string; reason: string; lines: DraftLine[] };
  taxRates: CatalogTaxRate[];
  busy: boolean;
  onChange: (next: { date: string; reason: string; lines: DraftLine[] }) => void;
  onSubmit: () => Promise<void>;
  preview: ReturnType<typeof previewTotals>;
}) {
  const exceeds = Number(preview.total) > Number(invoice.outstanding_bdt);
  const ready = draft.reason.trim().length >= 3 && preview.complete && !exceeds && Number(preview.total) > 0;

  return (
    <div className="panel panel--sunk">
      <div className="panel-head">
        <h3 style={{ fontSize: "var(--t-base)" }}>Credit note against {invoice.doc_no}</h3>
      </div>

      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          {invoice.outstanding_bdt} of this invoice is still outstanding, and that is the most that can be
          credited. Anything beyond it is a customer advance, which a receipt records.
        </p>

        <div className="grid grid-2">
          <div className="field">
            <label className="label" htmlFor="credit-date">
              Date
            </label>
            <input
              id="credit-date"
              type="date"
              value={draft.date}
              onChange={(event) => onChange({ ...draft, date: event.target.value })}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="credit-reason">
              Why is this credit being given?
            </label>
            <input
              id="credit-reason"
              value={draft.reason}
              onChange={(event) => onChange({ ...draft, reason: event.target.value })}
              placeholder="Two units returned damaged"
            />
          </div>
        </div>

        <LineEditor
          lines={draft.lines}
          onChange={(lines) => onChange({ ...draft, lines })}
          items={[]}
          taxRates={taxRates}
          accounts={[]}
        />

        {exceeds ? (
          <p className="alert alert--error" role="alert" style={{ margin: 0 }}>
            That is more than the {invoice.outstanding_bdt} still owed on this invoice.
          </p>
        ) : null}

        <div className="row">
          <button className="btn btn--sm" type="button" disabled={busy || !ready} onClick={() => void onSubmit()}>
            Issue credit note
          </button>
        </div>
      </div>
    </div>
  );
}
