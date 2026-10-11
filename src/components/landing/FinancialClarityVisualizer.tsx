"use client";

import React, { useState } from "react";
import { Layers, ShieldCheck, ArrowUpRight, TrendingUp } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  monthlyInflow: number;
  rent: number;
  groceries: number;
  reserve: number;
  savings: number;
  runwayMonths: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: "standard",
    name: "Professional (৳ 1,20,000)",
    monthlyInflow: 120000,
    rent: 38000,
    groceries: 22000,
    reserve: 24000,
    savings: 36000,
    runwayMonths: 7.4,
  },
  {
    id: "executive",
    name: "Executive (৳ 1,85,000)",
    monthlyInflow: 185000,
    rent: 55000,
    groceries: 30000,
    reserve: 40000,
    savings: 60000,
    runwayMonths: 9.8,
  },
  {
    id: "founder",
    name: "Tech Lead (৳ 2,50,000)",
    monthlyInflow: 250000,
    rent: 65000,
    groceries: 35000,
    reserve: 50000,
    savings: 100000,
    runwayMonths: 12.5,
  },
];

export function FinancialClarityVisualizer() {
  const [selectedId, setSelectedId] = useState<string>("standard");

  const active = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  const totalAllocated = active.rent + active.groceries + active.reserve + active.savings;
  const variance = active.monthlyInflow - totalAllocated;

  const rentPct = Math.round((active.rent / active.monthlyInflow) * 100);
  const groceriesPct = Math.round((active.groceries / active.monthlyInflow) * 100);
  const reservePct = Math.round((active.reserve / active.monthlyInflow) * 100);
  const savingsPct = Math.round((active.savings / active.monthlyInflow) * 100);

  return (
    <div
      style={{
        backgroundColor: "#FFFDF7",
        color: "#171817",
        borderRadius: "16px",
        border: "1px solid #171817",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
        width: "100%",
        maxWidth: "580px",
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: "1rem 1.25rem",
          backgroundColor: "#EDE7DC",
          borderBottom: "1px solid #D9D2C5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#D8543D" }} />
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#171817",
              textTransform: "uppercase",
            }}
          >
            Capital Allocation Engine
          </span>
        </div>

        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.72rem",
            color: "#D8543D",
            fontWeight: 700,
            backgroundColor: "#FFFDF7",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
            border: "1px solid #D9D2C5",
          }}
        >
          BDT Deterministic
        </span>
      </div>

      {/* Scenario Switcher Controls */}
      <div style={{ padding: "1.25rem 1.25rem 0.75rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {SCENARIOS.map((s) => {
            const isSelected = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.76rem",
                  fontFamily: "var(--font-mono), monospace",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  backgroundColor: isSelected ? "#171817" : "#EDE7DC",
                  color: isSelected ? "#FFFDF7" : "#54524c",
                  border: isSelected ? "1px solid #171817" : "1px solid #D9D2C5",
                  boxShadow: isSelected ? "0 2px 8px rgba(23, 24, 23, 0.18)" : "none",
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Primary Metric Highlights */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#F6F2E9",
              borderRadius: "10px",
              border: "1px solid #E4DDCF",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono), monospace", color: "#827F76", textTransform: "uppercase" }}>
              Monthly Net Inflow
            </div>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono), monospace",
                color: "#171817",
                marginTop: "0.2rem",
              }}
            >
              ৳ {active.monthlyInflow.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#54524c", marginTop: "0.2rem" }}>
              Verified Bank Credit
            </div>
          </div>

          <div
            style={{
              padding: "1rem",
              backgroundColor: "#F6F2E9",
              borderRadius: "10px",
              border: "1px solid #E4DDCF",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono), monospace", color: "#827F76", textTransform: "uppercase" }}>
              Runway Buffer
            </div>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono), monospace",
                color: "#D8543D",
                marginTop: "0.2rem",
              }}
            >
              {active.runwayMonths} Months
            </div>
            <div style={{ fontSize: "0.72rem", color: "#54524c", marginTop: "0.2rem" }}>
              Non-discretionary reserve
            </div>
          </div>
        </div>

        {/* Interactive Waterfall Allocation Bar */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", fontFamily: "var(--font-mono), monospace", color: "#54524c", marginBottom: "0.4rem" }}>
            <span>Envelope Distribution</span>
            <span>100% Accounted</span>
          </div>
          <div
            style={{
              display: "flex",
              height: "12px",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #D9D2C5",
            }}
          >
            <div style={{ width: `${rentPct}%`, backgroundColor: "#171817" }} title={`Housing: ${rentPct}%`} />
            <div style={{ width: `${groceriesPct}%`, backgroundColor: "#54524c" }} title={`Living: ${groceriesPct}%`} />
            <div style={{ width: `${reservePct}%`, backgroundColor: "#C99B52" }} title={`Reserve: ${reservePct}%`} />
            <div style={{ width: `${savingsPct}%`, backgroundColor: "#D8543D" }} title={`Savings: ${savingsPct}%`} />
          </div>
        </div>

        {/* Breakdown Line Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.82rem", fontFamily: "var(--font-mono), monospace" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid #EDE7DC" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#2B2A27" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#171817" }} />
              Housing &amp; Commercial Rent
            </span>
            <span style={{ fontWeight: 700, color: "#171817" }}>
              ৳ {active.rent.toLocaleString()} ({rentPct}%)
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid #EDE7DC" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#2B2A27" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#54524c" }} />
              Groceries &amp; Utilities (15% VAT)
            </span>
            <span style={{ fontWeight: 700, color: "#171817" }}>
              ৳ {active.groceries.toLocaleString()} ({groceriesPct}%)
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid #EDE7DC" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#2B2A27" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#C99B52" }} />
              Liquid Reserve Buffer
            </span>
            <span style={{ fontWeight: 700, color: "#171817" }}>
              ৳ {active.reserve.toLocaleString()} ({reservePct}%)
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid #EDE7DC" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#2B2A27" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#D8543D" }} />
              Strategic Savings Pocket
            </span>
            <span style={{ fontWeight: 700, color: "#D8543D" }}>
              ৳ {active.savings.toLocaleString()} ({savingsPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Mathematical Invariant Strip */}
      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.25rem",
          backgroundColor: "#171817",
          color: "#FFFDF7",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.72rem",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3ddc97" }} />
          <span>∑ Inflow - ∑ Allocated</span>
        </div>
        <span style={{ color: "#FFFDF7", fontWeight: 700 }}>
          ৳ {variance.toFixed(2)} (Zero Float Invariant)
        </span>
      </div>
    </div>
  );
}
