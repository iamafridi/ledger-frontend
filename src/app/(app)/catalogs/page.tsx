"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/session-provider";
import { api, ApiError } from "@/lib/api";
import type { Account, CatalogCategory, CatalogTaxRate, CatalogUnit, TaxKind } from "@/lib/types";

/**
 * The three catalogs document lines snapshot from: tax rates, units of measure
 * and categories.
 *
 * They share one screen because they share one lifecycle and one meaning —
 * small, org-scoped vocabularies that documents *reference* rather than
 * contain. The two rules the API enforces are visible here:
 *
 *   - A tax rate's **code is fixed** (documents and items point at it) while
 *     its name and percentage stay editable. Changing 15% to 12% rewrites
 *     nothing that was already issued; every document snapshots its rate at
 *     line time (plan §5.4).
 *   - **Nothing is deleted, only retired**, so history that names a unit or
 *     category keeps resolving.
 *
 * On an organisation from before this module existed the catalogs are empty —
 * that is a repairable state, not an error, and the "seed defaults" button
 * fills in the 0/5/15 rates, common units and the personal-ledger categories
 * the chart already maps. It is idempotent, so pressing it twice is free.
 */
type Tab = "tax-rates" | "units" | "categories";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "tax-rates", label: "Tax rates" },
  { key: "units", label: "Units" },
  { key: "categories", label: "Categories" },
];

interface TaxDraft {
  code: string;
  name: string;
  rate_percent: string;
  kind: TaxKind;
}
interface UnitDraft {
  name: string;
  symbol: string;
}
interface CategoryDraft {
  name: string;
  kind: "EXPENSE" | "INCOME";
  account_code: string;
}

const emptyTaxDraft = (): TaxDraft => ({ code: "", name: "", rate_percent: "", kind: "VAT" });
const emptyUnitDraft = (): UnitDraft => ({ name: "", symbol: "" });
const emptyCategoryDraft = (): CategoryDraft => ({
  name: "",
  kind: "EXPENSE",
  account_code: "",
});

export default function CatalogsPage() {
  const { can } = useSession();
  const canWrite = can("masterdata.write");

  const [tab, setTab] = useState<Tab>("tax-rates");
  const [taxRates, setTaxRates] = useState<CatalogTaxRate[]>([]);
  const [units, setUnits] = useState<CatalogUnit[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [taxDraft, setTaxDraft] = useState<TaxDraft>(emptyTaxDraft());
  const [unitDraft, setUnitDraft] = useState<UnitDraft>(emptyUnitDraft());
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft());

  // One selection per tab, so switching away and back keeps the picked row.
  const [selected, setSelected] = useState<{ [K in Tab]: string | null }>({
    "tax-rates": null,
    units: null,
    categories: null,
  });

  // Everything loads once, with retired rows included; the toggle below filters
  // the display rather than re-fetching, because a screen with three tables
  // should not fire three requests every time somebody ticks a checkbox.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ tax_rates }, { units: unitRows }, { categories: categoryRows }, { accounts: chart }] =
        await Promise.all([
          api<{ tax_rates: CatalogTaxRate[] }>("/catalogs/tax-rates?include_inactive=true"),
          api<{ units: CatalogUnit[] }>("/catalogs/units?include_inactive=true"),
          api<{ categories: CatalogCategory[] }>("/catalogs/categories?include_inactive=true"),
          api<{ accounts: Account[] }>("/coa?include_inactive=true"),
        ]);
      setTaxRates(tax_rates);
      setUnits(unitRows);
      setCategories(categoryRows);
      setAccounts(chart.filter((account) => account.is_active));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the catalogs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const needsSeed = taxRates.length + units.length + categories.length === 0;

  async function seedDefaults() {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const { seeded } = await api<{ seeded: { tax_rates: number; units: number; categories: number } }>(
        "/catalogs/seed",
        { method: "POST", body: {} },
      );
      await load();
      setNotice(
        `Seeded ${seeded.tax_rates} tax rates, ${seeded.units} units and ${seeded.categories} categories. Anything already present was left alone.`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not seed the catalogs.");
    } finally {
      setSaving(false);
    }
  }

  /* Row updates, one setter per catalog. */

  function replaceTax(next: CatalogTaxRate) {
    setTaxRates((rows) => rows.map((row) => (row.id === next.id ? next : row)));
  }
  function replaceUnit(next: CatalogUnit) {
    setUnits((rows) => rows.map((row) => (row.id === next.id ? next : row)));
  }
  function replaceCategory(next: CatalogCategory) {
    setCategories((rows) => rows.map((row) => (row.id === next.id ? next : row)));
  }

  async function request<T>(
    path: string,
    method: "PATCH" | "DELETE",
    body: Record<string, unknown> | undefined,
    onSuccess: (row: T) => void,
    failure: string,
  ): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      const payload = await api<Record<string, T>>(path, {
        method,
        ...(body === undefined ? {} : { body }),
      });
      // The response wraps the row in its singular key (`{ unit }`, …).
      const row = Object.values(payload)[0] as T;
      onSuccess(row);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : failure);
    }
  }

  const accountInputs = useMemo(() => accounts.map((a) => ({ code: a.code, name: a.name })), [accounts]);

  const filterRows = <T extends { name: string; is_active: boolean }>(rows: T[]): T[] =>
    showInactive ? rows : rows.filter((row) => row.is_active);

  const visibleTax = filterRows(taxRates);
  const visibleUnits = filterRows(units);
  const visibleCategories = filterRows(categories);

  const selectedTax = taxRates.find((row) => row.id === selected["tax-rates"]) ?? null;
  const selectedUnit = units.find((row) => row.id === selected.units) ?? null;
  const selectedCategory = categories.find((row) => row.id === selected.categories) ?? null;

  async function createTax(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await api<{ tax_rate: CatalogTaxRate }>("/catalogs/tax-rates", {
        method: "POST",
        body: taxDraft,
      });
      setTaxRates((rows) => [...rows, payload.tax_rate].sort((a, b) => a.code.localeCompare(b.code)));
      setSelected((state) => ({ ...state, "tax-rates": payload.tax_rate.id }));
      setTaxDraft(emptyTaxDraft());
      setCreating(false);
      setNotice(`${payload.tax_rate.code} added at ${payload.tax_rate.rate_percent}%.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add that tax rate.");
    } finally {
      setSaving(false);
    }
  }

  async function createUnit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await api<{ unit: CatalogUnit }>("/catalogs/units", {
        method: "POST",
        body: unitDraft,
      });
      setUnits((rows) => [...rows, payload.unit].sort((a, b) => a.name.localeCompare(b.name)));
      setSelected((state) => ({ ...state, units: payload.unit.id }));
      setUnitDraft(emptyUnitDraft());
      setCreating(false);
      setNotice(`${payload.unit.name} added.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add that unit.");
    } finally {
      setSaving(false);
    }
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await api<{ category: CatalogCategory }>("/catalogs/categories", {
        method: "POST",
        body: { ...categoryDraft, account_code: categoryDraft.account_code.trim() },
      });
      setCategories((rows) =>
        [...rows, payload.category].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelected((state) => ({ ...state, categories: payload.category.id }));
      setCategoryDraft(emptyCategoryDraft());
      setCreating(false);
      setNotice(`${payload.category.name} posts to ${payload.category.account_code}.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add that category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Catalogs
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
            {canWrite && !needsSeed ? (
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => {
                  setTaxDraft(emptyTaxDraft());
                  setUnitDraft(emptyUnitDraft());
                  setCategoryDraft(emptyCategoryDraft());
                  setCreating((open) => !open);
                }}
              >
                {creating ? "Close" : "Add"}
              </button>
            ) : null}
          </div>
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
          The small vocabularies documents are written in. A rate&rsquo;s code is fixed — items and
          lines point at it — while its name and percentage stay editable, and every document
          snapshots the rate it was issued under. A rate is either VAT (added to a line) or
          withholding (deducted from a supplier payment and owed to the tax office instead).
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

        {loading ? (
          <div className="stack" style={{ marginTop: "var(--s-5)" }}>
            {[0, 1, 2].map((row) => (
              <div className="skeleton" key={row} style={{ height: "2rem" }} />
            ))}
          </div>
        ) : needsSeed ? (
          <div className="panel" style={{ marginTop: "var(--s-5)" }}>
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>Start from the defaults</h2>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              This ledger has no catalogs yet. Seed the standard tax rates (0 / 5 / 15), everyday
              units of measure and the categories the chart already maps — then edit or add to taste.
            </p>
            {canWrite ? (
              <div className="row" style={{ marginTop: "var(--s-4)" }}>
                <button className="btn" type="button" disabled={saving} onClick={() => void seedDefaults()}>
                  {saving ? "Seeding…" : "Seed defaults"}
                </button>
              </div>
            ) : (
              <p className="note" style={{ margin: 0 }}>
                Your role can read the catalogs but not change them.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* The three tabs. Existing button styles only — a tab strip that
                needs its own CSS is a tab strip nobody styled. */}
            <div className="row" style={{ gap: "var(--s-2)", marginTop: "var(--s-5)" }}>
              {TABS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className={`btn btn--sm ${tab === entry.key ? "" : "btn--quiet"}`}
                  aria-pressed={tab === entry.key}
                  onClick={() => {
                    setTab(entry.key);
                    setCreating(false);
                    setError(null);
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            {creating && canWrite ? (
              <div className="panel" style={{ marginTop: "var(--s-4)" }}>
                <div className="panel-head">
                  <h2 style={{ fontSize: "var(--t-lg)" }}>
                    New {TABS.find((entry) => entry.key === tab)?.label.replace(/s$/, "").toLowerCase()}
                  </h2>
                </div>

                {tab === "tax-rates" ? (
                  <form className="stack" onSubmit={createTax} noValidate>
                    <div className="grid grid-3">
                      <div className="field">
                        <label className="label" htmlFor="tax-code">
                          Code
                        </label>
                        <input
                          id="tax-code"
                          className="mono"
                          value={taxDraft.code}
                          onChange={(event) => setTaxDraft({ ...taxDraft, code: event.target.value })}
                          placeholder="VAT75"
                          required
                        />
                        <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                          Fixed after saving — items and lines quote it.
                        </p>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="tax-name">
                          Name
                        </label>
                        <input
                          id="tax-name"
                          value={taxDraft.name}
                          onChange={(event) => setTaxDraft({ ...taxDraft, name: event.target.value })}
                          placeholder="VAT 7.5%"
                          required
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="tax-rate">
                          Rate, percent
                        </label>
                        <input
                          id="tax-rate"
                          inputMode="decimal"
                          value={taxDraft.rate_percent}
                          onChange={(event) =>
                            setTaxDraft({ ...taxDraft, rate_percent: event.target.value })
                          }
                          placeholder="7.5"
                          required
                        />
                      </div>
                    </div>
                    <div className="field" style={{ maxWidth: "24rem" }}>
                      <label className="label" htmlFor="tax-kind">
                        Kind
                      </label>
                      <select
                        id="tax-kind"
                        value={taxDraft.kind}
                        onChange={(event) =>
                          setTaxDraft({ ...taxDraft, kind: event.target.value as TaxKind })
                        }
                      >
                        <option value="VAT">VAT — added to a document line</option>
                        <option value="WITHHOLDING">Withholding — deducted from a payment</option>
                      </select>
                      <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                        A withholding rate cannot be put on a line; a VAT rate cannot be deducted from a
                        payment. They post to different control accounts, so the server refuses either
                        way round.
                      </p>
                    </div>
                    <div className="row">
                      <button className="btn" type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Add tax rate"}
                      </button>
                    </div>
                  </form>
                ) : tab === "units" ? (
                  <form className="stack" onSubmit={createUnit} noValidate>
                    <div className="grid grid-3">
                      <div className="field">
                        <label className="label" htmlFor="unit-name">
                          Name
                        </label>
                        <input
                          id="unit-name"
                          value={unitDraft.name}
                          onChange={(event) => setUnitDraft({ ...unitDraft, name: event.target.value })}
                          placeholder="Box"
                          required
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="unit-symbol">
                          Symbol
                        </label>
                        <input
                          id="unit-symbol"
                          className="mono"
                          value={unitDraft.symbol}
                          onChange={(event) =>
                            setUnitDraft({ ...unitDraft, symbol: event.target.value })
                          }
                          placeholder="box"
                          required
                        />
                      </div>
                    </div>
                    <div className="row">
                      <button className="btn" type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Add unit"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form className="stack" onSubmit={createCategory} noValidate>
                    <div className="grid grid-3">
                      <div className="field">
                        <label className="label" htmlFor="category-name">
                          Name
                        </label>
                        <input
                          id="category-name"
                          value={categoryDraft.name}
                          onChange={(event) =>
                            setCategoryDraft({ ...categoryDraft, name: event.target.value })
                          }
                          placeholder="Delivery"
                          required
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="category-kind">
                          Kind
                        </label>
                        <select
                          id="category-kind"
                          value={categoryDraft.kind}
                          onChange={(event) =>
                            setCategoryDraft({
                              ...categoryDraft,
                              kind: event.target.value as "EXPENSE" | "INCOME",
                            })
                          }
                        >
                          <option value="EXPENSE">Expense</option>
                          <option value="INCOME">Income</option>
                        </select>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="category-account">
                          Account <span className="faint">blank = sensible default</span>
                        </label>
                        <input
                          id="category-account"
                          className="mono"
                          list="catalog-account-options"
                          value={categoryDraft.account_code}
                          onChange={(event) =>
                            setCategoryDraft({ ...categoryDraft, account_code: event.target.value })
                          }
                          placeholder="5800"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <button className="btn" type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Add category"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : null}

            <datalist id="catalog-account-options">
              {accountInputs.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.name}
                </option>
              ))}
            </datalist>
          </>
        )}
      </section>

      {loading || needsSeed ? null : (
        <section className="section">
          <div className="row-between">
            <p className="label">
              {tab === "tax-rates"
                ? `${visibleTax.length} tax rates`
                : tab === "units"
                  ? `${visibleUnits.length} units`
                  : `${visibleCategories.length} categories`}
            </p>
          </div>

          <div className="grid grid-sidebar" style={{ marginTop: "var(--s-5)", alignItems: "start" }}>
            <div className="panel panel--flush">
              <div className="ledger-scroll">
                {tab === "tax-rates" ? (
                  <table className="ledger">
                    <caption className="sr-only">Tax rates</caption>
                    <thead>
                      <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Name</th>
                        <th scope="col">Kind</th>
                        <th scope="col">Rate</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTax.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="muted">
                            No tax rates.
                          </td>
                        </tr>
                      ) : (
                        visibleTax.map((row) => (
                          <tr
                            key={row.id}
                            className={row.id === selected["tax-rates"] ? "is-selected" : undefined}
                            onClick={() => setSelected((state) => ({ ...state, "tax-rates": row.id }))}
                            style={{ cursor: "pointer" }}
                          >
                            <td className="mono nowrap">{row.code}</td>
                            <td>{row.name}</td>
                            <td className="muted">
                              {row.kind === "WITHHOLDING" ? "Withholding" : "VAT"}
                            </td>
                            <td className="mono nowrap">{row.rate_percent}%</td>
                            <td className="muted">{row.is_active ? "Active" : "Retired"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : tab === "units" ? (
                  <table className="ledger">
                    <caption className="sr-only">Units</caption>
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Symbol</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUnits.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="muted">
                            No units.
                          </td>
                        </tr>
                      ) : (
                        visibleUnits.map((row) => (
                          <tr
                            key={row.id}
                            className={row.id === selected.units ? "is-selected" : undefined}
                            onClick={() => setSelected((state) => ({ ...state, units: row.id }))}
                            style={{ cursor: "pointer" }}
                          >
                            <td>{row.name}</td>
                            <td className="mono nowrap">{row.symbol}</td>
                            <td className="muted">{row.is_active ? "Active" : "Retired"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="ledger">
                    <caption className="sr-only">Categories</caption>
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Kind</th>
                        <th scope="col">Account</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCategories.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="muted">
                            No categories.
                          </td>
                        </tr>
                      ) : (
                        visibleCategories.map((row) => (
                          <tr
                            key={row.id}
                            className={row.id === selected.categories ? "is-selected" : undefined}
                            onClick={() => setSelected((state) => ({ ...state, categories: row.id }))}
                            style={{ cursor: "pointer" }}
                          >
                            <td>{row.name}</td>
                            <td className="muted">{row.kind === "EXPENSE" ? "Expense" : "Income"}</td>
                            <td className="mono nowrap">
                              {row.account_code}
                              {row.account_name ? <span className="muted"> {row.account_name}</span> : null}
                            </td>
                            <td className="muted">{row.is_active ? "Active" : "Retired"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {tab === "tax-rates" ? (
              <TaxDetail
                row={selectedTax}
                canWrite={canWrite}
                onPatch={(row, body, message) =>
                  request<CatalogTaxRate>(`/catalogs/tax-rates/${row.id}`, "PATCH", body, (next) => {
                    replaceTax(next);
                    setNotice(message);
                  }, "Could not update that tax rate.")
                }
                onDeactivate={(row) =>
                  request<CatalogTaxRate>(`/catalogs/tax-rates/${row.id}`, "DELETE", undefined, (next) => {
                    replaceTax(next);
                    setNotice(`${next.code} retired. Documents already issued keep their snapshot.`);
                  }, "Could not retire that tax rate.")
                }
              />
            ) : tab === "units" ? (
              <UnitDetail
                row={selectedUnit}
                canWrite={canWrite}
                onPatch={(row, body, message) =>
                  request<CatalogUnit>(`/catalogs/units/${row.id}`, "PATCH", body, (next) => {
                    replaceUnit(next);
                    setNotice(message);
                  }, "Could not update that unit.")
                }
                onDeactivate={(row) =>
                  request<CatalogUnit>(`/catalogs/units/${row.id}`, "DELETE", undefined, (next) => {
                    replaceUnit(next);
                    setNotice(`${next.name} retired. Documents already issued keep it.`);
                  }, "Could not retire that unit.")
                }
              />
            ) : (
              <CategoryDetail
                row={selectedCategory}
                accounts={accountInputs}
                canWrite={canWrite}
                onPatch={(row, body, message) =>
                  request<CatalogCategory>(`/catalogs/categories/${row.id}`, "PATCH", body, (next) => {
                    replaceCategory(next);
                    setNotice(message);
                  }, "Could not update that category.")
                }
                onDeactivate={(row) =>
                  request<CatalogCategory>(`/catalogs/categories/${row.id}`, "DELETE", undefined, (next) => {
                    replaceCategory(next);
                    setNotice(`${next.name} retired.`);
                  }, "Could not retire that category.")
                }
              />
            )}
          </div>
        </section>
      )}
    </>
  );
}

/* ── Detail panels ───────────────────────────────────────────────────────── */

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

function RetireButton({
  active,
  busy,
  onRetire,
}: {
  active: boolean;
  busy: boolean;
  onRetire: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    setConfirming(false);
  }, [active]);

  if (!active) return null;
  return confirming ? (
    <>
      <button className="btn btn--danger btn--sm" type="button" onClick={onRetire}>
        Yes, retire
      </button>
      <button className="btn btn--quiet btn--sm" type="button" onClick={() => setConfirming(false)}>
        Keep it
      </button>
    </>
  ) : (
    <button className="btn btn--quiet btn--sm" type="button" disabled={busy} onClick={() => setConfirming(true)}>
      Retire
    </button>
  );
}

function TaxDetail({
  row,
  canWrite,
  onPatch,
  onDeactivate,
}: {
  row: CatalogTaxRate | null;
  canWrite: boolean;
  onPatch: (row: CatalogTaxRate, body: Record<string, unknown>, message: string) => Promise<void>;
  onDeactivate: (row: CatalogTaxRate) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [kind, setKind] = useState<TaxKind>("VAT");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(row?.name ?? "");
    setRate(row?.rate_percent ?? "");
    setKind(row?.kind ?? "VAT");
  }, [row?.id, row?.name, row?.rate_percent, row?.kind]);

  if (!row) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Tax rate</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pick a rate to rename it or change the percentage.
        </p>
      </div>
    );
  }

  const changed = name !== row.name || rate !== row.rate_percent || kind !== row.kind;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>
          <span className="mono">{row.code}</span> {row.name}
        </h2>
      </div>
      <div className="stack">
        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
          <DetailRow label="Code" value={`${row.code} — fixed`} />
          <DetailRow label="Kind" value={row.kind === "WITHHOLDING" ? "Withholding" : "VAT"} />
          <DetailRow label="Status" value={row.is_active ? "Active" : "Retired"} />
        </dl>

        {canWrite ? (
          <>
            <div className="field">
              <label className="label" htmlFor="tax-edit-name">
                Name
              </label>
              <input id="tax-edit-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="tax-edit-rate">
                Rate, percent
              </label>
              <input
                id="tax-edit-rate"
                inputMode="decimal"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
              <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                Changing this changes the default for future documents only — issued ones snapshotted
                their rate at line time.
              </p>
            </div>
            <div className="field">
              <label className="label" htmlFor="tax-edit-kind">
                Kind
              </label>
              <select
                id="tax-edit-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as TaxKind)}
              >
                <option value="VAT">VAT — added to a document line</option>
                <option value="WITHHOLDING">Withholding — deducted from a payment</option>
              </select>
            </div>
            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              <button
                className="btn btn--sm"
                type="button"
                disabled={!changed || busy}
                onClick={() => {
                  setBusy(true);
                  void onPatch(
                    row,
                    { name: name.trim(), rate_percent: rate.trim(), kind },
                    `${name.trim()} saved.`,
                  ).finally(() => setBusy(false));
                }}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
              <RetireButton active={row.is_active} busy={busy} onRetire={() => void onDeactivate(row)} />
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Your role can read tax rates but not change them.
          </p>
        )}
      </div>
    </div>
  );
}

function UnitDetail({
  row,
  canWrite,
  onPatch,
  onDeactivate,
}: {
  row: CatalogUnit | null;
  canWrite: boolean;
  onPatch: (row: CatalogUnit, body: Record<string, unknown>, message: string) => Promise<void>;
  onDeactivate: (row: CatalogUnit) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(row?.name ?? "");
    setSymbol(row?.symbol ?? "");
  }, [row?.id, row?.name, row?.symbol]);

  if (!row) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Unit</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pick a unit to rename it.
        </p>
      </div>
    );
  }

  const changed = name !== row.name || symbol !== row.symbol;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>{row.name}</h2>
      </div>
      <div className="stack">
        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
          <DetailRow label="Symbol" value={row.symbol} />
          <DetailRow label="Status" value={row.is_active ? "Active" : "Retired"} />
        </dl>

        {canWrite ? (
          <>
            <div className="field">
              <label className="label" htmlFor="unit-edit-name">
                Name
              </label>
              <input id="unit-edit-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="unit-edit-symbol">
                Symbol
              </label>
              <input
                id="unit-edit-symbol"
                className="mono"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
              />
            </div>
            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              <button
                className="btn btn--sm"
                type="button"
                disabled={!changed || busy}
                onClick={() => {
                  setBusy(true);
                  void onPatch(row, { name: name.trim(), symbol: symbol.trim() }, `${name.trim()} saved.`).finally(
                    () => setBusy(false),
                  );
                }}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
              <RetireButton active={row.is_active} busy={busy} onRetire={() => void onDeactivate(row)} />
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Your role can read units but not change them.
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryDetail({
  row,
  accounts,
  canWrite,
  onPatch,
  onDeactivate,
}: {
  row: CatalogCategory | null;
  accounts: Array<{ code: string; name: string }>;
  canWrite: boolean;
  onPatch: (row: CatalogCategory, body: Record<string, unknown>, message: string) => Promise<void>;
  onDeactivate: (row: CatalogCategory) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [accountCode, setAccountCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(row?.name ?? "");
    setKind(row?.kind ?? "EXPENSE");
    setAccountCode(row?.account_code ?? "");
  }, [row?.id, row?.name, row?.kind, row?.account_code]);

  if (!row) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: "var(--t-lg)" }}>Category</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Pick a category to see which account it posts to.
        </p>
      </div>
    );
  }

  const changed = name !== row.name || kind !== row.kind || accountCode !== row.account_code;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 style={{ fontSize: "var(--t-lg)" }}>{row.name}</h2>
      </div>
      <div className="stack">
        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0 }}>
          <DetailRow
            label="Posts to"
            value={row.account_name ? `${row.account_code} ${row.account_name}` : row.account_code}
          />
          <DetailRow label="Kind" value={row.kind === "EXPENSE" ? "Expense" : "Income"} />
          <DetailRow label="Status" value={row.is_active ? "Active" : "Retired"} />
        </dl>

        {canWrite ? (
          <>
            <div className="field">
              <label className="label" htmlFor="category-edit-name">
                Name
              </label>
              <input
                id="category-edit-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="category-edit-kind">
                Kind
              </label>
              <select
                id="category-edit-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as "EXPENSE" | "INCOME")}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="category-edit-account">
                Account
              </label>
              <input
                id="category-edit-account"
                className="mono"
                list="catalog-account-options-edit"
                value={accountCode}
                onChange={(event) => setAccountCode(event.target.value)}
                placeholder="5800"
              />
              <datalist id="catalog-account-options-edit">
                {accounts.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.name}
                  </option>
                ))}
              </datalist>
              <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
                Expense categories must map to expense accounts, income to revenue — the server
                refuses anything else, because a mismatched category still balances but misstates
                every margin.
              </p>
            </div>
            <div className="row" style={{ gap: "var(--s-2)", flexWrap: "wrap" }}>
              <button
                className="btn btn--sm"
                type="button"
                disabled={!changed || busy}
                onClick={() => {
                  setBusy(true);
                  void onPatch(
                    row,
                    { name: name.trim(), kind, account_code: accountCode.trim() },
                    `${name.trim()} saved.`,
                  ).finally(() => setBusy(false));
                }}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
              <RetireButton active={row.is_active} busy={busy} onRetire={() => void onDeactivate(row)} />
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Your role can read categories but not change them.
          </p>
        )}
      </div>
    </div>
  );
}
