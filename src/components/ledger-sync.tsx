"use client";

import { useCallback, useEffect, useState } from "react";

import { useSession } from "./session-provider";
import { api, ApiError } from "@/lib/api";
import type { ExpenseLedgerStatus } from "@/lib/types";

/**
 * Says whether this account's expenses are in the general ledger, and offers to
 * put them there.
 *
 * WHY THIS IS ON SCREEN AT ALL
 * The ledger is the single source of truth (plan §4, D3), and the bridge that
 * posts each expense is allowed to fail softly: a date inside a closed period is
 * not the fault of the person typing, and refusing to record their expense would
 * break the personal edition for a reason that has nothing to do with them.
 *
 * Fail-soft is only honest while the failure is visible and fixable. This is both
 * halves of that: it counts what is missing, and it repairs it. Without it, the
 * dashboard and the trial balance could disagree indefinitely and nobody would
 * be told.
 *
 * Silence when everything is in the books is deliberate — a permanent "0
 * unposted" panel would train people to stop reading it.
 */
export function LedgerSync({ onRepaired }: { onRepaired?: () => void }) {
  const { can } = useSession();
  const [status, setStatus] = useState<ExpenseLedgerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { ledger } = await api<{ ledger: ExpenseLedgerStatus }>("/expenses/ledger-status");
      setStatus(ledger);
    } catch {
      // The expense list is the page's real content. A status request failing
      // must not be allowed to take the screen with it.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function post() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { result } = await api<{
        result: { total: number; posted: number; failed: number; opened_years: string[]; failures: string[] };
      }>("/expenses/post-to-ledger", { method: "POST" });

      const years =
        result.opened_years.length > 0 ? ` A fiscal year (${result.opened_years.join(", ")}) was opened to reach them.` : "";
      setNotice(`${result.posted} of ${result.total} expenses posted to the ledger.${years}`);
      if (result.failed > 0) {
        setError(`${result.failed} could not be posted. ${result.failures[0] ?? ""}`.trim());
      }
      await load();
      onRepaired?.();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not post those expenses.");
    } finally {
      setBusy(false);
    }
  }

  const outstanding = status?.unposted ?? 0;
  if (outstanding === 0 && !notice && !error) return null;

  return (
    <div className="stack" style={{ marginTop: "var(--s-4)" }}>
      {notice ? (
        <p className="alert alert--ok" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {outstanding > 0 ? (
        <div className="panel">
          <div className="row-between" style={{ gap: "var(--s-3)", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 22rem" }}>
              <p className="label" style={{ margin: 0 }}>
                {outstanding} of {status?.total ?? 0} expenses are not in the books
              </p>
              <p className="muted" style={{ margin: "var(--s-2) 0 0" }}>
                Every amount belongs in the general ledger, so the dashboard and the trial balance tell the
                same story. These are recorded as expenses but never reached it — usually because they are
                dated before the ledger opened.
              </p>
            </div>

            {can("expenses.write") ? (
              <button className="btn btn--sm" type="button" disabled={busy} onClick={() => void post()}>
                {busy ? "Posting…" : "Post to the books"}
              </button>
            ) : (
              <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
                Your role cannot write expenses.
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
