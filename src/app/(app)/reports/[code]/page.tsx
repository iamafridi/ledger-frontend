"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Landmark } from "lucide-react";

import { Amount } from "@/components/money";
import { api, apiDownload, ApiError } from "@/lib/api";
import { playShutterTick, playVaultClick } from "@/lib/audio";
import { addMoney } from "@/lib/money";
import type {
  Account,
  Party,
  ReportCell,
  ReportColumn,
  ReportDefinitionSummary,
  ReportRow,
} from "@/lib/types";

/**
 * One report, run on demand.
 *
 * The screen has no knowledge of any particular report beyond how to *ask* for
 * it. Columns and parameters both come from the definition the server sends
 * back — Phase 5 moved the parameter table out of this file and into the
 * registry — so adding a report on the server makes it work here without a
 * line changing.
 *
 * The two honest limitations that remain are about presentation, not
 * knowledge: party pickers are loaded once for the reports that need them, and
 * account pickers likewise. Which kind each parameter is comes from the
 * definition's `kind`.
 */
export default function ReportRunnerPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [definition, setDefinition] = useState<ReportDefinitionSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Catalog data for the two picker kinds. Loaded once; a failure to load
   *  either must not take the screen down — only the pickers degrade. */
  useEffect(() => {
    let alive = true;
    api<{ accounts: Account[] }>("/coa")
      .then((result) => {
        if (alive) setAccounts(result.accounts);
      })
      .catch(() => undefined);
    api<{ parties: Party[] }>("/parties")
      .then((result) => {
        if (alive) setParties(result.parties);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  /** Fetch the definition itself, so the parameter bar renders before the
   *  first run and the runner works for reports it has never seen. */
  useEffect(() => {
    let alive = true;
    setDefinition(null);
    setFilters({});
    setRows([]);
    api<{ reports: ReportDefinitionSummary[] }>(`/reports/catalog`)
      .then((result) => {
        if (!alive) return;
        const found = result.reports.find((entry) => entry.code === code) ?? null;
        setDefinition(found);
      })
      .catch((caught: unknown) => {
        if (alive) {
          setError(caught instanceof ApiError ? caught.message : "Could not load that report.");
        }
      });
    return () => {
      alive = false;
    };
  }, [code]);

  const fields = definition?.params ?? [];

  /** Every required filter has a value, so running the report can succeed. */
  const ready = fields.every((field) => !field.required || (filters[field.key] ?? "").length > 0);

  const run = useCallback(async () => {
    playVaultClick();
    setRunning(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) query.set(key, value);
      }
      const suffix = query.toString();
      const result = await api<{ report: ReportDefinitionSummary; rows: ReportRow[] }>(
        `/reports/${code}${suffix ? `?${suffix}` : ""}`,
      );
      setDefinition(result.report);
      setRows(result.rows);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not run that report.");
      setRows([]);
    } finally {
      setLoading(false);
      setRunning(false);
    }
  }, [code, filters]);

  // Run as soon as the report can produce something: immediately for the ones
  // with no required filter, and the moment the last required filter is filled
  // for the ones that need it.
  //
  // `run` is reached through a ref rather than named in the dependency list.
  // It is rebuilt whenever any filter changes, and depending on it directly
  // would mean an optional "to" date silently re-running the report as it is
  // typed — so the effect keys on the two things that actually decide whether a
  // run can happen at all.
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const ranOnce = useRef(false);
  useEffect(() => {
    if (!definition || ranOnce.current) return;
    if (!ready) {
      setLoading(false);
      return;
    }
    ranOnce.current = true;
    void runRef.current();
  }, [definition, ready]);

  /** CSV export — the same report, the same filters, streamed as a file. */
  const exportCsv = useCallback(async () => {
    playShutterTick();
    setExporting(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) query.set(key, value);
      }
      const suffix = query.toString();
      await apiDownload(
        `/reports/${code}/export${suffix ? `?${suffix}` : ""}`,
        `ledger-${code}-${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not export that report.");
    } finally {
      setExporting(false);
    }
  }, [code, filters]);

  const printBoardroomPack = useCallback(() => {
    playShutterTick();
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  const totals = useMemo(() => {
    const keys = definition?.additive ?? [];
    if (keys.length === 0) return null;

    const summed = new Map<string, string>();
    for (const key of keys) {
      const values: string[] = [];
      for (const row of rows) {
        const value = row[key];
        if (typeof value === "string" && /^-?\d+\.\d{2}$/.test(value)) values.push(value);
      }
      summed.set(key, addMoney(values));
    }

    const debit = summed.get("debit_bdt");
    const credit = summed.get("credit_bdt");
    return {
      summed,
      difference: debit !== undefined && credit !== undefined ? addMoney([debit, `-${credit}`]) : null,
      ties: debit !== undefined && credit !== undefined && debit === credit,
    };
  }, [definition, rows]);

  const pickerFor = (kind: string) =>
    kind === "account" ? accounts : kind === "party" ? parties : null;

  return (
    <>
      <section className="section">
        <div className="row-between">
          <p className="eyebrow" style={{ flex: "1 1 20rem" }}>
            05 &nbsp; {definition?.name ?? "Report"}
          </p>
          <div className="row" style={{ gap: "var(--s-2)" }}>
            {definition && rows.length > 0 ? (
              <button
                className="btn btn--quiet btn--sm"
                type="button"
                onClick={printBoardroomPack}
                style={{ borderColor: "rgba(201, 155, 82, 0.4)", color: "#E0B774" }}
              >
                <span>🖨️ Print Boardroom Pack</span>
              </button>
            ) : null}
            {definition ? (
              <button
                className="btn btn--quiet btn--sm"
                type="button"
                disabled={exporting || running || !ready}
                onClick={() => void exportCsv()}
              >
                {exporting ? "Exporting…" : "Download CSV"}
              </button>
            ) : null}
            <Link className="btn btn--quiet btn--sm" href="/reports">
              All reports
            </Link>
          </div>
        </div>

        {definition ? (
          <p className="muted" style={{ marginTop: "var(--s-3)", maxWidth: "62ch" }}>
            {definition.description}
          </p>
        ) : null}

        {error ? (
          <p className="alert alert--error" role="alert" style={{ marginTop: "var(--s-4)" }}>
            {error}
          </p>
        ) : null}

        <div className="grid grid-3" style={{ marginTop: "var(--s-5)" }}>
          {fields.map((field) => {
            const options = pickerFor(field.kind);
            return (
              <div className="field" key={field.key}>
                <label className="label" htmlFor={`filter-${field.key}`}>
                  {field.label}
                  {field.required ? "" : <span className="faint"> optional</span>}
                </label>
                {field.kind === "choice" ? (
                  <select
                    id={`filter-${field.key}`}
                    value={filters[field.key] ?? field.placeholder ?? ""}
                    onChange={(event) => setFilters({ ...filters, [field.key]: event.target.value })}
                  >
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : options ? (
                  <select
                    id={`filter-${field.key}`}
                    value={filters[field.key] ?? ""}
                    onChange={(event) => setFilters({ ...filters, [field.key]: event.target.value })}
                  >
                    <option value="">{field.placeholder ?? "Choose…"}</option>
                    {options.map((entry) => (
                      <option
                        key={field.kind === "account" ? entry.code : entry.id}
                        value={field.kind === "account" ? entry.code : entry.id}
                      >
                        {field.kind === "account"
                          ? `${entry.code} — ${entry.name}`
                          : `${entry.code} — ${entry.name}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`filter-${field.key}`}
                    type={field.kind === "month" ? "month" : "date"}
                    value={filters[field.key] ?? ""}
                    onChange={(event) => setFilters({ ...filters, [field.key]: event.target.value })}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="row" style={{ marginTop: "var(--s-4)" }}>
          <button className="btn btn--sm" type="button" disabled={running || !ready} onClick={() => void run()}>
            {running ? "Running…" : "Run report"}
          </button>
          {!ready ? (
            <span className="faint" style={{ fontSize: "var(--t-xs)" }}>
              Fill in the required filters to run this report.
            </span>
          ) : null}
        </div>
      </section>

      <section className="section">
        {!definition ? (
          <div className="empty">
            <p style={{ margin: 0 }}>{error ? "That report could not be loaded." : "Loading the report…"}</p>
          </div>
        ) : !ready ? (
          <div className="empty">
            <p style={{ margin: 0 }}>Choose the filters above, and the report runs itself.</p>
          </div>
        ) : loading || running ? (
          <div className="stack">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div className="skeleton" key={row} style={{ height: "2rem" }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <p style={{ margin: 0 }}>This report returned nothing for those filters.</p>
          </div>
        ) : (
          <div className="panel panel--flush" id="print-root" style={{ position: "relative" }}>
            {/* Executive Boardroom Print & Audit Header */}
            <div
              style={{
                padding: "var(--s-4) var(--s-5)",
                borderBottom: "1px solid var(--line-firm)",
                background: "linear-gradient(180deg, rgba(201, 155, 82, 0.06), rgba(0,0,0,0))",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--s-3)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Landmark size={14} color="#C99B52" />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#C99B52",
                      fontWeight: 700,
                    }}
                  >
                    LEDGER PRIVATE OPERATING SYSTEM • BOARDROOM AUDIT DOSSIER
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: "var(--t-lg)", letterSpacing: "-0.02em" }}>
                  {definition.name}
                </h3>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--ink-muted)",
                  textAlign: "right",
                  lineHeight: 1.4,
                }}
              >
                <div>
                  <span style={{ color: "#4ADE80" }}>●</span> VERIFIED IMMUTABLE
                </div>
                <div style={{ color: "var(--ink-faint)", fontSize: "10px" }}>
                  DHAKA (UTC+6) • {new Date().toISOString().slice(0, 10)}
                </div>
              </div>
            </div>

            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">{definition.name}</caption>
                <thead>
                  <tr>
                    {definition.columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={column.type === "money" ? "num" : undefined}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {definition.columns.map((column) => (
                        <td
                          key={column.key}
                          className={column.type === "money" ? "num" : undefined}
                        >
                          <Cell column={column} value={row[column.key] ?? null} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {totals ? (
                  <tfoot>
                    <tr>
                      {definition.columns.map((column, index) => {
                        const total = totals.summed.get(column.key);
                        return (
                          <td key={column.key} className={column.type === "money" ? "num" : undefined}>
                            {total !== undefined ? (
                              <Amount value={total} size="sm" />
                            ) : index === 0 ? (
                              <span className="label">Total</span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>

            <div className="pager">
              <p className="label pager-count">
                {rows.length} {rows.length === 1 ? "row" : "rows"}
              </p>
              {totals?.difference !== null && totals?.difference !== undefined ? (
                totals.ties ? (
                  <span className="chip chip--ok">debits = credits</span>
                ) : (
                  <span className="chip chip--short">
                    out by <Amount value={totals.difference} size="sm" />
                  </span>
                )
              ) : null}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

/**
 * One cell, rendered by the column's declared type.
 *
 * Money is only treated as money when it already looks canonical. A report that
 * sent a description in a money column would otherwise be handed to the paisa
 * renderer and come out as a nonsense figure — better to fall back to plain
 * monospace than to print something wrong.
 */
function Cell({ column, value }: { column: ReportColumn; value: ReportCell }) {
  if (value === null || value === undefined || value === "") {
    return <span className="faint">—</span>;
  }

  const text = String(value);

  if (column.type === "money") {
    return /^-?\d+\.\d{2}$/.test(text) ? (
      <Amount value={text} size="sm" />
    ) : (
      <span className="mono">{text}</span>
    );
  }

  if (column.type === "code" || column.type === "date") {
    return <span className="mono nowrap">{text}</span>;
  }

  return <>{text}</>;
}
