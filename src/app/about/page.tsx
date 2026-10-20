"use client";

import Link from "next/link";
import { useState } from "react";
import StaggeredMenu from "@/components/StaggeredMenu";
import { PUBLIC_NAV_ITEMS, PUBLIC_SOCIAL_ITEMS } from "@/lib/nav";
import { Footer } from "@/components/footer";
import { DEMO_EMAIL } from "@/lib/demo";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Layers,
  Scale,
  Calculator,
  Lock,
  FileText,
  Building2,
  Receipt,
  ShoppingBag,
  Users,
} from "lucide-react";

interface SystemNode {
  id: string;
  name: string;
  category: string;
  debitAccounts: string[];
  creditAccounts: string[];
  invariant: string;
  summary: string;
}

const TOPOLOGY_NODES: SystemNode[] = [
  {
    id: "sales",
    name: "Sales & Invoicing",
    category: "Revenue / AR",
    debitAccounts: ["1100 Accounts Receivable", "1010 Bank / Cash"],
    creditAccounts: ["4000 Sales Revenue", "2100 VAT Payable 15%"],
    invariant: "Invoice Total = Taxable Subtotal + VAT (truncated paisa)",
    summary: "Creates B2B tax invoices with automated 15% VAT, line discounts, advance clearing, and printable A4 formats.",
  },
  {
    id: "purchases",
    name: "Purchases & Payables",
    category: "Expense / AP",
    debitAccounts: ["1200 Inventory Stock", "5100 Operating Expense", "1500 Fixed Assets"],
    creditAccounts: ["2000 Supplier AP", "1010 Bank"],
    invariant: "Stock Unit Cost = Total Bill Value ÷ Quantity",
    summary: "Procurement bills from suppliers with 3-way line item matching, advance disbursements, and wire payment allocation.",
  },
  {
    id: "payroll",
    name: "Staff Payroll & Advances",
    category: "P11 Compliance",
    debitAccounts: ["5000 Staff Salary Expense"],
    creditAccounts: ["2300 Payroll Payable", "1600 Loan Amortization", "1010 Bank Vault"],
    invariant: "Gross Salary = Net Pay + Deductions + Loan Recoveries",
    summary: "Two-step salary posting (accrual & disbursement), monthly payslip generator, and automated staff loan recovery via Account 1600.",
  },
  {
    id: "assets",
    name: "Fixed Asset Register",
    category: "Capital Assets",
    debitAccounts: ["5200 Depreciation Expense"],
    creditAccounts: ["1510 Accumulated Depreciation"],
    invariant: "Book Value = Acquisition Cost - Accumulated Depreciation ≥ Salvage Value",
    summary: "Straight-line asset write-downs with salvage floors, acquisition postings, and automated monthly depreciation runs.",
  },
  {
    id: "vat",
    name: "Statutory NBR Form 9.1",
    category: "Tax Compliance",
    debitAccounts: ["2100 Output VAT 15%"],
    creditAccounts: ["1400 Input Tax Rebate", "1010 Tax Payment to NBR"],
    invariant: "Net VAT = Whole Taka (Output VAT - Input Rebate)",
    summary: "Official government tax return generator adhering to Bangladesh National Board of Revenue rules with whole-taka truncation.",
  },
  {
    id: "gl",
    name: "General Ledger Core",
    category: "Double-Entry Engine",
    debitAccounts: ["1000 Assets", "5000 Expenses"],
    creditAccounts: ["2000 Liabilities", "3000 Equity", "4000 Revenues"],
    invariant: "Σ Debits = Σ Credits · Invariant I1/I2 Balanced",
    summary: "The central multi-document ACID transaction engine enforcing zero floating point drift with 40-digit decimal.js precision.",
  },
  {
    id: "reports",
    name: "Financial Statements",
    category: "Reporting",
    debitAccounts: ["Balance Sheet", "Trial Balance"],
    creditAccounts: ["Profit & Loss", "General Ledger Book"],
    invariant: "Assets = Liabilities + Equity (Equation Balance I3)",
    summary: "Real-time consolidated balance sheet, profit & loss, trial balance, and drillable account ledgers computed on the fly.",
  },
];

const PAGES_DIRECTORY = [
  {
    route: "/dashboard",
    title: "Executive Dashboard",
    iconNum: "01",
    badge: "Live Telemetry",
    desc: "Real-time liquidity gauge, revenue vs expense metrics, pending invoice alerts, cash runway projections, and 1-click enterprise seeders.",
    features: ["Total Cash & Bank liquidity KPI", "Live Profit & Loss metric", "Recent unposted draft alerts", "Invariant health monitor"],
  },
  {
    route: "/sales",
    title: "Sales & Invoicing Module",
    iconNum: "02",
    badge: "B2B & Commercial",
    desc: "Create and dispatch professional tax invoices with customer party lookups, automated 15% VAT, line discounts, and payment receipts.",
    features: ["A4 printable invoice generation", "Partial payment allocations", "Customer advance offsetting", "Sub-ledger AR aging report"],
  },
  {
    route: "/purchases",
    title: "Purchases & Procurement",
    iconNum: "03",
    badge: "Supplier AP",
    desc: "Log vendor bills, track purchase orders, clear supplier advances, and monitor outstanding accounts payable.",
    features: ["Itemized bill lines with auto-VAT", "Supplier credit tracking", "Bank transfer settlements", "Inventory unit valuation"],
  },
  {
    route: "/accounts",
    title: "Chart of Accounts & GL",
    iconNum: "04",
    badge: "Pacioli Structure",
    desc: "Complete 4-digit standardized chart of accounts spanning Assets (1000s), Liabilities (2000s), Equity (3000s), Revenue (4000s), and Expenses (5000s).",
    features: ["Sub-ledger drilldown", "Real-time running balance", "Debit/Credit invariant guards", "Account activation toggles"],
  },
  {
    route: "/journals",
    title: "Manual Journal Entries",
    iconNum: "05",
    badge: "Double-Entry",
    desc: "Full debit-credit voucher editor supporting multi-line balancing, line descriptions, reference tags, and irreversible posted audits.",
    features: ["Zero-drift balance validator", "Unposted draft staging", "Reversal voucher generator", "Permanent audit log stamp"],
  },
  {
    route: "/banking",
    title: "Banking & Treasury Vault",
    iconNum: "06",
    badge: "Liquidity Control",
    desc: "Centralized treasury ledger tracking balances across commercial bank accounts (BRAC, DBBL, City Bank) and mobile financial services (bKash).",
    features: ["Bank statement import", "Treasury transfer vouchers", "Paisa truncation checks", "Multi-account liquidity walk"],
  },
  {
    route: "/tax",
    title: "NBR VAT Return 9.1",
    iconNum: "07",
    badge: "Tax Compliance",
    desc: "Official government tax return generator adhering to Bangladesh National Board of Revenue rules with automated 15% rate computation.",
    features: ["Mushak 9.1 sub-forms (Sub 24, 25, 26)", "VDS withholding tracking", "Whole-taka truncation rule", "Treasury deposit challan log"],
  },
  {
    route: "/staff",
    title: "Staff & Payroll Module",
    iconNum: "08",
    badge: "Workforce",
    desc: "Manage employee records, salary structures, staff advance loans, and monthly payroll voucher posting.",
    features: ["Salary disbursement vouchers", "Staff loan recovery schedules", "Designation & department tracking", "Monthly payslip generation"],
  },
  {
    route: "/reports",
    title: "Financial Statements & Analytics",
    iconNum: "09",
    badge: "Audit Ready",
    desc: "Instant drillable Balance Sheet, Profit & Loss statement, and Trial Balance generated directly from immutable journal entries.",
    features: ["Exportable balance sheets", "Income statement drilldowns", "Trial balance equality check", "Historical period comparison"],
  },
];

const ARCHITECTURE_FAQS = [
  {
    q: "How does the system ensure zero floating-point arithmetic drift?",
    a: "Every financial computation is strictly governed by 40-digit decimal.js arithmetic. Floating point IEEE 754 representations are prohibited in financial ledgers. Amounts are stored and verified down to the exact paisa (1 BDT = 100 Paisa), guaranteeing that Σ Debits strictly equals Σ Credits with zero rounding drift across millions of transactions.",
  },
  {
    q: "What makes the General Ledger tamper-proof and audit-ready?",
    a: "Once a journal voucher or commercial invoice is posted, its ledger lines are mathematically locked. Deleting posted transactions is prohibited by database invariants. Any corrective action requires a formal compensating reversing voucher, maintaining an immutable, traceable audit trail suitable for statutory NBR inspection and external audit.",
  },
  {
    q: "How is Bangladesh 15% VAT and VDS calculated?",
    a: "Our tax engine implements statutory National Board of Revenue (NBR) rules. In accordance with Bangladesh VAT law, Output VAT is applied at exactly 15% on taxable supplies, Input Tax rebates are tracked against Account 1400, and final payable figures are truncated to whole Taka integers on Mushak 9.1 tax returns.",
  },
  {
    q: "Can team members access specific modules based on their role?",
    a: "Yes. The platform enforces granular Role-Based Access Control (RBAC). Roles include Executive / CFO (full system access), Accountant (GL, Invoicing, Banking, Tax), and Operations (Inventory, Sales dispatch), ensuring strict segregation of duties across finance and commercial operations.",
  },
];

export default function AboutPage() {
  const [selectedNode, setSelectedNode] = useState<SystemNode>(TOPOLOGY_NODES[0]);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [scratchDebit, setScratchDebit] = useState<string>("45000.00");
  const [scratchCredit, setScratchCredit] = useState<string>("45000.00");

  const isBalanced =
    parseFloat(scratchDebit || "0") === parseFloat(scratchCredit || "0") &&
    parseFloat(scratchDebit || "0") > 0;

  return (
    <div style={{ background: "#FAF7F2", minHeight: "100vh", color: "#141514" }}>
      {/* Navigation Header */}
      <StaggeredMenu
        position="right"
        items={PUBLIC_NAV_ITEMS}
        socialItems={PUBLIC_SOCIAL_ITEMS}
        colors={["#D8543D", "#141514", "#141514"]}
        accentColor="#D8543D"
      />

      <main style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
        <div style={{ maxWidth: "76rem", marginInline: "auto", paddingInline: "1.5rem" }}>
          {/* Hero Section */}
          <section
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E0D5",
              borderRadius: "16px",
              padding: "clamp(2rem, 5vw, 4rem)",
              boxShadow: "0 2px 12px rgba(20, 21, 20, 0.04)",
              marginBottom: "3.5rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "3rem",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "999px",
                    background: "rgba(216, 84, 61, 0.08)",
                    border: "1px solid rgba(216, 84, 61, 0.25)",
                    color: "#D8543D",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "1.25rem",
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Mathematical Invariant Engine</span>
                </div>

                <h1
                  style={{
                    fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: "-0.035em",
                    fontFamily: "var(--font-serif), Georgia, serif",
                    margin: "0 0 1.25rem 0",
                    color: "#141514",
                  }}
                >
                  The architectural foundation of mathematical truth.
                </h1>

                <p style={{ color: "#5A5955", fontSize: "1.05rem", lineHeight: 1.6, margin: "0 0 2rem 0" }}>
                  Every invoice, bill, bank transfer, payroll disbursement, and asset write-down
                  interconnects into a single unified double-entry ledger core. Zero float drift,
                  40-digit precision, and instant statutory compliance.
                </p>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <Link
                    href="/login?redirect=/dashboard"
                    style={{
                      background: "#141514",
                      color: "#FAF7F2",
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      padding: "0.85rem 1.65rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>Launch Live Dashboard</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/pricing"
                    style={{
                      background: "transparent",
                      color: "#141514",
                      border: "1px solid #E5E0D5",
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      padding: "0.85rem 1.65rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                    }}
                  >
                    View Pricing Plans
                  </Link>
                </div>
              </div>

              {/* Right Architecture Card */}
              <div
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #E5E0D5",
                  borderRadius: "12px",
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #E5E0D5",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#141514",
                    }}
                  >
                    Core Invariants (I1–I6)
                  </span>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(20, 21, 20, 0.06)",
                      color: "#141514",
                    }}
                  >
                    Continuous Verification
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E0D5",
                      borderRadius: "8px",
                      padding: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "0.6875rem", color: "#5A5955", textTransform: "uppercase" }}>
                      Journal Invariant
                    </span>
                    <p style={{ margin: "4px 0 0 0", fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace" }}>
                      Σ DR = Σ CR
                    </p>
                  </div>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E0D5",
                      borderRadius: "8px",
                      padding: "1rem",
                    }}
                  >
                    <span style={{ fontSize: "0.6875rem", color: "#5A5955", textTransform: "uppercase" }}>
                      Pacioli Equilibrium
                    </span>
                    <p style={{ margin: "4px 0 0 0", fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace" }}>
                      A ≡ L + E
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E0D5",
                    borderRadius: "8px",
                    padding: "1rem",
                  }}
                >
                  <span style={{ fontSize: "0.6875rem", color: "#5A5955", textTransform: "uppercase" }}>
                    Precision Engine
                  </span>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      color: "#D8543D",
                      fontFamily: "monospace",
                    }}
                  >
                    40-digit integer paisa (decimal.js)
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "#5A5955",
                    borderTop: "1px solid #E5E0D5",
                    paddingTop: "0.75rem",
                  }}
                >
                  <span>25 Benchmark Datasets</span>
                  <span style={{ color: "#D8543D", fontWeight: 600 }}>Zero Drift Confirmed</span>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Topology Section */}
          <section
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E0D5",
              borderRadius: "16px",
              padding: "clamp(2rem, 5vw, 3.5rem)",
              boxShadow: "0 2px 12px rgba(20, 21, 20, 0.04)",
              marginBottom: "3.5rem",
            }}
          >
            <div style={{ marginBottom: "2rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#D8543D",
                }}
              >
                System Topology
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  margin: "0.5rem 0 0.5rem 0",
                }}
              >
                How business events map into double-entry ledger vouchers.
              </h2>
              <p style={{ color: "#5A5955", margin: 0, maxWidth: "60ch" }}>
                Select a business event module below to inspect its debit and credit account postings,
                enforced invariants, and architectural execution rules.
              </p>
            </div>

            {/* Module Picker Buttons */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                overflowX: "auto",
                paddingBottom: "0.75rem",
                marginBottom: "1.75rem",
              }}
            >
              {TOPOLOGY_NODES.map((node) => {
                const isSelected = selectedNode.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{
                      padding: "0.6rem 1.1rem",
                      borderRadius: "8px",
                      border: `1px solid ${isSelected ? "#141514" : "#E5E0D5"}`,
                      background: isSelected ? "#141514" : "#FAF7F2",
                      color: isSelected ? "#FAF7F2" : "#141514",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {node.name}
                  </button>
                );
              })}
            </div>

            {/* Selected Module Detail Panel */}
            <div
              style={{
                background: "#FAF7F2",
                border: "1px solid #E5E0D5",
                borderRadius: "12px",
                padding: "2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "#D8543D",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {selectedNode.category}
                  </span>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      margin: "0.25rem 0 0 0",
                      fontFamily: "var(--font-serif), Georgia, serif",
                    }}
                  >
                    {selectedNode.name}
                  </h3>
                </div>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E0D5",
                    borderRadius: "6px",
                    padding: "0.4rem 0.85rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#141514",
                    fontFamily: "monospace",
                  }}
                >
                  {selectedNode.invariant}
                </div>
              </div>

              <p style={{ color: "#5A5955", fontSize: "0.9375rem", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
                {selectedNode.summary}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E0D5",
                    borderRadius: "8px",
                    padding: "1.25rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "#D8543D",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Debit Accounts (DR)
                  </span>
                  <ul style={{ margin: "0.75rem 0 0 0", paddingLeft: "1.25rem", color: "#141514", fontSize: "0.875rem" }}>
                    {selectedNode.debitAccounts.map((acc) => (
                      <li key={acc} style={{ marginBottom: "0.35rem" }}>
                        <strong>{acc}</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E0D5",
                    borderRadius: "8px",
                    padding: "1.25rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "#141514",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Credit Accounts (CR)
                  </span>
                  <ul style={{ margin: "0.75rem 0 0 0", paddingLeft: "1.25rem", color: "#141514", fontSize: "0.875rem" }}>
                    {selectedNode.creditAccounts.map((acc) => (
                      <li key={acc} style={{ marginBottom: "0.35rem" }}>
                        <strong>{acc}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Directory of Modules Grid */}
          <section style={{ marginBottom: "3.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#D8543D",
                }}
              >
                Platform Modules
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  marginTop: "0.5rem",
                }}
              >
                Nine specialized modules, one unified ledger.
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {PAGES_DIRECTORY.map((mod) => (
                <div
                  key={mod.route}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E0D5",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "#D8543D",
                          fontFamily: "monospace",
                        }}
                      >
                        {mod.iconNum}
                      </span>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: "#FAF7F2",
                          border: "1px solid #E5E0D5",
                          color: "#5A5955",
                        }}
                      >
                        {mod.badge}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        margin: "0 0 0.5rem 0",
                        color: "#141514",
                      }}
                    >
                      {mod.title}
                    </h3>

                    <p style={{ color: "#5A5955", fontSize: "0.875rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                      {mod.desc}
                    </p>

                    <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#5A5955", fontSize: "0.8125rem", lineHeight: 1.6 }}>
                      {mod.features.map((feat) => (
                        <li key={feat}>{feat}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: "1.5rem", paddingTop: "0.75rem", borderTop: "1px solid #FAF7F2" }}>
                    <Link
                      href={mod.route}
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: "#141514",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <span>Open {mod.title}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Architecture FAQs */}
          <section
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E0D5",
              borderRadius: "16px",
              padding: "clamp(2rem, 5vw, 3.5rem)",
              boxShadow: "0 2px 12px rgba(20, 21, 20, 0.04)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#D8543D",
                }}
              >
                Technical Standards
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  marginTop: "0.5rem",
                }}
              >
                Frequently asked architectural questions.
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "48rem", marginInline: "auto" }}>
              {ARCHITECTURE_FAQS.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={faq.q}
                    style={{
                      border: "1px solid #E5E0D5",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: isOpen ? "#FAF7F2" : "#FFFFFF",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      style={{
                        width: "100%",
                        padding: "1.25rem 1.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: "#141514",
                      }}
                    >
                      <span>{faq.q}</span>
                      <span style={{ fontSize: "1.1rem", marginLeft: "1rem" }}>{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          padding: "0 1.5rem 1.25rem 1.5rem",
                          color: "#5A5955",
                          fontSize: "0.875rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Public Footer */}
      <Footer variant="marketing" />
    </div>
  );
}
