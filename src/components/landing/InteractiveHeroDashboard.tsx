"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpRight,
  PlusCircle,
  Camera,
  Layers,
  Scale,
  BookOpen,
  PieChart,
  PiggyBank,
  Receipt,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  Database,
  SlidersHorizontal,
} from "lucide-react";
import { PUBLISHED_25_BENCHMARKS, BenchmarkCaseMeta } from "@/components/dashboard/CollapsibleBenchmarkCases";

export function InteractiveHeroDashboard() {
  const [heroMode, setHeroMode] = useState<"personal" | "enterprise">("personal");
  const [activeTab, setActiveTab] = useState<
    "ledger" | "overview" | "benchmarks" | "expenses" | "tax"
  >("ledger");

  // Active benchmark selected from the 25 published test cases
  const [selectedCaseId, setSelectedCaseId] = useState<string>("PUB-01");
  const [benchmarksExpanded, setBenchmarksExpanded] = useState<boolean>(false);
  const [benchmarkFilterTag, setBenchmarkFilterTag] = useState<string>("ALL");
  const [benchmarkSearch, setBenchmarkSearch] = useState<string>("");

  const activeBenchmark = useMemo<BenchmarkCaseMeta>(() => {
    return (
      PUBLISHED_25_BENCHMARKS.find((b) => b.case_id === selectedCaseId) ||
      PUBLISHED_25_BENCHMARKS[0]
    );
  }, [selectedCaseId]);

  // Dynamic calculations based on selected benchmark
  const salaryNum = useMemo(() => {
    return parseFloat(activeBenchmark.salary_bdt.replace(/,/g, "")) || 85000;
  }, [activeBenchmark]);

  const { outflowNum, liquidBalanceNum, isShortfall, daysElapsed, daysInMonth, dailyBurnNum } =
    useMemo(() => {
      const days = parseInt(activeBenchmark.today.split("-")[2] || "18", 10);
      const totalDays = 31;

      let multiplier = 0.72;
      if (activeBenchmark.tag === "TIGHT") multiplier = 1.08;
      else if (activeBenchmark.tag === "HIGH_SAVINGS") multiplier = 0.52;
      else if (activeBenchmark.tag === "IRREGULAR") multiplier = 0.88;

      const outflow = Math.round(salaryNum * multiplier);
      const balance = Math.round(salaryNum * 2.8 + (salaryNum - outflow));
      const short = outflow > salaryNum;
      const dailyBurn = Math.round(outflow / Math.max(1, days));

      return {
        outflowNum: outflow,
        liquidBalanceNum: balance,
        isShortfall: short,
        daysElapsed: days,
        daysInMonth: totalDays,
        dailyBurnNum: dailyBurn,
      };
    }, [activeBenchmark, salaryNum]);

  // Filter 25 benchmark cases
  const filteredBenchmarks = useMemo(() => {
    return PUBLISHED_25_BENCHMARKS.filter((item) => {
      const matchTag = benchmarkFilterTag === "ALL" || item.tag === benchmarkFilterTag;
      const matchSearch =
        item.case_id.toLowerCase().includes(benchmarkSearch.toLowerCase()) ||
        item.title.toLowerCase().includes(benchmarkSearch.toLowerCase()) ||
        item.scenario.toLowerCase().includes(benchmarkSearch.toLowerCase()) ||
        item.salary_bdt.includes(benchmarkSearch);
      return matchTag && matchSearch;
    });
  }, [benchmarkFilterTag, benchmarkSearch]);

  // Dynamic sample expenses matching active case
  const sampleExpenses = useMemo(() => {
    const base = [
      { shop: "Shwapno Superstore", date: activeBenchmark.today, cat: "Groceries", bdt: 3420, vat: "15% NBR" },
      { shop: "Aarong Handicrafts", date: "2026-10-14", cat: "Clothing", bdt: 8650, vat: "15% NBR" },
      { shop: "Square Hospital Diagnostics", date: "2026-10-12", cat: "Health", bdt: 12400, vat: "Exempt" },
      { shop: "Dhaka Electric Supply (DESCO)", date: "2026-10-08", cat: "Utilities", bdt: 4800, vat: "5% NBR" },
      { shop: "Star Tech Engineering", date: "2026-10-05", cat: "Equipment", bdt: 14500, vat: "15% NBR" },
    ];
    if (activeBenchmark.tag === "TIGHT") {
      return [
        { shop: "Popular Diagnostic Center", date: activeBenchmark.today, cat: "Health", bdt: 18500, vat: "Exempt" },
        ...base.slice(0, 4),
      ];
    }
    if (activeBenchmark.tag === "HIGH_SAVINGS") {
      return [
        { shop: "IDLC Mutual Fund SIP", date: activeBenchmark.today, cat: "Savings Pocket", bdt: 25000, vat: "Exempt" },
        ...base.slice(0, 4),
      ];
    }
    return base;
  }, [activeBenchmark]);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        backgroundColor: "#080909",
        color: "#F6F2E9",
        borderRadius: "16px",
        border: "1px solid #282a29",
        boxShadow: "0 28px 60px -12px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.12)",
        overflow: "hidden",
        clipPath: "inset(0 round 16px)",
        WebkitClipPath: "inset(0 round 16px)",
        isolation: "isolate",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        fontSize: "0.82rem",
        WebkitFontSmoothing: "antialiased",
        transform: "translateZ(0)",
      }}
    >
      {/* ──────────────────────────────────────────────────────────
          1. WINDOW TOP BAR (Single row, clean & uncrowded)
      ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "0.7rem 1rem",
          borderBottom: "1px solid #1c1e1c",
          borderTopLeftRadius: "15px",
          borderTopRightRadius: "15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#111211",
        }}
      >
        {/* Left: Window Dots & Brand Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#D8543D" }} />
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#333633" }} />
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#262926" }} />
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.72rem",
              color: "#827F76",
              marginLeft: "0.4rem",
              letterSpacing: "0.02em",
            }}
          >
            LEDGER COCKPIT · <strong style={{ color: "#FFFDF7" }}>{heroMode.toUpperCase()}</strong>
          </span>
        </div>

        {/* Right: Personal / Enterprise Mode Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#171917",
            padding: "2px",
            borderRadius: "6px",
            border: "1px solid #242724",
          }}
        >
          <button
            type="button"
            onClick={() => setHeroMode("personal")}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.68rem",
              padding: "0.22rem 0.65rem",
              borderRadius: "4px",
              border: "none",
              backgroundColor: heroMode === "personal" ? "rgba(201, 155, 82, 0.25)" : "transparent",
              color: heroMode === "personal" ? "#FFFDF7" : "#827F76",
              fontWeight: heroMode === "personal" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setHeroMode("enterprise")}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.68rem",
              padding: "0.22rem 0.65rem",
              borderRadius: "4px",
              border: "none",
              backgroundColor: heroMode === "enterprise" ? "rgba(216, 84, 61, 0.25)" : "transparent",
              color: heroMode === "enterprise" ? "#FFFDF7" : "#827F76",
              fontWeight: heroMode === "enterprise" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Enterprise
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. MAIN BODY (Sidebar + Content Workspace)
      ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", minHeight: "440px" }}>
        {/* Left Sidebar Navigation */}
        <aside
          style={{
            width: "148px",
            minWidth: "148px",
            backgroundColor: "#0d0f0d",
            borderRight: "1px solid #1c1e1c",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "0.75rem 0.5rem",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span
              style={{
                fontSize: "0.58rem",
                color: "#827F76",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0.2rem 0.4rem",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              MODULES
            </span>

            {[
              { id: "ledger", label: "Double-Entry", icon: <Scale size={13} color="#D8543D" /> },
              { id: "overview", label: "Cash Runway", icon: <Layers size={13} color="#FFFDF7" /> },
              { id: "benchmarks", label: "Benchmark Cases", icon: <Database size={13} color="#D8543D" />, badge: "25" },
              { id: "expenses", label: "Outflows", icon: <PlusCircle size={13} color="#D8543D" /> },
              { id: "tax", label: "VAT 9.1", icon: <FileSpreadsheet size={13} color="#FFFDF7" /> },
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as typeof activeTab);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.45rem 0.55rem",
                    borderRadius: "6px",
                    border: `1px solid ${active ? "rgba(216, 84, 61, 0.4)" : "transparent"}`,
                    backgroundColor: active ? "rgba(216, 84, 61, 0.15)" : "transparent",
                    color: active ? "#FFFDF7" : "#827F76",
                    fontSize: "0.74rem",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontWeight: active ? 700 : 500 }}>{item.label}</span>
                  </span>
                  {item.badge ? (
                    <span
                      style={{
                        fontSize: "0.56rem",
                        padding: "1px 4px",
                        borderRadius: "3px",
                        backgroundColor: "rgba(216, 84, 61, 0.25)",
                        color: "#D8543D",
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Active Scenario Indicator at Bottom of Sidebar */}
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "6px",
              backgroundColor: "#131613",
              border: "1px solid #1f221f",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span style={{ fontSize: "0.58rem", color: "#827F76", fontFamily: "var(--font-mono), monospace" }}>
              ACTIVE CASE
            </span>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#D8543D", fontFamily: "var(--font-mono), monospace" }}>
              {activeBenchmark.case_id}
            </span>
            <span style={{ fontSize: "0.62rem", color: "#827F76" }}>{activeBenchmark.tag}</span>
          </div>
        </aside>

        {/* Right Main Stage */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "#080909",
          }}
        >
          {/* Top Subheader with Collapsible Case Selector & Status Pill */}
          <div
            style={{
              padding: "0.65rem 1rem",
              borderBottom: "1px solid #1c1e1c",
              backgroundColor: "#0d0f0d",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            {/* Interactive Benchmark Case Selector Dropdown Button */}
            <button
              type="button"
              onClick={() => setBenchmarksExpanded(!benchmarksExpanded)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.28rem 0.65rem",
                borderRadius: "6px",
                border: `1px solid ${benchmarksExpanded ? "#D8543D" : "#282a28"}`,
                backgroundColor: benchmarksExpanded ? "rgba(216, 84, 61, 0.18)" : "#141614",
                color: "#FFFDF7",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono), monospace",
                transition: "all 0.15s ease",
              }}
              title="Click to expand/collapse the 25 benchmark cases drawer"
            >
              <Database size={13} color="#D8543D" />
              <span style={{ color: "#D8543D", fontWeight: 700 }}>{activeBenchmark.case_id}</span>
              <span style={{ color: "#827F76" }}>·</span>
              <span style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeBenchmark.title}
              </span>
              {benchmarksExpanded ? <ChevronUp size={13} color="#D8543D" /> : <ChevronDown size={13} color="#827F76" />}
            </button>

            {/* Status Pill & Date */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.65rem",
                  padding: "0.22rem 0.55rem",
                  borderRadius: "4px",
                  backgroundColor: isShortfall ? "rgba(216, 84, 61, 0.15)" : "rgba(255, 253, 247, 0.08)",
                  color: isShortfall ? "#D8543D" : "#FFFDF7",
                  border: `1px solid ${isShortfall ? "rgba(216, 84, 61, 0.3)" : "rgba(255, 253, 247, 0.15)"}`,
                  fontFamily: "var(--font-mono), monospace",
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={11} />
                {isShortfall ? "Deficit Pace" : "Balanced"}
              </div>
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "#827F76",
                  fontFamily: "var(--font-mono), monospace",
                  display: "none",
                }}
                className="hide-mobile"
              >
                {activeBenchmark.month}
              </span>
            </div>
          </div>

          {/* Collapsible 25 Benchmark Drawer Panel */}
          {benchmarksExpanded && (
            <div
              style={{
                backgroundColor: "#0d0f0e",
                borderBottom: "1px solid #262926",
                padding: "0.75rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxHeight: "240px",
                overflowY: "auto",
                borderTop: "1px solid #1f221f",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                <span className="mono" style={{ fontSize: "0.68rem", color: "#D8543D", fontWeight: 700 }}>
                  SELECT FROM 25 BENCHMARKS
                </span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {(["ALL", "SURPLUS", "TIGHT", "HIGH_SAVINGS", "IRREGULAR"] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setBenchmarkFilterTag(tag)}
                      style={{
                        fontSize: "0.58rem",
                        padding: "2px 5px",
                        borderRadius: "3px",
                        border: benchmarkFilterTag === tag ? "1px solid #D8543D" : "1px solid #222",
                        backgroundColor: benchmarkFilterTag === tag ? "rgba(216, 84, 61, 0.2)" : "transparent",
                        color: benchmarkFilterTag === tag ? "#FFFDF7" : "#827F76",
                        cursor: "pointer",
                      }}
                    >
                      {tag.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Filter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  backgroundColor: "#141614",
                  border: "1px solid #242724",
                  borderRadius: "5px",
                  padding: "3px 7px",
                }}
              >
                <Search size={11} color="#827F76" />
                <input
                  type="text"
                  placeholder="Filter 25 cases (e.g. PUB-04, tight, 90,000)..."
                  value={benchmarkSearch}
                  onChange={(e) => setBenchmarkSearch(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#F6F2E9",
                    fontSize: "0.7rem",
                    width: "100%",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                />
              </div>

              {/* Grid of 25 cases */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: "0.4rem",
                }}
              >
                {filteredBenchmarks.map((b) => {
                  const isSelected = b.case_id === selectedCaseId;
                  return (
                    <div
                      key={b.case_id}
                      onClick={() => {
                        setSelectedCaseId(b.case_id);
                        setBenchmarksExpanded(false);
                      }}
                      style={{
                        backgroundColor: isSelected ? "rgba(216, 84, 61, 0.2)" : "#131513",
                        border: `1px solid ${isSelected ? "#D8543D" : "#1f221f"}`,
                        borderRadius: "5px",
                        padding: "0.4rem 0.5rem",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: "0.66rem", fontWeight: 700, color: isSelected ? "#D8543D" : "#FFFDF7" }}>
                          {b.case_id}
                        </span>
                        <span style={{ fontSize: "0.56rem", color: "#827F76" }}>৳{b.salary_bdt}</span>
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "#FFFDF7", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Content Views */}
          <div style={{ flex: 1, padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {/* VIEW 1: COCKPIT / OVERVIEW */}
            {activeTab === "overview" && (
              <>
                {/* 3 Metric Cards Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.6rem" }}>
                  {/* Card 1: Liquid Cash */}
                  <div
                    style={{
                      backgroundColor: "#111311",
                      borderRadius: "8px",
                      border: "1px solid #1f221f",
                      padding: "0.75rem",
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", color: "#827F76", textTransform: "uppercase", display: "block" }}>
                      Liquid Cash Balance
                    </span>
                    <div className="mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#FFFDF7", marginTop: "2px" }}>
                      ৳ {liquidBalanceNum.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "0.62rem", color: "#8FA892" }}>
                      {activeBenchmark.pocket_count} Pockets Buffered
                    </span>
                  </div>

                  {/* Card 2: Inflow */}
                  <div
                    style={{
                      backgroundColor: "#111311",
                      borderRadius: "8px",
                      border: "1px solid #1f221f",
                      padding: "0.75rem",
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", color: "#827F76", textTransform: "uppercase", display: "block" }}>
                      Month Inflow
                    </span>
                    <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#8FA892", marginTop: "2px" }}>
                      + ৳ {salaryNum.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "0.62rem", color: "#827F76" }}>Gross Salary</span>
                  </div>

                  {/* Card 3: Outflow */}
                  <div
                    style={{
                      backgroundColor: "#111311",
                      borderRadius: "8px",
                      border: "1px solid #1f221f",
                      padding: "0.75rem",
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", color: "#827F76", textTransform: "uppercase", display: "block" }}>
                      Month Outflow
                    </span>
                    <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#D8543D", marginTop: "2px" }}>
                      − ৳ {outflowNum.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "0.62rem", color: "#827F76" }}>
                      {activeBenchmark.expense_count} entries
                    </span>
                  </div>
                </div>

                {/* Pace vs. Calendar Runway Bar */}
                <div
                  style={{
                    backgroundColor: "#111311",
                    borderRadius: "8px",
                    border: "1px solid #1f221f",
                    padding: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#827F76", marginBottom: "0.35rem", fontFamily: "var(--font-mono), monospace" }}>
                    <span>RUNWAY PACE ({daysElapsed} of {daysInMonth} DAYS)</span>
                    <span style={{ color: isShortfall ? "#D8543D" : "#FFFDF7" }}>
                      ৳ {dailyBurnNum}/day avg burn
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#1c1e1c", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.round((outflowNum / salaryNum) * 100))}%`,
                        height: "100%",
                        backgroundColor: isShortfall ? "#D8543D" : "#FFFDF7",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>

                {/* Scenario Context Banner */}
                <div
                  style={{
                    backgroundColor: "rgba(216, 84, 61, 0.08)",
                    border: "1px solid rgba(216, 84, 61, 0.2)",
                    borderRadius: "8px",
                    padding: "0.65rem 0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                  }}
                >
                  <ShieldCheck size={15} color="#D8543D" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: "0.74rem", color: "#FFFDF7", margin: 0, lineHeight: "1.4" }}>
                    <strong>{activeBenchmark.case_id} Scenario:</strong> {activeBenchmark.scenario}
                  </p>
                </div>

                {/* Recent Outflow Snapshot */}
                <div
                  style={{
                    backgroundColor: "#111311",
                    borderRadius: "8px",
                    border: "1px solid #1f221f",
                    padding: "0.65rem 0.75rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "#827F76", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Recent Outflow Vouchers ({activeBenchmark.expense_count} Total)
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("expenses")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#C99B52",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      View All →
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {sampleExpenses.slice(0, 3).map((exp, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.7rem",
                          padding: "2px 0",
                          borderBottom: idx < 2 ? "1px solid #181b18" : "none",
                        }}
                      >
                        <span style={{ color: "#FFFDF7", fontWeight: 500 }}>{exp.shop}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ color: "#827F76", fontSize: "0.62rem" }}>{exp.cat}</span>
                          <span className="mono" style={{ color: "#D8543D", fontWeight: 600 }}>
                            − ৳{exp.bdt.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: 25 BENCHMARK DATASETS (Full dedicated view) */}
            {activeTab === "benchmarks" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#FFFDF7" }}>25 Published Benchmark Datasets</h4>
                  <span className="mono" style={{ fontSize: "0.68rem", color: "#C99B52" }}>Currently Loaded: {activeBenchmark.case_id}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem", maxHeight: "280px", overflowY: "auto" }}>
                  {PUBLISHED_25_BENCHMARKS.map((item) => (
                    <div
                      key={item.case_id}
                      onClick={() => {
                        setSelectedCaseId(item.case_id);
                        setActiveTab("overview");
                      }}
                      style={{
                        padding: "0.55rem 0.65rem",
                        borderRadius: "6px",
                        backgroundColor: item.case_id === selectedCaseId ? "rgba(216, 84, 61, 0.2)" : "#111311",
                        border: `1px solid ${item.case_id === selectedCaseId ? "#D8543D" : "#1e211e"}`,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="mono" style={{ fontWeight: 700, fontSize: "0.72rem", color: item.case_id === selectedCaseId ? "#D8543D" : "#FFFDF7" }}>
                          {item.case_id}
                        </span>
                        <span style={{ fontSize: "0.58rem", color: "#827F76" }}>৳{item.salary_bdt}</span>
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "#FFFDF7", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: "0.64rem", color: "#827F76", lineHeight: 1.2 }}>
                        {item.scenario.slice(0, 50)}…
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: EXPENSES */}
            {activeTab === "expenses" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#FFFDF7" }}>Itemized Outflows ({activeBenchmark.expense_count} entries)</h4>
                  <span className="mono" style={{ fontSize: "0.68rem", color: "#827F76" }}>Case: {activeBenchmark.case_id}</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #222", color: "#827F76", textAlign: "left" }}>
                        <th style={{ padding: "4px 8px" }}>Party / Shop</th>
                        <th style={{ padding: "4px 8px" }}>Category</th>
                        <th style={{ padding: "4px 8px" }}>Tax / VAT</th>
                        <th style={{ padding: "4px 8px", textAlign: "right" }}>Amount (BDT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleExpenses.map((exp, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #161816" }}>
                          <td style={{ padding: "5px 8px", color: "#FFFDF7", fontWeight: 600 }}>{exp.shop}</td>
                          <td style={{ padding: "5px 8px", color: "#827F76" }}>{exp.cat}</td>
                          <td style={{ padding: "5px 8px" }}>
                            <span style={{ fontSize: "0.58rem", padding: "1px 4px", borderRadius: "3px", backgroundColor: "rgba(143, 168, 146, 0.15)", color: "#8FA892" }}>
                              {exp.vat}
                            </span>
                          </td>
                          <td style={{ padding: "5px 8px", textAlign: "right", color: "#D8543D", fontFamily: "var(--font-mono), monospace" }}>
                            − ৳{exp.bdt.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 5: DOUBLE-ENTRY */}
            {activeTab === "ledger" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#FFFDF7" }}>Pacioli Double-Entry Equilibrium</h4>
                  <span className="mono" style={{ fontSize: "0.68rem", color: "#8FA892" }}>A ≡ L + E (Verified)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div style={{ backgroundColor: "#111311", border: "1px solid #1f221f", padding: "0.6rem", borderRadius: "6px" }}>
                    <span style={{ fontSize: "0.64rem", color: "#827F76" }}>Total Debits (Dr)</span>
                    <div className="mono" style={{ fontSize: "0.95rem", color: "#8FA892", fontWeight: 700 }}>
                      ৳ {(liquidBalanceNum + outflowNum).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#111311", border: "1px solid #1f221f", padding: "0.6rem", borderRadius: "6px" }}>
                    <span style={{ fontSize: "0.64rem", color: "#827F76" }}>Total Credits (Cr)</span>
                    <div className="mono" style={{ fontSize: "0.95rem", color: "#8FA892", fontWeight: 700 }}>
                      ৳ {(liquidBalanceNum + outflowNum).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 6: STATUTORY VAT */}
            {activeTab === "tax" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#FFFDF7" }}>Bangladesh NBR VAT 9.1 &amp; Mushak 6.3</h4>
                <div style={{ backgroundColor: "#111311", border: "1px solid #1f221f", padding: "0.75rem", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
                    <span style={{ color: "#FFFDF7" }}>Standard VAT Rate</span>
                    <span className="mono" style={{ color: "#D8543D", fontWeight: 700 }}>15.00%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginTop: "4px" }}>
                    <span style={{ color: "#827F76" }}>Tax Retained</span>
                    <span className="mono" style={{ color: "#FFFDF7" }}>৳ {Math.round(outflowNum * 0.15).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ──────────────────────────────────────────────────────────
          3. BOTTOM STATUS BAR (Single line, perfectly aligned)
      ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "0.55rem 1rem",
          backgroundColor: "#0d0f0d",
          borderTop: "1px solid #1c1e1c",
          borderBottomLeftRadius: "15px",
          borderBottomRightRadius: "15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.7rem",
          fontFamily: "var(--font-mono), monospace",
          color: "#9E9A90",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#D8543D" }} />
          <span>PUB-01 to PUB-25 Live Benchmark Engine</span>
        </div>

        <Link
          href="/login?redirect=/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            color: "#FFFDF7",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Open Production Dashboard <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
}
