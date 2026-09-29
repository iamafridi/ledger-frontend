"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { api, apiDownload, ApiError } from "@/lib/api";
import type {
  Account,
  CatalogTaxRate,
  Challan,
  Party,
  TaxCertificate,
  VatReturn,
  VatSideReturn,
  WithholdingRegister,
} from "@/lib/types";
import { DemoSeederBanner } from "@/components/demo-seeder-banner";

/**
 * Tax & VAT (plan §6, Phase 7).
 *
 * Four questions, one screen: what did this month's tax come to, what is still
 * withheld and undeposited, pay it over, and hand the supplier the certificate
 * they will claim it with.
 *
 * **Nothing here computes a tax figure.** The return arrives whole from the
 * server, built from the tax snapshotted on the documents' own lines, and the
 * screen renders it. The only arithmetic in this file is the truncation
 * *display* — showing that the declared figure is the book figure with the paisa
 * dropped — which is a caption, not a calculation: the difference is the
 * server's `rounding_difference_bdt`.
 *
 * The date is a fiscal month, not a period id: a return is filed for a month,
 * and asking for one that is not open in the ledger still answers honestly
 * (zero bands) rather than erroring.
 */

type Tab = "vat" | "withholding" | "challans" | "certificates";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "vat", label: "VAT return" },
  { key: "withholding", label: "Withholding" },
  { key: "challans", label: "Challans" },
  { key: "certificates", label: "Certificates" },
];

const today = (): string => new Date().toISOString().slice(0, 10);
const thisMonth = (): string => new Date().toISOString().slice(0, 7);

export default function TaxPage() {
  const { can } = useSession();
  const canWrite = can("tax.write");
  const canExport = can("tax.export");

  const [tab, setTab] = useState<Tab>("vat");
  const [month, setMonth] = useState<string>(thisMonth());

  const [vat, setVat] = useState<VatReturn | null>(null);
  const [register, setRegister] = useState<WithholdingRegister | null>(null);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [certificates, setCertificates] = useState<TaxCertificate[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxRates, setTaxRates] = useState<CatalogTaxRate[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [challanDraft, setChallanDraft] = useState({
    date: today(),
    amount_bdt: "",
    account_code: "1010",
    challan_ref: "",
    memo: "",
  });
  const [certificateDraft, setCertificateDraft] = useState({ party_id: "", month: thisMonth() });

  const load = useCallback(
    async (forMonth: string) => {
      setLoading(true);
      setError(null);
      try {
        const [vatData, registerData, challanData, certificateData, partyData, chart, rates] =
          await Promise.all([
            api<{ vat_return: VatReturn }>(`/tax/vat-return?month=${forMonth}`),
            api<{ register: WithholdingRegister }>("/tax/withholding?limit=200"),
            api<{ challans: Challan[] }>("/tax/challans?limit=100"),
            api<{ certificates: TaxCertificate[] }>("/tax/certificates?limit=100"),
            api<{ parties: Party[] }>("/parties"),
            api<{ accounts: Account[] }>("/coa?include_inactive=true"),
            api<{ tax_rates: CatalogTaxRate[] }>("/catalogs/tax-rates"),
          ]);
        setVat(vatData.vat_return);
        setRegister(registerData.register);
        setChallans(challanData.challans);
        setCertificates(certificateData.certificates);
        // A certificate is issued to a supplier and can only be settled from a
        // supplier's payment, so customers are not offered.
        setParties(partyData.parties.filter((party) => party.kind !== "CUSTOMER"));
        setAccounts(chart.accounts.filter((account) => account.type === "ASSET" && account.is_active));
        setTaxRates(rates.tax_rates.filter((rate) => rate.kind === "WITHHOLDING" && rate.is_active));
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : "Could not load the tax screen.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(month);
  }, [load, month]);

  const depositAccounts = useMemo(
    () => accounts.map((account) => ({ code: account.code, name: account.name })),
    [accounts],
  );

  async function createChallan(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const payload = await api<{ challan: Challan }>("/tax/challans", {
        method: "POST",
        body: {
          date: challanDraft.date,
          amount_bdt: challanDraft.amount_bdt.trim(),
          account_code: challanDraft.account_code.trim(),
          challan_ref: challanDraft.challan_ref.trim(),
          memo: challanDraft.memo.trim(),
        },
      });
      const msg = `${payload.challan.doc_no} recorded — the withholding liability is ${payload.challan.amount_bdt} lighter.`;
      setNotice(msg);
      toast.success(msg);
      setChallanDraft({ date: today(), amount_bdt: "", account_code: challanDraft.account_code, challan_ref: "", memo: "" });
      await load(month);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not record that challan.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function issueCertificate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const payload = await api<{ certificate: TaxCertificate }>("/tax/certificates", {
        method: "POST",
        body: { party_id: certificateDraft.party_id, month: certificateDraft.month },
      });
      const msg = `${payload.certificate.doc_no} issued to ${payload.certificate.party_name} for ${payload.certificate.period_key}.`;
      setNotice(msg);
      toast.success(msg);
      await load(month);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not issue that certificate.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function download(path: string, filename: string) {
    setError(null);
    try {
      await apiDownload(path, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not download that file.";
      setError(err);
      toast.error(err);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Tax &amp; VAT
          </p>
          <div className="row" style={{ gap: "var(--s-3)", alignItems: "flex-end" }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label" htmlFor="tax-month">
                Fiscal month
              </label>
              <input
                id="tax-month"
                type="month"
                className="mono"
                value={month}
                onChange={(event) => setMonth(event.target.value || thisMonth())}
              />
            </div>
          </div>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "66ch" }}>
          The tax on a line is computed once, when the document is written, and posted from that same
          snapshot — so the return below and the VAT control accounts it is reconciled against are two
          readings of one set of facts. Nothing on this screen is a stored return.
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

        {vat && vat.documents.invoices === 0 && vat.documents.bills === 0 && (
          <div style={{ marginTop: "var(--s-4)" }}>
            <DemoSeederBanner sectionName="Tax & VAT" onSeeded={() => void load(month)} compact={true} />
          </div>
        )}

        <div className="row" style={{ gap: "var(--s-2)", marginTop: "var(--s-5)" }}>
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={`btn btn--sm ${tab === entry.key ? "" : "btn--quiet"}`}
              aria-pressed={tab === entry.key}
              onClick={() => {
                setTab(entry.key);
                setError(null);
                setNotice(null);
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
      ) : tab === "vat" && vat ? (
        <VatReturnSection vat={vat} canExport={canExport} onDownload={download} />
      ) : tab === "withholding" && register ? (
        <WithholdingSection
          register={register}
          rates={taxRates}
          canExport={canExport}
          onDownload={download}
        />
      ) : tab === "challans" ? (
        <ChallansSection
          challans={challans}
          canWrite={canWrite}
          busy={busy}
          draft={challanDraft}
          depositAccounts={depositAccounts}
          onChange={setChallanDraft}
          onSubmit={createChallan}
        />
      ) : tab === "certificates" ? (
        <CertificatesSection
          certificates={certificates}
          parties={parties}
          canWrite={canWrite}
          busy={busy}
          draft={certificateDraft}
          onChange={setCertificateDraft}
          onSubmit={issueCertificate}
        />
      ) : null}
    </>
  );
}

/* ── VAT return ──────────────────────────────────────────────────────────── */

function VatReturnSection({
  vat,
  canExport,
  onDownload,
}: {
  vat: VatReturn;
  canExport: boolean;
  onDownload: (path: string, filename: string) => Promise<void>;
}) {
  const difference = vat.rounding_difference_bdt;
  const moved = difference !== "0.00";

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="label">{vat.month_label} — net payable</p>
          {canExport ? (
            <button
              type="button"
              className="btn btn--sm btn--quiet"
              onClick={() => void onDownload(`/tax/vat-return/export?month=${vat.month}`, `vat-return-${vat.month}.csv`)}
            >
              Download CSV
            </button>
          ) : null}
        </div>

        <div className="panel" style={{ marginTop: "var(--s-4)" }}>
          <div className="grid grid-3">
            <div className="stack" style={{ gap: "var(--s-1)" }}>
              <span className="label">Books</span>
              <Amount value={vat.net_payable_bdt} size="lg" />
              <span className="note">Output tax less input tax, to the paisa.</span>
            </div>
            <div className="stack" style={{ gap: "var(--s-1)" }}>
              <span className="label">Return (whole taka)</span>
              <Amount value={vat.net_payable_declared_bdt} size="lg" />
              <span className="note">Each rate band truncated, then added.</span>
            </div>
            <div className="stack" style={{ gap: "var(--s-1)" }}>
              <span className="label">Truncation difference</span>
              <Amount value={difference} size="lg" tone="auto" />
              <span className="note">{moved ? "Shown, not hidden." : "Nothing was truncated."}</span>
            </div>
          </div>
          <p className="note" style={{ marginTop: "var(--s-4)", maxWidth: "76ch" }}>
            {vat.rounding_note}
          </p>
        </div>

        <div className="grid grid-2" style={{ marginTop: "var(--s-5)", alignItems: "start" }}>
          <BandsTable title="Output VAT — sales" side={vat.output} />
          <BandsTable title="Input VAT — purchases" side={vat.input} />
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", fontSize: "var(--t-sm)" }}>
          {vat.documents.invoices} invoices, {vat.documents.credit_notes} credit notes,{" "}
          {vat.documents.bills} bills and {vat.documents.debit_notes} debit notes fall in this month.
          Voided documents are excluded — their entry was reversed, so they belong to neither side.
        </p>
      </section>

      <section className="section">
        <p className="label">What the control accounts hold</p>
        <div className="panel panel--flush" style={{ marginTop: "var(--s-4)" }}>
          <div className="ledger-scroll">
            <table className="ledger">
              <caption className="sr-only">Tax control accounts</caption>
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col" className="num">
                    Balance
                  </th>
                  <th scope="col">Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono nowrap">
                    {vat.controls.output_account_code} <span className="muted">VAT Payable</span>
                  </td>
                  <td className="num">
                    <Amount value={vat.controls.output_balance_bdt} size="sm" />
                  </td>
                  <td className="muted">Output VAT charged, all time — what customers paid us on the government&rsquo;s behalf.</td>
                </tr>
                <tr>
                  <td className="mono nowrap">
                    {vat.controls.input_account_code} <span className="muted">VAT Receivable</span>
                  </td>
                  <td className="num">
                    <Amount value={vat.controls.input_balance_bdt} size="sm" />
                  </td>
                  <td className="muted">Input VAT paid on purchases, claimable against the above.</td>
                </tr>
                <tr>
                  <td className="mono nowrap">
                    {vat.controls.withholding_account_code} <span className="muted">Source Tax Payable</span>
                  </td>
                  <td className="num">
                    <Amount value={vat.controls.withholding_balance_bdt} size="sm" />
                  </td>
                  <td className="muted">
                    Withheld {vat.controls.withheld_to_date_bdt}, deposited {vat.controls.deposited_to_date_bdt} —{" "}
                    <Amount value={vat.controls.withholding_outstanding_bdt} size="sm" /> still owed.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="note" style={{ marginTop: "var(--s-3)" }}>
          These are all-time balances, not the month&rsquo;s figure: the liability a return declares is settled
          against them, and the integrity run asserts they equal the documents behind them to the paisa.
        </p>
      </section>
    </>
  );
}

function BandsTable({ title, side }: { title: string; side: VatSideReturn }) {
  return (
    <div className="panel panel--flush">
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>{title}</h2>
      </div>
      <div className="ledger-scroll">
        <table className="ledger">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col" className="num">
                Rate
              </th>
              <th scope="col" className="num">
                Net
              </th>
              <th scope="col" className="num">
                Tax
              </th>
              <th scope="col" className="num">
                Declared
              </th>
            </tr>
          </thead>
          <tbody>
            {side.bands.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Nothing taxed this month.
                </td>
              </tr>
            ) : (
              side.bands.map((band) => (
                <tr key={band.tax_code}>
                  <td className="mono nowrap">{band.tax_code}</td>
                  <td className="num mono">{band.rate_percent}%</td>
                  <td className="num">
                    <Amount value={band.net_bdt} size="sm" />
                  </td>
                  <td className="num">
                    <Amount value={band.tax_bdt} size="sm" />
                  </td>
                  <td className="num">
                    <Amount value={band.declared_bdt} size="sm" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td />
              <td className="num">
                <Amount value={side.net_bdt} size="sm" />
              </td>
              <td className="num">
                <Amount value={side.tax_bdt} size="sm" />
              </td>
              <td className="num">
                <Amount value={side.declared_bdt} size="sm" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Withholding register ────────────────────────────────────────────────── */

function WithholdingSection({
  register,
  rates,
  canExport,
  onDownload,
}: {
  register: WithholdingRegister;
  /** The withholding rates configured, so the screen says which obligations it
   *  knows about even in a month nothing was taken under one of them. */
  rates: CatalogTaxRate[];
  canExport: boolean;
  onDownload: (path: string, filename: string) => Promise<void>;
}) {
  return (
    <section className="section">
      <div className="row-between">
        <p className="label">{register.rows.length} withholdings</p>
        <div className="row" style={{ gap: "var(--s-3)", alignItems: "center" }}>
          <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
            Withheld <Amount value={register.total_bdt} size="sm" /> · deposited{" "}
            <Amount value={register.deposited_bdt} size="sm" /> · still owed{" "}
            <Amount value={register.outstanding_bdt} size="sm" />
          </span>
          {canExport ? (
            <button
              type="button"
              className="btn btn--sm btn--quiet"
              onClick={() => void onDownload("/tax/withholding/export", "withholding.csv")}
            >
              Download CSV
            </button>
          ) : null}
        </div>
      </div>

      {register.totals.length > 0 ? (
        <p className="muted" style={{ marginTop: "var(--s-3)" }}>
          By rate:{" "}
          {register.totals.map((total) => (
            <span key={total.tax_code} className="mono" style={{ marginRight: "var(--s-3)" }}>
              {total.tax_code} <Amount value={total.amount_bdt} size="sm" />
            </span>
          ))}
        </p>
      ) : null}

      <p className="muted" style={{ marginTop: "var(--s-3)", fontSize: "var(--t-sm)" }}>
        Rates configured:{" "}
        {rates.length === 0 ? (
          <>none — add one on the catalogs screen.</>
        ) : (
          rates.map((rate) => (
            <span key={rate.code} className="mono" style={{ marginRight: "var(--s-3)" }}>
              {rate.code} {rate.rate_percent}%
            </span>
          ))
        )}
      </p>

      <div className="panel panel--flush" style={{ marginTop: "var(--s-4)" }}>
        <div className="ledger-scroll">
          <table className="ledger">
            <caption className="sr-only">Withholding register</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Supplier</th>
                <th scope="col">Payment</th>
                <th scope="col">Code</th>
                <th scope="col" className="num">
                  Rate
                </th>
                <th scope="col" className="num">
                  Withheld
                </th>
                <th scope="col">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {register.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    Nothing has been withheld yet. Withholding is recorded on a supplier payment.
                  </td>
                </tr>
              ) : (
                register.rows.map((row) => (
                  <tr key={`${row.payment_id}-${row.tax_code}`}>
                    <td className="mono nowrap">{row.date}</td>
                    <td>
                      {row.party_name}
                      {row.party_code ? <span className="muted"> {row.party_code}</span> : null}
                    </td>
                    <td className="mono nowrap">{row.doc_no}</td>
                    <td className="mono nowrap">{row.tax_code}</td>
                    <td className="num mono">{row.tax_rate_snapshot}%</td>
                    <td className="num">
                      <Amount value={row.amount_bdt} size="sm" />
                    </td>
                    <td className="muted">{row.certified ? "Issued" : "Not yet"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ── Challans ────────────────────────────────────────────────────────────── */

function ChallansSection({
  challans,
  canWrite,
  busy,
  draft,
  depositAccounts,
  onChange,
  onSubmit,
}: {
  challans: Challan[];
  canWrite: boolean;
  busy: boolean;
  draft: { date: string; amount_bdt: string; account_code: string; challan_ref: string; memo: string };
  depositAccounts: Array<{ code: string; name: string }>;
  onChange: (next: { date: string; amount_bdt: string; account_code: string; challan_ref: string; memo: string }) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
}) {
  return (
    <section className="section">
      <p className="label">Challans — tax deposited with the government</p>

      {canWrite ? (
        <div className="panel" style={{ marginTop: "var(--s-4)" }}>
          <div className="panel-head">
            <h2 style={{ fontSize: "var(--t-lg)" }}>Record a deposit</h2>
          </div>
          <form className="stack" onSubmit={onSubmit} noValidate>
            <div className="grid grid-3">
              <div className="field">
                <label className="label" htmlFor="challan-date">
                  Date
                </label>
                <input
                  id="challan-date"
                  type="date"
                  className="mono"
                  value={draft.date}
                  onChange={(event) => onChange({ ...draft, date: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="challan-amount">
                  Amount
                </label>
                <input
                  id="challan-amount"
                  inputMode="decimal"
                  value={draft.amount_bdt}
                  onChange={(event) => onChange({ ...draft, amount_bdt: event.target.value })}
                  placeholder="12500.00"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="challan-account">
                  Paid from
                </label>
                <input
                  id="challan-account"
                  className="mono"
                  list="challan-account-options"
                  value={draft.account_code}
                  onChange={(event) => onChange({ ...draft, account_code: event.target.value })}
                  placeholder="1010"
                />
                <datalist id="challan-account-options">
                  {depositAccounts.map((account) => (
                    <option key={account.code} value={account.code}>
                      {account.name}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="label" htmlFor="challan-ref">
                  Tax office reference <span className="faint">optional</span>
                </label>
                <input
                  id="challan-ref"
                  className="mono"
                  value={draft.challan_ref}
                  onChange={(event) => onChange({ ...draft, challan_ref: event.target.value })}
                  placeholder="as printed on their receipt"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="challan-memo">
                  Memo
                </label>
                <input
                  id="challan-memo"
                  value={draft.memo}
                  onChange={(event) => onChange({ ...draft, memo: event.target.value })}
                  placeholder="VAT return 2026-09"
                />
              </div>
            </div>
            <p className="note" style={{ margin: 0 }}>
              Posts <span className="mono">DR 2200 / CR the account above</span> — the only thing that clears
              the withholding liability, because the money has really gone.
            </p>
            <div className="row">
              <button className="btn" type="submit" disabled={busy || draft.amount_bdt.trim() === ""}>
                {busy ? "Recording…" : "Record challan"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="note" style={{ marginTop: "var(--s-4)" }}>
          Your role can read the tax position but not record a deposit.
        </p>
      )}

      <div className="panel panel--flush" style={{ marginTop: "var(--s-5)" }}>
        <div className="ledger-scroll">
          <table className="ledger">
            <caption className="sr-only">Challans</caption>
            <thead>
              <tr>
                <th scope="col">Number</th>
                <th scope="col">Date</th>
                <th scope="col" className="num">
                  Amount
                </th>
                <th scope="col">Paid from</th>
                <th scope="col">Reference</th>
                <th scope="col">Memo</th>
              </tr>
            </thead>
            <tbody>
              {challans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No deposits recorded yet.
                  </td>
                </tr>
              ) : (
                challans.map((challan) => (
                  <tr key={challan.id}>
                    <td className="mono nowrap">{challan.doc_no}</td>
                    <td className="mono nowrap">{challan.date}</td>
                    <td className="num">
                      <Amount value={challan.amount_bdt} size="sm" />
                    </td>
                    <td className="mono nowrap">
                      {challan.account_code} <span className="muted">{challan.account_name}</span>
                    </td>
                    <td className="mono nowrap">{challan.challan_ref || "—"}</td>
                    <td className="muted">{challan.memo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ── Certificates ────────────────────────────────────────────────────────── */

function CertificatesSection({
  certificates,
  parties,
  canWrite,
  busy,
  draft,
  onChange,
  onSubmit,
}: {
  certificates: TaxCertificate[];
  parties: Party[];
  canWrite: boolean;
  busy: boolean;
  draft: { party_id: string; month: string };
  onChange: (next: { party_id: string; month: string }) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
}) {
  return (
    <section className="section">
      <p className="label">Withholding certificates — what the supplier claims</p>

      {canWrite ? (
        <div className="panel" style={{ marginTop: "var(--s-4)" }}>
          <div className="panel-head">
            <h2 style={{ fontSize: "var(--t-lg)" }}>Issue a certificate</h2>
          </div>
          <form className="stack" onSubmit={onSubmit} noValidate>
            <div className="grid grid-2">
              <div className="field">
                <label className="label" htmlFor="certificate-party">
                  Supplier
                </label>
                <select
                  id="certificate-party"
                  value={draft.party_id}
                  onChange={(event) => onChange({ ...draft, party_id: event.target.value })}
                  required
                >
                  <option value="">Choose a supplier…</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.code} — {party.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="certificate-month">
                  Month
                </label>
                <input
                  id="certificate-month"
                  type="month"
                  className="mono"
                  value={draft.month}
                  onChange={(event) => onChange({ ...draft, month: event.target.value })}
                  required
                />
              </div>
            </div>
            <p className="note" style={{ margin: 0 }}>
              It posts nothing — the tax was withheld when the payment was made. What it records is that the
              paper exists and carries a number. A second certificate for the same supplier and month is
              refused, so the same tax cannot be claimed twice.
            </p>
            <div className="row">
              <button className="btn" type="submit" disabled={busy || draft.party_id === ""}>
                {busy ? "Issuing…" : "Issue certificate"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="note" style={{ marginTop: "var(--s-4)" }}>
          Your role can read certificates but not issue them.
        </p>
      )}

      <div className="panel panel--flush" style={{ marginTop: "var(--s-5)" }}>
        <div className="ledger-scroll">
          <table className="ledger">
            <caption className="sr-only">Withholding certificates</caption>
            <thead>
              <tr>
                <th scope="col">Number</th>
                <th scope="col">Supplier</th>
                <th scope="col">Month</th>
                <th scope="col" className="num">
                  Amount
                </th>
                <th scope="col">Rates</th>
              </tr>
            </thead>
            <tbody>
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No certificates issued yet.
                  </td>
                </tr>
              ) : (
                certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="mono nowrap">{certificate.doc_no}</td>
                    <td>
                      {certificate.party_name}
                      {certificate.party_code ? <span className="muted"> {certificate.party_code}</span> : null}
                    </td>
                    <td className="mono nowrap">{certificate.period_key}</td>
                    <td className="num">
                      <Amount value={certificate.amount_bdt} size="sm" />
                    </td>
                    <td className="mono muted nowrap">
                      {certificate.withholdings
                        .map((row) => `${row.tax_code} @ ${row.tax_rate_snapshot}%`)
                        .join(", ")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
