"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ArrowRight,
  ExternalLink,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Maximize2,
  X,
  FileText,
  BookOpen,
  Receipt,
  FileSpreadsheet,
  Users,
  CreditCard,
  Building2,
  Boxes,
  Target,
  RefreshCw,
  Lock,
  Camera,
  PiggyBank,
  Filter,
} from "lucide-react";
import StaggeredMenu from "@/components/StaggeredMenu";
import { PUBLIC_NAV_ITEMS, PUBLIC_SOCIAL_ITEMS } from "@/lib/nav";
import { Footer } from "@/components/footer";
import { Seal } from "@/components/ui/seal";

interface ModuleData {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: "Core" | "Books" | "Commercial" | "Treasury" | "Governance";
  href: string;
  image: string;
  badge: string;
  sealType?: "POSTED" | "AUDITED" | "NBR_9_1" | "LOCKED";
  invariant: string;
  problemSolved: string;
  whatToExpect: string;
  highlights: string[];
  accounts: string;
  permission: string;
}

const MODULES_CATALOG: ModuleData[] = [
  {
    id: "dashboard",
    number: "01",
    title: "Executive Dashboard",
    subtitle: "Real-time BDT liquidity, monthly burn, runway, and net worth posture",
    category: "Core",
    href: "/dashboard",
    image: "/modules/dashboard.png",
    badge: "Executive Control",
    sealType: "POSTED",
    invariant: "Invariant I5: Operating Runway = Liquid Cash ÷ Average Monthly Burn",
    problemSolved:
      "Executives and finance leaders struggle to see immediate cash standing without waiting for end-of-month accountant spreadsheets.",
    whatToExpect:
      "A high-contrast visual cockpit showing instant cash-in-bank, Accounts Receivable aging, Accounts Payable dues, monthly burn rate, and a 25-case benchmark selector to stress-test real scenarios.",
    highlights: [
      "Live BDT cash balance aggregated across all active bank and vault accounts",
      "Receivables vs. payables spread with 30/60/90-day overdue indicators",
      "Benchmark loader to instantly inspect manufacturing, trading, or service books",
      "Direct action buttons to post journal entries or scan receipts with zero friction",
    ],
    accounts: "1010 Bank Vault, 1100 Receivables, 2000 Payables",
    permission: "dashboard.view",
  },
  {
    id: "insights",
    number: "02",
    title: "Financial Intelligence & Insights",
    subtitle: "Granular category trends, anomaly detection, and burn velocity",
    category: "Core",
    href: "/insights",
    image: "/modules/insights.png",
    badge: "Predictive Analytics",
    invariant: "Rolling 30-Day Outflow Variance & Categorical Distribution",
    problemSolved:
      "Hidden spending leaks, unexplained spikes in operating expenses, and lack of clarity on whether expenditures are personal or corporate.",
    whatToExpect:
      "Comprehensive breakdown of top vendor outflows, daily spending velocity charts, category-by-category expense comparisons, and tabs separating personal money from enterprise operations.",
    highlights: [
      "Top spending category heatmaps with percentage share of monthly disbursements",
      "High-value transaction anomaly flags alerting finance teams to atypical spikes",
      "Dual workspace tabs cleanly separating corporate business expenses from owner draws",
      "Interactive time filters covering current month, quarter-to-date, and trailing year",
    ],
    accounts: "5000–5990 Operating Expenses, 3010 Owner Drawings",
    permission: "insights.view",
  },
  {
    id: "accounts",
    number: "03",
    title: "Chart of Accounts (COA)",
    subtitle: "5-Tier Pacioli hierarchy enforcing strict normal balance parity",
    category: "Books",
    href: "/accounts",
    image: "/modules/accounts.png",
    badge: "Pacioli Standard",
    sealType: "POSTED",
    invariant: "Invariant I2: Permanent Accounts Roll Forward; Temporary Accounts Close to Equity",
    problemSolved:
      "Disorganized ledgers where asset, liability, and expense accounts are mixed up, making it impossible to produce a balanced trial balance.",
    whatToExpect:
      "A structured 4-digit hierarchical chart (1000 Assets, 2000 Liabilities, 3000 Equity, 4000 Revenue, 5000 Expenses). Every account has its normal balance enforced, transaction count displayed, and instant drill-down to its full audit register.",
    highlights: [
      "Strict normal balance enforcement: debits increase Assets & Expenses; credits increase Liabilities, Equity & Revenue",
      "Control accounts linked to Sub-Ledgers (Customers quote 1100 AR, Suppliers quote 2000 AP)",
      "Zero account deletion: retired accounts are archived to preserve historical transaction integrity",
      "Quick account creator with automatic code assignment and type classification",
    ],
    accounts: "Full General Ledger (Codes 1000 through 5999)",
    permission: "coa.read",
  },
  {
    id: "journals",
    number: "04",
    title: "Journal Entries & General Ledger",
    subtitle: "Single-write-path double-entry vouchers with mandatory integer balancing",
    category: "Books",
    href: "/journals",
    image: "/modules/journals.png",
    badge: "Core Invariant I1",
    sealType: "POSTED",
    invariant: "Invariant I1: Σ Debits = Σ Credits strictly at integer paisa resolution",
    problemSolved:
      "Unbalanced transactions, floating-point rounding drifts, and manual spreadsheets that allow debits not to equal credits.",
    whatToExpect:
      "The definitive single-write-path accounting kernel. Every voucher requires balanced debits and credits before submission. Any unbalanced entry is rejected at the server engine with an informative error.",
    highlights: [
      "Balanced voucher form with live running debit and credit counters",
      "Support for multi-line compound journal entries with per-line memos and segment tagging",
      "Filterable transaction feed by account, date range, or voucher number",
      "Immutable posting: posted entries cannot be silently edited; corrections require reversal vouchers",
    ],
    accounts: "All Chart of Account Codes",
    permission: "journals.read",
  },
  {
    id: "reports",
    number: "05",
    title: "Financial Statements & Reporting",
    subtitle: "Balance Sheet, Profit & Loss, Trial Balance, and Cash Flow Statements",
    category: "Books",
    href: "/reports",
    image: "/modules/reports.png",
    badge: "GAAP / IFRS Aligned",
    sealType: "AUDITED",
    invariant: "Invariant I3: Assets = Liabilities + Equity (Double-line closing rule)",
    problemSolved:
      "Manual reporting delays where CFOs must wait days to compile trial balances and balance sheets from disjointed spreadsheets.",
    whatToExpect:
      "Deterministic, instant generation of official accounting statements directly from posted journal lines. Includes Balance Sheet, Profit & Loss (P&L), Trial Balance, and Cash Flow statements with double-line closing rules.",
    highlights: [
      "Balance Sheet strictly verifying Assets = Liabilities + Equity at every historical date",
      "Income statement showing Gross Profit, Operating Expenses, and Net Net Earnings in BDT",
      "Trial balance listing all accounts with debit/credit balance verification",
      "One-click RFC-4180 CSV export and print-ready formatted layout for audit defense",
    ],
    accounts: "Consolidated Balance Sheet & Income Statement",
    permission: "reports.view",
  },
  {
    id: "tax",
    number: "06",
    title: "Statutory VAT Return (Mushak 9.1)",
    subtitle: "NBR Bangladesh VAT withholding, input tax rebate, and statutory filing",
    category: "Treasury",
    href: "/tax",
    image: "/modules/tax.png",
    badge: "NBR Form 9.1",
    sealType: "NBR_9_1",
    invariant: "Invariant I7: Net VAT Payable = Output VAT (Part 3) − Rebatable Input VAT (Part 4)",
    problemSolved:
      "Complex statutory VAT compliance under the Bangladesh VAT and Supplementary Duty Act 2012, risk of penalties, and lost input tax rebates.",
    whatToExpect:
      "A complete digital facsimile of National Board of Revenue (NBR) Form Mushak 9.1. Tracks standard 15% VAT, zero-rated exports, truncated rates, VDS (VAT Deducted at Source), and produces ready-to-file monthly return schedules.",
    highlights: [
      "Automatic bifurcation of taxable supplies into Standard 15%, Truncated, and Exempt sales",
      "Input Tax Credit reconciliation matching supplier Mushak 6.3 invoices against treasury accounts",
      "VDS withholding register automatically computing treasury deposit obligations",
      "Statutory period freeze ensuring filed VAT returns cannot be modified post-submission",
    ],
    accounts: "2100 VAT Output Payable, 1150 Input VAT Rebatable",
    permission: "tax.read",
  },
  {
    id: "sales",
    number: "07",
    title: "Sales & Invoicing",
    subtitle: "Customer tax invoices, Mushak 6.3 compliance, and accounts receivable",
    category: "Commercial",
    href: "/sales",
    image: "/modules/sales.png",
    badge: "Trade Engine",
    sealType: "POSTED",
    invariant: "Invoice Gross = Line Subtotals + VAT − Trade Discounts − Advance Adjustments",
    problemSolved:
      "Disjointed invoicing systems that fail to calculate statutory VAT correctly, fail to adjust advances, and leave receivables untracked.",
    whatToExpect:
      "Full B2B commercial billing workflow. Issue professional invoices with automatic 15% VAT calculation, apply customer deposits from Account 2050, print statutory tax invoices, and record partial settlements.",
    highlights: [
      "Line-item item catalog lookup with automatic unit pricing and SKU tax code prefill",
      "Integrated customer advance adjustment deducting prepayments at the invoice level",
      "Instant journal voucher generation crediting 4000 Sales Revenue and 2100 VAT Payable",
      "Customer aging register highlighting overdue receivables with payment tracking",
    ],
    accounts: "1100 Accounts Receivable, 4000 Sales Revenue, 2100 VAT Payable",
    permission: "sales.read",
  },
  {
    id: "banking",
    number: "08",
    title: "Bank & Cash Reconciliations",
    subtitle: "Multi-bank statement reconciliation, uncleared checks, and cash vaults",
    category: "Treasury",
    href: "/banking",
    image: "/modules/banking.png",
    badge: "Treasury Control",
    invariant: "Adjusted Bank Balance = Statement Ending + Deposits in Transit − Outstanding Checks",
    problemSolved:
      "Book balance differing from actual bank statements, unnoticed unauthorized debits, and lost track of transit deposits.",
    whatToExpect:
      "Treasury management interface connecting general ledger cash accounts (1010) to real commercial bank accounts. Import statements, match bank credits with journal receipts, and reconcile uncleared instruments.",
    highlights: [
      "Side-by-side reconciliation tool matching bank statement rows against general ledger debits/credits",
      "Support for multiple corporate accounts (City Bank, BRAC Bank, Eastern Bank, Petty Cash)",
      "Automated detection of bank service fees and interest earnings with instant adjusting entry posting",
      "Reconciliation sign-off history guaranteeing closed bank periods cannot be tampered with",
    ],
    accounts: "1010 Bank Main, 1020 Petty Cash Vault",
    permission: "banking.read",
  },
  {
    id: "staff",
    number: "09",
    title: "Staff Directory & Payroll",
    subtitle: "Two-step salary posting, tax withholding, staff loan recovery, and payslips",
    category: "Treasury",
    href: "/staff",
    image: "/modules/staff.png",
    badge: "Payroll P11",
    sealType: "POSTED",
    invariant: "Net Pay = Gross Salary − Income Tax Withholding − Staff Loan Amortization",
    problemSolved:
      "Messy Excel payroll calculations, manual tax deductions, and forgetting to recover staff loans from salary payments.",
    whatToExpect:
      "Enterprise payroll engine executing statutory salary runs. Features two-step accounting: Step 1 posts Salary Accrual (Expense vs. Payable); Step 2 executes Bank Disbursement. Generates PDF pay slips with tax certificates.",
    highlights: [
      "Staff member directory recording employee designation, basic salary, allowances, and tax code",
      "Automated employee loan amortizations recovering monthly installments via Account 1600",
      "Income tax withholding calculation with statutory Mushak tax compliance",
      "Batch disbursement posting recording single wire transfer journal voucher",
    ],
    accounts: "5000 Staff Salaries, 2300 Payroll Payable, 1600 Staff Loans",
    permission: "staff.read",
  },
  {
    id: "inventory",
    number: "10",
    title: "Warehouse Stock Valuation",
    subtitle: "Weighted-average perpetual inventory cost basis across multiple depots",
    category: "Commercial",
    href: "/inventory",
    image: "/modules/inventory.png",
    badge: "Weighted Average",
    invariant: "Cost of Goods Sold (COGS) = Units Dispatched × Moving Weighted Average Cost",
    problemSolved:
      "Inaccurate inventory valuation leading to distorted gross margin calculations and lack of warehouse stock visibility.",
    whatToExpect:
      "Perpetual inventory tracking system calculating weighted-average unit cost as items are received via purchase bills and dispatched via sales invoices. Multi-depot visibility prevents stockouts.",
    highlights: [
      "Moving weighted-average unit cost re-evaluated with every vendor bill receipt",
      "Automated COGS journal entry posted upon sales invoice dispatch (Debit 5100 COGS / Credit 1200 Inventory)",
      "Multi-warehouse tracking supporting Central Warehouse, Depot Chittagong, and Retail outlets",
      "Low stock threshold alerts and stock adjustment journal integration for spoilage or shrinkage",
    ],
    accounts: "1200 Inventory Asset, 5100 Cost of Goods Sold",
    permission: "inventory.read",
  },
  {
    id: "receipts",
    number: "11",
    title: "OCR Receipt Scanner",
    subtitle: "Computer vision line-item parsing, cash memo ingestion, and expense filing",
    category: "Core",
    href: "/receipts",
    image: "/modules/receipts.png",
    badge: "Computer Vision",
    invariant: "Scanned Receipt BDT = Sum of Extracted Line Items + VAT Memo",
    problemSolved:
      "Lost paper receipts, tedious manual data entry of cash memos, and missed business tax write-offs.",
    whatToExpect:
      "Upload or take a photo of any printed tax invoice, receipt, or thermal cash memo. The system extracts merchant name, date, subtotal, VAT, and line items, presenting a pre-filled voucher ready for one-click posting.",
    highlights: [
      "Multi-format OCR parser supporting high-resolution JPG, PNG, and PDF receipts",
      "Instant merchant name and expense category auto-classification",
      "Side-by-side inspection view comparing original scanned document against parsed values",
      "Zero float drift: parses amounts down to integer paisa resolution",
    ],
    accounts: "5200 Office Expense, 1020 Petty Cash, 1150 Input VAT",
    permission: "receipts.scan",
  },
  {
    id: "budgets",
    number: "12",
    title: "Budgets & Variance Analysis",
    subtitle: "Departmental expenditure caps, realized variance, and burn ceilings",
    category: "Books",
    href: "/budgets",
    image: "/modules/budgets.png",
    badge: "Variance Analytics",
    invariant: "Variance BDT = Budget Allocation − Realized General Ledger Debits",
    problemSolved:
      "Departments overspending quarterly budgets without management noticing until after accounts close.",
    whatToExpect:
      "Set quarterly or annual expense ceilings across general ledger accounts and cost center segments. Real-time variance monitor tracks realized spend against budgeted amounts with color-coded warning thresholds.",
    highlights: [
      "Quarterly budget allocation by expense category and operating department",
      "Real-time spend tracking reflecting posted journal vouchers instantly",
      "Variance percentage calculations alerting controllers to unfavorable deviations",
      "Historical budget vs. actual comparison aiding executive forecasting",
    ],
    accounts: "5000–5999 Operating Expense Accounts",
    permission: "budgets.read",
  },
  {
    id: "audit",
    number: "13",
    title: "Immutable Audit Trail",
    subtitle: "Append-only ledger of actor mutations, IP addresses, and cryptographic diffs",
    category: "Governance",
    href: "/audit",
    image: "/modules/audit.png",
    badge: "Invariant I6",
    sealType: "AUDITED",
    invariant: "Invariant I6: Audit log is append-only; update/delete operations throw fatal errors",
    problemSolved:
      "Tampering with past accounting records, fraudulent modifications, and lack of accountability for financial edits.",
    whatToExpect:
      "Enterprise audit explorer querying the immutable AuditLog collection. Every financial mutation snapshots the acting user UID, IP address, timestamp in Asia/Dhaka time, action code, and full JSON before/after state diff.",
    highlights: [
      "Append-only database schema blocking updateOne, deleteOne, and findOneAndDelete at the Mongoose kernel",
      "Granular entity filtering (journal entries, invoices, payroll runs, fixed assets, settings)",
      "Interactive Before/After modal visualizing exact fields altered during any edit",
      "Dhaka timezone timestamps ensuring complete legal compliance with Bangladesh regulatory audits",
    ],
    accounts: "Immutable AuditLog Storage",
    permission: "audit.read",
  },
  {
    id: "segments",
    number: "14",
    title: "Cost Centers & Analytical Segments",
    subtitle: "Branch locations, cost centers, projects, and departments",
    category: "Governance",
    href: "/segments",
    image: "/modules/segments.png",
    badge: "Multi-Dimension",
    invariant: "Segment Tagging maintains GL Chart of Accounts purity without account explosion",
    problemSolved:
      "Chart of accounts clutter caused by creating separate accounts for every branch or project (e.g. Rent-Dhaka, Rent-Chittagong).",
    whatToExpect:
      "Define analytical dimensions (Branch, Department, Capital Project, Cost Center). Tag these dimensions on individual journal lines and sales invoices to generate divisional P&L statements without expanding the GL chart.",
    highlights: [
      "Four distinct classification types: Branch Location, Operating Department, Project, Cost Center",
      "Immutable code handles guaranteeing document references never break",
      "Soft-retirement lifecycle preserving historical transaction tagging",
      "Divisional profit and loss filtering across all financial reporting",
    ],
    accounts: "Tagging on all GL Line Items",
    permission: "segments.read",
  },
  {
    id: "parties",
    number: "15",
    title: "Master Counterparties",
    subtitle: "Customers, vendors, contractors, and statutory agencies with control accounts",
    category: "Commercial",
    href: "/parties",
    image: "/modules/parties.png",
    badge: "Master Data",
    invariant: "Every Party links directly to Control Account 1100 (AR) or 2000 (AP)",
    problemSolved:
      "Disconnected contact lists with no direct link to accounts receivable or accounts payable balances.",
    whatToExpect:
      "Unified counterparty directory for all organizations you do business with. Categorize entities as Customer, Supplier, or Both. Every party links to an asset or liability control account, ensuring balanced sub-ledger accounting.",
    highlights: [
      "Customer & Supplier classification with automatic default control account prefill",
      "Contact details, BIN (Business Identification Number), and statutory TIN tracking",
      "Historical document registry showing all invoices, bills, and advances issued to each counterparty",
      "Strict code permanence preventing broken transaction links",
    ],
    accounts: "1100 Accounts Receivable, 2000 Accounts Payable",
    permission: "masterdata.read",
  },
  {
    id: "command_palette",
    number: "16",
    title: "Executive Command Palette (⌘K)",
    subtitle: "Instant hotkey jump to all 30+ screens, actions, and ledger vouchers",
    category: "Core",
    href: "/dashboard",
    image: "/modules/command_palette.png",
    badge: "Atelier Speed",
    invariant: "Single Hotkey Dispatches Any Enterprise Action in Under 200ms",
    problemSolved:
      "Wasting time clicking through multi-level navigation trees to find specific screens or record entries.",
    whatToExpect:
      "Press ⌘K (or Ctrl+K) anywhere across the application to invoke the executive spotlight modal. Instantly jump to any module, create a journal voucher, issue an invoice, or inspect audit logs with keyboard shortcuts.",
    highlights: [
      "Global hotkey listener accessible from all public and authenticated screens",
      "Full index covering all 30+ pages, statutory reports, and master data catalogs",
      "Quick action triggers for recording vouchers, scanning receipts, and creating dimensions",
      "Minimalist atelier design adhering strictly to the 3-color palette",
    ],
    accounts: "Global Application Interface",
    permission: "Universal",
  },
  {
    id: "sandbox",
    number: "17",
    title: "Live Financial Math Sandbox",
    subtitle: "Interactive double-entry balancing simulator and compound DPS calculator",
    category: "Core",
    href: "/#sandbox",
    image: "/modules/sandbox.png",
    badge: "Math Verification",
    sealType: "POSTED",
    invariant: "Live Verification of IEEE-754 Float Prohibition & Exact Paisa Arithmetic",
    problemSolved:
      "Skepticism over whether an accounting system truly computes with exact 40-digit decimal arithmetic without floating-point errors.",
    whatToExpect:
      "Interactive simulation sandbox on the homepage. Enter custom debit and credit values, test unbalanced vouchers, and calculate compound Deposit Pension Scheme (DPS) yields with verified mathematical precision.",
    highlights: [
      "Real-time visual feedback on debit vs. credit balance state",
      "Compound interest engine simulating monthly DPS growth over 1 to 10 years",
      "Zero float drift demonstration comparing standard JavaScript math against Ledger kernel",
      "Direct code explanation highlighting the single-write-path posting rule",
    ],
    accounts: "Interactive Client Engine",
    permission: "Public Access",
  },
  {
    id: "pricing",
    number: "18",
    title: "Transparent Enterprise Pricing",
    subtitle: "Clear monthly and annual corporate plans with interactive ROI calculator",
    category: "Governance",
    href: "/pricing",
    image: "/modules/pricing.png",
    badge: "Commercial Tier",
    invariant: "Transparent BDT Billing with Zero Hidden Transaction Surcharges",
    problemSolved:
      "Opaque enterprise pricing models that hide costs behind sales calls and add unexpected per-voucher fees.",
    whatToExpect:
      "Dedicated pricing page featuring Starter, Growth, and Enterprise atelier tiers. Includes an interactive ROI calculator modeling time saved on NBR VAT filings, audit preparation, and payroll runs.",
    highlights: [
      "Three clear tiers tailored for early-stage companies, growing businesses, and enterprise conglomerates",
      "Interactive ROI calculator adjusting for team size and monthly voucher volume",
      "Annual billing discount with two months complimentary service",
      "Full feature comparison matrix detailing permissions, audit retention, and API access",
    ],
    accounts: "Corporate Subscription Engine",
    permission: "Public Access",
  },
  {
    id: "about_topology",
    number: "19",
    title: "Architectural Topology & Invariants",
    subtitle: "System topology map, double-entry nodes, and engineering invariants",
    category: "Governance",
    href: "/about",
    image: "/modules/about_topology.png",
    badge: "System Philosophy",
    sealType: "AUDITED",
    invariant: "Core Invariants I1 through I16 Defining Single-Write-Path Integrity",
    problemSolved:
      "Lack of architectural documentation explaining how complex accounting sub-systems connect together.",
    whatToExpect:
      "Comprehensive architectural manifesto detailing Ledger's origins, 16 core mathematical invariants, interactive ledger topology node explorer, and FAQ addressing enterprise audit compliance.",
    highlights: [
      "Interactive system topology explorer showing debit and credit accounts for every subsystem",
      "Deep dive into the 16 core mathematical invariants safeguarding tenant books",
      "Company origins and engineering principles rooted in Dhaka corporate reality",
      "Legal and regulatory compliance guarantees under Bangladesh Companies Act 1994",
    ],
    accounts: "System Architecture Specification",
    permission: "Public Access",
  },
];

export default function ModulesPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    "All" | "Core" | "Books" | "Commercial" | "Treasury" | "Governance"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxModule, setLightboxModule] = useState<ModuleData | null>(null);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MODULES_CATALOG.filter((m) => {
      if (selectedCategory !== "All" && m.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.problemSolved.toLowerCase().includes(q) ||
        m.invariant.toLowerCase().includes(q) ||
        m.highlights.some((h) => h.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

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

      <main style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
        <div style={{ maxWidth: "80rem", marginInline: "auto", paddingInline: "1.5rem" }}>
          {/* Hero Section */}
          <section
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E0D5",
              borderRadius: "16px",
              padding: "clamp(2rem, 5vw, 4rem)",
              boxShadow: "0 2px 12px rgba(20, 21, 20, 0.04)",
              marginBottom: "3rem",
            }}
          >
            <div style={{ maxWidth: "58rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: "rgba(216, 84, 61, 0.08)",
                  border: "1px solid rgba(216, 84, 61, 0.25)",
                  color: "#D8543D",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "1.25rem",
                }}
              >
                <Layers size={13} />
                <span>SYSTEM DIRECTORY &amp; CAPABILITY CATALOG · 19 VERIFIED MODULES</span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  margin: "0 0 1.25rem 0",
                  color: "#141514",
                }}
              >
                Every module built with mathematical certainty.
              </h1>

              <p
                style={{
                  fontSize: "1.125rem",
                  lineHeight: 1.7,
                  color: "#5A5955",
                  margin: "0 0 2rem 0",
                  maxWidth: "52ch",
                }}
              >
                Explore every screen, ledger workflow, and statutory schedule in Ledger. Each module is documented below with real high-resolution screenshots, business problem context, and architectural invariants.
              </p>

              <div className="row" style={{ gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  href="/login?redirect=/dashboard"
                  className="btn btn--primary"
                  style={{
                    padding: "0.8rem 1.75rem",
                    fontSize: "0.95rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>Launch Live Platform</span>
                  <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
                  }}
                  className="btn btn--quiet"
                  style={{
                    padding: "0.8rem 1.25rem",
                    fontSize: "0.95rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>Quick Jump</span>
                  <span className="hotkey-pill">⌘K</span>
                </button>
              </div>
            </div>
          </section>

          {/* Interactive Filter & Search Bar */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E0D5",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              marginBottom: "3rem",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            {/* Category Pills */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {(
                [
                  "All",
                  "Core",
                  "Books",
                  "Commercial",
                  "Treasury",
                  "Governance",
                ] as const
              ).map((cat) => {
                const count =
                  cat === "All"
                    ? MODULES_CATALOG.length
                    : MODULES_CATALOG.filter((m) => m.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "6px",
                      border: isSelected ? "1px solid #141514" : "1px solid #E5E0D5",
                      background: isSelected ? "#141514" : "#FAF7F2",
                      color: isSelected ? "#FAF7F2" : "#141514",
                      fontSize: "0.825rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{cat}</span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        background: isSelected ? "rgba(250, 247, 242, 0.2)" : "rgba(20, 21, 20, 0.08)",
                        color: isSelected ? "#FAF7F2" : "#5A5955",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#FAF7F2",
                border: "1px solid #E5E0D5",
                borderRadius: "6px",
                padding: "0.4rem 0.75rem",
                minWidth: "260px",
              }}
            >
              <Search size={14} color="#8A8780" />
              <input
                type="text"
                placeholder="Search modules, invariants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.85rem",
                  width: "100%",
                  color: "#141514",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <X size={12} color="#8A8780" />
                </button>
              )}
            </div>
          </div>

          {/* Modules Gallery Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
            {filteredModules.length === 0 ? (
              <div
                style={{
                  padding: "4rem",
                  textAlign: "center",
                  background: "#FFFFFF",
                  border: "1px solid #E5E0D5",
                  borderRadius: "12px",
                }}
              >
                <Layers size={36} style={{ color: "#8A8780", margin: "0 auto 1rem auto" }} />
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>No matching modules</h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                  Try resetting your search query or selecting a different category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="btn btn--quiet btn--sm"
                  style={{ marginTop: "1rem" }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredModules.map((mod, index) => {
                const isEven = index % 2 === 0;
                return (
                  <article
                    key={mod.id}
                    id={mod.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E0D5",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 3px 14px rgba(20, 21, 20, 0.03)",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                      gap: 0,
                    }}
                  >
                    {/* Visual Screenshot Side */}
                    <div
                      style={{
                        padding: "1.75rem",
                        background: "#F4EFE6",
                        borderRight: "1px solid #E5E0D5",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        position: "relative",
                        order: isEven ? 1 : 2,
                      }}
                    >
                      {/* Screenshot Frame with Browser Top Bar */}
                      <div
                        style={{
                          background: "#FFFFFF",
                          borderRadius: "10px",
                          border: "1px solid #D8D2C5",
                          overflow: "hidden",
                          boxShadow: "0 12px 28px -6px rgba(20, 21, 20, 0.12)",
                          position: "relative",
                          cursor: "pointer",
                          transition: "transform 0.25s ease, box-shadow 0.25s ease",
                        }}
                        onClick={() => setLightboxModule(mod)}
                        title="Click to inspect full resolution screenshot"
                      >
                        {/* Chrome window header */}
                        <div
                          style={{
                            padding: "8px 12px",
                            background: "#ECE6D8",
                            borderBottom: "1px solid #D8D2C5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ display: "flex", gap: "5px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D8543D" }} />
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#E5E0D5" }} />
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#E5E0D5" }} />
                          </div>
                          <span
                            className="mono"
                            style={{
                              fontSize: "0.6875rem",
                              color: "#5A5955",
                              letterSpacing: "0.02em",
                            }}
                          >
                            app.ledger.local{mod.href}
                          </span>
                          <Maximize2 size={11} color="#5A5955" />
                        </div>

                        {/* Image Preview */}
                        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9.2", background: "#FAF7F2" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mod.image}
                            alt={`${mod.title} Screenshot Preview`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "top left",
                              display: "block",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(20, 21, 20, 0.0)",
                              transition: "background 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(20, 21, 20, 0.25)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(20, 21, 20, 0.0)";
                            }}
                          >
                            <span
                              style={{
                                background: "#141514",
                                color: "#FAF7F2",
                                padding: "6px 14px",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                opacity: 0.9,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Maximize2 size={12} />
                              <span>Inspect Full Resolution</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Image Caption & Invariant Rule */}
                      <div
                        style={{
                          marginTop: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "0.75rem",
                          color: "#5A5955",
                        }}
                      >
                        <span className="mono" style={{ color: "#D8543D", fontWeight: 600 }}>
                          {mod.invariant}
                        </span>
                        {mod.sealType && <Seal type={mod.sealType} reference={mod.number} />}
                      </div>
                    </div>

                    {/* Editorial Content Side */}
                    <div
                      style={{
                        padding: "clamp(1.75rem, 3.5vw, 2.75rem)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        order: isEven ? 2 : 1,
                      }}
                    >
                      <div>
                        {/* Header Eyebrow */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span
                              className="mono"
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: "#D8543D",
                              }}
                            >
                              MODULE {mod.number}
                            </span>
                            <span style={{ color: "#D8D2C5" }}>·</span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "#8A8780",
                                fontWeight: 600,
                              }}
                            >
                              {mod.category}
                            </span>
                          </div>

                          <span
                            className="chip"
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              background: "#FAF7F2",
                              border: "1px solid #E5E0D5",
                              color: "#141514",
                            }}
                          >
                            {mod.badge}
                          </span>
                        </div>

                        {/* Title & Subtitle */}
                        <h2
                          style={{
                            fontFamily: "var(--font-serif), serif",
                            fontSize: "clamp(1.5rem, 2.5vw, 1.95rem)",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            margin: "0 0 0.5rem 0",
                            color: "#141514",
                          }}
                        >
                          {mod.title}
                        </h2>

                        <p
                          style={{
                            fontSize: "0.95rem",
                            lineHeight: 1.6,
                            color: "#5A5955",
                            margin: "0 0 1.5rem 0",
                          }}
                        >
                          {mod.subtitle}
                        </p>

                        {/* Business Context & What to Expect */}
                        <div
                          style={{
                            background: "#FAF7F2",
                            border: "1px solid #E5E0D5",
                            borderRadius: "8px",
                            padding: "1rem",
                            marginBottom: "1.5rem",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontWeight: 700,
                              color: "#141514",
                              marginBottom: "0.35rem",
                            }}
                          >
                            What This Solves:
                          </div>
                          <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", color: "#5A5955", lineHeight: 1.55 }}>
                            {mod.problemSolved}
                          </p>

                          <div
                            style={{
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontWeight: 700,
                              color: "#141514",
                              marginBottom: "0.35rem",
                            }}
                          >
                            What To Expect In-App:
                          </div>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#5A5955", lineHeight: 1.55 }}>
                            {mod.whatToExpect}
                          </p>
                        </div>

                        {/* Key Capabilities Checklist */}
                        <div style={{ marginBottom: "1.75rem" }}>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontWeight: 700,
                              color: "#141514",
                              marginBottom: "0.6rem",
                            }}
                          >
                            Key Capabilities:
                          </div>
                          <ul
                            style={{
                              margin: 0,
                              padding: 0,
                              listStyle: "none",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.45rem",
                            }}
                          >
                            {mod.highlights.map((h, i) => (
                              <li
                                key={i}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "0.5rem",
                                  fontSize: "0.825rem",
                                  color: "#141514",
                                  lineHeight: 1.45,
                                }}
                              >
                                <CheckCircle2
                                  size={13}
                                  color="#D8543D"
                                  style={{ flexShrink: 0, marginTop: "2px" }}
                                />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Footer Specs & Action Button */}
                      <div
                        style={{
                          borderTop: "1px solid #E5E0D5",
                          paddingTop: "1.25rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "1rem",
                        }}
                      >
                        <div style={{ fontSize: "0.75rem" }}>
                          <span className="muted" style={{ display: "block" }}>Accounts Touched:</span>
                          <span className="mono" style={{ fontWeight: 600, color: "#141514" }}>
                            {mod.accounts}
                          </span>
                        </div>

                        <Link
                          href={mod.href}
                          className="btn btn--primary btn--sm"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.5rem 1rem",
                          }}
                        >
                          <span>Launch Module</span>
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Lightbox Full-Screen Modal */}
      {lightboxModule && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(20, 21, 20, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setLightboxModule(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              maxWidth: "1100px",
              width: "100%",
              overflow: "hidden",
              border: "1px solid #383935",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div
              style={{
                padding: "1rem 1.5rem",
                background: "#141514",
                color: "#FAF7F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span className="mono" style={{ color: "#D8543D", fontSize: "0.8rem", fontWeight: 700 }}>
                  MODULE {lightboxModule.number} · {lightboxModule.category.toUpperCase()}
                </span>
                <h3 style={{ margin: "2px 0 0 0", fontSize: "1.15rem", fontWeight: 700 }}>
                  {lightboxModule.title}
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Link
                  href={lightboxModule.href}
                  className="btn btn--primary btn--sm"
                  style={{
                    background: "#D8543D",
                    color: "#FAF7F2",
                    fontSize: "0.8rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span>Open Live Screen</span>
                  <ExternalLink size={12} />
                </Link>
                <button
                  type="button"
                  onClick={() => setLightboxModule(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#FAF7F2",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  title="Close (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lightbox Image Viewport */}
            <div
              style={{
                maxHeight: "75vh",
                overflowY: "auto",
                background: "#FAF7F2",
                padding: "1rem",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxModule.image}
                alt={`${lightboxModule.title} Full Resolution`}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: "6px",
                  border: "1px solid #E5E0D5",
                }}
              />
            </div>

            {/* Lightbox Footer Notes */}
            <div
              style={{
                padding: "0.8rem 1.5rem",
                background: "#FAF7F2",
                borderTop: "1px solid #E5E0D5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.8rem",
              }}
            >
              <span className="mono muted">{lightboxModule.invariant}</span>
              <span className="muted">Press ESC or click outside to dismiss</span>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Footer */}
      <Footer variant="marketing" />
    </div>
  );
}
