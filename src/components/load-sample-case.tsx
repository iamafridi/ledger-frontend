"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api";

/**
 * Loads one of the twenty-five bundled sample cases into the signed-in
 * account.
 *
 * An empty ledger demonstrates none of the four required items, so this exists
 * to put real, checkable data in front of anyone opening the application for the
 * first time. The figures that follow are the engine's output over data whose
 * expected results are published, so the dashboard can be checked against the
 * dataset by hand rather than taken on trust.
 */
export function LoadSampleCase({ onLoaded }: { onLoaded: (month: string) => void }) {
  const [caseId, setCaseId] = useState("PUB-01");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cases = Array.from(
    { length: 25 },
    (_, index) => `PUB-${String(index + 1).padStart(2, "0")}`,
  );

  const [enterpriseBusy, setEnterpriseBusy] = useState(false);
  const [enterpriseSuccess, setEnterpriseSuccess] = useState<string | null>(null);

  async function loadEnterprise() {
    setError(null);
    setEnterpriseSuccess(null);
    setEnterpriseBusy(true);
    try {
      const res = await api<{
        seeded: {
          period: string;
          parties: number;
          items: number;
          bills: number;
          invoices: number;
          assets: number;
          staff: number;
          loans: number;
          runs: number;
        };
      }>("/demo/enterprise", {
        method: "POST",
      });
      setEnterpriseSuccess(
        `Seeded Enterprise Suite: ${res.seeded.parties} parties, ${res.seeded.items} items, ${res.seeded.invoices} invoices, ${res.seeded.bills} bills, ${res.seeded.assets} assets, ${res.seeded.staff} staff, ${res.seeded.loans} loans, ${res.seeded.runs} payroll runs!`,
      );
      onLoaded(res.seeded.period);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not seed enterprise suite.");
    } finally {
      setEnterpriseBusy(false);
    }
  }

  return (
    <div className="stack" style={{ alignItems: "center", gap: "var(--s-3)" }}>
      <p className="label">Load Sample Cases or Complete Enterprise Suite</p>

      {error ? (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {enterpriseSuccess ? (
        <p className="alert alert--success" role="status" style={{ color: "var(--brand-ink, #0e5a3c)" }}>
          {enterpriseSuccess}
        </p>
      ) : null}

      <div className="row" style={{ justifyContent: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
        <label className="sr-only" htmlFor="sample-case">
          Which published case to load
        </label>
        <select
          id="sample-case"
          value={caseId}
          onChange={(event) => setCaseId(event.target.value)}
          style={{
            minHeight: "44px",
            padding: "0 var(--s-3)",
            background: "var(--paper)",
            border: "1px solid var(--rule-firm)",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {cases.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn"
          disabled={busy || enterpriseBusy}
          onClick={async () => {
            setError(null);
            setEnterpriseSuccess(null);
            setBusy(true);
            try {
              const { seeded } = await api<{ seeded: { month: string } }>("/demo/seed", {
                method: "POST",
                body: { case_id: caseId },
              });
              onLoaded(seeded.month);
            } catch (caught) {
              setError(caught instanceof ApiError ? caught.message : "Could not load that case.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Loading…" : "Load Case"}
        </button>

        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || enterpriseBusy}
          onClick={loadEnterprise}
          style={{
            background: "var(--ink-primary)",
            color: "var(--paper-pure, #fff)",
            fontWeight: 600,
          }}
        >
          {enterpriseBusy ? "Seeding Enterprise…" : "Load Enterprise Suite"}
        </button>
      </div>

      <p className="note" style={{ fontSize: "var(--t-xs)", textAlign: "center", maxWidth: "600px" }}>
        &ldquo;Load Case&rdquo; seeds personal salary/expenses/pockets (PUB-01 to 25). &ldquo;Load Enterprise Suite&rdquo; seeds customers, vendors, catalog items, sales invoices, procurement bills, payments, receipts, fixed assets, and staff payroll runs into the current period.
      </p>
    </div>
  );
}
