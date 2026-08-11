"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/session-provider";
import { api, ApiError } from "@/lib/api";
import { ACCOUNT_TYPES, type Account, type AccountType, type NormalBalance } from "@/lib/types";

/**
 * The chart of accounts, as a tree.
 *
 * This is the screen every other accounting screen quietly depends on: a
 * journal line, an invoice and a trial balance all name accounts by *code*, so
 * the code has to be visible here and it has to be stable. The list is
 * therefore grouped by type in the conventional order an accountant reads —
 * assets, liabilities, equity, revenue, expenses — with children indented under
 * their parent.
 *
 * Two rules from the API are surfaced rather than hidden:
 *
 *   - System accounts (cash, AR, AP, VAT control …) cannot be re-coded or
 *     deactivated. Their code is what the posting engine resolves, so the form
 *     offers their name and nothing else.
 *   - Nothing with history is deleted. "Deactivate" exists instead, and the
 *     server refuses it while the account still has children or postings.
 */
const TYPE_ORDER: AccountType[] = ACCOUNT_TYPES;

const TYPE_LABEL: Record<AccountType, string> = {
  ASSET: "Assets",
  LIABILITY: "Liabilities",
  EQUITY: "Equity",
  REVENUE: "Revenue",
  EXPENSE: "Expenses",
};

interface Draft {
  code: string;
  name: string;
  type: AccountType;
  subtype: string;
  normal_balance: NormalBalance;
  parent_code: string;
}

const emptyDraft = (): Draft => ({
  code: "",
  name: "",
  type: "EXPENSE",
  // A debit-normal expense account is the overwhelmingly common new account,
  // so the form opens on the answer that is right most of the time.
  normal_balance: "DEBIT",
  subtype: "",
  parent_code: "",
});

export default function AccountsPage() {
  const { can } = useSession();
  const canWrite = can("coa.write");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { accounts: rows } = await api<{ accounts: Account[] }>(
        `/coa?include_inactive=${showInactive}`,
      );
      setAccounts(rows);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the chart of accounts.");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = accounts.find((account) => account.id === selectedId) ?? null;

  /** Children by parent id, so the tree renders in one pass rather than N queries. */
  const byParent = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const account of accounts) {
      if (!account.parent_id) continue;
      const bucket = map.get(account.parent_id) ?? [];
      bucket.push(account);
      map.set(account.parent_id, bucket);
    }
    return map;
  }, [accounts]);

  const query = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return null;
    return accounts.filter(
      (account) =>
        account.code.includes(query) ||
        account.name.toLowerCase().includes(query) ||
        account.subtype.toLowerCase().includes(query),
    );
  }, [accounts, query]);

  const inputs = useMemo(
    () => accounts.filter((account) => account.is_active).map((account) => ({ code: account.code, name: account.name })),
    [accounts],
  );

  /**
   * The whole tree, or just the parts that match a search.
   *
   * While searching the hierarchy is dropped: a parent that does not itself
   * match would either be hidden (losing the reason its children are indented)
   * or shown (looking like a match when nothing about it matched).
   */
  function renderRows(list: Account[], depth: number): React.ReactNode[] {
    return list.flatMap((account) => {
      const children = byParent.get(account.id) ?? [];
      return [
        <tr
          key={account.id}
          className={account.id === selectedId ? "is-selected" : undefined}
          onClick={() => setSelectedId(account.id)}
          style={{ cursor: "pointer" }}
        >
          <td className="mono nowrap">{account.code}</td>
          <td>
            <span style={{ paddingLeft: `${depth * 1.25}rem` }}>
              {account.name}
              {account.is_system ? (
                <span className="chip" style={{ marginLeft: "var(--s-2)" }}>
                  system
                </span>
              ) : null}
              {account.is_active ? null : (
                <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                  inactive
                </span>
              )}
            </span>
          </td>
          <td className="muted">{account.subtype || "—"}</td>
          <td className="muted nowrap">{account.normal_balance === "DEBIT" ? "Dr" : "Cr"}</td>
        </tr>,
        ...renderRows(children, depth + 1),
      ];
    });
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const { account } = await api<{ account: Account }>("/coa", {
        method: "POST",
        body: {
          code: draft.code.trim(),
          name: draft.name.trim(),
          type: draft.type,
          subtype: draft.subtype.trim(),
          normal_balance: draft.normal_balance,
          ...(draft.parent_code ? { parent_code: draft.parent_code } : {}),
        },
      });
      setAccounts((rows) => [...rows, account].sort((a, b) => a.code.localeCompare(b.code)));
      setSelectedId(account.id);
      setDraft(emptyDraft());
      setCreating(false);
      setNotice(`Account ${account.code} added.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add that account.");
    } finally {
      setSaving(false);
    }
  }

  function replace(next: Account) {
    setAccounts((rows) => rows.map((row) => (row.id === next.id ? next : row)));
  }

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setError(null);
    setNotice(null);
    try {
      const { account } = await api<{ account: Account }>(`/coa/${id}`, { method: "PATCH", body });
      replace(account);
      setNotice(message);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update that account.");
    }
  }

  async function deactivate(id: string) {
    setError(null);
    setNotice(null);
    try {
      const { account } = await api<{ account: Account }>(`/coa/${id}`, { method: "DELETE" });
      replace(account);
      setNotice(`${account.code} deactivated. It disappears from lists that hide inactive accounts.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not deactivate that account.");
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            02 &nbsp; Chart of accounts
          </p>
          <div className="row" style={{ gap: "var(--s-3)" }}>
            <label className="label row" style={{ gap: "var(--s-2)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              Show inactive
            </label>
            {canWrite ? (
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => {
                  setDraft(emptyDraft());
                  setCreating((open) => !open);
                }}
              >
                {creating ? "Close" : "Add account"}
              </button>
            ) : null}
          </div>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          Every amount in the ledger lands on one of these accounts. The <span className="mono">system</span>{" "}
          accounts are what the posting engine resolves by code — they can be renamed, never re-coded or
          deactivated.
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

        {creating && canWrite ? (
          <div className="panel" style={{ marginTop: "var(--s-5)" }}>
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>New account</h2>
            </div>
            <form className="stack" onSubmit={create} noValidate>
              <div className="grid grid-3">
                <div className="field">
                  <label className="label" htmlFor="coa-code">
                    Code
                  </label>
                  <input
                    id="coa-code"
                    className="mono"
                    value={draft.code}
                    onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                    placeholder="6210"
                    required
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="coa-name">
                    Name
                  </label>
                  <input
                    id="coa-name"
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    placeholder="Marketing Expense"
                    required
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="coa-type">
                    Type
                  </label>
                  <select
                    id="coa-type"
                    value={draft.type}
                    onChange={(event) => setDraft({ ...draft, type: event.target.value as AccountType })}
                  >
                    {TYPE_ORDER.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABEL[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="coa-subtype">
                    Subtype <span className="faint">optional</span>
                  </label>
                  <input
                    id="coa-subtype"
                    value={draft.subtype}
                    onChange={(event) => setDraft({ ...draft, subtype: event.target.value })}
                    placeholder="MARKETING"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="coa-side">
                    Normal balance
                  </label>
                  <select
                    id="coa-side"
                    value={draft.normal_balance}
                    onChange={(event) =>
                      setDraft({ ...draft, normal_balance: event.target.value as NormalBalance })
                    }
                  >
                    <option value="DEBIT">Debit — assets, expenses</option>
                    <option value="CREDIT">Credit — liabilities, equity, revenue</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="coa-parent">
                    Parent <span className="faint">optional</span>
                  </label>
                  <input
                    id="coa-parent"
                    className="mono"
                    list="coa-parent-options"
                    value={draft.parent_code}
                    onChange={(event) => setDraft({ ...draft, parent_code: event.target.value })}
                    placeholder="5800"
                  />
                  <datalist id="coa-parent-options">
                    {inputs.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="row">
                <button className="btn" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Add account"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="row-between" style={{ marginTop: "var(--s-3)" }}>
          <div className="field" style={{ flex: "1 1 18rem", maxWidth: "26rem" }}>
            <label className="label" htmlFor="coa-search">
              Filter
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="coa-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, name or subtype"
                style={{ width: "100%", paddingRight: search ? "2.2rem" : undefined }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear filter query"
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink-muted)",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "28px",
                    minHeight: "28px",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <p className="label">{accounts.length} accounts</p>
        </div>

        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-3)", alignItems: "start" }}>
          <div className="panel panel--flush">
            {loading ? (
              <div className="stack" style={{ padding: "var(--s-5)" }}>
                {[0, 1, 2, 3, 4].map((row) => (
                  <div className="skeleton" key={row} style={{ height: "2rem" }} />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div className="empty">
                <p style={{ margin: 0 }}>This ledger has no accounts yet.</p>
              </div>
            ) : (
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Chart of accounts</caption>
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col">Account</th>
                      <th scope="col">Subtype</th>
                      <th scope="col">Side</th>
                    </tr>
                  </thead>
                  {matches ? (
                    <tbody>
                      {matches.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="muted">
                            Nothing matches “{search}”.
                          </td>
                        </tr>
                      ) : (
                        renderRows(matches, 0)
                      )}
                    </tbody>
                  ) : (
                    TYPE_ORDER.map((type) => {
                      const bucket = accounts.filter((account) => account.type === type);
                      if (bucket.length === 0) return null;
                      return (
                        <tbody key={type}>
                          <tr className="group-row">
                            <th scope="colgroup" colSpan={4}>
                              {TYPE_LABEL[type]}
                            </th>
                          </tr>
                          {renderRows(bucket, 0)}
                        </tbody>
                      );
                    })
                  )}
                </table>
              </div>
            )}
          </div>

          <AccountDetail
            account={selected}
            canWrite={canWrite}
            onPatch={patch}
            onDeactivate={deactivate}
          />
        </div>
      </section>
    </>
  );
}

/**
 * The selected account, and the only two things that can be done to one.
 *
 * A system account offers its name alone. The API would refuse anything else,
 * but a form that lets you type a value it is going to reject is a worse form
 * than one that never asks.
 */
function AccountDetail({
  account,
  canWrite,
  onPatch,
  onDeactivate,
}: {
  account: Account | null;
  canWrite: boolean;
  onPatch: (id: string, body: Record<string, unknown>, message: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [subtype, setSubtype] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Re-seed the fields whenever a different account is picked, so an edit
  // started on one account can never be saved onto another.
  useEffect(() => {
    setName(account?.name ?? "");
    setSubtype(account?.subtype ?? "");
    setConfirming(false);
  }, [account?.id, account?.name, account?.subtype]);

  if (!account) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Account</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pick an account to see what it is and rename it.
        </p>
      </div>
    );
  }

  const changed = name.trim() !== account.name || subtype !== account.subtype;

  async function save() {
    if (!account) return;
    setBusy(true);
    try {
      await onPatch(
        account.id,
        { name: name.trim(), ...(account.is_system ? {} : { subtype }) },
        `${name.trim()} saved.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>
          <span className="mono">{account.code}</span> {account.name}
        </h2>
      </div>

      <div className="stack">
        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
          <DetailRow label="Type" value={TYPE_LABEL[account.type]} />
          <DetailRow label="Subtype" value={account.subtype || "—"} />
          <DetailRow label="Normal balance" value={account.normal_balance === "DEBIT" ? "Debit" : "Credit"} />
          <DetailRow label="Status" value={account.is_active ? "Active" : "Inactive"} />
          <DetailRow label="Origin" value={account.is_system ? "Part of the ledger's structure" : "Added by you"} />
        </dl>

        {account.is_system ? (
          <p className="muted" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
            Renaming is safe. The code and type are what postings resolve against, so they stay fixed.
          </p>
        ) : null}

        {canWrite ? (
          <>
            <div className="field">
              <label className="label" htmlFor="coa-edit-name">
                Name
              </label>
              <input
                id="coa-edit-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            {account.is_system ? null : (
              <div className="field">
                <label className="label" htmlFor="coa-edit-subtype">
                  Subtype
                </label>
                <input
                  id="coa-edit-subtype"
                  value={subtype}
                  onChange={(event) => setSubtype(event.target.value)}
                />
              </div>
            )}

            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              <button className="btn btn--sm" type="button" disabled={!changed || busy} onClick={() => void save()}>
                {busy ? "Saving…" : "Save changes"}
              </button>

              {account.is_system || !account.is_active ? null : confirming ? (
                <>
                  {/* Two steps rather than a browser confirm(): deactivating is
                      recoverable, but it silently removes an account from every
                      picker in the app, which deserves a sentence of warning. */}
                  <button
                    className="btn btn--danger btn--sm"
                    type="button"
                    onClick={() => void onDeactivate(account.id)}
                  >
                    Yes, deactivate
                  </button>
                  <button className="btn btn--quiet btn--sm" type="button" onClick={() => setConfirming(false)}>
                    Keep it
                  </button>
                </>
              ) : (
                <button className="btn btn--quiet btn--sm" type="button" onClick={() => setConfirming(true)}>
                  Deactivate
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Your role can read the chart but not change it.
          </p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row-between" style={{ gap: "var(--s-3)" }}>
      <dt className="label" style={{ margin: 0 }}>
        {label}
      </dt>
      <dd className="muted" style={{ margin: 0, textAlign: "right" }}>
        {value}
      </dd>
    </div>
  );
}
