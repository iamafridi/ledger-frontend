"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ExpenseForm, emptyDraft, type ExpenseDraft } from "@/components/expense-form";
import { toast } from "@/components/toast-provider";
import { api, ApiError } from "@/lib/api";
import { currentMonth } from "@/lib/use-dashboard";
import type { Category, Expense, ReceiptExtraction, ScanResult } from "@/lib/types";

/**
 * Required item 1's photograph path, in three explicit steps: choose, review,
 * save.
 *
 * THE REVIEW STEP IS THE POINT. The brief asks us to "show what was read so the
 * user can check it, and let them correct any field before saving". So:
 *
 *   - Nothing is written by the scan. The endpoint that reads the image has no
 *     access to the expense collection; saving is a separate request the user
 *     makes from this form.
 *   - Every field arrives with a confidence mark and, underneath, the literal
 *     characters the reader saw — so the user can check our reading against the
 *     photo without zooming in on it.
 *   - A field the reader could not make out arrives EMPTY rather than guessed. A
 *     blank the user fills in is a small cost; a confident wrong amount waved
 *     through is a corrupted ledger.
 */
export default function ReceiptsPage() {
  const fileInput = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft(""));
  const [saved, setSaved] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setScan(null);
    setSaved(null);
    setError(null);
    setDraft(emptyDraft(""));
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onFile(file: File) {
    setError(null);
    setSaved(null);
    setBusy(true);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));

    try {
      const form = new FormData();
      form.append("image", file);
      const result = await api<ScanResult>("/receipts/scan", { method: "POST", form });
      setScan(result);

      // Seed the form from the reading. Null stays null — an unread field is
      // presented as blank, never as a plausible guess.
      const { amount, date, shop, category } = result.extraction;
      setDraft({
        date: date.value ?? "",
        category: (category.value as Category | null) ?? "",
        shop: shop.value ?? "",
        amount: amount.value ?? "",
        note: "",
      });
      toast.info("Receipt analyzed. Please review extracted figures.");
    } catch (caught) {
      const msg = caught instanceof ApiError ? caught.message : "Could not read that image.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const extraction = scan?.extraction;

  return (
    <>
      <section className="section">
        <p className="eyebrow">01 &nbsp; Scan a receipt</p>
        <div className="grid grid-sidebar" style={{ marginTop: "var(--s-3)", alignItems: "start" }}>
          <div className="stack">
            <h1>Photograph the bill. Check it. Then save.</h1>
            <p className="note">
              The amount, date and shop are read from the photo and shown to you with the raw text
              behind each one. Nothing is recorded until you press save, and every field stays
              editable until you do.
            </p>

            <div className="row">
              <input
                ref={fileInput}
                id="receipt-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onFile(file);
                }}
              />
              <label className="btn" htmlFor="receipt-file">
                {busy ? "Reading…" : "Choose a photo"}
              </label>
              {scan ? (
                <button type="button" className="btn btn--quiet" onClick={reset}>
                  Start again
                </button>
              ) : null}
            </div>

            {error ? (
              <p className="alert alert--error" role="alert">
                {error}
              </p>
            ) : null}

            {extraction?.error ? (
              <p className="alert alert--error" role="alert">
                {extraction.error} You can still enter the details by hand below.
              </p>
            ) : null}
          </div>

          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview}
              alt="The receipt you uploaded"
              className="panel"
              style={{ padding: "var(--s-2)", objectFit: "contain", maxHeight: "22rem", width: "100%" }}
            />
          ) : (
            <div className="empty">
              <p style={{ margin: 0 }}>No photo chosen yet.</p>
            </div>
          )}
        </div>

      {scan ? (
        <div style={{ marginTop: "var(--s-4)", paddingTop: "var(--s-4)", borderTop: "1px solid var(--border)" }}>
          <div className="row-between">
            <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
              02 &nbsp; Check what was read
            </p>
            <span className="chip">
              {scan.provider === "none" ? "manual entry" : `read by ${scan.provider}`}
            </span>
          </div>

          <p className="alert" style={{ marginTop: "var(--s-3)" }}>
            <strong>Nothing has been saved yet.</strong> Correct anything that is wrong — the reading
            is a suggestion, and the figures below are what will be recorded.
          </p>

          {saved ? (
            <div className="alert alert--ok" style={{ marginTop: "var(--s-3) " }} role="status">
              Saved {saved.shop}, ৳{saved.amount_bdt} on {saved.date}.{" "}
              <Link href="/expenses">See it in your expenses</Link> or{" "}
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                style={{ marginLeft: "var(--s-2)" }}
                onClick={reset}
              >
                scan another
              </button>
            </div>
          ) : (
            <div className="panel" style={{ marginTop: "var(--s-3)" }}>
              <ExpenseForm
                draft={draft}
                onDraftChange={setDraft}
                onSaved={(expense) => {
                  setSaved(expense);
                  toast.success(`Saved receipt: ${expense.shop} (৳${expense.amount_bdt})`);
                }}
                source="receipt"
                submitLabel="Confirm and save"
              >
                {(field) => <ReadingNote extraction={extraction} field={field} />}
              </ExpenseForm>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: "var(--s-4)", paddingTop: "var(--s-4)", borderTop: "1px solid var(--border)" }}>
          <p className="eyebrow">02 &nbsp; Or enter it by hand</p>
          <div className="panel" style={{ marginTop: "var(--s-3)" }}>
            <ExpenseForm
              draft={draft.date ? draft : { ...draft, date: `${currentMonth()}-01` }}
              onDraftChange={setDraft}
              onSaved={(expense) => {
                setSaved(expense);
                toast.success(`Saved expense: ${expense.shop} (৳${expense.amount_bdt})`);
              }}
              source="manual"
            />
          </div>
        </div>
      )}
      </section>
    </>
  );
}

/**
 * What the reader saw for one field: its confidence, and the literal characters
 * it read. Confidence is never colour alone — the word is always printed.
 */
function ReadingNote({
  extraction,
  field,
}: {
  extraction: ReceiptExtraction | undefined;
  field: keyof ExpenseDraft;
}) {
  if (!extraction) return null;
  if (field === "note") return null;

  const read = extraction[field as "amount" | "date" | "shop" | "category"];
  if (!read) return null;

  if (read.value === null) {
    return (
      <span className="row" style={{ gap: "var(--s-2)" }}>
        <span className="chip chip--low">not read</span>
        <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
          {read.raw ? `saw “${read.raw}”` : "nothing legible — please fill this in"}
        </span>
      </span>
    );
  }

  return (
    <span className="row" style={{ gap: "var(--s-2)" }}>
      <span className={`chip chip--${read.confidence}`}>{read.confidence} confidence</span>
      {read.raw ? (
        <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
          read “{read.raw}”
        </span>
      ) : null}
    </span>
  );
}
