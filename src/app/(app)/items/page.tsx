"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import type { Account, CatalogTaxRate, CatalogUnit, Item } from "@/lib/types";

/**
 * Items — what is sold and bought. Each one carries the defaults every future
 * document line will start from: the unit it is measured in, the tax rate that
 * applies, and the three accounts its postings land on.
 *
 * The account fields are three separate pickers rather than one clever guess
 * because they are genuinely three different questions: what a sale credits,
 * what a stock movement debits, and what a one-off purchase expenses. An item
 * that answers none of them correctly is caught here, at data-entry time,
 * instead of producing a plausible-looking but wrong journal months later.
 *
 * `track_stock` is offered as a plain flag: services and one-off purchases
 * never need quantity-on-hand, and pretending otherwise fills the books with
 * inventory rows nobody counts.
 */
interface Draft {
  sku: string;
  name: string;
  description: string;
  track_stock: boolean;
  unit_id: string;
  /** Held as the string the field typed; converted on save. */
  reorder_level: string;
  tax_code: string;
  income_account_code: string;
  cogs_account_code: string;
  expense_account_code: string;
}

const emptyDraft = (): Draft => ({
  sku: "",
  name: "",
  description: "",
  track_stock: false,
  unit_id: "",
  reorder_level: "0",
  tax_code: "",
  income_account_code: "4000",
  cogs_account_code: "5000",
  expense_account_code: "5800",
});

/** "0" and "" both mean "only an empty shelf counts as low". */
const reorderLevelOf = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export default function ItemsPage() {
  const { can } = useSession();
  const canWrite = can("masterdata.write");

  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [units, setUnits] = useState<CatalogUnit[]>([]);
  const [taxRates, setTaxRates] = useState<CatalogTaxRate[]>([]);
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
      const [{ items: rows }, { accounts: chart }, { units: unitRows }, { tax_rates: taxRows }] =
        await Promise.all([
          api<{ items: Item[] }>(`/items?include_inactive=${showInactive}`),
          api<{ accounts: Account[] }>("/coa?include_inactive=true"),
          api<{ units: CatalogUnit[] }>("/catalogs/units?include_inactive=true"),
          api<{ tax_rates: CatalogTaxRate[] }>("/catalogs/tax-rates?include_inactive=true"),
        ]);
      setItems(rows);
      setAccounts(chart.filter((account) => account.is_active));
      setUnits(unitRows);
      setTaxRates(taxRows);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load items.");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!query) return items;
    return items.filter(
      (item) =>
        item.sku.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query),
    );
  }, [items, query]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const { item } = await api<{ item: Item }>("/items", {
        method: "POST",
        body: {
          ...draft,
          unit_id: draft.unit_id || null,
          reorder_level: reorderLevelOf(draft.reorder_level),
        },
      });
      setItems((rows) => [...rows, item].sort((a, b) => a.sku.localeCompare(b.sku)));
      setSelectedId(item.id);
      setDraft(emptyDraft());
      setCreating(false);
      setNotice(`${item.sku} added.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add that item.");
    } finally {
      setSaving(false);
    }
  }

  function replace(next: Item) {
    setItems((rows) => rows.map((row) => (row.id === next.id ? next : row)));
  }

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setError(null);
    setNotice(null);
    try {
      const { item } = await api<{ item: Item }>(`/items/${id}`, { method: "PATCH", body });
      replace(item);
      setNotice(message);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update that item.");
    }
  }

  async function deactivate(id: string) {
    setError(null);
    setNotice(null);
    try {
      const { item } = await api<{ item: Item }>(`/items/${id}`, { method: "DELETE" });
      replace(item);
      setNotice(`${item.sku} retired. Documents that already name it still resolve.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not retire that item.");
    }
  }

  const accountInputs = useMemo(() => accounts.map((a) => ({ code: a.code, name: a.name })), [accounts]);
  const activeUnits = units.filter((unit) => unit.is_active);
  const activeTaxRates = taxRates.filter((rate) => rate.is_active);

  function taxLabel(rate: CatalogTaxRate): string {
    return `${rate.code} · ${rate.name} (${rate.rate_percent}%)`;
  }

  /** One shared form body, used by both the create panel and the detail panel. */
  function draftFields(
    draft: Draft,
    setDraft: (next: Draft) => void,
    idPrefix: string,
  ): React.ReactNode {
    return (
      <div className="grid grid-3">
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-sku`}>
            SKU
          </label>
          <input
            id={`${idPrefix}-sku`}
            className="mono"
            value={draft.sku}
            onChange={(event) => setDraft({ ...draft, sku: event.target.value })}
            placeholder="RICE-1KG"
            required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-name`}>
            Name
          </label>
          <input
            id={`${idPrefix}-name`}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Basmati Rice 1kg"
            required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-unit`}>
            Unit
          </label>
          <select
            id={`${idPrefix}-unit`}
            value={draft.unit_id}
            onChange={(event) => setDraft({ ...draft, unit_id: event.target.value })}
          >
            <option value="">No unit</option>
            {activeUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.symbol})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-tax`}>
            Default tax rate
          </label>
          <select
            id={`${idPrefix}-tax`}
            value={draft.tax_code}
            onChange={(event) => setDraft({ ...draft, tax_code: event.target.value })}
          >
            <option value="">No tax</option>
            {activeTaxRates.map((rate) => (
              <option key={rate.id} value={rate.code}>
                {taxLabel(rate)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-income`}>
            Income account
          </label>
          <input
            id={`${idPrefix}-income`}
            className="mono"
            list={`${idPrefix}-accounts`}
            value={draft.income_account_code}
            onChange={(event) => setDraft({ ...draft, income_account_code: event.target.value })}
            placeholder="4000"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-cogs`}>
            COGS account
          </label>
          <input
            id={`${idPrefix}-cogs`}
            className="mono"
            list={`${idPrefix}-accounts`}
            value={draft.cogs_account_code}
            onChange={(event) => setDraft({ ...draft, cogs_account_code: event.target.value })}
            placeholder="5000"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-expense`}>
            Expense account
          </label>
          <input
            id={`${idPrefix}-expense`}
            className="mono"
            list={`${idPrefix}-accounts`}
            value={draft.expense_account_code}
            onChange={(event) => setDraft({ ...draft, expense_account_code: event.target.value })}
            placeholder="5800"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-description`}>
            Description <span className="faint">optional</span>
          </label>
          <input
            id={`${idPrefix}-description`}
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            placeholder="Loose grain, sold by the kg"
          />
        </div>
        <div className="field">
          <span className="label">Stock</span>
          <label className="row" style={{ gap: "var(--s-2)", cursor: "pointer", marginTop: "var(--s-2)" }}>
            <input
              type="checkbox"
              checked={draft.track_stock}
              onChange={(event) => setDraft({ ...draft, track_stock: event.target.checked })}
            />
            Track quantity on hand
          </label>
        </div>
        <div className="field">
          <label className="label" htmlFor={`${idPrefix}-reorder`}>
            Reorder at
          </label>
          <input
            id={`${idPrefix}-reorder`}
            inputMode="numeric"
            className="mono"
            value={draft.reorder_level}
            onChange={(event) => setDraft({ ...draft, reorder_level: event.target.value })}
            placeholder="0"
            disabled={!draft.track_stock}
          />
          <span className="note">0 warns only when the shelf is empty.</span>
        </div>
        <datalist id={`${idPrefix}-accounts`}>
          {accountInputs.map((account) => (
            <option key={account.code} value={account.code}>
              {account.name}
            </option>
          ))}
        </datalist>
      </div>
    );
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Items
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
                {creating ? "Close" : "Add item"}
              </button>
            ) : null}
          </div>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          What you trade, with the defaults every document line starts from: unit, tax rate, and the
          accounts a sale, a stock movement and a purchase post to.
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
              <h2 style={{ fontSize: "var(--t-lg)" }}>New item</h2>
            </div>
            <form className="stack" onSubmit={create} noValidate>
              {draftFields(draft, setDraft, "item-new")}
              <div className="row">
                <button className="btn" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Add item"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div style={{ marginTop: "var(--s-4)" }}>
        <div className="row-between">
          <div className="field" style={{ flex: "1 1 18rem", maxWidth: "26rem" }}>
            <label className="label" htmlFor="item-search">
              Filter
            </label>
            <input
              id="item-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="SKU, name or description"
            />
          </div>
          <p className="label">{visible.length} items</p>
        </div>

        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-5)", alignItems: "start" }}>
          <div className="panel panel--flush">
            {loading ? (
              <div className="stack" style={{ padding: "var(--s-5)" }}>
                {[0, 1, 2, 3, 4].map((row) => (
                  <div className="skeleton" key={row} style={{ height: "2rem" }} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="empty">
                <p style={{ margin: 0 }}>No items yet. Add what you sell and buy.</p>
              </div>
            ) : (
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Items</caption>
                  <thead>
                    <tr>
                      <th scope="col">SKU</th>
                      <th scope="col">Name</th>
                      <th scope="col">Unit</th>
                      <th scope="col">Tax</th>
                      <th scope="col">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="muted">
                          Nothing matches “{search}”.
                        </td>
                      </tr>
                    ) : (
                      visible.map((item) => (
                        <tr
                          key={item.id}
                          className={item.id === selectedId ? "is-selected" : undefined}
                          onClick={() => setSelectedId(item.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="mono nowrap">{item.sku}</td>
                          <td>
                            {item.name}
                            {item.is_active ? null : (
                              <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                                retired
                              </span>
                            )}
                          </td>
                          <td className="muted">{item.unit_name || "—"}</td>
                          <td className="mono nowrap">
                            {item.tax_code ? `${item.tax_rate_percent}%` : "—"}
                          </td>
                          <td className="muted">{item.track_stock ? "Yes" : "No"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ItemDetail
            item={selected}
            draftFields={draftFields}
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
 * The selected item, and the only two things that can be done to one.
 *
 * The SKU is shown read-only: stock and reports key off it, so it is fixed
 * after creation just like a party's code.
 */
function ItemDetail({
  item,
  draftFields,
  canWrite,
  onPatch,
  onDeactivate,
}: {
  item: Item | null;
  draftFields: (draft: Draft, setDraft: (next: Draft) => void, idPrefix: string) => React.ReactNode;
  canWrite: boolean;
  onPatch: (id: string, body: Record<string, unknown>, message: string) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Re-seed whenever a different item is picked, so an edit started on one can
  // never be saved onto another.
  useEffect(() => {
    setDraft(
      item
        ? {
            sku: item.sku,
            name: item.name,
            description: item.description,
            track_stock: item.track_stock,
            unit_id: item.unit_id ?? "",
            reorder_level: String(item.reorder_level ?? 0),
            tax_code: item.tax_code,
            income_account_code: item.income_account_code,
            cogs_account_code: item.cogs_account_code,
            expense_account_code: item.expense_account_code,
          }
        : emptyDraft(),
    );
    setConfirming(false);
  }, [item]);

  if (!item) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Item</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pick an item to see its defaults and edit them.
        </p>
      </div>
    );
  }

  const changed =
    draft.name !== item.name ||
    draft.description !== item.description ||
    draft.track_stock !== item.track_stock ||
    draft.unit_id !== (item.unit_id ?? "") ||
    reorderLevelOf(draft.reorder_level) !== item.reorder_level ||
    draft.tax_code !== item.tax_code ||
    draft.income_account_code !== item.income_account_code ||
    draft.cogs_account_code !== item.cogs_account_code ||
    draft.expense_account_code !== item.expense_account_code;

  async function save() {
    if (!item) return;
    setBusy(true);
    try {
      await onPatch(
        item.id,
        {
          name: draft.name.trim(),
          description: draft.description.trim(),
          track_stock: draft.track_stock,
          unit_id: draft.unit_id || null,
          reorder_level: reorderLevelOf(draft.reorder_level),
          tax_code: draft.tax_code,
          income_account_code: draft.income_account_code.trim(),
          cogs_account_code: draft.cogs_account_code.trim(),
          expense_account_code: draft.expense_account_code.trim(),
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
          <span className="mono">{item.sku}</span> {item.name}
        </h2>
      </div>

      <div className="stack">
        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
          <DetailRow label="Unit" value={item.unit_name || "None"} />
          <DetailRow
            label="Tax"
            value={item.tax_code ? `${item.tax_name} (${item.tax_rate_percent}%)` : "No tax"}
          />
          <DetailRow
            label="Stock"
            value={
              item.track_stock
                ? `Tracked — low at ${item.reorder_level} or fewer`
                : "Not tracked"
            }
          />
          <DetailRow
            label="Posts to"
            value={`${item.income_account_code} / ${item.cogs_account_code} / ${item.expense_account_code}`}
          />
          <DetailRow label="Status" value={item.is_active ? "Active" : "Retired"} />
        </dl>

        {canWrite ? (
          <>
            {draftFields(draft, setDraft, "item-edit")}

            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              <button
                className="btn btn--sm"
                type="button"
                disabled={!changed || busy}
                onClick={() => void save()}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>

              {!item.is_active ? null : confirming ? (
                <>
                  <button
                    className="btn btn--danger btn--sm"
                    type="button"
                    onClick={() => void onDeactivate(item.id)}
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
            Your role can read items but not change them.
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
