"use client";

/**
 * The §5.4 line editor for purchase documents — bills and debit notes.
 *
 * This file is the purchase-side wrapper around the shared editor component:
 * the arithmetic lives once in `lib/money.ts` and the editor JSX once in
 * `components/sales/document-lines.tsx`. What differs here is only what the
 * wrapper passes in — expense accounts instead of revenue ones, an item's
 * `expense_account_code` as the account an item fills in, and labels that say
 * what a purchase line is for. A second copy of the table itself would be two
 * places for the line UI to drift.
 */
import {
  LineEditor,
  LineTable,
  emptyLine,
  lineFromStored,
  previewTotals,
  toRequestLine,
} from "@/components/sales/document-lines";
import type { Account, InvoiceLine } from "@/lib/types";

export {
  emptyLine,
  lineFromStored,
  previewTotals,
  toRequestLine,
  LineEditor as PurchaseLineEditor,
  LineTable,
};

/** The account pickers on a purchase document offer expense accounts only. */
export function expenseAccounts(accounts: Account[]): Account[] {
  return accounts.filter((account) => account.type === "EXPENSE" && account.is_active);
}

/** A bill line's own label — the shared editor is family-agnostic. */
export const PURCHASE_EDITOR_DEFAULTS = {
  itemAccountField: "expense_account_code",
  datalistId: "purchase-expense-accounts",
  accountPlaceholder: "5800",
  accountLabel: "expense account",
} as const;

/** Re-exported for callers that want the stored-line type spelled out. */
export type StoredLine = InvoiceLine;
