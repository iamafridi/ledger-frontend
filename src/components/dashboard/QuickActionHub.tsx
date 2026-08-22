"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Camera,
  Receipt,
  FileSpreadsheet,
  BookOpen,
  History,
  Layers,
  Scale,
  Landmark,
  ShieldCheck,
  Users,
  BarChart3,
  Lock,
  Compass,
  PiggyBank,
  Boxes,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";

interface ActionItem {
  href: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  category: "OPERATIONS" | "LEDGER" | "COMPLIANCE" | "INSIGHTS";
  badge?: string;
}

const ACTION_ITEMS: ActionItem[] = [
  {
    href: "/expenses",
    label: "Record Expense",
    sublabel: "Personal & Business out-of-pocket",
    icon: <PlusCircle size={18} color="#D8543D" />,
    category: "OPERATIONS",
  },
  {
    href: "/receipts",
    label: "Receipt Scanner",
    sublabel: "Scan Bengali / English thermal receipts",
    icon: <Camera size={18} color="#141514" />,
    category: "OPERATIONS",
  },
  {
    href: "/sales",
    label: "Sales & Invoicing",
    sublabel: "Trade invoices, delivery challans",
    icon: <Receipt size={18} color="#141514" />,
    category: "OPERATIONS",
  },
  {
    href: "/purchases",
    label: "Vendor Bills",
    sublabel: "Procurement bills & 3-way matching",
    icon: <FileSpreadsheet size={18} color="#141514" />,
    category: "OPERATIONS",
  },
  {
    href: "/accounts",
    label: "Chart of Accounts",
    sublabel: "5-class Pacioli double-entry tree",
    icon: <BookOpen size={18} color="#141514" />,
    category: "LEDGER",
  },
  {
    href: "/journals",
    label: "Journal Register",
    sublabel: "Append-only general journal entries",
    icon: <History size={18} color="#141514" />,
    category: "LEDGER",
  },
  {
    href: "/recurring",
    label: "Recurring Accruals",
    sublabel: "Amortization & automated standing orders",
    icon: <Layers size={18} color="#141514" />,
    category: "LEDGER",
  },
  {
    href: "/budgets",
    label: "Budget Variance",
    sublabel: "Cost centers & variance tracking",
    icon: <Scale size={18} color="#141514" />,
    category: "LEDGER",
  },
  {
    href: "/banking",
    label: "Treasury & Bank",
    sublabel: "Multi-bank feeds & auto-reconciliation",
    icon: <Landmark size={18} color="#141514" />,
    category: "COMPLIANCE",
  },
  {
    href: "/tax",
    label: "NBR VAT 9.1",
    sublabel: "Mushak 6.3 withholding & tax returns",
    icon: <ShieldCheck size={18} color="#D8543D" />,
    category: "COMPLIANCE",
    badge: "VAT 15%",
  },
  {
    href: "/staff",
    label: "Payroll & TDS",
    sublabel: "Salary sheets & TDS deduction",
    icon: <Users size={18} color="#141514" />,
    category: "COMPLIANCE",
  },
  {
    href: "/reports",
    label: "20 Audit Reports",
    sublabel: "Trial balance, P&L, balance sheet",
    icon: <BarChart3 size={18} color="#141514" />,
    category: "COMPLIANCE",
  },
  {
    href: "/periods",
    label: "Period Closing",
    sublabel: "Month-end checkpoint & period sealing",
    icon: <Lock size={18} color="#D8543D" />,
    category: "INSIGHTS",
  },
  {
    href: "/insights",
    label: "Runway Heatmap",
    sublabel: "Deterministic cashflow & burn forecast",
    icon: <Compass size={18} color="#141514" />,
    category: "INSIGHTS",
  },
  {
    href: "/pockets",
    label: "Savings Pockets",
    sublabel: "DPS, emergency, & goal pools",
    icon: <PiggyBank size={18} color="#141514" />,
    category: "INSIGHTS",
  },
  {
    href: "/inventory",
    label: "Perpetual Stock",
    sublabel: "Valuation, items & stock batches",
    icon: <Boxes size={18} color="#141514" />,
    category: "OPERATIONS",
  },
];

export function QuickActionHub() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredItems = ACTION_ITEMS.filter(
    (item) => selectedCategory === "ALL" || item.category === selectedCategory
  );

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--line-firm)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        marginTop: "var(--s-3)",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "var(--s-3) var(--s-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          backgroundColor: "#FAF7F2",
          borderBottom: isOpen ? "1px solid var(--line)" : "none",
          transition: "background-color 0.15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              backgroundColor: "rgba(216, 84, 61, 0.1)",
              border: "1px solid rgba(216, 84, 61, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D8543D",
            }}
          >
            <Compass size={16} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>
                Application Operations &amp; Modules
              </h3>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-mono), monospace",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(20, 21, 20, 0.06)",
                  color: "#141514",
                  border: "1px solid var(--line)",
                }}
              >
                16 Endpoints
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              Direct access into every ledger module, statutory filing, and operations workflow.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
          <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "#141514", fontWeight: 600 }}>
            {isOpen ? "COLLAPSE ACTIONS" : "EXPAND ACTIONS"}
          </span>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "var(--surface-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink)",
            }}
          >
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: "var(--s-4)" }}>
          {/* Category Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "var(--s-3)" }}>
            {[
              { id: "ALL", label: "All Operations" },
              { id: "OPERATIONS", label: "Commercial & Operations" },
              { id: "LEDGER", label: "Double-Entry Books" },
              { id: "COMPLIANCE", label: "Treasury & Tax Compliance" },
              { id: "INSIGHTS", label: "Analytics & Runways" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  backgroundColor: selectedCategory === cat.id ? "#141514" : "#F4EFE6",
                  color: selectedCategory === cat.id ? "#FFFDF7" : "#5A5955",
                  border: `1px solid ${selectedCategory === cat.id ? "#141514" : "var(--line)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Action Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "var(--s-3)",
            }}
          >
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--s-3)",
                  padding: "var(--s-3)",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.borderColor = "var(--line-firm)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(20, 21, 20, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ marginTop: "2px" }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(216, 84, 61, 0.08)",
                          color: "#D8543D",
                          border: "1px solid rgba(216, 84, 61, 0.25)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "0.72rem",
                      color: "var(--ink-muted)",
                      lineHeight: 1.35,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.sublabel}
                  </p>
                </div>
                <ArrowUpRight size={13} color="var(--ink-faint)" style={{ marginTop: "4px" }} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
