"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Activity,
  TrendingUp,
  PlusCircle,
  Camera,
  PiggyBank,
  BookOpen,
  FileText,
  RefreshCw,
  Target,
  Lock,
  BarChart3,
  Receipt,
  ShoppingBag,
  Boxes,
  Handshake,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Users,
  Settings,
  ClipboardList,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sparkles,
  FileCheck,
  Scale,
  Building,
} from "lucide-react";
import { playAcousticTick, playVaultClick, playShutterTick } from "@/lib/audio";

interface CommandItem {
  id: string;
  title: string;
  description: string;
  href?: string;
  action?: () => void;
  group: string;
  icon: React.ReactNode;
  keywords: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Hotkey Listener (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) playShutterTick();
          return !prev;
        });
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Master Navigation & Action Catalog
  const commands: CommandItem[] = useMemo(
    () => [
      // Quick Actions
      {
        id: "act-journal",
        title: "Record Journal Entry",
        description: "Post manual double-entry voucher with balanced debits and credits",
        href: "/journals",
        group: "Quick Actions",
        icon: <FileText size={16} color="#D8543D" />,
        keywords: "voucher post create journal entry double entry debit credit",
      },
      {
        id: "act-expense",
        title: "Record Quick Expense",
        description: "Log out-of-pocket operating expenditure in BDT",
        href: "/expenses",
        group: "Quick Actions",
        icon: <PlusCircle size={16} color="#D8543D" />,
        keywords: "spend cost disbursement expense out of pocket cash",
      },
      {
        id: "act-scan",
        title: "Scan Receipt with OCR",
        description: "Upload tax invoice or cash memo for instant line-item extraction",
        href: "/receipts",
        group: "Quick Actions",
        icon: <Camera size={16} color="#D8543D" />,
        keywords: "ocr camera scan upload receipt invoice voucher photo memo",
      },
      {
        id: "act-invoice",
        title: "Issue Sales Invoice",
        description: "Create customer commercial bill with Mushak VAT rate calculation",
        href: "/sales",
        group: "Quick Actions",
        icon: <Receipt size={16} color="#D8543D" />,
        keywords: "bill customer accounts receivable ar sales invoice revenue",
      },
      {
        id: "act-segment",
        title: "Create Cost Center Segment",
        description: "Add new branch, department, project, or cost division",
        href: "/segments",
        group: "Quick Actions",
        icon: <Layers size={16} color="#D8543D" />,
        keywords: "branch department project cost center segment division tag",
      },

      // Core & Insights
      {
        id: "nav-dash",
        title: "Executive Dashboard",
        description: "Real-time liquidity, cash burn, and operating KPI overview",
        href: "/dashboard",
        group: "Core & Insights",
        icon: <Activity size={16} />,
        keywords: "dashboard home overview kpi burn cash metrics balance",
      },
      {
        id: "nav-insights",
        title: "Financial Intelligence Insights",
        description: "Runway forecasting, category trends, and anomaly detection",
        href: "/insights",
        group: "Core & Insights",
        icon: <TrendingUp size={16} />,
        keywords: "analytics runway trends forecast intelligence anomaly",
      },
      {
        id: "nav-pockets",
        title: "Targeted Savings Pockets",
        description: "Sub-account liquidity rings and milestone cash reserves",
        href: "/pockets",
        group: "Core & Insights",
        icon: <PiggyBank size={16} />,
        keywords: "savings pocket reserve ringfence liquidity goal",
      },

      // Books & Accounting
      {
        id: "nav-coa",
        title: "Chart of Accounts (COA)",
        description: "Multi-tier asset, liability, equity, revenue, and expense codes",
        href: "/accounts",
        group: "Double-Entry Books",
        icon: <BookOpen size={16} />,
        keywords: "chart of accounts coa ledger asset liability equity",
      },
      {
        id: "nav-journals",
        title: "General Ledger Journals",
        description: "Audited immutable vouchers and line-item transaction feed",
        href: "/journals",
        group: "Double-Entry Books",
        icon: <FileText size={16} />,
        keywords: "journal voucher entries transactions gl audit post",
      },
      {
        id: "nav-reports",
        title: "Financial Statements & Reports",
        description: "Balance Sheet, Profit & Loss, Trial Balance, Cash Flows",
        href: "/reports",
        group: "Double-Entry Books",
        icon: <BarChart3 size={16} />,
        keywords: "balance sheet p&l profit loss trial balance statement financial",
      },
      {
        id: "nav-budgets",
        title: "Budgets & Variance Analysis",
        description: "Quarterly expenditure caps against realized transactions",
        href: "/budgets",
        group: "Double-Entry Books",
        icon: <Target size={16} />,
        keywords: "budget variance plan target cap forecast overspend",
      },
      {
        id: "nav-recurring",
        title: "Recurring & Accruals",
        description: "Automated monthly amortizations, rent, and deferred charges",
        href: "/recurring",
        group: "Double-Entry Books",
        icon: <RefreshCw size={16} />,
        keywords: "recurring automated schedule accrual amortize subscription",
      },
      {
        id: "nav-periods",
        title: "Fiscal Period Close",
        description: "Hard reconciliation locks and statutory period freeze",
        href: "/periods",
        group: "Double-Entry Books",
        icon: <Lock size={16} />,
        keywords: "period close fiscal year month lock freeze reconcile",
      },

      // Commercial & Operations
      {
        id: "nav-sales",
        title: "Sales & Accounts Receivable",
        description: "Client billing, payment settlement, and customer balances",
        href: "/sales",
        group: "Commercial & Trade",
        icon: <Receipt size={16} />,
        keywords: "sales invoice ar receivables clients customers billing",
      },
      {
        id: "nav-purchases",
        title: "Purchases & Accounts Payable",
        description: "Supplier bills, 3-way matching, and payment authorizations",
        href: "/purchases",
        group: "Commercial & Trade",
        icon: <ShoppingBag size={16} />,
        keywords: "purchases ap payables bills vendor supplier procurement",
      },
      {
        id: "nav-inventory",
        title: "Warehouse Stock Valuation",
        description: "Weighted-average cost basis, multi-warehouse item tracking",
        href: "/inventory",
        group: "Commercial & Trade",
        icon: <Boxes size={16} />,
        keywords: "inventory stock warehouse sku valuation units goods",
      },
      {
        id: "nav-advances",
        title: "Party Advances & Deposits",
        description: "Prepayments, security deposits, and contractor advance tracking",
        href: "/advances",
        group: "Commercial & Trade",
        icon: <Handshake size={16} />,
        keywords: "advance deposit retainer prepaid security contractor",
      },

      // Treasury & Compliance
      {
        id: "nav-banking",
        title: "Bank & Cash Reconciliations",
        description: "Statement imports, uncleared checks, and settlement matching",
        href: "/banking",
        group: "Treasury & Compliance",
        icon: <CreditCard size={16} />,
        keywords: "bank cash account reconcile statement clearance deposit",
      },
      {
        id: "nav-assets",
        title: "Fixed Assets & Depreciation",
        description: "Straight-line depreciation schedules and asset register",
        href: "/assets",
        group: "Treasury & Compliance",
        icon: <Building2 size={16} />,
        keywords: "fixed asset depreciation schedule equipment property book value",
      },
      {
        id: "nav-tax",
        title: "Statutory VAT Return (Mushak 9.1)",
        description: "NBR Bangladesh VAT withholding, input tax rebate, and filing",
        href: "/tax",
        group: "Treasury & Compliance",
        icon: <FileSpreadsheet size={16} />,
        keywords: "vat tax nbr mushak 9.1 withholding rebate revenue board",
      },
      {
        id: "nav-staff",
        title: "Staff Directory & Payroll",
        description: "Monthly salary disbursements, tax deductions, and pay slips",
        href: "/staff",
        group: "Treasury & Compliance",
        icon: <Users size={16} />,
        keywords: "staff payroll salary compensation wages employee payslip",
      },
      {
        id: "nav-audit",
        title: "Immutable Audit Trail",
        description: "Append-only ledger of actor mutations and cryptographic diffs",
        href: "/audit",
        group: "Treasury & Compliance",
        icon: <ShieldCheck size={16} color="#D8543D" />,
        keywords: "audit trail log immutable security actor who changed what diff",
      },

      // Master Data & Organization
      {
        id: "nav-parties",
        title: "Master Counterparties",
        description: "Customers, vendors, contractors, and statutory agencies",
        href: "/parties",
        group: "Master Data & Setup",
        icon: <Building size={16} />,
        keywords: "parties customers vendors suppliers counterparties contacts",
      },
      {
        id: "nav-items",
        title: "Product & Service Catalog",
        description: "SKU library, unit measurements, and default tax codes",
        href: "/items",
        group: "Master Data & Setup",
        icon: <Boxes size={16} />,
        keywords: "items sku product service pricing goods master",
      },
      {
        id: "nav-segments",
        title: "Cost Centers & Analytical Segments",
        description: "Branch locations, cost centers, projects, and departments",
        href: "/segments",
        group: "Master Data & Setup",
        icon: <Layers size={16} color="#D8543D" />,
        keywords: "segments cost center branch department project dimensions",
      },
      {
        id: "nav-settings",
        title: "Organization Settings & Team",
        description: "Company profile, user roles, security, and tenant config",
        href: "/settings",
        group: "Master Data & Setup",
        icon: <Settings size={16} />,
        keywords: "settings configuration team roles permissions tenant org profile",
      },

      // Governance & Legal
      {
        id: "nav-terms",
        title: "Terms of Service & Compliance",
        description: "Mathematical certainty clauses and Dhaka jurisdiction",
        href: "/terms",
        group: "Governance & Legal",
        icon: <Scale size={16} />,
        keywords: "terms service legal agreement compliance contract dhaka",
      },
      {
        id: "nav-privacy",
        title: "Privacy & Data Sovereignty Policy",
        description: "Zero third-party trackers and Companies Act 1994 compliance",
        href: "/privacy",
        group: "Governance & Legal",
        icon: <ShieldCheck size={16} />,
        keywords: "privacy data sovereignty security protection tracker",
      },
      {
        id: "nav-modules",
        title: "Platform Modules Directory",
        description: "Visual tour of all 19 platform modules with live screenshots and invariants",
        href: "/modules",
        group: "Governance & Legal",
        icon: <Layers size={16} color="#D8543D" />,
        keywords: "modules tour directory screenshots catalogue catalog features overview screens",
      },
      {
        id: "nav-pricing",
        title: "Transparent Corporate Pricing",
        description: "Clear monthly and annual corporate plans with interactive ROI calculator",
        href: "/pricing",
        group: "Governance & Legal",
        icon: <Receipt size={16} />,
        keywords: "pricing tiers plans cost subscription enterprise starter roi calculator",
      },
      {
        id: "nav-about",
        title: "About Ledger & Atelier Philosophy",
        description: "Origins, architectural invariants, and leadership team",
        href: "/about",
        group: "Governance & Legal",
        icon: <FileCheck size={16} />,
        keywords: "about company team philosophy story invariants",
      },
    ],
    [],
  );

  // Filter commands by search term
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.keywords.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Handle arrow key navigation inside results
  const handleKeyDownInside = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      playAcousticTick(2100, 0.015, 0.02);
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      playAcousticTick(2300, 0.015, 0.02);
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target) {
        executeCommand(target);
      }
    }
  };

  const executeCommand = (cmd: CommandItem) => {
    playVaultClick();
    setIsOpen(false);
    if (cmd.action) {
      cmd.action();
    } else if (cmd.href) {
      router.push(cmd.href);
    }
  };

  if (!isOpen) return null;

  // Group filtered results by section
  const groups = Array.from(new Set(filtered.map((item) => item.group)));

  return (
    <div
      className="command-palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="command-palette-window" role="dialog" aria-modal="true">
        {/* Search Input Bar */}
        <div className="command-palette-input-wrap">
          <Search size={18} color="var(--ink-muted)" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a document, account code, action, or jump to page..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInside}
          />
          <span className="hotkey-pill">ESC</span>
        </div>

        {/* Results List */}
        <ul className="command-palette-list">
          {filtered.length === 0 ? (
            <li style={{ padding: "var(--s-6)", textAlign: "center", color: "var(--ink-muted)" }}>
              <p style={{ margin: 0, fontSize: "var(--t-sm)" }}>No ledger screens or actions match &ldquo;{query}&rdquo;</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "var(--t-xs)", color: "var(--ink-faint)" }}>
                Try searching &ldquo;journal&rdquo;, &ldquo;vat&rdquo;, &ldquo;invoice&rdquo;, &ldquo;payroll&rdquo;, or &ldquo;audit&rdquo;.
              </p>
            </li>
          ) : (
            groups.map((group) => {
              const itemsInGroup = filtered.filter((i) => i.group === group);
              return (
                <li key={group} style={{ listStyle: "none" }}>
                  <div className="command-palette-group-title">{group}</div>
                  {itemsInGroup.map((cmd) => {
                    const currentIndex = filtered.indexOf(cmd);
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <div
                        key={cmd.id}
                        className="command-item"
                        data-selected={isSelected}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <div className="command-item-left">
                          <span style={{ display: "inline-flex", alignItems: "center" }}>
                            {cmd.icon}
                          </span>
                          <div>
                            <div className="command-item-title">{cmd.title}</div>
                            <div className="command-item-desc">{cmd.description}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {cmd.href && (
                            <span className="mono" style={{ fontSize: "0.6875rem", color: "var(--ink-faint)" }}>
                              {cmd.href}
                            </span>
                          )}
                          <ArrowRight size={13} color="var(--ink-faint)" />
                        </div>
                      </div>
                    );
                  })}
                </li>
              );
            })
          )}
        </ul>

        {/* Footer info */}
        <div className="command-palette-footer">
          <div className="row" style={{ gap: "var(--s-3)", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span className="hotkey-pill">↑</span>
              <span className="hotkey-pill">↓</span> Navigate
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span className="hotkey-pill">↵</span> Open
            </span>
          </div>

          <div className="row" style={{ gap: "var(--s-2)", alignItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.6875rem" }}>Ledger Command Suite</span>
            <span className="chip chip--ok" style={{ fontSize: "0.625rem", padding: "1px 6px" }}>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
