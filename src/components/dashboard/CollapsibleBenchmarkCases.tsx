"use client";

import React, { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { ChevronDown, ChevronUp, Database, Search, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, SlidersHorizontal } from "lucide-react";

export interface BenchmarkCaseMeta {
  case_id: string;
  title: string;
  today: string;
  month: string;
  salary_bdt: string;
  expense_count: number;
  pocket_count: number;
  tag: "SURPLUS" | "TIGHT" | "HIGH_SAVINGS" | "IRREGULAR";
  scenario: string;
}

export const PUBLISHED_25_BENCHMARKS: BenchmarkCaseMeta[] = [
  { case_id: "PUB-01", title: "Standard Professional Baseline", today: "2026-10-18", month: "2026-10", salary_bdt: "85,000.00", expense_count: 18, pocket_count: 3, tag: "SURPLUS", scenario: "Standard living expenses with disciplined DPS and rent allocation." },
  { case_id: "PUB-02", title: "Medical Emergency & Outflow", today: "2026-10-19", month: "2026-10", salary_bdt: "75,000.00", expense_count: 22, pocket_count: 2, tag: "TIGHT", scenario: "Sudden healthcare diagnostic bills testing the emergency cash buffer." },
  { case_id: "PUB-03", title: "Festival Shopping & Bonus", today: "2026-10-20", month: "2026-10", salary_bdt: "1,10,000.00", expense_count: 26, pocket_count: 3, tag: "SURPLUS", scenario: "Festival gifts, clothing and family dining with bonus salary." },
  { case_id: "PUB-04", title: "High-Discipline Savings", today: "2026-10-15", month: "2026-10", salary_bdt: "90,000.00", expense_count: 12, pocket_count: 4, tag: "HIGH_SAVINGS", scenario: "Aggressive 45% savings rate directed into mutual funds and DPS." },
  { case_id: "PUB-05", title: "Mid-Month Deficit Burn", today: "2026-10-22", month: "2026-10", salary_bdt: "60,000.00", expense_count: 24, pocket_count: 1, tag: "TIGHT", scenario: "Spending pace running ahead of salary; testing projected shortfall alert." },
  { case_id: "PUB-06", title: "Quarterly Tuition & Rent", today: "2026-10-16", month: "2026-10", salary_bdt: "1,20,000.00", expense_count: 19, pocket_count: 3, tag: "SURPLUS", scenario: "School tuition installment paired with Gulshan apartment lease." },
  { case_id: "PUB-07", title: "Freelance Inflow Injection", today: "2026-10-17", month: "2026-10", salary_bdt: "95,000.00", expense_count: 17, pocket_count: 2, tag: "SURPLUS", scenario: "Secondary contract remittance smoothing monthly utility costs." },
  { case_id: "PUB-08", title: "Home Appliance EMI Installment", today: "2026-10-21", month: "2026-10", salary_bdt: "80,000.00", expense_count: 21, pocket_count: 2, tag: "TIGHT", scenario: "Fixed electronic installment (EMI) impacting disposable buffer." },
  { case_id: "PUB-09", title: "Junior Engineer Lean Budget", today: "2026-10-14", month: "2026-10", salary_bdt: "45,000.00", expense_count: 14, pocket_count: 2, tag: "TIGHT", scenario: "Bachelor mess rent, bus commute, and tight living costs." },
  { case_id: "PUB-10", title: "Executive Household Treasury", today: "2026-10-25", month: "2026-10", salary_bdt: "1,80,000.00", expense_count: 29, pocket_count: 5, tag: "HIGH_SAVINGS", scenario: "Multi-bank liquidity, children savings pockets, and automobile maintenance." },
  { case_id: "PUB-11", title: "Apartment Renovation Outflow", today: "2026-10-23", month: "2026-10", salary_bdt: "1,05,000.00", expense_count: 23, pocket_count: 2, tag: "IRREGULAR", scenario: "Civil repairs, contractor paint bills, and hardware purchases." },
  { case_id: "PUB-12", title: "Vehicle Insurance Renewal", today: "2026-10-18", month: "2026-10", salary_bdt: "88,000.00", expense_count: 16, pocket_count: 3, tag: "SURPLUS", scenario: "Annual comprehensive car insurance and BRTA fitness fee." },
  { case_id: "PUB-13", title: "Business Travel & Per-Diem", today: "2026-10-19", month: "2026-10", salary_bdt: "1,15,000.00", expense_count: 20, pocket_count: 3, tag: "SURPLUS", scenario: "Flight bookings, hotel accommodation, and client dinner receipts." },
  { case_id: "PUB-14", title: "Career Transition Low-Burn", today: "2026-10-12", month: "2026-10", salary_bdt: "50,000.00", expense_count: 11, pocket_count: 1, tag: "TIGHT", scenario: "Zero-discretionary survival mode during sabbatical." },
  { case_id: "PUB-15", title: "Year-End Tax & Zakat Draw", today: "2026-10-24", month: "2026-10", salary_bdt: "1,40,000.00", expense_count: 25, pocket_count: 4, tag: "IRREGULAR", scenario: "Statutory tax lawyer advance, Mushak deduction, and Zakat funds." },
  { case_id: "PUB-16", title: "Agrarian Family Remittance", today: "2026-10-17", month: "2026-10", salary_bdt: "70,000.00", expense_count: 15, pocket_count: 2, tag: "SURPLUS", scenario: "Village home remittance through bKash and local agro seeds." },
  { case_id: "PUB-17", title: "Tech Stack & Developer Gear", today: "2026-10-21", month: "2026-10", salary_bdt: "92,000.00", expense_count: 18, pocket_count: 3, tag: "SURPLUS", scenario: "Cloud hosting, ergonomic chair, and monitor equipment." },
  { case_id: "PUB-18", title: "Family Wedding Gifting Outflow", today: "2026-10-26", month: "2026-10", salary_bdt: "85,000.00", expense_count: 27, pocket_count: 2, tag: "TIGHT", scenario: "Traditional jewelry gift, community center contribution, and formal wear." },
  { case_id: "PUB-19", title: "Aggressive DPS Retirement Fund", today: "2026-10-16", month: "2026-10", salary_bdt: "1,30,000.00", expense_count: 14, pocket_count: 5, tag: "HIGH_SAVINGS", scenario: "Double DPS installment with automated standing bank orders." },
  { case_id: "PUB-20", title: "High Dining & Hospitality Burn", today: "2026-10-22", month: "2026-10", salary_bdt: "82,000.00", expense_count: 28, pocket_count: 1, tag: "TIGHT", scenario: "Frequent weekend restaurant bills and coffee meetings." },
  { case_id: "PUB-21", title: "Wellness & Annual Health Club", today: "2026-10-15", month: "2026-10", salary_bdt: "78,000.00", expense_count: 16, pocket_count: 3, tag: "SURPLUS", scenario: "Annual gym pass, organic groceries, and physiotherapy sessions." },
  { case_id: "PUB-22", title: "House Shifting & Deposit", today: "2026-10-23", month: "2026-10", salary_bdt: "1,25,000.00", expense_count: 22, pocket_count: 2, tag: "IRREGULAR", scenario: "Security deposit transfer and pickup van logistics." },
  { case_id: "PUB-23", title: "Emergency Water Heater Breakdown", today: "2026-10-18", month: "2026-10", salary_bdt: "68,000.00", expense_count: 19, pocket_count: 2, tag: "TIGHT", scenario: "Plumbing contractor overhaul testing unexpected drain." },
  { case_id: "PUB-24", title: "New Year Savings Goal Inception", today: "2026-10-14", month: "2026-10", salary_bdt: "96,000.00", expense_count: 15, pocket_count: 4, tag: "HIGH_SAVINGS", scenario: "Seeding newly minted vacation and emergency pockets." },
  { case_id: "PUB-25", title: "Perfect Golden Equilibrium", today: "2026-10-20", month: "2026-10", salary_bdt: "1,00,000.00", expense_count: 20, pocket_count: 3, tag: "SURPLUS", scenario: "Exact mathematical balance where actual burn mirrors planned pace." },
];

export function CollapsibleBenchmarkCases({
  onLoaded,
}: {
  onLoaded: (month: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCaseId, setLoadingCaseId] = useState<string | null>(null);
  const [enterpriseBusy, setEnterpriseBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const filteredCases = PUBLISHED_25_BENCHMARKS.filter((c) => {
    const matchesTag = activeTag === "ALL" || c.tag === activeTag;
    const matchesSearch =
      c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.salary_bdt.includes(searchQuery);
    return matchesTag && matchesSearch;
  });

  const handleLoadCase = async (caseId: string) => {
    setLoadingCaseId(caseId);
    setFeedback(null);
    try {
      const res = await api<{ seeded: { month: string } }>("/demo/seed", {
        method: "POST",
        body: { case_id: caseId },
      });
      setFeedback({
        message: `Successfully loaded benchmark case ${caseId} (${res.seeded.month}) with full checkable ledger entries!`,
        type: "success",
      });
      onLoaded(res.seeded.month);
    } catch (err) {
      setFeedback({
        message: err instanceof ApiError ? err.message : `Failed to seed ${caseId}`,
        type: "error",
      });
    } finally {
      setLoadingCaseId(null);
    }
  };

  const handleLoadEnterpriseSuite = async () => {
    setEnterpriseBusy(true);
    setFeedback(null);
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
          runs: number;
        };
      }>("/demo/enterprise", {
        method: "POST",
      });
      setFeedback({
        message: `Enterprise Suite Seeded: ${res.seeded.parties} parties, ${res.seeded.invoices} invoices, ${res.seeded.bills} bills, ${res.seeded.assets} assets, ${res.seeded.staff} staff payroll runs in period ${res.seeded.period}!`,
        type: "success",
      });
      onLoaded(res.seeded.period);
    } catch (err) {
      setFeedback({
        message: err instanceof ApiError ? err.message : "Could not seed enterprise suite.",
        type: "error",
      });
    } finally {
      setEnterpriseBusy(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--line-firm)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        marginTop: "var(--s-4)",
      }}
    >
      {/* Collapsible Accordion Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "var(--s-4) var(--s-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          backgroundColor: isOpen ? "var(--surface-2)" : "var(--surface)",
          borderBottom: isOpen ? "1px solid var(--line)" : "none",
          transition: "background-color 0.15s ease",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "rgba(201, 155, 82, 0.15)",
              border: "1px solid rgba(201, 155, 82, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C99B52",
            }}
          >
            <Database size={18} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 700, color: "var(--ink)" }}>
                Published Benchmark Dataset
              </h3>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "var(--font-mono), monospace",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(74, 222, 128, 0.15)",
                  color: "#22c55e",
                  border: "1px solid rgba(74, 222, 128, 0.3)",
                }}
              >
                25 Test Scenarios Available
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
              Load any of the 25 published test cases (PUB-01 to PUB-25) or full Enterprise ERP suite directly into the active ledger.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              color: "#C99B52",
              fontWeight: 600,
            }}
          >
            {isOpen ? "COLLAPSE PANEL" : "EXPAND ALL 25 CASES"}
          </span>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "var(--surface-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink)",
            }}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div style={{ padding: "var(--s-5)", backgroundColor: "var(--surface)" }}>
          {/* Top Feedback Alert */}
          {feedback && (
            <div
              style={{
                padding: "var(--s-3) var(--s-4)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "var(--s-4)",
                backgroundColor: feedback.type === "success" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border: feedback.type === "success" ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                color: feedback.type === "success" ? "#16a34a" : "#dc2626",
                display: "flex",
                alignItems: "center",
                gap: "var(--s-2)",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Quick Filter & Enterprise Seed Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--s-3)",
              flexWrap: "wrap",
              marginBottom: "var(--s-4)",
              paddingBottom: "var(--s-4)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                minWidth: "260px",
                flex: "1 1 300px",
              }}
            >
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: "12px",
                  color: "var(--ink-faint)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search across 25 cases (e.g. 'PUB-04', 'Tuition', '85,000')…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  paddingLeft: "36px",
                  paddingRight: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--line-firm)",
                  backgroundColor: "var(--bg)",
                  color: "var(--ink)",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>

            {/* Tag Filter Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: "All 25 Cases" },
                { id: "SURPLUS", label: "Surplus" },
                { id: "TIGHT", label: "Tight Margin" },
                { id: "HIGH_SAVINGS", label: "High DPS / Savings" },
                { id: "IRREGULAR", label: "Irregular Outflow" },
              ].map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setActiveTag(tag.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: activeTag === tag.id ? 700 : 500,
                    backgroundColor: activeTag === tag.id ? "var(--ink)" : "var(--surface-2)",
                    color: activeTag === tag.id ? "var(--surface)" : "var(--ink-muted)",
                    border: `1px solid ${activeTag === tag.id ? "var(--ink)" : "var(--line)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Master Enterprise Suite Seeder Button */}
            <button
              type="button"
              disabled={enterpriseBusy}
              onClick={handleLoadEnterpriseSuite}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#141514",
                color: "#FFFDF7",
                border: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: enterpriseBusy ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(20, 21, 20, 0.15)",
                transition: "opacity 0.15s ease",
              }}
            >
              {enterpriseBusy ? <RefreshCw size={14} className="spin" /> : <Database size={14} />}
              <span>{enterpriseBusy ? "Seeding Suite…" : "Load Full Enterprise ERP Suite"}</span>
            </button>
          </div>

          {/* Cases Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "var(--s-3)",
              maxHeight: "560px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {filteredCases.map((c) => {
              const isCurrentlyLoading = loadingCaseId === c.case_id;

              const tagColor =
                c.tag === "SURPLUS"
                  ? { bg: "rgba(34, 197, 94, 0.12)", text: "#16a34a", border: "rgba(34, 197, 94, 0.3)" }
                  : c.tag === "HIGH_SAVINGS"
                  ? { bg: "rgba(201, 155, 82, 0.12)", text: "#C99B52", border: "rgba(201, 155, 82, 0.3)" }
                  : c.tag === "IRREGULAR"
                  ? { bg: "rgba(168, 85, 247, 0.12)", text: "#9333ea", border: "rgba(168, 85, 247, 0.3)" }
                  : { bg: "rgba(239, 68, 68, 0.12)", text: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };

              return (
                <div
                  key={c.case_id}
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    padding: "var(--s-3) var(--s-4)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "var(--s-2)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    {/* Header: Case ID and Tag Pill */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          color: "var(--ink)",
                          backgroundColor: "var(--surface-3)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--line-firm)",
                        }}
                      >
                        {c.case_id}
                      </span>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: tagColor.bg,
                          color: tagColor.text,
                          border: `1px solid ${tagColor.border}`,
                        }}
                      >
                        {c.tag}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 style={{ margin: "8px 0 4px 0", fontSize: "0.92rem", fontWeight: 700, color: "var(--ink)" }}>
                      {c.title}
                    </h4>

                    {/* Scenario Description */}
                    <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--ink-muted)", lineHeight: 1.4 }}>
                      {c.scenario}
                    </p>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "var(--s-2)",
                      borderTop: "1px solid var(--line)",
                      marginTop: "4px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.65rem", color: "var(--ink-faint)", display: "block" }}>
                        SALARY BASELINE
                      </span>
                      <span
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color: "var(--ink)",
                        }}
                      >
                        ৳ {c.salary_bdt}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--ink-faint)", display: "block" }}>
                        DATA ROWS
                      </span>
                      <span style={{ fontSize: "0.76rem", fontFamily: "var(--font-mono)", color: "var(--ink-muted)" }}>
                        {c.expense_count} exp · {c.pocket_count} pck
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrentlyLoading}
                      onClick={() => handleLoadCase(c.case_id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        borderRadius: "5px",
                        backgroundColor: "var(--ink)",
                        color: "var(--surface)",
                        border: "none",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        cursor: isCurrentlyLoading ? "not-allowed" : "pointer",
                        transition: "transform 0.1s ease",
                      }}
                    >
                      {isCurrentlyLoading ? (
                        <>
                          <RefreshCw size={12} className="spin" />
                          <span>Seeding…</span>
                        </>
                      ) : (
                        <>
                          <span>Load</span>
                          <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
