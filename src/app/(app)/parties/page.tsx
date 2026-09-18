"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import { PARTY_KINDS, PARTY_KIND_LABEL, type Account, type Party, type PartyKind } from "@/lib/types";

/**
 * Customers and suppliers — the parties documents will be issued to (P3 sales,
 * P4 purchases).
 *
 * Two rules from the API are surfaced rather than hidden:
 *
 *   - The **code is fixed after creation**. It is the handle a document quotes,
 *     so the form offers it once, at creation, and never again.
 *   - **Nothing is deleted.** "Retire" deactivates: a party already named on a
 *     document keeps resolving, it just stops appearing in pickers.
 *
 * The control account is shown against every party because that is the whole
 * accounting point of one — a customer's balance is Accounts Receivable, a
 * supplier's is Accounts Payable — and the form pre-fills the conventional
 * account for the chosen kind so most users never need to think about it.
 */
interface Draft {
  code: string;
  name: string;
  kind: PartyKind;
  email: string;
  phone: string;
  address: string;
  control_account_code: string;
}

const emptyDraft = (): Draft => ({
  code: "",
  name: "",
  kind: "BOTH",
  email: "",
  phone: "",
  address: "",
  control_account_code: "",
});

/** Conventional control accounts — mirrors `CONTROL_BY_KIND` in the service. */
const CONTROL_BY_KIND: Record<PartyKind, string> = {
  CUSTOMER: "1100",
  SUPPLIER: "2000",
  BOTH: "1100",
};

export default function PartiesPage() {
  const { can } = useSession();
  const canWrite = can("masterdata.write");

  const [parties, setParties] = useState<Party[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"ALL" | PartyKind>("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ parties: rows }, { accounts: chart }] = await Promise.all([
        api<{ parties: Party[] }>(`/parties?include_inactive=${showInactive}`),
        api<{ accounts: Account[] }>("/coa?include_inactive=true"),
      ]);
      setParties(rows);
      // Only asset and liability accounts can hold a party's balance; the
      // picker offers exactly those, so a wrong pick is not a possible mistake.
      setAccounts(
        chart.filter(
          (account) => account.is_active && (account.type === "ASSET" || account.type === "LIABILITY"),
        ),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load parties.");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = parties.find((party) => party.id === selectedId) ?? null;

  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    let rows = parties;
    if (kindFilter !== "ALL") rows = rows.filter((party) => party.kind === kindFilter || party.kind === "BOTH");
    if (query) {
      rows = rows.filter(
        (party) =>
          party.code.toLowerCase().includes(query) ||
          party.name.toLowerCase().includes(query) ||
          party.control_account_code.includes(query),
      );
    }
    return rows;
  }, [parties, kindFilter, query]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const { party } = await api<{ party: Party }>("/parties", {
        method: "POST",
        body: { ...draft },
      });
      setParties((rows) => [...rows, party].sort((a, b) => a.code.localeCompare(b.code)));
      setSelectedId(party.id);
      setDraft(emptyDraft());
      setCreating(false);
      setNotice(`${party.code} added — ${party.name} posts to ${party.control_account_code}.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add that party.");
    } finally {
      setSaving(false);
    }
  }

  function replace(next: Party) {
    setParties((rows) => rows.map((row) => (row.id === next.id ? next : row)));
  }

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setError(null);
    setNotice(null);
    try {
      const { party } = await api<{ party: Party }>(`/parties/${id}`, { method: "PATCH", body });
      replace(party);
      setNotice(message);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update that party.");
    }
  }

  async function deactivate(id: string) {
    setError(null);
    setNotice(null);
    try {
      const { party } = await api<{ party: Party }>(`/parties/${id}`, { method: "DELETE" });
      replace(party);
      setNotice(`${party.code} retired. Documents that already name it still resolve.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not retire that party.");
    }
  }

  /** Accounts as `code — name`, for the datalist the two forms share. */
  const accountInputs = useMemo(
    () => accounts.map((account) => ({ code: account.code, name: account.name })),
    [accounts],
  );

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Parties
          </p>
          <div className="row" style={{ gap: "var(--s-3)" }}>
            <label className="label row" style={{ gap: "var(--s-2)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              Show retired
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
                {creating ? "Close" : "Add party"}
              </button>
            ) : null}
          </div>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          Who you buy from and sell to. Each party&rsquo;s balance lives on a control account in the
          chart — receivable for customers, payable for suppliers — so the sub-ledger always ties back
          to the books.
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
              <h2 style={{ fontSize: "var(--t-lg)" }}>New party</h2>
            </div>
            <form className="stack" onSubmit={create} noValidate>
              <div className="grid grid-3">
                <div className="field">
                  <label className="label" htmlFor="party-code">
                    Code
                  </label>
                  <input
                    id="party-code"
                    className="mono"
                    value={draft.code}
                    onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                    placeholder="KHAN"
                    required
                  />
                  <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                    Fixed after saving — documents quote it.
                  </p>
                </div>
                <div className="field">
                  <label className="label" htmlFor="party-name">
                    Name
                  </label>
                  <input
                    id="party-name"
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    placeholder="Khan Traders"
                    required
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="party-kind">
                    Kind
                  </label>
                  <select
                    id="party-kind"
                    value={draft.kind}
                    onChange={(event) =>
                      setDraft({ ...draft, kind: event.target.value as PartyKind })
                    }
                  >
                    {PARTY_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {PARTY_KIND_LABEL[kind]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="party-email">
                    E-mail <span className="faint">optional</span>
                  </label>
                  <input
                    id="party-email"
                    type="email"
                    value={draft.email}
                    onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                    placeholder="accounts@khan.example"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="party-phone">
                    Phone <span className="faint">optional</span>
                  </label>
                  <input
                    id="party-phone"
                    value={draft.phone}
                    onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                    placeholder="+880 1711 000000"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="party-control">
                    Control account
                  </label>
                  <input
                    id="party-control"
                    className="mono"
                    list="party-account-options"
                    value={draft.control_account_code}
                    onChange={(event) =>
                      setDraft({ ...draft, control_account_code: event.target.value })
                    }
                    placeholder={CONTROL_BY_KIND[draft.kind]}
                  />
                  <datalist id="party-account-options">
                    {accountInputs.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.name}
                      </option>
                    ))}
                  </datalist>
                  <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                    Blank uses {CONTROL_BY_KIND[draft.kind]} — the conventional account for this kind.
                  </p>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label className="label" htmlFor="party-address">
                    Address <span className="faint">optional</span>
                  </label>
                  <input
                    id="party-address"
                    value={draft.address}
                    onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                    placeholder="12 Motijheel, Dhaka 1000"
                  />
                </div>
              </div>

              <div className="row">
                <button className="btn" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Add party"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div style={{ marginTop: "var(--s-4)" }}>
        <div className="row-between">
          <div className="field" style={{ flex: "1 1 18rem", maxWidth: "26rem" }}>
            <label className="label" htmlFor="party-search">
              Filter
            </label>
            <input
              id="party-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Code, name or control account"
            />
          </div>
          <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
            {(["ALL", ...PARTY_KINDS] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                className={`btn btn--sm ${kindFilter === kind ? "" : "btn--quiet"}`}
                onClick={() => setKindFilter(kind)}
              >
                {kind === "ALL" ? "All" : PARTY_KIND_LABEL[kind]}
              </button>
            ))}
            <p className="label" style={{ marginLeft: "var(--s-2)" }}>
              {visible.length} parties
            </p>
          </div>
        </div>

        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-5)", alignItems: "start" }}>
          <div className="panel panel--flush">
            {loading ? (
              <div className="stack" style={{ padding: "var(--s-5)" }}>
                {[0, 1, 2, 3, 4].map((row) => (
                  <div className="skeleton" key={row} style={{ height: "2rem" }} />
                ))}
              </div>
            ) : parties.length === 0 ? (
              <div className="empty">
                <p style={{ margin: 0 }}>
                  No parties yet. Add the people and businesses you trade with.
                </p>
              </div>
            ) : (
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Parties</caption>
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col">Name</th>
                      <th scope="col">Kind</th>
                      <th scope="col">Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="muted">
                          Nothing matches “{search}”.
                        </td>
                      </tr>
                    ) : (
                      visible.map((party) => (
                        <tr
                          key={party.id}
                          className={party.id === selectedId ? "is-selected" : undefined}
                          onClick={() => setSelectedId(party.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="mono nowrap">{party.code}</td>
                          <td>
                            {party.name}
                            {party.is_active ? null : (
                              <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                                retired
                              </span>
                            )}
                          </td>
                          <td className="muted">{PARTY_KIND_LABEL[party.kind]}</td>
                          <td className="mono nowrap">{party.control_account_code}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <PartyDetail
            party={selected}
            accounts={accountInputs}
            canWrite={canWrite}
            onPatch={patch}
            onDeactivate={deactivate}
          />
        </div>
        </div>
      </section>
    </>
  );
}

/**
 * The selected party, and the only two things that can be done to one.
 *
 * The code is shown but not editable — it is the handle documents quote, and a
 * code that starts meaning something else is worse than no code at all.
 */
function PartyDetail({
  party,
  accounts,
  canWrite,
  onPatch,
  onDeactivate,
}: {
  party: Party | null;
  accounts: Array<{ code: string; name: string }>;
  canWrite: boolean;
  onPatch: (id: string, body: Record<string, unknown>, message: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Re-seed whenever a different party is picked, so an edit started on one
  // can never be saved onto another.
  useEffect(() => {
    setDraft(
      party
        ? {
            code: party.code,
            name: party.name,
            kind: party.kind,
            email: party.email,
            phone: party.phone,
            address: party.address,
            control_account_code: party.control_account_code,
          }
        : emptyDraft(),
    );
    setConfirming(false);
  }, [party]);

  if (!party) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Party</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pick a party to see its details and edit it.
        </p>
      </div>
    );
  }

  const changed =
    draft.name !== party.name ||
    draft.kind !== party.kind ||
    draft.email !== party.email ||
    draft.phone !== party.phone ||
    draft.address !== party.address ||
    draft.control_account_code !== party.control_account_code;

  async function save() {
    if (!party) return;
    setBusy(true);
    try {
      await onPatch(
        party.id,
        {
          name: draft.name.trim(),
          kind: draft.kind,
          email: draft.email.trim(),
          phone: draft.phone.trim(),
          address: draft.address.trim(),
          control_account_code: draft.control_account_code.trim(),
        },
        `${draft.name.trim()} saved.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>
          <span className="mono">{party.code}</span> {party.name}
        </h2>
      </div>

      <div className="stack">
        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
          <DetailRow label="Kind" value={PARTY_KIND_LABEL[party.kind]} />
          <DetailRow
            label="Control account"
            value={
              party.control_account_name
                ? `${party.control_account_code} ${party.control_account_name}`
                : party.control_account_code
            }
          />
          <DetailRow label="Status" value={party.is_active ? "Active" : "Retired"} />
        </dl>

        {canWrite ? (
          <>
            <div className="field">
              <label className="label" htmlFor="party-edit-name">
                Name
              </label>
              <input
                id="party-edit-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="party-edit-kind">
                Kind
              </label>
              <select
                id="party-edit-kind"
                value={draft.kind}
                onChange={(event) => setDraft({ ...draft, kind: event.target.value as PartyKind })}
              >
                {PARTY_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {PARTY_KIND_LABEL[kind]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="party-edit-control">
                Control account
              </label>
              <input
                id="party-edit-control"
                className="mono"
                list="party-account-options-edit"
                value={draft.control_account_code}
                onChange={(event) =>
                  setDraft({ ...draft, control_account_code: event.target.value })
                }
                placeholder={CONTROL_BY_KIND[draft.kind]}
              />
              <datalist id="party-account-options-edit">
                {accounts.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="field">
              <label className="label" htmlFor="party-edit-email">
                E-mail
              </label>
              <input
                id="party-edit-email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="party-edit-phone">
                Phone
              </label>
              <input
                id="party-edit-phone"
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="party-edit-address">
                Address
              </label>
              <input
                id="party-edit-address"
                value={draft.address}
                onChange={(event) => setDraft({ ...draft, address: event.target.value })}
              />
            </div>

            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              <button
                className="btn btn--sm"
                type="button"
                disabled={!changed || busy}
                onClick={() => void save()}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>

              {!party.is_active ? null : confirming ? (
                <>
                  <button
                    className="btn btn--danger btn--sm"
                    type="button"
                    onClick={() => void onDeactivate(party.id)}
                  >
                    Yes, retire
                  </button>
                  <button
                    className="btn btn--quiet btn--sm"
                    type="button"
                    onClick={() => setConfirming(false)}
                  >
                    Keep it
                  </button>
                </>
              ) : (
                <button
                  className="btn btn--quiet btn--sm"
                  type="button"
                  onClick={() => setConfirming(true)}
                >
                  Retire
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Your role can read parties but not change them.
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
