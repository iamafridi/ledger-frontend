"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import type {
  Account,
  Advance,
  AdvanceDetail,
  AdvanceLedger,
  AdvanceOutstanding,
  OutstandingBill,
  OutstandingInvoice,
  Party,
} from "@/lib/types";

/**
 * Advances and credit control (plan §6, Phase 10; ADR 0004).
 *
 * One question, three answers: whose money are we holding, which document has
 * claimed it, and what does the balance have to be at a date.
 *
 * **The status is never set here.** An advance is OPEN, PARTIALLY_ADJUSTED or
 * FULLY_ADJUSTED because of the rows that claim it, and the server derives that
 * after every write — the same way an invoice is never marked PAID by hand. So
 * this screen shows the derived status and offers only the acts that change the
 * underlying rows: record an advance, claim one against a document, and inspect
 * the claims.
 *
 * The ledger tab is the reconciliation: advances are the positive rows and their
 * claims the negative ones, and the closing balance it prints must equal the
 * per-party outstanding on the first tab at the same date. That is the same
 * formula read two ways, which is why both are computed on the server from the
 * same collection rather than assembled here.
 */

type Tab = "outstanding" | "ledger";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "outstanding", label: "Outstanding" },
  { key: "ledger", label: "Ledger" },
];

const today = (): string => new Date().toISOString().slice(0, 10);

const STATUS_LABEL: Record<Advance["status"], string> = {
  OPEN: "open",
  PARTIALLY_ADJUSTED: "partly claimed",
  FULLY_ADJUSTED: "fully claimed",
};

const SOURCE_LABEL: Record<Advance["source"], string> = {
  MANUAL: "recorded by hand",
  RECEIPT_REMAINDER: "receipt remainder",
  PAYMENT_PREPAYMENT: "payment prepayment",
};

export default function AdvancesPage() {
  const { can } = useSession();
  const canWrite = can("advances.write");

  const [tab, setTab] = useState<Tab>("outstanding");

  const [advances, setAdvances] = useState<Advance[]>([]);
  const [outstanding, setOutstanding] = useState<AdvanceOutstanding[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"" | Advance["status"]>("");
  const [partyFilter, setPartyFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdvanceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [draft, setDraft] = useState({
    party_id: "",
    date: today(),
    amount_bdt: "",
    account_code: "",
    reference: "",
    notes: "",
  });

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyDraft, setApplyDraft] = useState<{
    document_type: "INVOICE" | "BILL";
    document_id: string;
    amount_bdt: string;
    date: string;
  }>({ document_type: "INVOICE", document_id: "", amount_bdt: "", date: "" });
  const [openInvoices, setOpenInvoices] = useState<OutstandingInvoice[]>([]);
  const [openBills, setOpenBills] = useState<OutstandingBill[]>([]);

  const [ledgerParty, setLedgerParty] = useState("");
  const [ledgerFrom, setLedgerFrom] = useState("");
  const [ledgerTo, setLedgerTo] = useState("");
  const [ledger, setLedger] = useState<AdvanceLedger | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, perParty, partyData, accountData] = await Promise.all([
        api<{ advances: Advance[] }>("/advances"),
        api<{ outstanding: AdvanceOutstanding[] }>("/advances/outstanding"),
        api<{ parties: Party[] }>("/parties"),
        api<{ accounts: Account[] }>("/coa"),
      ]);
      setAdvances(list.advances);
      setOutstanding(perParty.outstanding);
      setParties(partyData.parties.filter((row) => row.is_active));
      setAccounts(accountData.accounts);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the advance ledger.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const { advance } = await api<{ advance: AdvanceDetail }>(`/advances/${id}`);
      setDetail(advance);
    } catch (caught) {
      setDetail(null);
      setError(caught instanceof ApiError ? caught.message : "Could not open that advance.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) void loadDetail(selected);
    else setDetail(null);
  }, [selected, loadDetail]);

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const query = new URLSearchParams();
      if (ledgerParty) query.set("party_id", ledgerParty);
      if (ledgerFrom) query.set("from", ledgerFrom);
      if (ledgerTo) query.set("to", ledgerTo);
      const suffix = query.toString();
      setLedger(await api<AdvanceLedger>(`/advances/ledger${suffix ? `?${suffix}` : ""}`));
    } catch (caught) {
      setLedger(null);
      setError(caught instanceof ApiError ? caught.message : "Could not build the advance ledger.");
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerParty, ledgerFrom, ledgerTo]);

  useEffect(() => {
    if (tab !== "ledger") return;
    void loadLedger();
  }, [tab, loadLedger]);

  // The document picker for "claim an advance": only what still has something
  // owing, oldest first from the server, is offered.
  useEffect(() => {
    if (!applyOpen) return;
    let cancelled = false;
    void (async () => {
      try {
        const [sales, purchases] = await Promise.all([
          api<{ invoices: OutstandingInvoice[] }>("/sales/outstanding"),
          api<{ bills: OutstandingBill[] }>("/purchases/outstanding"),
        ]);
        if (!cancelled) {
          setOpenInvoices(sales.invoices);
          setOpenBills(purchases.bills);
        }
      } catch {
        // The picker is a convenience; typing a document id is not offered, so a
        // failure here just leaves the lists empty rather than failing the page.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyOpen]);

  const assetAccounts = useMemo(() => accounts.filter((row) => row.type === "ASSET"), [accounts]);

  const filtered = useMemo(
    () =>
      advances.filter(
        (row) =>
          (statusFilter === "" || row.status === statusFilter) &&
          (partyFilter === "" || row.party_id === partyFilter),
      ),
    [advances, statusFilter, partyFilter],
  );

  const totalOutstanding = useMemo(
    () =>
      outstanding.reduce((sum, row) => sum + Number(row.outstanding_bdt), 0).toFixed(2),
    [outstanding],
  );

  function reset(): void {
    setNotice(null);
    setError(null);
  }

  async function createAdvance(event: React.FormEvent) {
    event.preventDefault();
    reset();
    if (draft.party_id === "" || draft.amount_bdt.trim() === "") return;

    setBusy(true);
    try {
      const { advance } = await api<{ advance: AdvanceDetail }>("/advances", {
        method: "POST",
        body: {
          party_id: draft.party_id,
          date: draft.date,
          amount_bdt: draft.amount_bdt.trim(),
          account_code: draft.account_code,
          reference: draft.reference.trim(),
          notes: draft.notes.trim(),
        },
      });
      const msg = `Recorded ${advance.amount_bdt} taka held for ${advance.party_name}. ` +
        `It posts as cash against ${advance.account_name || advance.account_code}, and an invoice for them can claim it.`;
      setNotice(msg);
      toast.success(msg);
      setDraft({ ...draft, amount_bdt: "", reference: "", notes: "" });
      await load();
      setSelected(advance.id);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not record that advance.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function applyAdvance(event: React.FormEvent) {
    event.preventDefault();
    reset();
    if (applyDraft.document_id === "" || applyDraft.amount_bdt.trim() === "") return;

    setBusy(true);
    try {
      const result = await api<{ document_no: string; rows: Array<{ amount: string }> }>("/advances/apply", {
        method: "POST",
        body: {
          document_type: applyDraft.document_type,
          document_id: applyDraft.document_id,
          amount_bdt: applyDraft.amount_bdt.trim(),
          ...(applyDraft.date ? { date: applyDraft.date } : {}),
        },
      });
      const spread = result.rows.length > 1 ? ` from ${result.rows.length} advances, oldest first` : "";
      const msg = `Claimed ${applyDraft.amount_bdt.trim()} taka of advance against ${result.document_no || "the document"}${spread}. ` +
        "Nothing was posted — that money was already in the ledger when it arrived.";
      setNotice(msg);
      toast.success(msg);
      setApplyDraft({ ...applyDraft, document_id: "", amount_bdt: "" });
      setApplyOpen(false);
      await load();
      if (selected) await loadDetail(selected);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not claim that advance.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  const documentOptions =
    applyDraft.document_type === "INVOICE"
      ? openInvoices.map((row) => ({
          id: row.id,
          label: `${row.doc_no ?? "draft"} — ${row.party_name} — ${row.outstanding_bdt} owing`,
          party_id: row.party_id,
        }))
      : openBills.map((row) => ({
          id: row.id,
          label: `${row.doc_no ?? "draft"} — ${row.party_name} — ${row.outstanding_bdt} owing`,
          party_id: row.party_id,
        }));

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Advances
          </p>
          {outstanding.length > 0 ? (
            <div className="row" style={{ gap: "var(--s-4)", flexWrap: "wrap" }}>
              <Stat label="Parties holding money" value={String(outstanding.length)} />
              <Stat label="Total held" value={totalOutstanding} money />
            </div>
          ) : null}
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "70ch" }}>
          Money a party has paid that no document has claimed yet. When a customer pays more than they owe, or pays
          before anything is owed, the difference is held on their account until an invoice claims it — and claiming it
          posts nothing, because the money reached the ledger when it arrived. The integrity run asserts that
          &Sigma; advances &minus; &Sigma; claims is never negative for anybody.
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

        <div className="row" style={{ gap: "var(--s-2)", marginTop: "var(--s-5)" }}>
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={`btn btn--sm ${tab === entry.key ? "" : "btn--quiet"}`}
              aria-pressed={tab === entry.key}
              onClick={() => {
                setTab(entry.key);
                reset();
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className="section">
          <div className="stack">
            {[0, 1, 2].map((row) => (
              <div className="skeleton" key={row} style={{ height: "2rem" }} />
            ))}
          </div>
        </section>
      ) : tab === "outstanding" ? (
        <>
          {canWrite ? (
            <section className="section">
              <div className="panel">
                <div className="panel-head">
                  <h2 style={{ fontSize: "var(--t-lg)" }}>Record an advance</h2>
                  <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
                    money already in hand, with no receipt behind it
                  </span>
                </div>
                <form className="stack" onSubmit={createAdvance} noValidate>
                  <div className="grid grid-3">
                    <div className="field">
                      <label className="label" htmlFor="adv-party">
                        Party
                      </label>
                      <select
                        id="adv-party"
                        value={draft.party_id}
                        onChange={(event) => setDraft({ ...draft, party_id: event.target.value })}
                        required
                      >
                        <option value="">Choose a party…</option>
                        {parties.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.code} — {row.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="adv-date">
                        Date
                      </label>
                      <input
                        id="adv-date"
                        type="date"
                        className="mono"
                        value={draft.date}
                        onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="adv-amount">
                        Amount
                      </label>
                      <input
                        id="adv-amount"
                        inputMode="decimal"
                        className="mono"
                        value={draft.amount_bdt}
                        onChange={(event) => setDraft({ ...draft, amount_bdt: event.target.value })}
                        placeholder="50000.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-3">
                    <div className="field">
                      <label className="label" htmlFor="adv-account">
                        Money sits in
                      </label>
                      <select
                        id="adv-account"
                        value={draft.account_code}
                        onChange={(event) => setDraft({ ...draft, account_code: event.target.value })}
                      >
                        <option value="">1000 — Cash on Hand</option>
                        {assetAccounts.map((row) => (
                          <option key={row.id} value={row.code}>
                            {row.code} — {row.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="adv-reference">
                        Reference <span className="faint">optional</span>
                      </label>
                      <input
                        id="adv-reference"
                        value={draft.reference}
                        onChange={(event) => setDraft({ ...draft, reference: event.target.value })}
                        placeholder="cheque number, or a note"
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="adv-notes">
                        Notes <span className="faint">optional</span>
                      </label>
                      <input
                        id="adv-notes"
                        value={draft.notes}
                        onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                        placeholder="what it is for"
                      />
                    </div>
                  </div>

                  <p className="note" style={{ margin: 0 }}>
                    A customer&rsquo;s advance posts <span className="mono">DR the account above / CR their control account</span>; a
                    supplier&rsquo;s prepayment is the mirror. A receipt overpayment parks itself here automatically — record one by
                    hand only when no receipt was raised.
                  </p>

                  <div className="row" style={{ gap: "var(--s-3)" }}>
                    <button
                      className="btn"
                      type="submit"
                      disabled={busy || draft.party_id === "" || draft.amount_bdt.trim() === ""}
                    >
                      {busy ? "Recording…" : "Record advance"}
                    </button>
                    {canWrite ? (
                      <button
                        className="btn btn--quiet"
                        type="button"
                        onClick={() => {
                          reset();
                          setApplyOpen(!applyOpen);
                        }}
                      >
                        {applyOpen ? "Close the claim box" : "Claim an advance against a document"}
                      </button>
                    ) : null}
                  </div>
                </form>

                {applyOpen ? (
                  <form className="stack" onSubmit={applyAdvance} noValidate style={{ marginTop: "var(--s-5)" }}>
                    <h3 className="label">Claim against a document</h3>
                    <div className="grid grid-3">
                      <div className="field">
                        <label className="label" htmlFor="apply-type">
                          Document
                        </label>
                        <select
                          id="apply-type"
                          value={applyDraft.document_type}
                          onChange={(event) =>
                            setApplyDraft({
                              ...applyDraft,
                              document_type: event.target.value as "INVOICE" | "BILL",
                              document_id: "",
                            })
                          }
                        >
                          <option value="INVOICE">Invoice (customer advance)</option>
                          <option value="BILL">Bill (supplier prepayment)</option>
                        </select>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="apply-document">
                          Which one
                        </label>
                        <select
                          id="apply-document"
                          value={applyDraft.document_id}
                          onChange={(event) => setApplyDraft({ ...applyDraft, document_id: event.target.value })}
                          required
                        >
                          <option value="">Choose an open document…</option>
                          {documentOptions.map((row) => (
                            <option key={row.id} value={row.id}>
                              {row.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="apply-amount">
                          Amount
                        </label>
                        <input
                          id="apply-amount"
                          inputMode="decimal"
                          className="mono"
                          value={applyDraft.amount_bdt}
                          onChange={(event) => setApplyDraft({ ...applyDraft, amount_bdt: event.target.value })}
                          placeholder="20000.00"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-3">
                      <div className="field">
                        <label className="label" htmlFor="apply-date">
                          Applied on <span className="faint">optional</span>
                        </label>
                        <input
                          id="apply-date"
                          type="date"
                          className="mono"
                          value={applyDraft.date}
                          onChange={(event) => setApplyDraft({ ...applyDraft, date: event.target.value })}
                        />
                      </div>
                    </div>
                    <p className="note" style={{ margin: 0 }}>
                      Oldest advance first, and never more than the party actually holds. Claiming more than is available is
                      refused by name rather than quietly capped.
                    </p>
                    <div className="row">
                      <button
                        className="btn"
                        type="submit"
                        disabled={busy || applyDraft.document_id === "" || applyDraft.amount_bdt.trim() === ""}
                      >
                        {busy ? "Claiming…" : "Claim the advance"}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="section">
            <div className="panel panel--flush">
              <div className="panel-head">
                <h2 style={{ fontSize: "var(--t-lg)" }}>What we are holding</h2>
                <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
                  one row per party · largest first
                </span>
              </div>
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Advance balance by party</caption>
                  <thead>
                    <tr>
                      <th scope="col">Party</th>
                      <th scope="col" className="num">
                        Advances
                      </th>
                      <th scope="col" className="num">
                        Claimed
                      </th>
                      <th scope="col" className="num">
                        Held now
                      </th>
                      <th scope="col" className="num">
                        Open
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstanding.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="muted">
                          Nobody is holding money with us. A receipt that takes more than the customer owes parks the
                          difference here automatically.
                        </td>
                      </tr>
                    ) : (
                      outstanding.map((row) => (
                        <tr
                          key={row.party_id}
                          className={partyFilter === row.party_id ? "is-selected" : undefined}
                          onClick={() => setPartyFilter(partyFilter === row.party_id ? "" : row.party_id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <span className="mono">{row.party_code}</span> {row.party_name}
                          </td>
                          <td className="num">
                            <Amount value={row.advances_bdt} size="sm" />
                          </td>
                          <td className="num muted">
                            <Amount value={row.adjusted_bdt} size="sm" />
                          </td>
                          <td className="num">
                            <Amount value={row.outstanding_bdt} size="sm" />
                          </td>
                          <td className="num mono">{row.open_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="note" style={{ padding: "var(--s-4)", margin: 0 }}>
                Click a party to filter the advances below. The held figure is what the integrity run asserts never goes
                negative.
              </p>
            </div>
          </section>

          <section className="section">
            <div className="panel panel--flush">
              <div className="panel-head">
                <h2 style={{ fontSize: "var(--t-lg)" }}>Advances</h2>
                <div className="row" style={{ gap: "var(--s-3)", alignItems: "flex-end" }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label" htmlFor="filter-party">
                      Party
                    </label>
                    <select
                      id="filter-party"
                      value={partyFilter}
                      onChange={(event) => setPartyFilter(event.target.value)}
                    >
                      <option value="">Everyone</option>
                      {parties.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.code} — {row.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label" htmlFor="filter-status">
                      State
                    </label>
                    <select
                      id="filter-status"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as "" | Advance["status"])}
                    >
                      <option value="">Any</option>
                      <option value="OPEN">Open</option>
                      <option value="PARTIALLY_ADJUSTED">Partly claimed</option>
                      <option value="FULLY_ADJUSTED">Fully claimed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Advances, oldest money first</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Party</th>
                      <th scope="col" className="num">
                        Advance
                      </th>
                      <th scope="col" className="num">
                        Claimed
                      </th>
                      <th scope="col" className="num">
                        Left
                      </th>
                      <th scope="col">State</th>
                      <th scope="col">Came from</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="muted">
                          No advances match. Clear the filters, or record one above.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row) => (
                        <tr
                          key={row.id}
                          className={selected === row.id ? "is-selected" : undefined}
                          onClick={() => setSelected(selected === row.id ? null : row.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="mono nowrap">{row.date}</td>
                          <td>
                            <span className="mono">{row.party_code}</span> {row.party_name}
                          </td>
                          <td className="num">
                            <Amount value={row.amount_bdt} size="sm" />
                          </td>
                          <td className="num muted">
                            <Amount value={row.adjusted_bdt} size="sm" />
                          </td>
                          <td className="num">
                            <Amount value={row.outstanding_bdt} size="sm" />
                          </td>
                          <td className="nowrap">
                            {row.status === "FULLY_ADJUSTED" ? (
                              <span className="chip chip--short">fully claimed</span>
                            ) : row.status === "PARTIALLY_ADJUSTED" ? (
                              <span className="chip">partly claimed</span>
                            ) : (
                              <span className="chip">open</span>
                            )}
                          </td>
                          <td className="muted nowrap">
                            {SOURCE_LABEL[row.source]}
                            {row.source_doc_no ? <span className="mono"> · {row.source_doc_no}</span> : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="note" style={{ padding: "var(--s-4)", margin: 0 }}>
                Oldest money first — the order the engine would drain. Click a row for the documents that claimed it.
              </p>
            </div>
          </section>

          {selected && detail ? (
            <AllocationInspector advance={detail} loading={detailLoading} onClose={() => setSelected(null)} />
          ) : detailLoading ? (
            <section className="section">
              <div className="skeleton" style={{ height: "5rem" }} />
            </section>
          ) : null}
        </>
      ) : (
        <section className="section">
          <div className="panel panel--flush">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Advance ledger</h2>
              <div className="row" style={{ gap: "var(--s-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label" htmlFor="ledger-party">
                    Party
                  </label>
                  <select id="ledger-party" value={ledgerParty} onChange={(event) => setLedgerParty(event.target.value)}>
                    <option value="">Everyone</option>
                    {parties.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.code} — {row.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label" htmlFor="ledger-from">
                    From <span className="faint">optional</span>
                  </label>
                  <input
                    id="ledger-from"
                    type="date"
                    className="mono"
                    value={ledgerFrom}
                    onChange={(event) => setLedgerFrom(event.target.value)}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label" htmlFor="ledger-to">
                    As at <span className="faint">optional</span>
                  </label>
                  <input
                    id="ledger-to"
                    type="date"
                    className="mono"
                    value={ledgerTo}
                    onChange={(event) => setLedgerTo(event.target.value)}
                  />
                </div>
                <button className="btn btn--sm" type="button" onClick={() => void loadLedger()}>
                  Rebuild
                </button>
              </div>
            </div>

            {ledgerLoading ? (
              <div className="skeleton" style={{ height: "6rem", margin: "var(--s-4)" }} />
            ) : (
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Advance ledger with running balance</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Party</th>
                      <th scope="col">What</th>
                      <th scope="col" className="num">
                        Advance
                      </th>
                      <th scope="col" className="num">
                        Claimed
                      </th>
                      <th scope="col" className="num">
                        Balance
                      </th>
                      <th scope="col" className="num">
                        Age
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ledger?.entries ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="muted">
                          Nothing in this range.
                        </td>
                      </tr>
                    ) : (
                      (ledger?.entries ?? []).map((row, index) => (
                        <tr key={`${row.date}-${row.kind}-${index}`}>
                          <td className="mono nowrap">{row.date}</td>
                          <td>{row.party_name}</td>
                          <td className="muted">
                            {row.kind === "ADVANCE" ? (
                              <>advance{row.reference ? ` · ${row.reference}` : ""}</>
                            ) : (
                              <>
                                claimed by <span className="mono">{row.document_no || row.document_type}</span>
                              </>
                            )}
                          </td>
                          <td className="num">
                            {row.kind === "ADVANCE" ? <Amount value={row.advance_bdt} size="sm" /> : <span className="faint">—</span>}
                          </td>
                          <td className="num">
                            {row.kind === "ADJUSTMENT" ? (
                              <Amount value={row.adjustment_bdt} size="sm" />
                            ) : (
                              <span className="faint">—</span>
                            )}
                          </td>
                          <td className="num">
                            <Amount value={row.running_balance_bdt} size="sm" />
                          </td>
                          <td className="num mono muted">{row.kind === "ADVANCE" ? row.age_days : ""}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {ledger ? (
                    <tfoot>
                      <tr>
                        <th scope="row" colSpan={5}>
                          Closing{ledger.as_of ? ` at ${ledger.as_of}` : ""}
                        </th>
                        <td className="num">
                          <Amount value={ledger.closing_bdt} size="sm" />
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            )}
            <p className="note" style={{ padding: "var(--s-4)", margin: 0 }}>
              The closing balance is the same figure the Outstanding tab shows at that date, read the other way: advances
              add, claims subtract. A post-dated advance can make a date in between read negative — that is the honest
              chronological view, not a breach of the never-negative rule, which is a whole-history statement.
            </p>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ label, value, money }: { label: string; value: string; money?: boolean }) {
  return (
    <div className="stack" style={{ gap: 0 }}>
      <span className="label" style={{ margin: 0 }}>
        {label}
      </span>
      {money ? (
        <Amount value={value} size="sm" />
      ) : (
        <span className="mono" style={{ fontSize: "var(--t-md)" }}>
          {value}
        </span>
      )}
    </div>
  );
}

/** The allocation inspector: the documents that have claimed this advance. */
function AllocationInspector({
  advance,
  loading,
  onClose,
}: {
  advance: AdvanceDetail;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <section className="section">
      <div className="panel panel--flush">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>
            <span className="mono">{advance.party_code}</span> {advance.party_name} — held since{" "}
            <span className="mono">{advance.date}</span>
          </h2>
          <button className="btn btn--sm btn--quiet" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="row" style={{ padding: "var(--s-4)", gap: "var(--s-6)", flexWrap: "wrap" }}>
          <Stat label="Advance" value={advance.amount_bdt} money />
          <Stat label="Claimed" value={advance.adjusted_bdt} money />
          <Stat label="Left" value={advance.outstanding_bdt} money />
          <Stat label="State" value={STATUS_LABEL[advance.status]} />
          <Stat label="Came from" value={SOURCE_LABEL[advance.source]} />
        </div>

        <p className="note" style={{ padding: "0 var(--s-4) var(--s-4)", margin: 0 }}>
          {advance.journal_entry_id ? (
            <>
              Recorded by hand, so it posted <span className="mono">cash against the control account</span> when it was
              created.
            </>
          ) : (
            <>
              The unclaimed remainder of{" "}
              <span className="mono">{advance.source_doc_no || "a receipt or payment"}</span>. Its money is already in that
              document&rsquo;s entry — claiming it here posts nothing, so the control account never moves twice.
            </>
          )}
          {advance.reference ? <> Reference <span className="mono">{advance.reference}</span>.</> : null}
          {advance.notes ? <> {advance.notes}</> : null}
        </p>

        <div className="ledger-scroll">
          <table className="ledger">
            <caption className="sr-only">Documents that claimed this advance</caption>
            <thead>
              <tr>
                <th scope="col">Applied on</th>
                <th scope="col">Document</th>
                <th scope="col">Type</th>
                <th scope="col" className="num">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Loading…
                  </td>
                </tr>
              ) : advance.adjustments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Nothing has claimed this advance yet. Issue an invoice with an advance amount, or claim it against an
                    open document above.
                  </td>
                </tr>
              ) : (
                advance.adjustments.map((row) => (
                  <tr key={row.id}>
                    <td className="mono nowrap">{row.adjusted_on}</td>
                    <td className="mono">{row.document_no || row.document_id}</td>
                    <td className="muted">{row.document_type === "INVOICE" ? "invoice" : "bill"}</td>
                    <td className="num">
                      <Amount value={row.amount_bdt} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ padding: "var(--s-4)", margin: 0 }}>
          Cancelling or amending one of those documents returns its claim here, transactionally, and the audit log keeps
          the history. A claim already reversed is not shown — the row is gone, and the reason is in the audit trail.
        </p>
      </div>
    </section>
  );
}
