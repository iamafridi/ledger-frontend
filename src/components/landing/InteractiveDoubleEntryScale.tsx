"use client";

import React, { useState } from "react";
import { Scale, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { playAcousticTick, playVaultClick } from "@/lib/audio";

interface SandboxTransaction {
  id: string;
  title: string;
  desc: string;
  category: string;
  amount: number;
  debits: { account: string; code: string; amount: number }[];
  credits: { account: string; code: string; amount: number }[];
}

const SAMPLE_TXS: SandboxTransaction[] = [
  {
    id: "rmg-export",
    title: "Chittagong Port RMG Export",
    desc: "10,000 Pcs Knitwear dispatched under Letter of Credit (LC) to Hamburg",
    category: "Corporate Export Sales",
    amount: 3250000,
    debits: [
      { code: "1100", account: "Trade Receivables (Export LC)", amount: 3250000 },
    ],
    credits: [
      { code: "4000", account: "Export Sales Revenue", amount: 3250000 },
    ],
  },
  {
    id: "raw-cotton",
    title: "Raw Cotton Import Consignment",
    desc: "25 Metric Tons raw cotton cleared from customs with 15% VAT Challan",
    category: "Inventory & VAT Inward",
    amount: 1840000,
    debits: [
      { code: "1200", account: "Raw Materials Stock (Warehouse 1)", amount: 1600000 },
      { code: "1150", account: "Statutory Input VAT (Mushak 6.3)", amount: 240000 },
    ],
    credits: [
      { code: "2000", account: "Accounts Payable (Direct Import)", amount: 1840000 },
    ],
  },
  {
    id: "payroll-disburse",
    title: "Dhaka Central Hub Monthly Payroll",
    desc: "Staff salaries disbursed with statutory tax withholding (TDS)",
    category: "Human Resources",
    amount: 950000,
    debits: [
      { code: "5000", account: "Salaries & Wages Expense", amount: 950000 },
    ],
    credits: [
      { code: "1010", account: "BRAC Bank Operating Account", amount: 875000 },
      { code: "2120", account: "Tax Withheld at Source (TDS NBR)", amount: 75000 },
    ],
  },
  {
    id: "depreciation-entry",
    title: "Fixed Asset Depreciation Posting",
    desc: "Monthly straight-line amortization of delivery fleet & machinery",
    category: "Month-End Accruals",
    amount: 120000,
    debits: [
      { code: "5400", account: "Depreciation Expense (Vehicles & Heavy Equipment)", amount: 120000 },
    ],
    credits: [
      { code: "1650", account: "Accumulated Depreciation (Contra-Asset)", amount: 120000 },
    ],
  },
];

export function InteractiveDoubleEntryScale() {
  const [activeTxId, setActiveTxId] = useState<string>("rmg-export");

  const tx = SAMPLE_TXS.find((t) => t.id === activeTxId) || SAMPLE_TXS[0];

  const totalDebits = tx.debits.reduce((sum, d) => sum + d.amount, 0);
  const totalCredits = tx.credits.reduce((sum, c) => sum + c.amount, 0);
  const isBalanced = totalDebits === totalCredits;

  const handleSelect = (id: string) => {
    playAcousticTick(2400, 0.02);
    setActiveTxId(id);
    playVaultClick();
  };

  return (
    <div
      style={{
        backgroundColor: "#0C0D0C",
        borderRadius: "20px",
        border: "1px solid rgba(201, 155, 82, 0.3)",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Gold Header */}
      <div
        style={{
          padding: "0.85rem 1.25rem",
          backgroundColor: "#141614",
          borderBottom: "1px solid #232623",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ADE80", boxShadow: "0 0 10px #4ADE80" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: "#FFFDF7", letterSpacing: "0.06em" }}>
            MATHEMATICAL DOUBLE-ENTRY SANDBOX
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#4ADE80", fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>
          <CheckCircle2 size={13} />
          <span>ZERO-FLOAT PAISA ARITHMETIC</span>
        </div>
      </div>

      {/* Transaction Selector Chips */}
      <div
        style={{
          padding: "1rem 1.25rem",
          backgroundColor: "#111311",
          borderBottom: "1px solid #232623",
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
        }}
      >
        {SAMPLE_TXS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t.id)}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: activeTxId === t.id ? "1px solid #C99B52" : "1px solid #282a28",
              backgroundColor: activeTxId === t.id ? "rgba(201, 155, 82, 0.18)" : "#181a18",
              color: activeTxId === t.id ? "#E5C287" : "#827F76",
              fontSize: "0.76rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Main Body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          padding: "1.5rem",
        }}
      >
        {/* Left: Transaction Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.68rem", color: "#C99B52", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {tx.category}
            </span>
            <h4 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFDF7", margin: "0.2rem 0 0.4rem 0" }}>
              {tx.title}
            </h4>
            <p style={{ fontSize: "0.84rem", color: "#ACA4BD", margin: 0, lineHeight: 1.5 }}>
              {tx.desc}
            </p>
          </div>

          {/* Value Badge */}
          <div
            style={{
              backgroundColor: "#171917",
              borderRadius: "10px",
              padding: "0.9rem 1.1rem",
              border: "1px solid #282a28",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#827F76", fontFamily: "var(--font-mono)" }}>
              TRANSACTION VALUE
            </span>
            <strong style={{ fontSize: "1.25rem", fontFamily: "var(--font-mono)", color: "#C99B52" }}>
              ৳ {tx.amount.toLocaleString()}.00
            </strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.74rem", color: "#8FA892", fontFamily: "var(--font-mono)" }}>
            <ShieldCheck size={14} />
            <span>Immutable Append-Only Audit Trail Registered</span>
          </div>
        </div>

        {/* Right: Balanced T-Account Visualizer */}
        <div
          style={{
            backgroundColor: "#141514",
            borderRadius: "12px",
            border: "1px solid #282a28",
            padding: "1.25rem",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {/* Scale Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #232623", paddingBottom: "0.65rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#4ADE80", fontSize: "0.76rem", fontWeight: 700 }}>
              <Scale size={14} />
              <span>BALANCED T-ACCOUNT LEDGER</span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "#827F76" }}>DIFF: ৳ 0.00</span>
          </div>

          {/* Two-Column T-Account Box */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", borderBottom: "1px solid #232623", paddingBottom: "1rem" }}>
            {/* Debit Side */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#4ADE80", fontWeight: 700, borderBottom: "1px dashed #2a2d2a", paddingBottom: "0.3rem" }}>
                DEBIT (DR)
              </span>
              {tx.debits.map((d, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "0.72rem", color: "#E5E2DC" }}>
                    {d.code} {d.account}
                  </span>
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#4ADE80" }}>
                    ৳ {d.amount.toLocaleString()}.00
                  </span>
                </div>
              ))}
            </div>

            {/* Credit Side */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderLeft: "1px solid #282a28", paddingLeft: "1rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#D8543D", fontWeight: 700, borderBottom: "1px dashed #2a2d2a", paddingBottom: "0.3rem" }}>
                CREDIT (CR)
              </span>
              {tx.credits.map((c, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "0.72rem", color: "#E5E2DC" }}>
                    {c.code} {c.account}
                  </span>
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#D8543D" }}>
                    ৳ {c.amount.toLocaleString()}.00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Match Proof */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", fontSize: "0.78rem" }}>
            <span style={{ color: "#827F76" }}>∑ DR ৳ {totalDebits.toLocaleString()}</span>
            <span style={{ color: "#C99B52", fontWeight: 700 }}>≡</span>
            <span style={{ color: "#827F76" }}>∑ CR ৳ {totalCredits.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
