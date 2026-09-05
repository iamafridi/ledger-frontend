"use client";

/**
 * The §5.4 line editor, shared by invoices, credit notes, bills and debit notes.
 *
 * ONE EDITOR, FOUR DOCUMENTS (since P4)
 * The arithmetic — gross, discount, tax on the net, all in exact integer paisa —
 * is identical whichever way the document runs, so it lives once (`lib/money.ts`
 * and the preview functions below). What differs per document family is only the
 * *vocabulary*: which account list a line draws from and which item field fills
 * the account when an item is picked. Both arrive as props, so a purchase
 * document passes expense accounts and `expense_account_code` without this file
 * growing a second copy of any row.
 *
 * A PREVIEW, AND IT SAYS SO
 * The footer totals update as you type, and every one of them is marked as a
 * preview. The engine recomputes all of them from the lines it receives — the
 * preview exists so a person can see what they are about to issue, not so the
 * browser can decide it. The arithmetic is exact integer paisa in `lib/money.ts`
 * (never a float) and follows the engine step for step: gross, then discount,
 * then tax on the net.
 *
 * WHAT A DEDUCTION LOOKS LIKE
 * A deduction line stores positive amounts and subtracts from the document, so
 * the editor shows its contribution with a minus sign while the stored value
 * stays positive. The sign belongs to the total, not to the line.
 */
import { useMemo } from "react";

import { Amount } from "@/components/money";
import { addMoney, multiplyMoney, negateMoney, percentOfMoney, toCanonical, type Money } from "@/lib/money";
import type { Account, CatalogTaxRate, InvoiceLine, Item } from "@/lib/types";

/** One line while it is being typed: everything is a string, because that is
 *  what an input holds and what the API accepts. */
export interface DraftLine {
  key: string;
  item_id: string;
  description: string;
  qty: string;
  unit_price_bdt: string;
  discount_bdt: string;
  tax_code: string;
  account_code: string;
  is_deduction: boolean;
}

let lineSeq = 0;

/** A fresh blank line. Keys are generated client-side so React can track rows
 *  that move or are removed; the API never sees them. */
export function emptyLine(): DraftLine {
  lineSeq += 1;
  return {
    key: `line-${lineSeq}`,
    item_id: "",
    description: "",
    qty: "1",
    unit_price_bdt: "",
    discount_bdt: "0.00",
    tax_code: "",
    account_code: "",
    is_deduction: false,
  };
}

/** A stored line, opened for editing. */
export function lineFromStored(line: InvoiceLine, fallbackTaxCode = ""): DraftLine {
  lineSeq += 1;
  return {
    key: `line-${lineSeq}`,
    item_id: line.item_id ?? "",
    description: line.description || line.label_snapshot,
    qty: String(line.qty),
    unit_price_bdt: line.unit_price_bdt,
    discount_bdt: line.discount_bdt,
    tax_code: line.tax_code || fallbackTaxCode,
    account_code: line.account_code,
    is_deduction: line.is_deduction,
  };
}

export interface LinePreview {
  /** Null means the line cannot be computed yet — something is half-typed. */
  net: Money | null;
  tax: Money | null;
  discount: Money;
  rate: string;
  /** The stored direction: true when this line subtracts. */
  deduction: boolean;
}

export function previewLine(line: DraftLine, taxRates: CatalogTaxRate[]): LinePreview {
  const rate = taxRates.find((row) => row.code === line.tax_code)?.rate_percent ?? "0.00";
  const discountRaw = toCanonical(line.discount_bdt || "0");
  const discount = discountRaw.ok ? discountRaw.value : "0.00";

  const price = toCanonical(line.unit_price_bdt);
  if (!price.ok) return { net: null, tax: null, discount, rate, deduction: line.is_deduction };

  const gross = multiplyMoney(price.value, line.qty || "0");
  if (gross === null) return { net: null, tax: null, discount, rate, deduction: line.is_deduction };

  const net = addMoney([gross, negateMoney(discount)]);
  const tax = percentOfMoney(net, rate);
  return { net, tax, discount, rate, deduction: line.is_deduction };
}

export interface TotalsPreview {
  subtotal: Money;
  discount_total: Money;
  tax_total: Money;
  total: Money;
  /** False while any line is still uncomputable, so the footer can say so. */
  complete: boolean;
}

export function previewTotals(lines: DraftLine[], taxRates: CatalogTaxRate[]): TotalsPreview {
  const previews = lines.map((line) => ({ line, preview: previewLine(line, taxRates) }));
  const signed = (value: Money, deduction: boolean): Money => (deduction ? negateMoney(value) : value);

  const net = previews
    .filter((row) => row.preview.net !== null)
    .map((row) => signed(row.preview.net as Money, row.line.is_deduction));
  const discount = previews
    .filter((row) => row.preview.net !== null)
    .map((row) => signed(row.preview.discount, row.line.is_deduction));
  const tax = previews
    .filter((row) => row.preview.tax !== null)
    .map((row) => signed(row.preview.tax as Money, row.line.is_deduction));

  const subtotal = addMoney(net);
  const taxTotal = addMoney(tax);

  return {
    subtotal,
    discount_total: addMoney(discount),
    tax_total: taxTotal,
    total: addMoney([subtotal, taxTotal]),
    complete: previews.every((row) => row.preview.net !== null),
  };
}

/** The stored shape the API wants, or a reason why the line is not ready. */
export function toRequestLine(line: DraftLine): Record<string, unknown> {
  const price = toCanonical(line.unit_price_bdt);
  const discount = toCanonical(line.discount_bdt || "0");
  return {
    item_id: line.item_id || null,
    description: line.description,
    qty: line.qty.trim() === "" ? 0 : Number(line.qty),
    unit_price_bdt: price.ok ? price.value : "0.00",
    discount_bdt: discount.ok ? discount.value : "0.00",
    tax_code: line.tax_code,
    account_code: line.account_code,
    is_deduction: line.is_deduction,
  };
}

/* ── The editor ───────────────────────────────────────────────────────────── */

export function LineEditor({
  lines,
  onChange,
  items,
  taxRates,
  accounts,
  /** Which item field fills the account when an item is picked. Sales default. */
  itemAccountField = "income_account_code",
  /** The datalist id behind the account input — unique per mount. */
  datalistId = "sales-revenue-accounts",
  accountPlaceholder = "4000",
  accountLabel = "revenue account",
}: {
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
  items: Item[];
  taxRates: CatalogTaxRate[];
  accounts: Account[];
  itemAccountField?: "income_account_code" | "expense_account_code";
  datalistId?: string;
  accountPlaceholder?: string;
  accountLabel?: string;
}) {
  const totals = useMemo(() => previewTotals(lines, taxRates), [lines, taxRates]);

  const patch = (index: number, changes: Partial<DraftLine>): void => {
    onChange(lines.map((line, position) => (position === index ? { ...line, ...changes } : line)));
  };

  /** Picking an item fills in what the master row already knows, and leaves
   *  alone anything the person has typed — an item is a default, not a
   *  constraint. */
  const chooseItem = (index: number, itemId: string): void => {
    const item = items.find((row) => row.id === itemId);
    patch(index, {
      item_id: itemId,
      description: item ? item.name : lines[index]?.description ?? "",
      tax_code: item?.tax_code || lines[index]?.tax_code || "",
      account_code: item?.[itemAccountField] || lines[index]?.account_code || "",
    });
  };

  return (
    <div className="stack">
      <div className="ledger-scroll">
        <table className="ledger">
          <caption className="sr-only">Document lines</caption>
          <thead>
            <tr>
              <th scope="col">Item or description</th>
              <th scope="col">Qty</th>
              <th scope="col">Unit price</th>
              <th scope="col">Discount</th>
              <th scope="col">Tax</th>
              <th scope="col">Account</th>
              <th scope="col" className="text-right">
                Net
              </th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const preview = previewLine(line, taxRates);
              return (
                <tr key={line.key}>
                  <td style={{ minWidth: "14rem" }}>
                    <div className="stack" style={{ gap: "var(--s-2)" }}>
                      <select
                        aria-label={`Line ${index + 1} item`}
                        value={line.item_id}
                        onChange={(event) => chooseItem(index, event.target.value)}
                      >
                        <option value="">— no item —</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.sku} · {item.name}
                          </option>
                        ))}
                      </select>
                      <input
                        aria-label={`Line ${index + 1} description`}
                        value={line.description}
                        onChange={(event) => patch(index, { description: event.target.value })}
                        placeholder="What is being sold"
                      />
                      <label className="label row" style={{ gap: "var(--s-2)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={line.is_deduction}
                          onChange={(event) => patch(index, { is_deduction: event.target.checked })}
                        />
                        Subtracts from the document
                      </label>
                    </div>
                  </td>
                  <td>
                    <input
                      className="mono"
                      aria-label={`Line ${index + 1} quantity`}
                      value={line.qty}
                      onChange={(event) => patch(index, { qty: event.target.value })}
                      inputMode="decimal"
                      style={{ width: "5rem" }}
                    />
                  </td>
                  <td>
                    <input
                      className="mono"
                      aria-label={`Line ${index + 1} unit price`}
                      value={line.unit_price_bdt}
                      onChange={(event) => patch(index, { unit_price_bdt: event.target.value })}
                      placeholder="0.00"
                      inputMode="decimal"
                      style={{ width: "7rem" }}
                    />
                  </td>
                  <td>
                    <input
                      className="mono"
                      aria-label={`Line ${index + 1} discount`}
                      value={line.discount_bdt}
                      onChange={(event) => patch(index, { discount_bdt: event.target.value })}
                      inputMode="decimal"
                      style={{ width: "6.5rem" }}
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`Line ${index + 1} tax code`}
                      value={line.tax_code}
                      onChange={(event) => patch(index, { tax_code: event.target.value })}
                    >
                      <option value="">No tax</option>
                      {taxRates.map((rate) => (
                        <option key={rate.code} value={rate.code}>
                          {rate.name} ({rate.rate_percent}%)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="mono"
                      aria-label={`Line ${index + 1} ${accountLabel}`}
                      list={datalistId}
                      value={line.account_code}
                      onChange={(event) => patch(index, { account_code: event.target.value })}
                      placeholder={accountPlaceholder}
                      style={{ width: "6rem" }}
                    />
                  </td>
                  <td className="text-right nowrap">
                    {line.is_deduction ? <span aria-hidden="true">−</span> : null}
                    {preview.net === null ? (
                      <span className="muted">—</span>
                    ) : (
                      <Amount value={line.is_deduction ? negateMoney(preview.net) : preview.net} size="sm" />
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      aria-label={`Remove line ${index + 1}`}
                      disabled={lines.length === 1}
                      onClick={() => onChange(lines.filter((_, position) => position !== index))}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <datalist id={datalistId}>
        {accounts.map((account) => (
          <option key={account.code} value={account.code}>
            {account.name}
          </option>
        ))}
      </datalist>

      <div className="row-between">
        <button type="button" className="btn btn--sm btn--quiet" onClick={() => onChange([...lines, emptyLine()])}>
          Add line
        </button>

        <dl className="stack" style={{ gap: "var(--s-2)", margin: 0, minWidth: "18rem" }}>
          <TotalRow label="Subtotal" value={totals.subtotal} />
          <TotalRow label="Discount" value={totals.discount_total} />
          <TotalRow label="VAT" value={totals.tax_total} />
          <TotalRow label="Total" value={totals.total} strong />
        </dl>
      </div>

      <p className="note" style={{ margin: 0, fontSize: "var(--t-xs)" }}>
        Preview{!totals.complete ? " — finish the highlighted lines to complete it" : ""}. The ledger
        recomputes every amount from these lines when you save.
      </p>
    </div>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: Money; strong?: boolean }) {
  return (
    <div className="row-between" style={{ gap: "var(--s-4)" }}>
      <dt className="label" style={{ margin: 0, fontWeight: strong ? 600 : undefined }}>
        {label}
      </dt>
      <dd style={{ margin: 0 }}>
        <Amount value={value} size={strong ? "lg" : "sm"} />
      </dd>
    </div>
  );
}

/* ── The saved document ───────────────────────────────────────────────────── */

/** A saved document's lines, read-only. The amounts are the engine's, printed
 *  exactly as stored — this component computes nothing. */
export function LineTable({ lines }: { lines: InvoiceLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        This document has no lines.
      </p>
    );
  }

  return (
    <div className="ledger-scroll">
      <table className="ledger">
        <caption className="sr-only">Document lines</caption>
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col">Qty</th>
            <th scope="col">Unit price</th>
            <th scope="col">Discount</th>
            <th scope="col">Tax</th>
            <th scope="col">Account</th>
            <th scope="col" className="text-right">
              Net
            </th>
            <th scope="col" className="text-right">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <td>
                {line.description || line.label_snapshot || "—"}
                {line.is_deduction ? (
                  <span className="chip chip--short" style={{ marginLeft: "var(--s-2)" }}>
                    subtracts
                  </span>
                ) : null}
              </td>
              <td className="mono nowrap">{line.qty}</td>
              <td className="text-right nowrap">
                <Amount value={line.unit_price_bdt} size="sm" />
              </td>
              <td className="text-right nowrap">
                <Amount value={line.discount_bdt} size="sm" />
              </td>
              <td className="muted nowrap">
                {line.tax_code ? `${line.tax_code} · ${line.tax_rate_snapshot}%` : "—"}
              </td>
              <td className="mono nowrap">{line.account_code}</td>
              <td className="text-right nowrap">
                <Amount value={line.net_bdt} size="sm" />
              </td>
              <td className="text-right nowrap">
                <Amount value={line.line_total_bdt} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
