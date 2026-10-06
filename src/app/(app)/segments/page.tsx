"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  Building,
  Briefcase,
  FolderGit2,
  PieChart,
  CheckCircle2,
  XCircle,
  Edit2,
  Archive,
  ArrowUpRight,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/components/session-provider";
import { toast } from "@/components/toast-provider";
import { Modal } from "@/components/ui/modal";
import {
  SEGMENT_TYPES,
  SEGMENT_TYPE_LABEL,
  type Segment,
  type SegmentType,
} from "@/lib/types";

interface DraftSegment {
  code: string;
  name: string;
  type: SegmentType;
  description: string;
}

const emptyDraft = (): DraftSegment => ({
  code: "",
  name: "",
  type: "BRANCH",
  description: "",
});

export default function SegmentsPage() {
  const { can } = useSession();
  const canWrite = can("segments.write") || can("masterdata.write");

  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | SegmentType>("ALL");
  const [showInactive, setShowInactive] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [draft, setDraft] = useState<DraftSegment>(emptyDraft());
  const [submitting, setSubmitting] = useState(false);

  const loadSegments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeParam = showInactive ? "" : "?active=true";
      const result = await api<{ segments: Segment[] }>(`/segments${activeParam}`);
      setSegments(result.segments || []);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Failed to load cost segments.");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  const openCreateModal = () => {
    setEditingSegment(null);
    setDraft(emptyDraft());
    setModalOpen(true);
  };

  const openEditModal = (seg: Segment) => {
    setEditingSegment(seg);
    setDraft({
      code: seg.code,
      name: seg.name,
      type: seg.type,
      description: seg.description || "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error("Segment name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingSegment) {
        // Update existing segment
        await api<{ segment: Segment }>(`/segments/${editingSegment.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: draft.name.trim(),
            type: draft.type,
            description: draft.description.trim(),
          }),
        });
        toast.success(`Segment ${editingSegment.code} successfully updated.`);
      } else {
        // Create new segment
        if (!draft.code.trim()) {
          toast.error("Segment unique code is required");
          setSubmitting(false);
          return;
        }
        await api<{ segment: Segment }>("/segments", {
          method: "POST",
          body: JSON.stringify({
            code: draft.code.trim().toUpperCase(),
            name: draft.name.trim(),
            type: draft.type,
            description: draft.description.trim(),
          }),
        });
        toast.success(`Segment ${draft.code.toUpperCase()} registered.`);
      }
      setModalOpen(false);
      void loadSegments();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Failed to commit segment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (seg: Segment) => {
    const nextState = !seg.is_active;
    const actionLabel = nextState ? "reactivate" : "retire";
    if (!confirm(`Are you sure you want to ${actionLabel} ${seg.code} (${seg.name})?`)) {
      return;
    }

    try {
      await api<{ segment: Segment }>(`/segments/${seg.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextState }),
      });
      toast.success(`Segment ${seg.code} is now ${nextState ? "active" : "retired"}.`);
      void loadSegments();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Failed to change segment state.");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return segments.filter((s) => {
      if (typeFilter !== "ALL" && s.type !== typeFilter) return false;
      if (!showInactive && !s.is_active) return false;
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    });
  }, [segments, typeFilter, showInactive, search]);

  const metrics = useMemo(() => {
    return {
      total: segments.length,
      branches: segments.filter((s) => s.type === "BRANCH" && s.is_active).length,
      depts: segments.filter((s) => s.type === "DEPARTMENT" && s.is_active).length,
      projects: segments.filter((s) => s.type === "PROJECT" && s.is_active).length,
      costCenters: segments.filter((s) => s.type === "COST_CENTER" && s.is_active).length,
    };
  }, [segments]);

  const getIconForType = (type: SegmentType) => {
    switch (type) {
      case "BRANCH":
        return <Building size={14} color="#D8543D" />;
      case "DEPARTMENT":
        return <Briefcase size={14} color="#141514" />;
      case "PROJECT":
        return <FolderGit2 size={14} color="#D8543D" />;
      case "COST_CENTER":
        return <PieChart size={14} color="#141514" />;
    }
  };

  return (
    <>
      <section className="section">
        <div className="row-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "var(--s-3)" }}>
          <div>
            <p className="eyebrow">Multi-Dimensional Governance · Master Data</p>
            <h1 style={{ fontSize: "var(--t-xl)", margin: "4px 0 0 0" }}>Cost Centers & Analytical Segments</h1>
            <p className="muted" style={{ margin: "4px 0 0 0", maxWidth: "62ch", fontSize: "var(--t-sm)" }}>
              Tag branches, departments, client projects, and cost centers across journals and invoices for granular P&L reporting without cluttering your general ledger accounts.
            </p>
          </div>

          <div className="row" style={{ gap: "var(--s-2)", alignItems: "center" }}>
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              onClick={() => {
                void loadSegments();
                toast.info("Refreshed analytical segments");
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-1)" }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
            {canWrite && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={openCreateModal}
                style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-1)" }}
              >
                <Plus size={14} />
                <span>New Segment</span>
              </button>
            )}
          </div>
        </div>

        {/* Analytical Dimension Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--s-3)",
            marginTop: "var(--s-4)",
          }}
        >
          <div className="card" style={{ padding: "var(--s-3)", borderLeft: "3px solid var(--accent)" }}>
            <span className="muted" style={{ fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Branches
            </span>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: "4px" }}>
              {metrics.branches}
            </div>
          </div>
          <div className="card" style={{ padding: "var(--s-3)", borderLeft: "3px solid var(--ink)" }}>
            <span className="muted" style={{ fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Departments
            </span>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: "4px" }}>
              {metrics.depts}
            </div>
          </div>
          <div className="card" style={{ padding: "var(--s-3)", borderLeft: "3px solid var(--accent)" }}>
            <span className="muted" style={{ fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Client Projects
            </span>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: "4px" }}>
              {metrics.projects}
            </div>
          </div>
          <div className="card" style={{ padding: "var(--s-3)", borderLeft: "3px solid var(--ink)" }}>
            <span className="muted" style={{ fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Cost Centers
            </span>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, marginTop: "4px" }}>
              {metrics.costCenters}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div
          className="row-between"
          style={{
            marginTop: "var(--s-4)",
            alignItems: "center",
            gap: "var(--s-3)",
            flexWrap: "wrap",
            padding: "var(--s-2) var(--s-3)",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flex: 1, minWidth: "16rem" }}>
            <Search size={14} className="muted" />
            <input
              type="text"
              placeholder="Search code, dimension name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "var(--t-sm)",
                width: "100%",
                padding: "4px 0",
              }}
            />
          </div>

          <div className="row" style={{ gap: "var(--s-3)", alignItems: "center", flexWrap: "wrap" }}>
            <div className="row" style={{ gap: "6px", alignItems: "center" }}>
              <span className="muted" style={{ fontSize: "var(--t-xs)", textTransform: "uppercase" }}>Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "ALL" | SegmentType)}
                style={{ padding: "0.3rem 0.6rem", fontSize: "var(--t-sm)" }}
              >
                <option value="ALL">All Classifications</option>
                {SEGMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SEGMENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>

            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--t-sm)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              <span className="muted">Include Retired</span>
            </label>
          </div>
        </div>

        {/* Segments Ledger Table */}
        <div style={{ marginTop: "var(--s-3)", overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--s-6)", textAlign: "center" }}>
              <span className="muted">Querying analytical segments...</span>
            </div>
          ) : error ? (
            <div style={{ padding: "var(--s-4)", color: "var(--accent)" }}>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: "var(--s-6)", textAlign: "center" }}>
              <Layers size={32} style={{ color: "var(--muted)", margin: "0 auto var(--s-2) auto", display: "block" }} />
              <h3 style={{ margin: "0 0 6px 0", fontSize: "var(--t-base)" }}>No Analytical Segments Found</h3>
              <p className="muted" style={{ margin: 0, fontSize: "var(--t-sm)", maxWidth: "45ch", marginInline: "auto" }}>
                {search || typeFilter !== "ALL"
                  ? "No segments matched your current filter criteria."
                  : "Organize transactions by setting up branches, cost centers, or client projects."}
              </p>
              {canWrite && !search && typeFilter === "ALL" && (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={openCreateModal}
                  style={{ marginTop: "var(--s-3)" }}
                >
                  Create First Segment
                </button>
              )}
            </div>
          ) : (
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
                  <th style={{ padding: "var(--s-2) var(--s-3)", fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Segment Code
                  </th>
                  <th style={{ padding: "var(--s-2) var(--s-3)", fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Name & Purpose
                  </th>
                  <th style={{ padding: "var(--s-2) var(--s-3)", fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Classification
                  </th>
                  <th style={{ padding: "var(--s-2) var(--s-3)", fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Status
                  </th>
                  <th style={{ padding: "var(--s-2) var(--s-3)", fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Created
                  </th>
                  {canWrite && (
                    <th style={{ padding: "var(--s-2) var(--s-3)", fontSize: "var(--t-xs)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((seg) => (
                  <tr
                    key={seg.id}
                    style={{
                      borderBottom: "1px solid var(--line)",
                      opacity: seg.is_active ? 1 : 0.6,
                    }}
                  >
                    <td style={{ padding: "var(--s-2) var(--s-3)", verticalAlign: "middle" }}>
                      <span className="mono" style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--ink)" }}>
                        {seg.code}
                      </span>
                    </td>
                    <td style={{ padding: "var(--s-2) var(--s-3)", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 600 }}>{seg.name}</div>
                      {seg.description && (
                        <div className="muted" style={{ fontSize: "0.8rem", marginTop: "2px" }}>
                          {seg.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "var(--s-2) var(--s-3)", verticalAlign: "middle" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                        }}
                      >
                        {getIconForType(seg.type)}
                        <span>{SEGMENT_TYPE_LABEL[seg.type]}</span>
                      </span>
                    </td>
                    <td style={{ padding: "var(--s-2) var(--s-3)", verticalAlign: "middle" }}>
                      {seg.is_active ? (
                        <span className="chip chip--ok" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          Active
                        </span>
                      ) : (
                        <span className="chip" style={{ fontSize: "0.7rem", padding: "2px 8px", background: "var(--surface)", border: "1px solid var(--line)" }}>
                          Retired
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "var(--s-2) var(--s-3)", verticalAlign: "middle", fontSize: "0.8rem" }}>
                      <span className="mono muted">
                        {seg.created_at ? new Date(seg.created_at).toLocaleDateString("en-GB") : "—"}
                      </span>
                    </td>
                    {canWrite && (
                      <td style={{ padding: "var(--s-2) var(--s-3)", verticalAlign: "middle", textAlign: "right" }}>
                        <div className="row" style={{ gap: "4px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => openEditModal(seg)}
                            title="Edit Segment"
                            style={{ padding: "4px 8px" }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn--quiet btn--sm"
                            onClick={() => handleToggleActive(seg)}
                            title={seg.is_active ? "Retire Segment" : "Reactivate Segment"}
                            style={{ padding: "4px 8px" }}
                          >
                            <Archive size={13} color={seg.is_active ? "var(--muted)" : "var(--accent)"} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Segment Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        title={editingSegment ? `Edit Segment: ${editingSegment.code}` : "Register New Analytical Dimension"}
        onClose={() => setModalOpen(false)}
      >
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
            {!editingSegment ? (
              <div className="field">
                <label className="label" htmlFor="segment-code">
                  Dimension Code <span style={{ color: "var(--accent)" }}>*</span>
                </label>
                <input
                  id="segment-code"
                  type="text"
                  required
                  placeholder="e.g. DHK-HQ, ENG-DEV, PRJ-2026"
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                  maxLength={32}
                  style={{ textTransform: "uppercase" }}
                  className="mono"
                />
                <p className="muted" style={{ fontSize: "var(--t-xs)", margin: "4px 0 0 0" }}>
                  Unique alphanumeric identifier. Once issued, code handle is permanent across accounting documents.
                </p>
              </div>
            ) : (
              <div className="field">
                <label className="label">Immutable Code</label>
                <div className="mono" style={{ padding: "0.5rem 0.75rem", background: "var(--surface)", border: "1px solid var(--line)" }}>
                  {editingSegment.code}
                </div>
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="segment-name">
                Dimension Name <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <input
                id="segment-name"
                type="text"
                required
                placeholder="e.g. Dhaka Central Headquarters"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                maxLength={120}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="segment-type">
                Classification Type <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <select
                id="segment-type"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as SegmentType })}
              >
                {SEGMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SEGMENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="segment-desc">
                Description & Statutory Scope (Optional)
              </label>
              <textarea
                id="segment-desc"
                rows={3}
                placeholder="Operational purpose, cost center assignment, or client contract handle..."
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                maxLength={300}
              />
            </div>

            <div className="row-between" style={{ marginTop: "var(--s-3)", borderTop: "1px solid var(--line)", paddingTop: "var(--s-3)" }}>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={submitting}
              >
                {submitting ? "Committing..." : editingSegment ? "Save Changes" : "Create Dimension"}
              </button>
            </div>
          </form>
        </Modal>
    </>
  );
}
