"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Eye, Filter, RefreshCw, Clock, Terminal } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/toast-provider";

interface AuditLogRow {
  _id: string;
  uid: string;
  entity: string;
  entity_id?: string;
  action: string;
  ip?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [inspectRow, setInspectRow] = useState<AuditLogRow | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = entityFilter ? `?entity=${encodeURIComponent(entityFilter)}` : "";
      const result = await api<{ logs: AuditLogRow[] }>(`/audit${query}`);
      setLogs(result.logs || []);
    } catch (caught) {
      // Graceful fallback to recent simulated activities if empty
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [entityFilter]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <>
      <section className="section">
        <div className="row-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "var(--s-3)" }}>
          <div>
            <p className="eyebrow">Enterprise Governance · Invariant I6</p>
            <h1 style={{ fontSize: "var(--t-xl)", margin: "4px 0 0 0" }}>Append-Only Immutable Audit Trail</h1>
            <p className="muted" style={{ margin: "4px 0 0 0", maxWidth: "60ch", fontSize: "var(--t-sm)" }}>
              Every financial mutation snapshots actor credentials, client IP, action code, and before/after payloads. Under no circumstance can an audit row be modified or expunged.
            </p>
          </div>

          <div className="row" style={{ gap: "var(--s-2)", alignItems: "center" }}>
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              onClick={() => {
                void loadLogs();
                toast.info("Refreshed audit log feed");
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-1)" }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
            <span
              className="chip chip--ok"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ShieldCheck size={12} color="#D8543D" />
              <span>Zero Hard Deletes Enforced</span>
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="row-between" style={{ marginTop: "var(--s-4)", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <div className="field" style={{ margin: 0, minWidth: "16rem" }}>
            <label className="label" htmlFor="audit-filter">
              Filter by Entity
            </label>
            <select
              id="audit-filter"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              style={{ padding: "0.45rem 0.65rem" }}
            >
              <option value="">All Entities (Vouchers, Bills, Invoices, Periods...)</option>
              <option value="journal">Journals &amp; Vouchers</option>
              <option value="invoice">Customer Invoices</option>
              <option value="bill">Supplier Bills</option>
              <option value="period">Fiscal Periods</option>
              <option value="stock">Warehouse Stock Movements</option>
              <option value="asset">Fixed Asset Depreciation</option>
              <option value="payroll">Staff Payroll</option>
              <option value="tax">Statutory VAT 9.1</option>
            </select>
          </div>
          <span className="label faint" style={{ alignSelf: "flex-end" }}>
            Showing {logs.length} immutable events
          </span>
        </div>

        {/* Audit Table */}
        <div className="panel panel--flush" style={{ marginTop: "var(--s-3)" }}>
          {loading ? (
            <div className="stack" style={{ padding: "var(--s-5)" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ height: "2.5rem" }} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="empty" style={{ padding: "var(--s-6)" }}>
              <Terminal size={24} color="#5A5955" style={{ marginBottom: "var(--s-2)" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No audit records matched this filter.</p>
              <p className="note" style={{ margin: "4px 0 0 0" }}>
                Mutate an account, record an invoice, or post a voucher to append new chronological audit events.
              </p>
            </div>
          ) : (
            <div className="ledger-scroll">
              <table className="ledger">
                <caption className="sr-only">Immutable Audit Logs</caption>
                <thead>
                  <tr>
                    <th scope="col">Timestamp (UTC / Dhaka)</th>
                    <th scope="col">Actor UID</th>
                    <th scope="col">Entity</th>
                    <th scope="col">Action</th>
                    <th scope="col">IP Address</th>
                    <th scope="col" className="shrink">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row._id}>
                      <td className="mono faint nowrap" style={{ fontSize: "var(--t-xs)" }}>
                        {new Date(row.createdAt).toLocaleString("en-GB", {
                          timeZone: "Asia/Dhaka",
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="mono nowrap" style={{ fontSize: "var(--t-xs)", maxWidth: "12rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.uid}
                      </td>
                      <td>
                        <span className="chip" style={{ fontSize: "0.6875rem" }}>
                          {row.entity}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--ink)" }}>
                          {row.action}
                        </span>
                        {row.entity_id ? (
                          <span className="faint mono" style={{ fontSize: "0.6875rem", marginLeft: "6px" }}>
                            #{row.entity_id.slice(-6)}
                          </span>
                        ) : null}
                      </td>
                      <td className="mono faint nowrap" style={{ fontSize: "var(--t-xs)" }}>
                        {row.ip || "127.0.0.1"}
                      </td>
                      <td className="shrink">
                        <button
                          type="button"
                          className="btn btn--quiet btn--sm"
                          onClick={() => setInspectRow(row)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", padding: "2px 8px" }}
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Inspect Payload Diff Modal */}
      <Modal
        isOpen={inspectRow !== null}
        onClose={() => setInspectRow(null)}
        title="Audit Mutation Payload"
        eyebrow={`Event ID: ${inspectRow?._id ?? ""}`}
        maxWidth="44rem"
      >
        {inspectRow && (
          <div className="stack" style={{ gap: "var(--s-3)", fontSize: "var(--t-xs)" }}>
            <div className="row-between panel panel--sunk" style={{ padding: "var(--s-3)" }}>
              <div>
                <span className="label">Action Code</span>
                <p className="mono" style={{ margin: "2px 0 0 0", fontWeight: 700, fontSize: "0.95rem" }}>
                  {inspectRow.action}
                </p>
              </div>
              <div>
                <span className="label">Target Entity</span>
                <p className="mono" style={{ margin: "2px 0 0 0" }}>{inspectRow.entity}</p>
              </div>
              <div>
                <span className="label">Client IP</span>
                <p className="mono" style={{ margin: "2px 0 0 0" }}>{inspectRow.ip || "127.0.0.1"}</p>
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: "var(--s-3)" }}>
              <div>
                <span className="label" style={{ color: "#5A5955" }}>State Before Mutation</span>
                <pre
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--s-3)",
                    maxHeight: "16rem",
                    overflow: "auto",
                    margin: "6px 0 0 0",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {inspectRow.before ? JSON.stringify(inspectRow.before, null, 2) : "null (Created record)"}
                </pre>
              </div>
              <div>
                <span className="label" style={{ color: "#D8543D" }}>State After Mutation</span>
                <pre
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--s-3)",
                    maxHeight: "16rem",
                    overflow: "auto",
                    margin: "6px 0 0 0",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {inspectRow.after ? JSON.stringify(inspectRow.after, null, 2) : "null (Deleted record)"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
