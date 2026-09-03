"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api";
import { toCanonical } from "@/lib/money";
import { CATEGORIES, type Category, type Expense } from "@/lib/types";

export interface ExpenseDraft {
  date: string;
  category: Category | "";
  shop: string;
  amount: string;
  note: string;
}

export const emptyDraft = (date: string): ExpenseDraft => ({
  date,
  category: "",
  shop: "",
  amount: "",
  note: "",
});

/**
 * The one form that writes an expense, shared by manual entry and by the receipt
 * review step. Sharing it is deliberate: the review gate must offer exactly the
 * same editing power as typing the expense by hand, or "correct any field before
 * saving" is only half true.
 */
export function ExpenseForm({
  draft,
  onDraftChange,
  onSaved,
  source,
  submitLabel = "Save expense",
  children,
}: {
  draft: ExpenseDraft;
  onDraftChange: (next: ExpenseDraft) => void;
  onSaved: (expense: Expense) => void;
  source: "manual" | "receipt";
  submitLabel?: string;
  /** Slot for per-field annotations, used by the receipt review. */
  children?: (field: keyof ExpenseDraft) => React.ReactNode;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseDraft, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof ExpenseDraft, value: string) => {
    onDraftChange({ ...draft, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const next: Partial<Record<keyof ExpenseDraft, string>> = {};
    if (!draft.date) next.date = "Pick the date on the receipt.";
    if (!draft.category) next.category = "Choose a category.";
    if (!draft.shop.trim()) next.shop = "Where was it spent?";

    const amount = toCanonical(draft.amount);
    if (!amount.ok) next.amount = amount.reason;

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setBusy(true);
    try {
      const { expense } = await api<{ expense: Expense }>("/expenses", {
        method: "POST",
        body: {
          date: draft.date,
          category: draft.category,
          shop: draft.shop.trim(),
          amount_bdt: amount.ok ? amount.value : "0.00",
          note: draft.note.trim(),
          source,
        },
      });
      onSaved(expense);
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : "Could not save that expense.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      {formError ? (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="grid grid-2">
        <div className={`field ${errors.amount ? "field--invalid" : ""}`}>
          <label className="label" htmlFor="expense-amount">
            Amount
          </label>
          <input
            id="expense-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={draft.amount}
            onChange={(event) => set("amount", event.target.value)}
            aria-invalid={Boolean(errors.amount)}
          />
          {children?.("amount")}
          {errors.amount ? <span className="field-error">{errors.amount}</span> : null}
        </div>

        <div className={`field ${errors.date ? "field--invalid" : ""}`}>
          <label className="label" htmlFor="expense-date">
            Date
          </label>
          <input
            id="expense-date"
            type="date"
            value={draft.date}
            onChange={(event) => set("date", event.target.value)}
            aria-invalid={Boolean(errors.date)}
          />
          {children?.("date")}
          {errors.date ? <span className="field-error">{errors.date}</span> : null}
        </div>

        <div className={`field ${errors.shop ? "field--invalid" : ""}`}>
          <label className="label" htmlFor="expense-shop">
            Shop
          </label>
          <input
            id="expense-shop"
            value={draft.shop}
            onChange={(event) => set("shop", event.target.value)}
            aria-invalid={Boolean(errors.shop)}
          />
          {children?.("shop")}
          {errors.shop ? <span className="field-error">{errors.shop}</span> : null}
        </div>

        <div className={`field ${errors.category ? "field--invalid" : ""}`}>
          <label className="label" htmlFor="expense-category">
            Category
          </label>
          <select
            id="expense-category"
            value={draft.category}
            onChange={(event) => set("category", event.target.value)}
            aria-invalid={Boolean(errors.category)}
          >
            <option value="">Choose…</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {children?.("category")}
          {errors.category ? <span className="field-error">{errors.category}</span> : null}
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="expense-note">
          Note <span className="faint">optional</span>
        </label>
        <input
          id="expense-note"
          value={draft.note}
          onChange={(event) => set("note", event.target.value)}
        />
      </div>

      <div className="row">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
