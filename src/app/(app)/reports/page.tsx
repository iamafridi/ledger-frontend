"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, FileText, CheckCircle2 } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import type { ReportDefinitionSummary } from "@/lib/types";

/**
 * The report centre — everything the ledger can print, from one source.
 */
export default function ReportsPage() {
  const [reports, setReports] = useState<ReportDefinitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ reports: ReportDefinitionSummary[] }>("/reports/catalog")
      .then((result) => {
        if (alive) setReports(result.reports);
      })
      .catch((caught: unknown) => {
        if (alive) {
          setError(caught instanceof ApiError ? caught.message : "Could not load the report catalogue.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => {
    const byGroup = new Map<string, ReportDefinitionSummary[]>();
    for (const report of reports) {
      const bucket = byGroup.get(report.group) ?? [];
      bucket.push(report);
      byGroup.set(report.group, bucket);
    }
    return [...byGroup.entries()];
  }, [reports]);

  return (
    <section className="section">
      <div className="row-between" style={{ alignItems: "flex-end", marginBottom: "var(--s-3)" }}>
        <div>
          <p className="eyebrow" style={{ margin: "0 0 4px 0" }}>05 &nbsp; Reports Catalogue</p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Statutory &amp; Financial Reports
          </h1>
        </div>
        <span className="chip chip--ok">
          {reports.length} verified definitions
        </span>
      </div>

      <p className="muted" style={{ margin: "0 0 var(--s-4) 0", maxWidth: "68ch", fontSize: "0.875rem" }}>
        Every report reads the same posted entries through the same immutable registry. Statements first, then registers, followed by underlying sub-ledgers — all exportable directly as compliant CSVs.
      </p>

      {error ? (
        <Alert variant="error" style={{ marginBottom: "var(--s-4)" }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid grid-3" style={{ gap: "var(--s-3)" }}>
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div className="panel skeleton" key={row} style={{ height: "6.5rem", borderRadius: "8px" }} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="empty">
          <p style={{ margin: 0 }}>No reports are registered yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          {groups.map(([group, entries]) => (
            <div key={group}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-2)",
                  marginBottom: "var(--s-2)",
                  paddingBottom: "4px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span
                  className="label"
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#141514",
                    letterSpacing: "0.08em",
                  }}
                >
                  {group}
                </span>
                <span className="faint" style={{ fontSize: "0.7rem" }}>
                  ({entries.length})
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "var(--s-3)",
                }}
              >
                {entries.map((report) => (
                  <Link
                    key={report.code}
                    href={`/reports/${report.code}`}
                    className="panel"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      padding: "var(--s-3) var(--s-4)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "var(--s-2)",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.borderColor = "var(--line-firm)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(20, 21, 20, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "var(--line)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div>
                      <div className="row-between" style={{ alignItems: "flex-start", gap: "8px" }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "#141514" }}>
                          {report.name}
                        </h2>
                        <ArrowUpRight size={14} color="#8A8780" />
                      </div>
                      <p
                        className="muted"
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "0.8rem",
                          lineHeight: 1.45,
                        }}
                      >
                        {report.description}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "6px",
                        borderTop: "1px solid #F4EFE6",
                        marginTop: "4px",
                      }}
                    >
                      <span className="mono faint" style={{ fontSize: "0.7rem" }}>
                        {report.columns.length} columns
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: "0.68rem",
                          color: "#D8543D",
                          fontWeight: 600,
                        }}
                      >
                        VIEW REPORT →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
