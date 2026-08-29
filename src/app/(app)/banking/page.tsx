"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Amount } from "@/components/money";
import { api, ApiError } from "@/lib/api";
import {
  BANK_ACCOUNT_KIND_LABEL,
  type Account,
  type BankAccount,
  type BankAccountKind,
  type CashPosition,
  type Transfer,
} from "@/lib/types";
import { DemoSeederBanner } from "@/components/demo-seeder-banner";

/**
 * Banking & cash — what is in the till and the bank, and how money moves between
 * them.
 *
 * Every balance on this screen is read from the ledger, so none of it can drift
 * from the trial balance. What this screen *does* own is the mapping (which chart
 * account each treasury account is), the transfer, and the point of entry to the
 * reconciliation workspace.
 *
 * A transfer is one form and one journal entry. There is deliberately no way to
 * record "money left here" and "money arrived there" separately — that is how a
 * half-finished transfer invents money.
 */

const today = (): string => new Date().toISOString().slice(0, 10);

/** Chart accounts that could back a treasury row: plain asset accounts. */
const TREASURY_SUBTYPES = ["", "CASH", "BANK"];

export default function BankingPage() {
  const [position, setPosition] = useState<CashPosition | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [chart, setChart] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [positionData, accountData, transferData] = await Promise.all([
        api<CashPosition>("/banking/position"),
        api<{ accounts: BankAccount[] }>("/banking/accounts?include_inactive=true"),
        api<{ transfers: Transfer[] }>("/banking/transfers?limit=25"),
      ]);
      setPosition(positionData);
      setAccounts(accountData.accounts);
      setTransfers(transferData.transfers);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the banking screen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<{ accounts: Account[] }>("/coa")
      .then((data) => setChart(data.accounts.filter((account) => account.type === "ASSET")))
      .catch(() => setChart([]));
  }, []);

  const active = accounts.filter((account) => account.is_active);
  const mapped = new Set(accounts.map((account) => account.account_code));
  const spare = chart.filter(
    (account) =>
      TREASURY_SUBTYPES.includes(account.subtype) &&
      !mapped.has(account.code) &&
      !["AR", "INVENTORY", "VAT_INPUT", "FIXED_ASSET", "ACCUM_DEPRECIATION"].includes(account.subtype),
  );

  async function run(work: () => Promise<void>, done: string): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await work();
      setNotice(done);
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
            06 &nbsp; Banking &amp; cash
          </p>
          <nav className="row" style={{ gap: "var(--s-3)" }}>
            <Link className="btn btn--sm btn--quiet" href="/journals">
              Journals
            </Link>
            <Link className="btn btn--sm btn--quiet" href="/reports/cash-position">
              Cash position report
            </Link>
          </nav>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          Each account here is a view of one asset account in the chart, so these balances are the ledger&rsquo;s
          own. Import a statement to see what the bank says, and reconcile the two.
        </p>

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

        {/* ── Cash position ─────────────────────────────────────────────────── */}
        <div style={{ marginTop: "var(--s-4)" }}>
          <div className="row-between">
          <p className="label" style={{ margin: 0 }}>
            Cash position {position ? `as at ${position.as_of}` : ""}
          </p>
          <div className="row" style={{ gap: "var(--s-3)" }}>
            <p className="label" style={{ margin: 0 }}>
              Total
            </p>
            <Amount value={position?.total_bdt ?? "0.00"} size="lg" />
          </div>
        </div>

        {/* The same position read from the chart rather than from the treasury
            rows. They differ only when a cash account exists with no treasury
            mapping, and saying so is cheaper than discovering it later. */}
        {position && position.ledger_total_bdt !== position.total_bdt ? (
          <p className="note" style={{ marginTop: "var(--s-3)" }}>
            The chart holds {position.ledger_total_bdt} across its cash and bank accounts, but only{" "}
            {position.total_bdt} is mapped to an account here. Set up the rest so it appears on this screen.
          </p>
        ) : null}

        <div className="panel panel--flush" style={{ marginTop: "var(--s-4)" }}>
          {loading ? (
            <div className="stack" style={{ padding: "var(--s-5)" }}>
              {[0, 1].map((row) => (
                <div className="skeleton" key={row} style={{ height: "2rem" }} />
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="empty stack" style={{ alignItems: "center", gap: "var(--s-3)", padding: "var(--s-5)" }}>
              <p style={{ margin: 0 }}>No bank or cash accounts yet. Add one below.</p>
              <DemoSeederBanner sectionName="Banking" onSeeded={load} compact={true} />
            </div>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Cash and bank accounts</caption>
                <thead>
                  <tr>
                    <th scope="col">Account</th>
                    <th scope="col">Backs onto</th>
                    <th scope="col">Last statement</th>
                    <th scope="col" className="text-right">
                      Book balance
                    </th>
                    <th scope="col" className="text-right">
                      Bank says
                    </th>
                    <th scope="col" className="text-right">
                      Difference
                    </th>
                    <th scope="col"> </th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <span className="mono faint">{BANK_ACCOUNT_KIND_LABEL[account.kind]}</span>{" "}
                        {account.name}
                        {account.unreconciled_count > 0 ? (
                          <span className="faint" style={{ marginLeft: "var(--s-2)" }}>
                            {account.unreconciled_count} to reconcile
                          </span>
                        ) : null}
                      </td>
                      <td className="muted nowrap">
                        <span className="mono">{account.account_code}</span> {account.account_name}
                      </td>
                      <td className="muted nowrap">{account.last_statement_date || "—"}</td>
                      <td className="text-right nowrap">
                        <Amount value={account.book_balance_bdt} size="sm" />
                      </td>
                      <td className="text-right nowrap">
                        {account.last_statement_balance_bdt === "" ? (
                          <span className="faint">—</span>
                        ) : (
                          <Amount value={account.last_statement_balance_bdt} size="sm" />
                        )}
                      </td>
                      <td className="text-right nowrap">
                        {account.difference_bdt === "" ? (
                          <span className="faint">—</span>
                        ) : (
                          <Amount value={account.difference_bdt} size="sm" />
                        )}
                      </td>
                      <td className="nowrap">
                        <Link className="btn btn--sm btn--quiet" href={`/banking/${account.id}`}>
                          Reconcile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <details style={{ marginTop: "var(--s-4)" }}>
          <summary className="label" style={{ cursor: "pointer" }}>
            Add a bank or cash account
          </summary>
          <AddAccountForm
            spare={spare}
            busy={busy}
            onSubmit={(body) =>
              run(async () => {
                await api("/banking/accounts", { method: "POST", body });
              }, `${body.name} added.`)
            }
          />
        </details>
      </div>

      {/* ── Transfers ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: "var(--s-4)" }}>
        <p className="label" style={{ margin: 0 }}>
          Transfer between accounts
        </p>
        <p className="muted" style={{ marginTop: "var(--s-2)", maxWidth: "62ch" }}>
          One balanced entry: the destination is debited, the source credited for the amount plus any fee.
        </p>

        {active.length < 2 ? (
          <p className="note" style={{ marginTop: "var(--s-3)" }}>
            A transfer needs two accounts. Add another one first.
          </p>
        ) : (
          <TransferForm
            accounts={active}
            chart={chart}
            busy={busy}
            onSubmit={(body) =>
              run(async () => {
                await api("/banking/transfers", { method: "POST", body });
              }, "Transfer posted.")
            }
          />
        )}

        <div className="row-between" style={{ marginTop: "var(--s-5)" }}>
          <p className="label" style={{ margin: 0 }}>
            Recent transfers
          </p>
          {/* One reason field, shared by every void button in this list — the
              same shape the journal register uses, so the habit transfers. */}
          <div className="field" style={{ margin: 0, minWidth: "16rem" }}>
            <label className="label" htmlFor="transfer-reason">
              Reason for voiding
            </label>
            <input
              id="transfer-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why the transfer is being reversed"
            />
          </div>
        </div>

        <div className="panel panel--flush" style={{ marginTop: "var(--s-3)" }}>
          {transfers.length === 0 ? (
            <div className="empty">
              <p style={{ margin: 0 }}>No transfers yet.</p>
            </div>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Transfers</caption>
                <thead>
                  <tr>
                    <th scope="col">Number</th>
                    <th scope="col">Date</th>
                    <th scope="col">From</th>
                    <th scope="col">To</th>
                    <th scope="col" className="text-right">
                      Amount
                    </th>
                    <th scope="col" className="text-right">
                      Fee
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col"> </th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td className="mono nowrap">{transfer.doc_no}</td>
                      <td className="muted nowrap">{transfer.date}</td>
                      <td>{transfer.from_name || transfer.from_account_code}</td>
                      <td>{transfer.to_name || transfer.to_account_code}</td>
                      <td className="text-right nowrap">
                        <Amount value={transfer.amount_bdt} size="sm" />
                      </td>
                      <td className="text-right nowrap">
                        {transfer.fee_bdt === "0.00" ? (
                          <span className="faint">—</span>
                        ) : (
                          <Amount value={transfer.fee_bdt} size="sm" />
                        )}
                      </td>
                      <td className="muted nowrap">
                        {transfer.status === "VOID" ? `Voided — ${transfer.void_reason}` : "Posted"}
                      </td>
                      <td className="nowrap">
                        {transfer.status === "POSTED" ? (
                          <button
                            type="button"
                            className="btn btn--sm btn--quiet"
                            disabled={busy || reason.trim().length < 3}
                            onClick={() =>
                              run(async () => {
                                await api(`/banking/transfers/${transfer.id}/void`, {
                                  method: "POST",
                                  body: { reason: reason.trim() },
                                });
                                setReason("");
                              }, `${transfer.doc_no} voided.`)
                            }
                          >
                            Void
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </section>
    </>
  );
}

/* ── Forms ───────────────────────────────────────────────────────────────── */

function AddAccountForm({
  spare,
  busy,
  onSubmit,
}: {
  spare: Account[];
  busy: boolean;
  onSubmit: (body: Record<string, string>) => void;
}) {
  const [kind, setKind] = useState<BankAccountKind>("BANK");
  const [name, setName] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const ready = name.trim().length >= 2 && accountCode !== "" && !busy;

  return (
    <div className="panel" style={{ marginTop: "var(--s-3)" }}>
      <div className="grid" style={{ gap: "var(--s-3)" }}>
        <div className="row" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="bank-kind">
              Kind
            </label>
            <select
              id="bank-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as BankAccountKind)}
            >
              <option value="BANK">Bank</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0, flex: "1 1 16rem" }}>
            <label className="label" htmlFor="bank-name">
              Name
            </label>
            <input
              id="bank-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="City Bank — Current"
            />
          </div>
          <div className="field" style={{ margin: 0, flex: "1 1 16rem" }}>
            <label className="label" htmlFor="bank-account-code">
              Backs onto
            </label>
            <select
              id="bank-account-code"
              value={accountCode}
              onChange={(event) => setAccountCode(event.target.value)}
            >
              <option value="">Choose an asset account…</option>
              {spare.map((account) => (
                <option key={account.id} value={account.code}>
                  {account.code} · {account.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {spare.length === 0 ? (
          <p className="note" style={{ margin: 0 }}>
            Every asset account is already mapped. Add another asset account on the{" "}
            <Link href="/accounts">Accounts</Link> screen first — a treasury account is a view of one.
          </p>
        ) : null}

        <div className="row" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
          <div className="field" style={{ margin: 0, flex: "1 1 14rem" }}>
            <label className="label" htmlFor="bank-institution">
              Bank (optional)
            </label>
            <input
              id="bank-institution"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
            />
          </div>
          <div className="field" style={{ margin: 0, flex: "1 1 14rem" }}>
            <label className="label" htmlFor="bank-number">
              Account number (optional)
            </label>
            <input
              id="bank-number"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
            />
          </div>
        </div>

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!ready}
            onClick={() =>
              onSubmit({
                kind,
                name: name.trim(),
                account_code: accountCode,
                bank_name: bankName.trim(),
                account_number: accountNumber.trim(),
              })
            }
          >
            Add account
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferForm({
  accounts,
  chart,
  busy,
  onSubmit,
}: {
  accounts: BankAccount[];
  chart: Account[];
  busy: boolean;
  onSubmit: (body: Record<string, string>) => void;
}) {
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId] = useState(accounts[1]?.id ?? "");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [feeAccount, setFeeAccount] = useState("");
  const [memo, setMemo] = useState("");

  const expenses = chart.filter((account) => account.type === "EXPENSE");
  const ready =
    fromId !== "" && toId !== "" && fromId !== toId && /^\d+(\.\d{1,2})?$/.test(amount) && Number(amount) > 0 && !busy;

  return (
    <div className="panel" style={{ marginTop: "var(--s-3)" }}>
      <div className="row" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
        <div className="field" style={{ margin: 0, flex: "1 1 14rem" }}>
          <label className="label" htmlFor="transfer-from">
            From
          </label>
          <select id="transfer-from" value={fromId} onChange={(event) => setFromId(event.target.value)}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.account_code}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ margin: 0, flex: "1 1 14rem" }}>
          <label className="label" htmlFor="transfer-to">
            To
          </label>
          <select id="transfer-to" value={toId} onChange={(event) => setToId(event.target.value)}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.account_code}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label className="label" htmlFor="transfer-date">
            Date
          </label>
          <input
            id="transfer-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="field" style={{ margin: 0, flex: "0 1 9rem" }}>
          <label className="label" htmlFor="transfer-amount">
            Amount
          </label>
          <input
            id="transfer-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="10000.00"
          />
        </div>
        <div className="field" style={{ margin: 0, flex: "0 1 8rem" }}>
          <label className="label" htmlFor="transfer-fee">
            Fee
          </label>
          <input
            id="transfer-fee"
            inputMode="decimal"
            value={fee}
            onChange={(event) => setFee(event.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="row" style={{ gap: "var(--s-3)", marginTop: "var(--s-3)", flexWrap: "wrap" }}>
        <div className="field" style={{ margin: 0, flex: "1 1 16rem" }}>
          <label className="label" htmlFor="transfer-memo">
            Memo
          </label>
          <input
            id="transfer-memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="What the transfer was for"
          />
        </div>
        {fee !== "" && Number(fee) > 0 ? (
          <div className="field" style={{ margin: 0, flex: "1 1 16rem" }}>
            <label className="label" htmlFor="transfer-fee-account">
              Fee goes to
            </label>
            <select
              id="transfer-fee-account"
              value={feeAccount}
              onChange={(event) => setFeeAccount(event.target.value)}
            >
              <option value="">Bank charges (5500)</option>
              {expenses.map((account) => (
                <option key={account.id} value={account.code}>
                  {account.code} · {account.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="row" style={{ justifyContent: "flex-end", marginTop: "var(--s-4)" }}>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!ready}
          onClick={() =>
            onSubmit({
              from_account_id: fromId,
              to_account_id: toId,
              date,
              amount_bdt: amount,
              fee_bdt: fee === "" ? "0.00" : fee,
              fee_account_code: feeAccount,
              memo: memo.trim(),
            })
          }
        >
          Post transfer
        </button>
      </div>
    </div>
  );
}
