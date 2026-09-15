"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Amount } from "@/components/money";
import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import type {
  Item,
  LowStockRow,
  MovementSource,
  StockBalance,
  StockMovement,
  StockSummary,
  Stocktake,
  StockTransfer,
  Warehouse,
} from "@/lib/types";
import { MOVEMENT_SOURCE_LABEL, STOCKTAKE_STATUS_LABEL } from "@/lib/types";

/**
 * Stock (plan §6, Phase 8).
 *
 * Four questions, one screen: what is on the shelf, how did it get that way, move
 * or correct it, and count it.
 *
 * **Nothing here computes a valuation.** Every figure — the value on a shelf, the
 * cost an issue would be relieved at, a variance's worth — arrives from the
 * server, which costs the goods with the same moving average that posted the
 * journal entry. The only arithmetic in this file adds up a worksheet the user is
 * still typing, which is a preview for their eyes and never a stored amount.
 *
 * The one thing worth noticing about the layout: **adjusting and counting are
 * behind a stricter permission than moving goods.** A transfer changes where
 * stock is and posts nothing; an adjustment and a posted variance change what the
 * balance sheet is worth with no document to explain it, so the screen hides
 * those controls and says why rather than offering a button that would 403.
 */

type Tab = "stock" | "movements" | "operations" | "counts";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "stock", label: "On hand" },
  { key: "movements", label: "Movements" },
  { key: "operations", label: "Adjust & transfer" },
  { key: "counts", label: "Stocktakes" },
];

const today = (): string => new Date().toISOString().slice(0, 10);

/** A form field the user typed, turned into a number. Never rendered back — the
 *  server owns every figure that is shown. */
function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}

const isQuantity = (value: number): boolean => Number.isFinite(value) && value > 0;

export default function InventoryPage() {
  const { can } = useSession();
  const canMove = can("inventory.write");
  const canAdjust = can("inventory.adjust");

  const [tab, setTab] = useState<Tab>("stock");

  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [movementFilter, setMovementFilter] = useState({ item_id: "", warehouse_id: "" });

  const [warehouseDraft, setWarehouseDraft] = useState({ code: "", name: "", is_default: false });
  const [adjustmentDraft, setAdjustmentDraft] = useState({
    item_id: "",
    warehouse_id: "",
    date: today(),
    mode: "IN" as "IN" | "OUT",
    qty: "",
    unit_cost_bdt: "",
    reason: "",
    memo: "",
  });
  const [transferDraft, setTransferDraft] = useState({
    item_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    date: today(),
    qty: "",
    memo: "",
  });
  const [countDraft, setCountDraft] = useState({
    warehouse_id: "",
    date: today(),
    memo: "",
    lines: [{ item_id: "", counted_qty: "", unit_cost_bdt: "" }],
  });
  const [posting, setPosting] = useState({ id: "", reason: "" });

  const load = useCallback(async (filter: { item_id: string; warehouse_id: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter.item_id) params.set("item_id", filter.item_id);
      if (filter.warehouse_id) params.set("warehouse_id", filter.warehouse_id);
      const suffix = params.toString() ? `?${params.toString()}` : "";

      const [stockData, warehouseData, movementData, stocktakeData, itemData] = await Promise.all([
        api<{ balances: StockBalance[]; low_stock: LowStockRow[]; summary: StockSummary }>("/inventory/stock"),
        api<{ warehouses: Warehouse[] }>("/inventory/warehouses"),
        api<{ movements: StockMovement[] }>(`/inventory/movements${suffix}`),
        api<{ stocktakes: Stocktake[] }>("/inventory/stocktakes?limit=50"),
        api<{ items: Item[] }>("/items?include_inactive=true"),
      ]);

      setBalances(stockData.balances);
      setLowStock(stockData.low_stock);
      setSummary(stockData.summary);
      setWarehouses(warehouseData.warehouses);
      setMovements(movementData.movements);
      setStocktakes(stocktakeData.stocktakes);
      // Only a tracked item can be counted, moved or adjusted into or out of
      // existence — the rest of the ledger has no quantity to speak of.
      setItems(itemData.items.filter((item) => item.track_stock && item.is_active));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the stock screen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(movementFilter);
    // The filter is read on mount and when it changes; the object identity is not
    // the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, movementFilter.item_id, movementFilter.warehouse_id]);

  const activeWarehouses = useMemo(() => warehouses.filter((row) => row.is_active), [warehouses]);

  function reset(): void {
    setNotice(null);
    setError(null);
  }

  async function createWarehouse(event: React.FormEvent) {
    event.preventDefault();
    reset();
    setBusy(true);
    try {
      const { warehouse } = await api<{ warehouse: Warehouse }>("/inventory/warehouses", {
        method: "POST",
        body: {
          code: warehouseDraft.code.trim(),
          name: warehouseDraft.name.trim(),
          is_default: warehouseDraft.is_default,
        },
      });
      const msg = `${warehouse.name} added. Goods bought for stock land here unless a document says otherwise.`;
      setNotice(msg);
      toast.success(msg);
      setWarehouseDraft({ code: "", name: "", is_default: false });
      await load(movementFilter);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not add that warehouse.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitAdjustment(event: React.FormEvent) {
    event.preventDefault();
    reset();
    const qty = toNumber(adjustmentDraft.qty);
    if (!adjustmentDraft.item_id || !isQuantity(qty) || adjustmentDraft.reason.trim().length < 3) return;

    setBusy(true);
    try {
      const { adjustment } = await api<{ adjustment: StockAdjustmentResult }>("/inventory/adjustments", {
        method: "POST",
        body: {
          item_id: adjustmentDraft.item_id,
          ...(adjustmentDraft.warehouse_id ? { warehouse_id: adjustmentDraft.warehouse_id } : {}),
          date: adjustmentDraft.date,
          qty_delta: adjustmentDraft.mode === "IN" ? qty : -qty,
          ...(adjustmentDraft.mode === "IN" && adjustmentDraft.unit_cost_bdt.trim() !== ""
            ? { unit_cost_bdt: adjustmentDraft.unit_cost_bdt.trim() }
            : {}),
          reason: adjustmentDraft.reason.trim(),
          memo: adjustmentDraft.memo.trim(),
        },
      });
      const msg = `${adjustment.sku} ${adjustment.direction === "IN" ? "increased" : "written off"} by ${adjustment.qty} ` +
        `(${adjustment.value_bdt} taka${adjustment.journal_entry_id ? ", posted" : ", nothing to post"}).`;
      setNotice(msg);
      toast.success(msg);
      setAdjustmentDraft({ ...adjustmentDraft, qty: "", unit_cost_bdt: "", reason: "", memo: "" });
      await load(movementFilter);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not record that adjustment.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitTransfer(event: React.FormEvent) {
    event.preventDefault();
    reset();
    const qty = toNumber(transferDraft.qty);
    if (!transferDraft.item_id || !transferDraft.from_warehouse_id || !transferDraft.to_warehouse_id || !isQuantity(qty)) {
      return;
    }

    setBusy(true);
    try {
      const { transfer } = await api<{ transfer: StockTransfer }>("/inventory/transfers", {
        method: "POST",
        body: {
          item_id: transferDraft.item_id,
          from_warehouse_id: transferDraft.from_warehouse_id,
          to_warehouse_id: transferDraft.to_warehouse_id,
          date: transferDraft.date,
          qty,
          memo: transferDraft.memo.trim(),
        },
      });
      const msg = `${transfer.qty} × ${transfer.sku} moved from ${transfer.from_warehouse_name} to ${transfer.to_warehouse_name} ` +
        `at ${transfer.value_bdt} taka cost. No journal entry: the value did not change hands.`;
      setNotice(msg);
      toast.success(msg);
      setTransferDraft({ ...transferDraft, qty: "", memo: "" });
      await load(movementFilter);
    } catch (caught) {
      const err = caught instanceof ApiError ? caught.message : "Could not move that stock.";
      setError(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitCount(event: React.FormEvent) {
    event.preventDefault();
    reset();
    const lines = countDraft.lines
      .filter((line) => line.item_id !== "")
      .map((line) => {
        const counted = toNumber(line.counted_qty);
        return {
          item_id: line.item_id,
          counted_qty: Number.isFinite(counted) && counted >= 0 ? counted : 0,
          ...(line.unit_cost_bdt.trim() !== "" ? { unit_cost_bdt: line.unit_cost_bdt.trim() } : {}),
        };
      });
    if (lines.length === 0) return;

    setBusy(true);
    try {
      const { stocktake } = await api<{ stocktake: Stocktake }>("/inventory/stocktakes", {
        method: "POST",
        body: {
          ...(countDraft.warehouse_id ? { warehouse_id: countDraft.warehouse_id } : {}),
          date: countDraft.date,
          memo: countDraft.memo.trim(),
          lines,
        },
      });
      setNotice(
        `${stocktake.lines.length} lines counted in ${stocktake.warehouse_name}. ` +
          `${stocktake.variance_qty_total} units of variance, worth ${stocktake.variance_value_bdt} taka — draft until it is posted.`,
      );
      setCountDraft({ warehouse_id: countDraft.warehouse_id, date: today(), memo: "", lines: [{ item_id: "", counted_qty: "", unit_cost_bdt: "" }] });
      await load(movementFilter);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not draw up that count.");
    } finally {
      setBusy(false);
    }
  }

  async function postCount(id: string, reason: string) {
    if (reason.trim().length < 3) return;
    reset();
    setBusy(true);
    try {
      const { stocktake } = await api<{ stocktake: Stocktake }>(`/inventory/stocktakes/${id}/post`, {
        method: "POST",
        body: { reason: reason.trim() },
      });
      setNotice(
        stocktake.journal_entry_id
          ? `Posted — the variance of ${stocktake.variance_value_bdt} taka is in the ledger.`
          : "Posted — the count agreed with the book, so there was nothing to post.",
      );
      setPosting({ id: "", reason: "" });
      await load(movementFilter);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not post that count.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            01 &nbsp; Stock
          </p>
          {summary ? (
            <div className="row" style={{ gap: "var(--s-4)", flexWrap: "wrap" }}>
              <Stat label="Tracked items" value={String(summary.tracked_item_count)} />
              <Stat label="Warehouses" value={String(summary.warehouse_count)} />
              <Stat label="Units on hand" value={String(summary.total_qty)} />
              <Stat label="Valued at" value={summary.total_value_bdt} money />
            </div>
          ) : null}
        </div>

        <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "70ch" }}>
          Stock is a movement journal, not a number on an item: every receipt, sale, transfer, write-off and count is
          recorded once and kept. The valuation below is what those movements say the shelves are worth, and it is the
          same figure the inventory control account holds — the integrity run asserts they agree to the paisa.
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
      ) : tab === "stock" ? (
        <StockSection
          balances={balances}
          lowStock={lowStock}
          warehouses={warehouses}
          canMove={canMove}
          busy={busy}
          draft={warehouseDraft}
          onChange={setWarehouseDraft}
          onSubmit={createWarehouse}
        />
      ) : tab === "movements" ? (
        <MovementsSection
          movements={movements}
          items={items}
          warehouses={warehouses}
          filter={movementFilter}
          onChange={setMovementFilter}
        />
      ) : tab === "operations" ? (
        <OperationsSection
          items={items}
          warehouses={activeWarehouses}
          canMove={canMove}
          canAdjust={canAdjust}
          busy={busy}
          adjustment={adjustmentDraft}
          transfer={transferDraft}
          onAdjustmentChange={setAdjustmentDraft}
          onTransferChange={setTransferDraft}
          onAdjust={submitAdjustment}
          onTransfer={submitTransfer}
        />
      ) : (
        <CountsSection
          stocktakes={stocktakes}
          items={items}
          warehouses={activeWarehouses}
          canMove={canMove}
          canAdjust={canAdjust}
          busy={busy}
          draft={countDraft}
          posting={posting}
          onChange={setCountDraft}
          onPostingChange={setPosting}
          onSubmit={submitCount}
          onPost={postCount}
        />
      )}
    </>
  );
}

/** The shape this page reads back from an adjustment, spelled out here so the
 *  form can name the fields it reports without importing the API module. */
type StockAdjustmentResult = {
  sku: string;
  direction: "IN" | "OUT";
  qty: number;
  value_bdt: string;
  journal_entry_id: string | null;
};

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

/* ── On hand ─────────────────────────────────────────────────────────────── */

function StockSection({
  balances,
  lowStock,
  warehouses,
  canMove,
  busy,
  draft,
  onChange,
  onSubmit,
}: {
  balances: StockBalance[];
  lowStock: LowStockRow[];
  warehouses: Warehouse[];
  canMove: boolean;
  busy: boolean;
  draft: { code: string; name: string; is_default: boolean };
  onChange: (next: { code: string; name: string; is_default: boolean }) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
}) {
  return (
    <>
      <section className="section">
        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div className="panel panel--flush">
            <div className="panel-head">
              <h2 style={{ fontSize: "var(--t-lg)" }}>On hand</h2>
              <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
                by item and warehouse
              </span>
            </div>
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Stock on hand</caption>
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Warehouse</th>
                    <th scope="col" className="num">
                      Qty
                    </th>
                    <th scope="col" className="num">
                      Avg cost
                    </th>
                    <th scope="col" className="num">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {balances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        Nothing is on the shelves yet. Receiving a bill for a stock-tracked item puts goods here.
                      </td>
                    </tr>
                  ) : (
                    balances.map((row) => (
                      <tr key={`${row.item_id}-${row.warehouse_id}`}>
                        <td>
                          <span className="mono">{row.sku}</span> {row.item_name}
                        </td>
                        <td className="muted nowrap">{row.warehouse_name}</td>
                        <td className="num mono">{row.qty}</td>
                        <td className="num">
                          <Amount value={row.avg_cost_bdt} size="sm" />
                        </td>
                        <td className="num">
                          <Amount value={row.value_bdt} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="stack">
            <div className="panel panel--flush">
              <div className="panel-head">
                <h2 style={{ fontSize: "var(--t-lg)" }}>Low stock</h2>
                <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
                  across every warehouse
                </span>
              </div>
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Items at or below their reorder level</caption>
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col" className="num">
                        On hand
                      </th>
                      <th scope="col" className="num">
                        Reorder at
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="muted">
                          Every tracked item is above its reorder level.
                        </td>
                      </tr>
                    ) : (
                      lowStock.map((row) => (
                        <tr key={row.item_id}>
                          <td>
                            <span className="mono">{row.sku}</span> {row.item_name}
                            {row.on_hand <= 0 ? (
                              <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                                out
                              </span>
                            ) : null}
                          </td>
                          <td className="num mono">{row.on_hand}</td>
                          <td className="num mono muted">{row.reorder_level}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="note" style={{ padding: "var(--s-4)", margin: 0 }}>
                A reorder level of 0 means only an empty shelf counts as low. Set one on the item to be warned before
                stock runs out.
              </p>
            </div>

            <div className="panel panel--flush">
              <div className="panel-head">
                <h2 style={{ fontSize: "var(--t-lg)" }}>Warehouses</h2>
              </div>
              <div className="ledger-scroll">
                <table className="ledger">
                  <caption className="sr-only">Warehouses</caption>
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col">Name</th>
                      <th scope="col" className="num">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="muted">
                          None yet — one is opened automatically the first time a document needs it.
                        </td>
                      </tr>
                    ) : (
                      warehouses.map((row) => (
                        <tr key={row.id}>
                          <td className="mono nowrap">
                            {row.code}
                            {row.is_default ? (
                              <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                                default
                              </span>
                            ) : null}
                          </td>
                          <td>
                            {row.name}
                            {row.is_active ? null : <span className="muted"> (retired)</span>}
                          </td>
                          <td className="num">
                            <Amount value={row.total_value_bdt} size="sm" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {canMove ? (
                <form className="stack" style={{ padding: "var(--s-4)" }} onSubmit={onSubmit} noValidate>
                  <div className="grid grid-2">
                    <div className="field">
                      <label className="label" htmlFor="warehouse-code">
                        Code
                      </label>
                      <input
                        id="warehouse-code"
                        className="mono"
                        value={draft.code}
                        onChange={(event) => onChange({ ...draft, code: event.target.value })}
                        placeholder="STORE2"
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="warehouse-name">
                        Name
                      </label>
                      <input
                        id="warehouse-name"
                        value={draft.name}
                        onChange={(event) => onChange({ ...draft, name: event.target.value })}
                        placeholder="Second Store"
                        required
                      />
                    </div>
                  </div>
                  <div className="row-between">
                    <label className="label row" style={{ gap: "var(--s-2)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={draft.is_default}
                        onChange={(event) => onChange({ ...draft, is_default: event.target.checked })}
                      />
                      Make this the default
                    </label>
                    <button
                      className="btn btn--sm"
                      type="submit"
                      disabled={busy || draft.code.trim() === "" || draft.name.trim().length < 2}
                    >
                      {busy ? "Saving…" : "Add warehouse"}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Movements ───────────────────────────────────────────────────────────── */

function MovementsSection({
  movements,
  items,
  warehouses,
  filter,
  onChange,
}: {
  movements: StockMovement[];
  items: Item[];
  warehouses: Warehouse[];
  filter: { item_id: string; warehouse_id: string };
  onChange: (next: { item_id: string; warehouse_id: string }) => void;
}) {
  return (
    <section className="section">
      <div className="row-between">
        <p className="label">{movements.length} movements</p>
        <div className="row" style={{ gap: "var(--s-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="movement-item">
              Item
            </label>
            <select
              id="movement-item"
              value={filter.item_id}
              onChange={(event) => onChange({ ...filter, item_id: event.target.value })}
            >
              <option value="">All items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label" htmlFor="movement-warehouse">
              Warehouse
            </label>
            <select
              id="movement-warehouse"
              value={filter.warehouse_id}
              onChange={(event) => onChange({ ...filter, warehouse_id: event.target.value })}
            >
              <option value="">All warehouses</option>
              {warehouses.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="panel panel--flush" style={{ marginTop: "var(--s-4)" }}>
        <div className="ledger-scroll">
          <table className="ledger">
            <caption className="sr-only">Stock movements</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Item</th>
                <th scope="col">Warehouse</th>
                <th scope="col">Because of</th>
                <th scope="col" className="num">
                  Qty
                </th>
                <th scope="col" className="num">
                  Unit cost
                </th>
                <th scope="col" className="num">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No movements yet. Receiving a bill for a stock-tracked item is the usual first one.
                  </td>
                </tr>
              ) : (
                movements.map((row) => (
                  <tr key={row.id}>
                    <td className="mono nowrap">{row.date}</td>
                    <td>
                      <span className="mono">{row.sku}</span> {row.item_name}
                    </td>
                    <td className="muted nowrap">{row.warehouse_name}</td>
                    <td className="muted">
                      {MOVEMENT_SOURCE_LABEL[row.source as MovementSource] ?? row.source}
                      {row.doc_no ? <span className="mono"> {row.doc_no}</span> : null}
                      {row.reason ? ` — ${row.reason}` : null}
                      {row.reversed ? (
                        <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                          reversed
                        </span>
                      ) : null}
                    </td>
                    <td className="num mono">
                      {row.direction === "IN" ? "+" : "−"}
                      {row.qty}
                    </td>
                    <td className="num">
                      <Amount value={row.unit_cost_bdt} size="sm" />
                    </td>
                    <td className="num">
                      <Amount value={row.value_bdt} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="note" style={{ marginTop: "var(--s-3)" }}>
        A movement is never deleted. A voided document writes the opposite movement instead, so the pair nets to nothing
        and the history still explains itself.
      </p>
    </section>
  );
}

/* ── Adjust & transfer ───────────────────────────────────────────────────── */

function OperationsSection({
  items,
  warehouses,
  canMove,
  canAdjust,
  busy,
  adjustment,
  transfer,
  onAdjustmentChange,
  onTransferChange,
  onAdjust,
  onTransfer,
}: {
  items: Item[];
  warehouses: Warehouse[];
  canMove: boolean;
  canAdjust: boolean;
  busy: boolean;
  adjustment: {
    item_id: string;
    warehouse_id: string;
    date: string;
    mode: "IN" | "OUT";
    qty: string;
    unit_cost_bdt: string;
    reason: string;
    memo: string;
  };
  transfer: {
    item_id: string;
    from_warehouse_id: string;
    to_warehouse_id: string;
    date: string;
    qty: string;
    memo: string;
  };
  onAdjustmentChange: (next: OperationsSectionProps["adjustment"]) => void;
  onTransferChange: (next: OperationsSectionProps["transfer"]) => void;
  onAdjust: (event: React.FormEvent) => Promise<void>;
  onTransfer: (event: React.FormEvent) => Promise<void>;
}) {
  const adjustReady =
    adjustment.item_id !== "" &&
    adjustment.reason.trim().length >= 3 &&
    isQuantity(toNumber(adjustment.qty)) &&
    adjustment.date !== "";

  const transferReady =
    transfer.item_id !== "" &&
    transfer.from_warehouse_id !== "" &&
    transfer.to_warehouse_id !== "" &&
    transfer.from_warehouse_id !== transfer.to_warehouse_id &&
    isQuantity(toNumber(transfer.qty)) &&
    transfer.date !== "";

  return (
    <section className="section">
      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="panel">
          <div className="panel-head">
            <h2 style={{ fontSize: "var(--t-lg)" }}>Adjust the count</h2>
          </div>
          {canAdjust ? (
            <form className="stack" onSubmit={onAdjust} noValidate>
              <div className="grid grid-2">
                <div className="field">
                  <label className="label" htmlFor="adjustment-item">
                    Item
                  </label>
                  <select
                    id="adjustment-item"
                    value={adjustment.item_id}
                    onChange={(event) => onAdjustmentChange({ ...adjustment, item_id: event.target.value })}
                    required
                  >
                    <option value="">Choose an item…</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku} — {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="adjustment-warehouse">
                    Warehouse
                  </label>
                  <select
                    id="adjustment-warehouse"
                    value={adjustment.warehouse_id}
                    onChange={(event) => onAdjustmentChange({ ...adjustment, warehouse_id: event.target.value })}
                  >
                    <option value="">The default</option>
                    {warehouses.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <span className="label">Direction</span>
                <div className="row" style={{ gap: "var(--s-2)", marginTop: "var(--s-2)" }}>
                  <button
                    type="button"
                    className={`btn btn--sm ${adjustment.mode === "IN" ? "" : "btn--quiet"}`}
                    aria-pressed={adjustment.mode === "IN"}
                    onClick={() => onAdjustmentChange({ ...adjustment, mode: "IN" })}
                  >
                    Stock found
                  </button>
                  <button
                    type="button"
                    className={`btn btn--sm ${adjustment.mode === "OUT" ? "" : "btn--quiet"}`}
                    aria-pressed={adjustment.mode === "OUT"}
                    onClick={() => onAdjustmentChange({ ...adjustment, mode: "OUT" })}
                  >
                    Stock written off
                  </button>
                </div>
              </div>

              <div className="grid grid-3">
                <div className="field">
                  <label className="label" htmlFor="adjustment-date">
                    Date
                  </label>
                  <input
                    id="adjustment-date"
                    type="date"
                    className="mono"
                    value={adjustment.date}
                    onChange={(event) => onAdjustmentChange({ ...adjustment, date: event.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="adjustment-qty">
                    Quantity
                  </label>
                  <input
                    id="adjustment-qty"
                    inputMode="decimal"
                    value={adjustment.qty}
                    onChange={(event) => onAdjustmentChange({ ...adjustment, qty: event.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="adjustment-cost">
                    Unit cost <span className="faint">optional</span>
                  </label>
                  <input
                    id="adjustment-cost"
                    inputMode="decimal"
                    className="mono"
                    value={adjustment.unit_cost_bdt}
                    onChange={(event) => onAdjustmentChange({ ...adjustment, unit_cost_bdt: event.target.value })}
                    placeholder="the current average"
                    disabled={adjustment.mode === "OUT"}
                  />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="adjustment-reason">
                  Reason
                </label>
                <input
                  id="adjustment-reason"
                  value={adjustment.reason}
                  onChange={(event) => onAdjustmentChange({ ...adjustment, reason: event.target.value })}
                  placeholder="Damaged in transit"
                  required
                />
              </div>

              <p className="note" style={{ margin: 0 }}>
                Posts <span className="mono">DR 1200 / CR 5600</span> for stock found, and the reverse for stock written
                off — 5600 Waste &amp; Shrinkage, because that is what a shortage is. A reason and the owner&rsquo;s
                signature are required: this is the one way the balance sheet can move without a document behind it.
              </p>

              <div className="row">
                <button className="btn" type="submit" disabled={busy || !adjustReady}>
                  {busy ? "Recording…" : "Record adjustment"}
                </button>
              </div>
            </form>
          ) : (
            <p className="note" style={{ margin: 0 }}>
              Your role can read stock but not adjust it. An adjustment moves the value of the balance sheet with no
              document to explain it, so it is the owner&rsquo;s or an admin&rsquo;s act.
            </p>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 style={{ fontSize: "var(--t-lg)" }}>Move between warehouses</h2>
          </div>
          {canMove ? (
            <form className="stack" onSubmit={onTransfer} noValidate>
              <div className="field">
                <label className="label" htmlFor="transfer-item">
                  Item
                </label>
                <select
                  id="transfer-item"
                  value={transfer.item_id}
                  onChange={(event) => onTransferChange({ ...transfer, item_id: event.target.value })}
                  required
                >
                  <option value="">Choose an item…</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <label className="label" htmlFor="transfer-from">
                    From
                  </label>
                  <select
                    id="transfer-from"
                    value={transfer.from_warehouse_id}
                    onChange={(event) => onTransferChange({ ...transfer, from_warehouse_id: event.target.value })}
                    required
                  >
                    <option value="">Choose…</option>
                    {warehouses.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="transfer-to">
                    To
                  </label>
                  <select
                    id="transfer-to"
                    value={transfer.to_warehouse_id}
                    onChange={(event) => onTransferChange({ ...transfer, to_warehouse_id: event.target.value })}
                    required
                  >
                    <option value="">Choose…</option>
                    {warehouses.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <label className="label" htmlFor="transfer-date">
                    Date
                  </label>
                  <input
                    id="transfer-date"
                    type="date"
                    className="mono"
                    value={transfer.date}
                    onChange={(event) => onTransferChange({ ...transfer, date: event.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="transfer-qty">
                    Quantity
                  </label>
                  <input
                    id="transfer-qty"
                    inputMode="decimal"
                    value={transfer.qty}
                    onChange={(event) => onTransferChange({ ...transfer, qty: event.target.value })}
                    placeholder="4"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="transfer-memo">
                  Memo <span className="faint">optional</span>
                </label>
                <input
                  id="transfer-memo"
                  value={transfer.memo}
                  onChange={(event) => onTransferChange({ ...transfer, memo: event.target.value })}
                  placeholder="Restocking the second store"
                />
              </div>

              <p className="note" style={{ margin: 0 }}>
                No journal entry: the goods change shelves, not value. They travel at the cost they left at, so the
                destination&rsquo;s average reflects what they actually cost.
              </p>

              <div className="row">
                <button className="btn" type="submit" disabled={busy || !transferReady}>
                  {busy ? "Moving…" : "Record transfer"}
                </button>
              </div>
            </form>
          ) : (
            <p className="note" style={{ margin: 0 }}>
              Your role can read stock but not move it.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

type OperationsSectionProps = {
  adjustment: {
    item_id: string;
    warehouse_id: string;
    date: string;
    mode: "IN" | "OUT";
    qty: string;
    unit_cost_bdt: string;
    reason: string;
    memo: string;
  };
  transfer: {
    item_id: string;
    from_warehouse_id: string;
    to_warehouse_id: string;
    date: string;
    qty: string;
    memo: string;
  };
};

/* ── Stocktakes ──────────────────────────────────────────────────────────── */

function CountsSection({
  stocktakes,
  items,
  warehouses,
  canMove,
  canAdjust,
  busy,
  draft,
  posting,
  onChange,
  onPostingChange,
  onSubmit,
  onPost,
}: {
  stocktakes: Stocktake[];
  items: Item[];
  warehouses: Warehouse[];
  canMove: boolean;
  canAdjust: boolean;
  busy: boolean;
  draft: {
    warehouse_id: string;
    date: string;
    memo: string;
    lines: { item_id: string; counted_qty: string; unit_cost_bdt: string }[];
  };
  posting: { id: string; reason: string };
  onChange: (next: CountsSectionProps["draft"]) => void;
  onPostingChange: (next: { id: string; reason: string }) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  onPost: (id: string, reason: string) => Promise<void>;
}) {
  const named = draft.lines.filter((line) => line.item_id !== "");
  const canSubmit = named.length > 0 && draft.date !== "";

  function setLine(index: number, next: { item_id: string; counted_qty: string; unit_cost_bdt: string }) {
    onChange({ ...draft, lines: draft.lines.map((line, at) => (at === index ? next : line)) });
  }

  return (
    <section className="section">
      {canMove ? (
        <div className="panel">
          <div className="panel-head">
            <h2 style={{ fontSize: "var(--t-lg)" }}>Draw up a count</h2>
          </div>
          <form className="stack" onSubmit={onSubmit} noValidate>
            <div className="grid grid-3">
              <div className="field">
                <label className="label" htmlFor="count-warehouse">
                  Warehouse
                </label>
                <select
                  id="count-warehouse"
                  value={draft.warehouse_id}
                  onChange={(event) => onChange({ ...draft, warehouse_id: event.target.value })}
                >
                  <option value="">The default</option>
                  {warehouses.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="count-date">
                  Date
                </label>
                <input
                  id="count-date"
                  type="date"
                  className="mono"
                  value={draft.date}
                  onChange={(event) => onChange({ ...draft, date: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="count-memo">
                  Memo <span className="faint">optional</span>
                </label>
                <input
                  id="count-memo"
                  value={draft.memo}
                  onChange={(event) => onChange({ ...draft, memo: event.target.value })}
                  placeholder="Quarterly count"
                />
              </div>
            </div>

            <div className="stack">
              {draft.lines.map((line, index) => (
                <div className="stack" key={index} style={{ gap: "var(--s-2)" }}>
                  <div className="grid grid-3">
                    <div className="field">
                      <label className="label" htmlFor={`count-item-${index}`}>
                        Item
                      </label>
                      <select
                        id={`count-item-${index}`}
                        value={line.item_id}
                        onChange={(event) => setLine(index, { ...line, item_id: event.target.value })}
                      >
                        <option value="">Choose an item…</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.sku} — {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor={`count-qty-${index}`}>
                        Counted
                      </label>
                      <input
                        id={`count-qty-${index}`}
                        inputMode="decimal"
                        value={line.counted_qty}
                        onChange={(event) => setLine(index, { ...line, counted_qty: event.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor={`count-cost-${index}`}>
                        Unit cost <span className="faint">optional</span>
                      </label>
                      <input
                        id={`count-cost-${index}`}
                        inputMode="decimal"
                        className="mono"
                        value={line.unit_cost_bdt}
                        onChange={(event) => setLine(index, { ...line, unit_cost_bdt: event.target.value })}
                        placeholder="the current average"
                      />
                    </div>
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      onClick={() =>
                        onChange({
                          ...draft,
                          lines: draft.lines.length === 1 ? draft.lines : draft.lines.filter((_, at) => at !== index),
                        })
                      }
                      disabled={draft.lines.length === 1}
                    >
                      Remove line
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="row-between">
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={() => onChange({ ...draft, lines: [...draft.lines, { item_id: "", counted_qty: "", unit_cost_bdt: "" }] })}
              >
                Add a line
              </button>
              <button className="btn" type="submit" disabled={busy || !canSubmit}>
                {busy ? "Saving…" : "Draw up worksheet"}
              </button>
            </div>
            <p className="note" style={{ margin: 0 }}>
              The book quantity and cost are snapshotted when the worksheet is drawn up, so the count is compared against
              what was true when somebody was standing in the warehouse. Nothing posts until the worksheet is posted,
              which needs the same signature an adjustment does.
            </p>
          </form>
        </div>
      ) : (
        <p className="note">Your role can read counts but not draw one up.</p>
      )}

      <div className="stack" style={{ marginTop: "var(--s-5)" }}>
        {stocktakes.length === 0 ? (
          <div className="panel">
            <p className="muted" style={{ margin: 0 }}>
              No counts recorded yet.
            </p>
          </div>
        ) : (
          stocktakes.map((row) => {
            const variance = row.variance_value_bdt !== "0.00" || row.variance_qty_total !== 0;
            return (
              <div className="panel panel--flush" key={row.id}>
                <div className="panel-head">
                  <h2 style={{ fontSize: "var(--t-lg)" }}>
                    <span className="mono">{row.date}</span> {row.warehouse_name}
                  </h2>
                  <span className="row" style={{ gap: "var(--s-3)" }}>
                    <span className="muted" style={{ fontSize: "var(--t-sm)" }}>
                      {STOCKTAKE_STATUS_LABEL[row.status].toLowerCase()} · {row.lines.length} lines
                    </span>
                    {row.status === "DRAFT" && canAdjust ? (
                      posting.id === row.id ? (
                        <span className="row" style={{ gap: "var(--s-2)" }}>
                          <input
                            aria-label="Reason for posting this variance"
                            value={posting.reason}
                            onChange={(event) => onPostingChange({ id: row.id, reason: event.target.value })}
                            placeholder="Why this variance is being posted"
                            style={{ minWidth: "16rem" }}
                          />
                          <button
                            className="btn btn--sm"
                            type="button"
                            disabled={busy || posting.reason.trim().length < 3}
                            onClick={() => void onPost(row.id, posting.reason)}
                          >
                            Post
                          </button>
                          <button
                            className="btn btn--quiet btn--sm"
                            type="button"
                            onClick={() => onPostingChange({ id: "", reason: "" })}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          className="btn btn--sm"
                          type="button"
                          onClick={() => onPostingChange({ id: row.id, reason: row.memo })}
                        >
                          Post variance
                        </button>
                      )
                    ) : null}
                  </span>
                </div>

                <div className="ledger-scroll">
                  <table className="ledger">
                    <caption className="sr-only">Counted lines</caption>
                    <thead>
                      <tr>
                        <th scope="col">Item</th>
                        <th scope="col" className="num">
                          Book
                        </th>
                        <th scope="col" className="num">
                          Counted
                        </th>
                        <th scope="col" className="num">
                          Variance
                        </th>
                        <th scope="col" className="num">
                          Unit cost
                        </th>
                        <th scope="col" className="num">
                          Worth
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.lines.map((line) => (
                        <tr key={line.item_id}>
                          <td>
                            <span className="mono">{line.sku_snapshot}</span> {line.label_snapshot}
                          </td>
                          <td className="num mono">{line.expected_qty}</td>
                          <td className="num mono">{line.counted_qty}</td>
                          <td className="num mono">
                            {line.variance_qty === 0 ? "—" : line.variance_qty > 0 ? `+${line.variance_qty}` : line.variance_qty}
                          </td>
                          <td className="num">
                            <Amount value={line.unit_cost_bdt} size="sm" />
                          </td>
                          <td className="num">
                            <Amount value={line.variance_value_bdt} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row">Total</th>
                        <td />
                        <td />
                        <td className="num mono">{row.variance_qty_total}</td>
                        <td />
                        <td className="num">
                          <Amount value={row.variance_value_bdt} size="sm" />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <p className="note" style={{ padding: "var(--s-4)", margin: 0 }}>
                  {row.status === "POSTED"
                    ? row.journal_entry_id
                      ? "The variance is in the ledger against 5600 Waste & Shrinkage."
                      : "Posted with no entry: the count agreed with the book. A count that agreed is still a fact worth recording."
                    : variance
                      ? "Draft — nothing has moved yet. Posting writes the variance to the ledger."
                      : "Draft — the count agrees with the book, so posting would write nothing."}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

type CountsSectionProps = {
  draft: {
    warehouse_id: string;
    date: string;
    memo: string;
    lines: { item_id: string; counted_qty: string; unit_cost_bdt: string }[];
  };
};
