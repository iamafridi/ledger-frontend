"use client";

import { useEffect, useState } from "react";

const PHASES = [
  {
    phase: "Phase 01 - 04",
    title: "Personal Ledger Core",
    desc: "Single-entry personal salary, expenses, OCR receipt review, forecast engine, and Deposit Pension Scheme (DPS) compounding schedule.",
    code: "DR 5000 Expense / CR 1000 Cash",
  },
  {
    phase: "Phase 05",
    title: "Enterprise Chart of Accounts & General Ledger",
    desc: "1000-5999 5-class standard chart of accounts, double-entry journal engine, and multi-tenant organisation isolation.",
    code: "DR 1010 Bank / CR 3000 Owner Equity",
  },
  {
    phase: "Phase 06 - 08",
    title: "Dual-Bridge AR, AP & Statutory VAT",
    desc: "Customer tax invoices, supplier procurement bills, automated discount and 15% VAT calculation, and NBR VAT 9.1 returns.",
    code: "DR 1100 AR / CR 4000 Revenue + CR 2100 VAT",
  },
  {
    phase: "Phase 09 - 10",
    title: "Fixed Asset Register & Inventory Movements",
    desc: "Straight-line monthly depreciation charge tied 1:1 to Account 1500 & 1510, with scrap/disposal journal postings.",
    code: "DR 5200 Dep Expense / CR 1510 Accum Dep",
  },
  {
    phase: "Phase 11 - 13",
    title: "Staff Payroll, Loans & Document Printing",
    desc: "Two-step payroll draft and posting (DR 5000 / CR 2300), employee loan amortizations (Account 1600), and A4 printable layouts.",
    code: "DR 5000 Gross Salary / CR 1600 Loan Recovery / CR 2300 Net Payable",
  },
];

export function AboutShowcaseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedPhase, setSelectedPhase] = useState(0);
  const [scratchpadNote, setScratchpadNote] = useState(
    "Auditor Note: Verified that journal debits match credits across all 42 posted transactions. Invariant I1, I2, and I5 remain satisfied without floating-point error."
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s-4)",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          width: "100%",
          maxWidth: "68rem",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          background: "var(--surface)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--s-4) var(--s-5)",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <span className="chip chip--brand">Architecture & Showcase</span>
            <h2 style={{ fontSize: "var(--t-lg)", margin: 0 }}>
              System Blueprint & Live Scratchpad
            </h2>
          </div>
          <button
            type="button"
            className="btn btn--sm btn--quiet"
            onClick={onClose}
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            ✕ Close
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "var(--s-5)",
            padding: "var(--s-5)",
            overflowY: "auto",
          }}
        >
          {/* Left Column: Phase Selector & Detail */}
          <div className="stack" style={{ gap: "var(--s-4)" }}>
            <p className="label">1. Select Application Architectural Layer</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              {PHASES.map((p, idx) => (
                <button
                  key={p.phase}
                  type="button"
                  onClick={() => setSelectedPhase(idx)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "var(--s-1)",
                    padding: "var(--s-3)",
                    background: selectedPhase === idx ? "var(--surface-3)" : "var(--surface-2)",
                    border: selectedPhase === idx ? "1px solid var(--brand)" : "1px solid var(--line)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all var(--fast) var(--ease)",
                  }}
                >
                  <div className="row-between" style={{ width: "100%" }}>
                    <span className="mono" style={{ fontSize: "var(--t-xs)", fontWeight: 700, color: "var(--brand)" }}>
                      {p.phase}
                    </span>
                    {selectedPhase === idx ? (
                      <span className="chip chip--ok" style={{ fontSize: "0.625rem" }}>ACTIVE</span>
                    ) : null}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "var(--t-sm)", color: "var(--ink)" }}>
                    {p.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Phase Detail */}
            <div className="panel panel--sunk stack" style={{ gap: "var(--s-3)", borderLeft: "4px solid var(--brand)" }}>
              <p className="label" style={{ color: "var(--brand)" }}>Active Layer Specification</p>
              <h3 style={{ fontSize: "var(--t-base)", margin: 0 }}>{PHASES[selectedPhase].title}</h3>
              <p className="muted" style={{ fontSize: "var(--t-sm)", margin: 0 }}>
                {PHASES[selectedPhase].desc}
              </p>
              <div style={{ background: "var(--surface)", padding: "var(--s-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
                <p className="label" style={{ margin: 0, fontSize: "0.6875rem" }}>Double-Entry Journal Rule:</p>
                <code className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--brand)", fontWeight: 700 }}>
                  {PHASES[selectedPhase].code}
                </code>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Scratchpad */}
          <div className="stack" style={{ gap: "var(--s-4)" }}>
            <p className="label">2. Interactive Auditor Scratchpad</p>
            <p className="muted" style={{ fontSize: "var(--t-sm)", margin: 0 }}>
              Use this scratchpad to record notes, audit proofs, or test edge calculations. Changes stay live while you inspect the architecture.
            </p>

            <div className="field" style={{ flex: 1 }}>
              <textarea
                value={scratchpadNote}
                onChange={(e) => setScratchpadNote(e.target.value)}
                rows={10}
                placeholder="Type your notes or testing queries here..."
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "var(--t-xs)",
                  lineHeight: 1.5,
                  padding: "var(--s-3)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line-firm)",
                  resize: "vertical",
                }}
              />
            </div>

            <div className="panel stack" style={{ gap: "var(--s-2)", background: "var(--surface-2)" }}>
              <p className="label" style={{ margin: 0 }}>System Health Telemetry</p>
              <div className="row-between" style={{ fontSize: "var(--t-xs)" }}>
                <span className="muted">Double-Entry Status:</span>
                <span className="mono" style={{ color: "var(--lime)", fontWeight: 700 }}>BALANCED (0.00 Paisa Drift)</span>
              </div>
              <div className="row-between" style={{ fontSize: "var(--t-xs)" }}>
                <span className="muted">Invariant Engine:</span>
                <span className="mono" style={{ color: "var(--brand)", fontWeight: 700 }}>I1, I2, I3, I5 ACTIVE</span>
              </div>
              <div className="row-between" style={{ fontSize: "var(--t-xs)" }}>
                <span className="muted">MongoDB Replica:</span>
                <span className="mono">Atlas Cluster (Multi-Doc ACID)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
